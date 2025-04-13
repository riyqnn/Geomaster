import { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";

const Jumlah = ({ isVisible }) => {
  const [sudahMuat, setSudahMuat] = useState(false);
  const [kesalahan, setKesalahan] = useState(null);
  const [wilayahTerpilih, setWilayahTerpilih] = useState(null);
  const [daftarWilayah, setDaftarWilayah] = useState([]);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible) return; // Pastikan peta ada dan isVisible true

    const petaWilayah = new Map();

    const saatMuat = () => {
      if (peta.getSource("jumlah_penduduk")) {
        setSudahMuat(true);
        return;
      }

      // Menampilkan indikator loading
      const indikatorMuat = document.createElement("div");
      indikatorMuat.id = "loading-indicator";
      indikatorMuat.className =
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 text-white p-4 rounded-lg z-50 flex items-center space-x-3";
      indikatorMuat.innerHTML =
        '<div class="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-r-2 border-blue-500"></div><span>Memuat data populasi...</span>';
      peta.getContainer().appendChild(indikatorMuat);

      // Mengambil data populasi
      fetch(
        "https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jumlah_penduduk.json"
      )
        .then((respons) => {
          if (!respons.ok) throw new Error(`Error HTTP! Status: ${respons.status}`);
          return respons.json();
        })
        .then((data) => {
          data.features.forEach((f) => {
            if (!f.properties.nama_kab_kota || !f.properties.jumlah_penduduk) return;
            const nama = f.properties.nama_kab_kota;
            const populasi = f.properties.jumlah_penduduk;
            if (!petaWilayah.has(nama)) {
              petaWilayah.set(nama, {
                id: f.id,
                nama,
                populasi,
              });
            }
          });

          const daftar = Array.from(petaWilayah.values());
          setDaftarWilayah(daftar.sort((a, b) => b.populasi - a.populasi));

          const nilaiPopulasi = data.features
            .filter((f) => f.properties.jumlah_penduduk)
            .map((f) => f.properties.jumlah_penduduk);
          const popMin = Math.min(...nilaiPopulasi);
          const popMax = Math.max(...nilaiPopulasi);

          // Menambahkan sumber dan layer ke peta
          if (!peta.getSource("jumlah_penduduk")) {
            peta.addSource("jumlah_penduduk", { type: "geojson", data });
          }

          if (!peta.getLayer("jumlah_penduduk-fill")) {
            peta.addLayer({
              id: "jumlah_penduduk-fill",
              type: "fill",
              source: "jumlah_penduduk",
              paint: {
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "jumlah_penduduk"],
                  popMin,
                  "#c6dbef",
                  popMax / 2,
                  "#4292c6",
                  popMax,
                  "#084594",
                ],
                "fill-opacity": 0.7,
              },
            });
          }

          if (!peta.getLayer("jumlah_penduduk-line")) {
            peta.addLayer({
              id: "jumlah_penduduk-line",
              type: "line",
              source: "jumlah_penduduk",
              paint: {
                "line-color": "#ff4d4d",
                "line-width": 2.5,
                "line-opacity": 1,
              },
            });
          }

          if (!peta.getLayer("jumlah_penduduk-label")) {
            peta.addLayer({
              id: "jumlah_penduduk-label",
              type: "symbol",
              source: "jumlah_penduduk",
              layout: {
                "text-field": ["get", "nama_kabupaten"],
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-size": 12,
                "text-offset": [0, 0.6],
                "text-anchor": "top",
              },
              paint: {
                "text-color": "#ffffff",
                "text-halo-color": "#000000",
                "text-halo-width": 1.5,
              },
            });
          }

          // Menangani event klik pada layer
          peta.on("click", "jumlah_penduduk-fill", (e) => {
            const properti = e.features[0].properties;
            setWilayahTerpilih({
              id: e.features[0].id,
              nama: properti.nama_kab_kota,
              populasi: properti.jumlah_penduduk,
            });

            if (peta.getLayer("highlight-layer")) {
              peta.removeLayer("highlight-layer");
            }

            peta.addLayer({
              id: "highlight-layer",
              type: "line",
              source: "jumlah_penduduk",
              filter: ["==", ["id"], e.features [0].id],
              paint: {
                "line-color": "#FFFF00",
                "line-width": 4,
                "line-opacity": 1,
              },
            });
          });

          // Menangani event mouse enter dan leave
          peta.on("mouseenter", "jumlah_penduduk-fill", () => {
            peta.getCanvas().style.cursor = "pointer";
          });

          peta.on("mouseleave", "jumlah_penduduk-fill", () => {
            peta.getCanvas().style.cursor = "";
          });

          // Menambahkan legend ke peta
          const addLegend = (peta, min, max) => {
            if (document.getElementById("legend")) return;

            const legend = document.createElement("div");
            legend.id = "legend";
            legend.className =
              "absolute bottom-16 right-8 bg-slate-900/90 p-4 rounded-lg text-white z-10 shadow-lg border border-slate-700/50";

            const title = document.createElement("h4");
            title.className = "font-bold text-center mb-2 text-blue-300";
            title.textContent = "Population Density";
            legend.appendChild(title);

            const mid = (min + max) / 2;
            const steps = [
              { color: "#c6dbef", value: min.toLocaleString() },
              { color: "#4292c6", value: mid.toLocaleString() },
              { color: "#084594", value: max.toLocaleString() },
            ];

            const gradient = document.createElement("div");
            gradient.className = "w-full h-6 mb-2 rounded";
            gradient.style.background =
              "linear-gradient(to right, #c6dbef, #4292c6, #084594)";
            legend.appendChild(gradient);

            const labels = document.createElement("div");
            labels.className = "flex justify-between text-xs";

            steps.forEach((step) => {
              const label = document.createElement("div");
              label.textContent = step.value;
              labels.appendChild(label);
            });

            legend.appendChild(labels);
            peta.getContainer().appendChild(legend);
          };

          addLegend(peta, popMin, popMax);

          // Menghapus indikator loading
          document.getElementById("loading-indicator")?.remove();
          console.log("Layer jumlah_penduduk berhasil ditambahkan");
          setSudahMuat(true);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setKesalahan(err.message);
          document.getElementById("loading-indicator")?.remove();
        });
    };

    peta.on("load", saatMuat);
    if (peta.loaded()) saatMuat();

    return () => {
      if (peta) {
        ["jumlah_penduduk-fill", "jumlah_penduduk-line", "jumlah_penduduk-label", "highlight-layer"].forEach((id) => {
          if (peta.getLayer(id)) peta.removeLayer(id);
        });
        if (peta.getSource("jumlah_penduduk")) peta.removeSource("jumlah_penduduk");
        if (document.getElementById("legend")) document.getElementById("legend").remove();
        if (document.getElementById("loading-indicator"))
          document.getElementById("loading-indicator").remove();
      }
    };
  }, [isVisible]); // Tambahkan isVisible sebagai dependensi

  // Jika isVisible false, tidak menampilkan komponen
  if (!isVisible) return null;

  return (
    <>
      {/* Tampilan panel informasi */}
      <div className="absolute top-4 left-4 z-10 transition-all duration-300 transform translate-x-0">
        <div
          className="bg-slate-900/90 text-white rounded-lg shadow-lg border border-slate-700/50 max-h-screen overflow-hidden flex flex-col"
          style={{ width: "320px" }}
        >
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-800 to-indigo-900">
            <h2 className="font-bold text-lg">Jumlah Penduduk</h2>
          </div>
  
          {wilayahTerpilih && (
            <div className="p-4 bg-blue-600/30 border-b border-slate-700">
              <h3 className="font-bold text-xl">{wilayahTerpilih.nama}</h3>
              <p className="flex items-center mt-2">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d ="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
                <span>
                  Population:{" "}
                  <strong>{wilayahTerpilih.populasi.toLocaleString()}</strong>
                </span>
              </p>
            </div>
          )}
  
          <div className="overflow-y-auto max-h-96">
            <div className="p-4">
              <h3 className="font-semibold mb-2 text-blue-300">Wilayah</h3>
              <div className="space-y-2">
                {daftarWilayah.map((wilayah) => (
                  <div
                    key={wilayah.id}
                    className={`p-3 rounded-lg text-sm transition-all cursor-pointer hover:bg-slate-700/50 ${
                      wilayahTerpilih?.id === wilayah.id
                        ? "bg-slate-700 border-l-4 border-blue-500"
                        : "bg-slate-800/50"
                    }`}
                    onClick={() => setWilayahTerpilih(wilayah)}
                  >
                    <div className="font-medium">{wilayah.nama}</div>
                    <div className="text-blue-300 text-sm mt-1">
                      Populasi: {wilayah.populasi.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );  
}

export default Jumlah;