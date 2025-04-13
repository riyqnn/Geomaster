import { useEffect, useState } from "react";

const Zoonosis = ({ isVisible }) => {
  const [sudahMuat, setSudahMuat] = useState(false);
  const [kesalahan, setKesalahan] = useState(null);
  const [wilayahTerpilih, setWilayahTerpilih] = useState(null);
  const [daftarWilayah, setDaftarWilayah] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible) return; // Pastikan peta ada dan isVisible true

    const petaWilayah = new Map();

    const saatMuat = () => {
      if (peta.getSource("penyebaran")) {
        setSudahMuat(true);
        return;
      }

      setIsLoading(true);
      // Menampilkan indikator loading
      const indikatorMuat = document.createElement("div");
      indikatorMuat.id = "loading-indicator";
      indikatorMuat.className =
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 text-white p-4 rounded-lg z-50 flex items-center space-x-3";
      indikatorMuat.innerHTML =
        '<div class="animate-spin rounded-full h-6 w-6 border-t-2 border-red-500 border-r-2 border-red-500"></div><span>Memuat data zoonosis...</span>';
      peta.getContainer().appendChild(indikatorMuat);

      // Mengambil data zoonosis
      fetch(
        "http://localhost:8080/geoserver/penyebaran/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=penyebaran%3Azoonosis&maxFeatures=50&outputFormat=application%2Fjson"
      )
        .then((respons) => {
          if (!respons.ok) throw new Error(`Error HTTP! Status: ${respons.status}`);
          return respons.json();
        })
        .then((data) => {
          // Console log untuk debug
          console.log("Data received:", data);
          
          // Pastikan ada fitur di dalam data
          if (!data.features || data.features.length === 0) {
            throw new Error("Tidak ada data fitur yang ditemukan");
          }
          
          data.features.forEach((f) => {
            if (!f.properties || !f.properties.Kota) return;
            
            const kota = f.properties.Kota;
            
            // Update data untuk Jakarta Selatan dan Jakarta Timur
            if (kota === "Jakarta Selatan") {
              f.properties.zoonosis_jumlah_kasus = 288;
              f.properties.zoonosis_jumlah_kematian = 1;
            } else if (kota === "Jakarta Timur") {
              f.properties.zoonosis_jumlah_kasus = 58;
              f.properties.zoonosis_jumlah_kematian = 38;
            }
            
            // Pastikan jumlahKasus dikonversi menjadi angka
            const jumlahKasus = parseInt(f.properties.zoonosis_jumlah_kasus || 0, 10);
            // Jika jumlahKematian null, gunakan 0
            const jumlahKematian = parseInt(f.properties.zoonosis_jumlah_kematian || 0, 10);
            const periodData = f.properties.zoonosis_periode_data || "Tidak ada data";
            
            // Hitung tingkat kematian dan tambahkan ke property untuk visualisasi
            const tingkatKematian = jumlahKasus > 0 ? (jumlahKematian / jumlahKasus * 100) : 0;
            f.properties.zoonosis_tingkat_kematian = tingkatKematian;
            
            // Hitung indeks keparahan (kombinasi dari jumlah kasus dan tingkat kematian)
            // Formula: jumlah kasus * (1 + tingkat kematian/100) - memberi bobot lebih pada wilayah dengan tingkat kematian tinggi
            const indeksSeverity = jumlahKasus * (1 + tingkatKematian/50);
            f.properties.zoonosis_indeks_severity = indeksSeverity;
            
            if (!petaWilayah.has(kota)) {
              petaWilayah.set(kota, {
                id: f.id,
                kota,
                jumlahKasus,
                jumlahKematian,
                tingkatKematian,
                indeksSeverity,
                periodData
              });
            }
          });

          const daftar = Array.from(petaWilayah.values());
          
          // Debug daftar wilayah
          console.log("Daftar wilayah:", daftar);
          
          if (daftar.length === 0) {
            throw new Error("Tidak berhasil mengekstrak data wilayah");
          }
          
          // Sort berdasarkan indeks severity (kombinasi kasus + kematian)
          setDaftarWilayah(daftar.sort((a, b) => b.indeksSeverity - a.indeksSeverity));

          // Dapatkan nilai indeks severity yang valid untuk warna peta
          const nilaiSeverity = daftar
            .map(w => w.indeksSeverity)
            .filter(value => !isNaN(value) && value !== null);
          
          console.log("Nilai severity index:", nilaiSeverity);
          
          // Ensure we have values
          if (nilaiSeverity.length === 0) {
            throw new Error("Tidak ada data severity yang valid");
          }
          
          // Dapatkan min dan max untuk severity
          let severityMin = Math.min(...nilaiSeverity);
          let severityMax = Math.max(...nilaiSeverity);
          
          // Ensure range is valid (add a small range if min equals max)
          if (severityMin === severityMax) {
            severityMin = Math.max(0, severityMin - 1);
            severityMax = severityMax + 1;
          }
          
          console.log(`Severity Min: ${severityMin}, Max: ${severityMax}`);
          
          // Hitung step-step dengan benar untuk warna
          const step1 = severityMin + ((severityMax - severityMin) / 3);
          const step2 = severityMin + ((severityMax - severityMin) * 2 / 3);
          
          console.log(`Step1: ${step1}, Step2: ${step2}`);

          // Menambahkan sumber dan layer ke peta
          if (!peta.getSource("penyebaran")) {
            peta.addSource("penyebaran", { type: "geojson", data });
          }

          if (!peta.getLayer("penyebaran-fill")) {
            peta.addLayer({
              id: "penyebaran-fill",
              type: "fill",
              source: "penyebaran",
              paint: {
                // Gunakan property indeks severity yang baru untuk warna
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "zoonosis_indeks_severity"],
                  severityMin,
                  "#ffffcc",
                  step1,
                  "#fd8d3c",
                  step2,
                  "#f03b20",
                  severityMax,
                  "#bd0026",
                ],
                "fill-opacity": 0.7,
              },
            });
          }

          if (!peta.getLayer("penyebaran-line")) {
            peta.addLayer({
              id: "penyebaran-line",
              type: "line",
              source: "penyebaran",
              paint: {
                "line-color": "#000",
                "line-width": 1,
                "line-opacity": 0.5,
              },
            });
          }

          if (!peta.getLayer("penyebaran-label")) {
            peta.addLayer({
              id: "penyebaran-label",
              type: "symbol",
              source: "penyebaran",
              layout: {
                "text-field": ["get", "Kota"],
                "text-font": ["Open Sans Regular"],
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

          // Tambahkan layer heatmap untuk visualisasi zoonosis
          if (!peta.getLayer("penyebaran-heatmap")) {
            peta.addLayer({
              id: "penyebaran-heatmap",
              type: "heatmap",
              source: "penyebaran",
              maxzoom: 15,
              paint: {
                // Kekuatan heatmap berdasarkan indeks severity
                "heatmap-weight": [
                  "interpolate",
                  ["linear"],
                  ["get", "zoonosis_indeks_severity"],
                  severityMin,
                  0,
                  severityMax,
                  1
                ],
                // Intensitas warna heatmap
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 1,
                  9, 3
                ],
                // Warna-warna heatmap
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0, "rgba(33,102,172,0)",
                  0.2, "rgb(103,169,207)",
                  0.4, "rgb(209,229,240)",
                  0.6, "rgb(253,219,199)",
                  0.8, "rgb(239,138,98)",
                  1, "rgb(178,24,43)"
                ],
                // Radius heatmap berdasarkan zoom level
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 2,
                  9, 20
                ],
                // Opacity heatmap berdasarkan zoom level
                "heatmap-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  7, 1,
                  9, 0.5
                ],
              }
            }, "penyebaran-label");
          }

          // Menangani event klik pada layer
          peta.on("click", "penyebaran-fill", (e) => {
            const properti = e.features[0].properties;
            const jumlahKasus = parseInt(properti.zoonosis_jumlah_kasus || 0, 10);
            const jumlahKematian = parseInt(properti.zoonosis_jumlah_kematian || 0, 10);
            const tingkatKematian = jumlahKasus > 0 ? (jumlahKematian / jumlahKasus * 100) : 0;
            
            setWilayahTerpilih({
              id: e.features[0].id,
              kota: properti.Kota,
              jumlahKasus,
              jumlahKematian,
              tingkatKematian,
              periodData: properti.zoonosis_periode_data || "Tidak ada data"
            });

            if (peta.getLayer("highlight-layer")) {
              peta.removeLayer("highlight-layer");
            }

            peta.addLayer({
              id: "highlight-layer",
              type: "line",
              source: "penyebaran",
              filter: ["==", ["id"], e.features[0].id],
              paint: {
                "line-color": "#FFFF00",
                "line-width": 4,
                "line-opacity": 1,
              },
            });
          });

          // Menangani event mouse enter dan leave
          peta.on("mouseenter", "penyebaran-fill", () => {
            peta.getCanvas().style.cursor = "pointer";
          });

          peta.on("mouseleave", "penyebaran-fill", () => {
            peta.getCanvas().style.cursor = "";
          });

          // Menambahkan legend ke peta dengan penjelasan indeks keparahan
          const addLegend = (peta, min, max) => {
            if (document.getElementById("zoonosis-legend")) return;

            const legend = document.createElement("div");
            legend.id = "zoonosis-legend";
            legend.className =
              "absolute bottom-16 right-8 bg-slate-900/90 p-4 rounded-lg text-white z-10 shadow-lg border border-slate-700/50";

            const title = document.createElement("h4");
            title.className = "font-bold text-center mb-2 text-red-300";
            title.textContent = "Tingkat Keparahan Zoonosis";
            legend.appendChild(title);

            const subTitle = document.createElement("div");
            subTitle.className = "text-xs text-center mb-3 text-slate-300";
            subTitle.textContent = "Berdasarkan jumlah kasus dan tingkat kematian";
            legend.appendChild(subTitle);

            const mid1 = min + (max - min) / 3;
            const mid2 = min + (2 * (max - min)) / 3;
            
            const steps = [
              { color: "#ffffcc", value: "Rendah" },
              { color: "#fd8d3c", value: "Sedang" },
              { color: "#f03b20", value: "Tinggi" },
              { color: "#bd0026", value: "Kritis" },
            ];

            const gradient = document.createElement("div");
            gradient.className = "w-full h-6 mb-2 rounded";
            gradient.style.background =
              "linear-gradient(to right, #ffffcc, #fd8d3c, #f03b20, #bd0026)";
            legend.appendChild(gradient);

            const labels = document.createElement("div");
            labels.className = "flex justify-between text-xs";

            steps.forEach((step) => {
              const label = document.createElement("div");
              label.textContent = step.value;
              labels.appendChild(label);
            });

            legend.appendChild(labels);
            
            // Tambahkan toggle untuk heatmap
            const toggleContainer = document.createElement("div");
            toggleContainer.className = "mt-3 pt-2 border-t border-slate-700 flex items-center";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = "heatmap-toggle";
            checkbox.className = "mr-2";
            checkbox.checked = true;
            
            checkbox.addEventListener("change", (e) => {
              const visibility = e.target.checked ? "visible" : "none";
              peta.setLayoutProperty("penyebaran-heatmap", "visibility", visibility);
            });
            
            const label = document.createElement("label");
            label.htmlFor = "heatmap-toggle";
            label.textContent = "Tampilkan Heatmap";
            label.className = "text-xs";
            
            toggleContainer.appendChild(checkbox);
            toggleContainer.appendChild(label);
            legend.appendChild(toggleContainer);
            
            peta.getContainer().appendChild(legend);
          };

          addLegend(peta, severityMin, severityMax);

          // Menghapus indikator loading
          document.getElementById("loading-indicator")?.remove();
          console.log("Layer penyebaran zoonosis berhasil ditambahkan");
          setSudahMuat(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setKesalahan(err.message);
          document.getElementById("loading-indicator")?.remove();
          setIsLoading(false);
        });
    };

    peta.on("load", saatMuat);
    if (peta.loaded()) saatMuat();

    return () => {
      if (peta) {
        ["penyebaran-fill", "penyebaran-line", "penyebaran-label", "penyebaran-heatmap", "highlight-layer"].forEach((id) => {
          if (peta.getLayer(id)) peta.removeLayer(id);
        });
        if (peta.getSource("penyebaran")) peta.removeSource("penyebaran");
        if (document.getElementById("zoonosis-legend")) document.getElementById("zoonosis-legend").remove();
        if (document.getElementById("loading-indicator"))
          document.getElementById("loading-indicator").remove();
      }
    };
  }, [isVisible]); // Tambahkan isVisible sebagai dependensi

  // Jika isVisible false, tidak menampilkan komponen
  if (!isVisible) return null;

  // Fungsi untuk mendapatkan kelas warna berdasarkan tingkat kematian
  const getDeathRateColorClass = (rate) => {
    if (rate >= 50) return "bg-red-900/70 text-red-200";
    if (rate >= 30) return "bg-red-800/70 text-red-200";
    if (rate >= 15) return "bg-amber-800/70 text-amber-200";
    return "bg-slate-700/70 text-slate-300";
  };

  return (
    <>
      {/* Tampilan panel informasi yang direvisi dengan UI lebih modern */}
      <div className="absolute top-4 left-4 z-10 transition-all duration-300 transform translate-x-0">
        <div
          className="bg-slate-900/90 text-white rounded-lg shadow-lg border border-slate-700/50 overflow-hidden flex flex-col"
          style={{ width: "340px", maxHeight: "85vh" }}
        >
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-800 to-rose-900">
            <h2 className="font-bold text-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
              Penyebaran Zoonosis
            </h2>
            {isLoading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-300 border-r-2 mr-2"></div>
                <span className="text-sm text-red-300">Loading</span>
              </div>
            )}
          </div>
  
          {kesalahan && (
            <div className="p-4 bg-red-900/50 border-b border-slate-700">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-300 text-sm">{kesalahan}</p>
              </div>
            </div>
          )}
  
          {wilayahTerpilih && (
            <div className="p-5 bg-slate-800/70 border-b border-slate-700">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <h3 className="font-bold text-xl">{wilayahTerpilih.kota}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-xs text-red-300 mb-1">Jumlah Kasus</div>
                  <div className="text-xl font-bold">{wilayahTerpilih.jumlahKasus.toLocaleString()}</div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-xs text-red-300 mb-1">Jumlah Kematian</div>
                  <div className="text-xl font-bold">{wilayahTerpilih.jumlahKematian.toLocaleString()}</div>
                </div>
              </div>
              
              <div className={`mt-3 p-3 rounded-lg ${getDeathRateColorClass(wilayahTerpilih.tingkatKematian)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-90">Tingkat Kematian</span>
                  <span className="text-lg font-bold">
                    {wilayahTerpilih.tingkatKematian.toFixed(1)}%
                  </span>
                </div>
                {/* Progress bar untuk visualisasi tingkat kematian */}
                <div className="w-full bg-slate-600/50 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(wilayahTerpilih.tingkatKematian, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Alert untuk tingkat kematian tinggi */}
              {wilayahTerpilih.tingkatKematian > 30 && (
                <div className="mt-3 p-2 rounded bg-red-900/30 border border-red-800/50 text-xs flex items-center">
                  <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <span className="text-red-300">
                    Perhatian: Tingkat kematian di wilayah ini sangat tinggi!
                  </span>
                </div>
              )}
            </div>
          )}
  
          <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 200px)" }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-red-300 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Daftar Kota
                </h3>
                <span className="text-xs text-slate-400">{daftarWilayah.length} wilayah</span>
              </div>
              
              {daftarWilayah.length === 0 && !isLoading ? (
                <div className="p-3 bg-slate-800/50 rounded-lg text-sm flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Tidak ada data wilayah tersedia
                </div>
              ) : (
                <div className="space-y-2">
                  {daftarWilayah.map((wilayah) => {
                    const tingkatKematian = wilayah.jumlahKasus > 0 
                      ? (wilayah.jumlahKematian / wilayah.jumlahKasus * 100) 
                      : 0;
                      
                    return (
                      <div
                        key={wilayah.id}
                        className={`p-3 rounded-lg text-sm transition-all cursor-pointer hover:bg-slate-700 ${
                          wilayahTerpilih?.id === wilayah.id
                            ? "bg-slate-700 border-l-4 border-red-500 pl-2"
                            : "bg-slate-800/50"
                        }`}
                        onClick={() => setWilayahTerpilih({
                          ...wilayah,
                          tingkatKematian
                        })}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{wilayah.kota}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            wilayah.jumlahKasus > 200 ? "bg-red-900/70 text-red-200" : 
                            wilayah.jumlahKasus > 100 ? "bg-amber-800/70 text-amber-200" : 
                            "bg-slate-700/70 text-slate-300"
                          }`}>
                            {wilayah.jumlahKasus.toLocaleString()} kasus
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-xs text-rose-300">
                              {wilayah.jumlahKematian.toLocaleString()} kematian
                            </span>
                          </div>
                          
                          <div className={`text-xs px-2 py-1 rounded-full ${getDeathRateColorClass(tingkatKematian)}`}>
                            {tingkatKematian.toFixed(1)}% CFR
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-slate-800/90 border-t border-slate-700 text-center">
            <div className="text-xs text-slate-400">Klik pada wilayah di peta untuk detail</div>
          </div>
        </div>
      </div>
    </>
  );  
}

export default Zoonosis;