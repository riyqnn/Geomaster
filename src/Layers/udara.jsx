import { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";

const UdaraLayer = ({ isVisible }) => {
  const [sudahMuat, setSudahMuat] = useState(false);
  const [kesalahan, setKesalahan] = useState(null);
  const [wilayahTerpilih, setWilayahTerpilih] = useState(null);
  const [daftarWilayah, setDaftarWilayah] = useState([]);

  // Function to get color based on category
  const getKategoriColor = (kategori) => {
    switch (kategori) {
      case "Baik": return "#00e676";
      case "Sedang": return "#ffee58";
      case "Tidak Sehat": return "#ff9800";
      case "Sangat Tidak Sehat": return "#f44336";
      case "Berbahaya": return "#9c27b0";
      default: return "#78909c";
    }
  };

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible) return;

    const petaWilayah = new Map();

    const saatMuat = () => {
      if (peta.getSource("kualitas_udara")) {
        setSudahMuat(true);
        return;
      }

      // Menampilkan indikator loading
      const indikatorMuat = document.createElement("div");
      indikatorMuat.id = "loading-indicator";
      indikatorMuat.className =
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 text-white p-4 rounded-lg z-50 flex items-center space-x-3";
      indikatorMuat.innerHTML =
        '<div class="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-r-2 border-blue-500"></div><span>Memuat data kualitas udara...</span>';
      peta.getContainer().appendChild(indikatorMuat);

      // Mengambil data kualitas udara dari GeoServer
      fetch(
        "http://localhost:8080/geoserver/data_udara/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=data_udara%3Adata_udara&maxFeatures=50&outputFormat=application%2Fjson"
      )
        .then((respons) => {
          if (!respons.ok) throw new Error(`Error HTTP! Status: ${respons.status}`);
          return respons.json();
        })
        .then((data) => {
          // Process data for display
          data.features.forEach((f) => {
            if (!f.properties || !f.properties.wilayah) return;

            const nama = f.properties.wilayah;
            const ispu = f.properties.data_udara_final_max || 0;
            let kategori = "Baik";

            if (ispu <= 60) kategori = "Baik";
            else if (ispu <= 70) kategori = "Sedang";
            else if (ispu <= 80) kategori = "Tidak Sehat";
            else if (ispu <= 90) kategori = "Sangat Tidak Sehat";
            else kategori = "Berbahaya";

            const wilayahData = {
              id: f.id,
              nama,
              ispu,
              kategori,
              pm10: f.properties.data_udara_final_pm_sepuluh,
              pm25: f.properties.data_udara_final_pm_duakomalima,
              so2: f.properties.data_udara_final_sulfur_dioksida,
              co: f.properties.data_udara_final_karbon_monoksida,
              o3: f.properties.data_udara_final_ozon,
              no2: f.properties.data_udara_final_nitrogen_dioksida,
              parameterKritis: f.properties.data_udara_final_parameter_pencemar_kritis,
              tanggal: f.properties.data_udara_final_tanggal,
              geometry: f.geometry,
            };

            petaWilayah.set(nama, wilayahData);
          });

          const daftar = Array.from(petaWilayah.values());
          setDaftarWilayah(daftar.sort((a, b) => b.ispu - a.ispu));

          // Cleanup existing layers if needed
          ["kualitas_udara-fill", "kualitas_udara-line", "kualitas_udara-labels", "highlight-udara"].forEach(id => {
            if (peta.getLayer(id)) peta.removeLayer(id);
          });
          if (peta.getSource("kualitas_udara")) peta.removeSource("kualitas_udara");

          // Add GeoJSON source to map
          peta.addSource("kualitas_udara", {
            type: "geojson",
            data: data,
          });

          // Add 3D fill-extrusion layer for air quality visualization
          peta.addLayer({
            id: "kualitas_udara-fill",
            type: "fill-extrusion",
            source: "kualitas_udara",
            paint: {
              "fill-extrusion-color": [
                "step",
                ["get", "data_udara_final_max"],
                "#00e676", 60, "#ffee58", 70, "#ff9800", 80, "#f44336", 90, "#9c27b0",
              ],
              "fill-extrusion-height": ["*", ["get", "data_udara_final_max"], 20],
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.65,
            },
          });

          // Add outline layer
          peta.addLayer({
            id: "kualitas_udara-line",
            type: "line",
            source: "kualitas_udara",
            paint: {
              "line-color": "#ffffff",
              "line-width": 1,
              "line-opacity": 0.8,
            },
          });

          // Add labels layer (tanpa font khusus)
          peta.addLayer({
            id: "kualitas_udara-labels",
            type: "symbol",
            source: "kualitas_udara",
            layout: {
              "text-field": ["to-string", ["get", "data_udara_final_max"]],
              "text-size": 12,
              "text-anchor": "center",
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "#000000",
              "text-halo-width": 1,
            },
          });

          // Handle click on layer
          peta.on("click", "kualitas_udara-fill", (e) => {
            const properties = e.features[0].properties;
            const ispu = properties.data_udara_final_max || 0;
            let kategori = "Baik";
            if (ispu <= 60) kategori = "Baik";
            else if (ispu <= 70) kategori = "Sedang";
            else if (ispu <= 80) kategori = "Tidak Sehat";
            else if (ispu <= 90) kategori = "Sangat Tidak Sehat";
            else kategori = "Berbahaya";

            setWilayahTerpilih({
              id: e.features[0].id,
              nama: properties.wilayah,
              ispu,
              kategori,
              pm10: properties.data_udara_final_pm_sepuluh,
              pm25: properties.data_udara_final_pm_duakomalima,
              so2: properties.data_udara_final_sulfur_dioksida,
              co: properties.data_udara_final_karbon_monoksida,
              o3: properties.data_udara_final_ozon,
              no2: properties.data_udara_final_nitrogen_dioksida,
              parameterKritis: properties.data_udara_final_parameter_pencemar_kritis,
              tanggal: properties.data_udara_final_tanggal,
            });

            if (peta.getLayer("highlight-udara")) peta.removeLayer("highlight-udara");

            peta.addLayer({
              id: "highlight-udara",
              type: "line",
              source: "kualitas_udara",
              filter: ["==", ["id"], e.features[0].id],
              paint: {
                "line-color": "#FFFF00",
                "line-width": 3,
                "line-opacity": 0.8,
              },
            });

            const center = calculateCenter(e.features[0].geometry);
            peta.flyTo({
              center,
              zoom: 12,
              pitch: 60, // Efek 3D
              bearing: 30,
              duration: 1500,
            });
          });

          peta.on("mouseenter", "kualitas_udara-fill", () => {
            peta.getCanvas().style.cursor = "pointer";
          });

          peta.on("mouseleave", "kualitas_udara-fill", () => {
            peta.getCanvas().style.cursor = "";
          });

          addLegend(peta);

          document.getElementById("loading-indicator")?.remove();
          console.log("Layer kualitas_udara berhasil ditambahkan");
          setSudahMuat(true);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setKesalahan(err.message);
          document.getElementById("loading-indicator")?.remove();
        });
    };

    // Helper function to calculate center of geometry
    const calculateCenter = (geometry) => {
      if (!geometry || !geometry.coordinates) return [0, 0];
      if (geometry.type === "Polygon") {
        let x = 0, y = 0, numPoints = 0;
        geometry.coordinates[0].forEach(coord => {
          x += coord[0];
          y += coord[1];
          numPoints++;
        });
        return numPoints > 0 ? [x / numPoints, y / numPoints] : [0, 0];
      } else if (geometry.type === "MultiPolygon") {
        let x = 0, y = 0, numPoints = 0;
        geometry.coordinates.forEach(polygon => {
          polygon[0].forEach(coord => {
            x += coord[0];
            y += coord[1];
            numPoints++;
          });
        });
        return numPoints > 0 ? [x / numPoints, y / numPoints] : [0, 0];
      }
      return geometry.coordinates || [0, 0];
    };

    const addLegend = (peta) => {
      if (document.getElementById("legend-udara")) return;

      const legend = document.createElement("div");
      legend.id = "legend-udara";
      legend.className =
        "absolute bottom-16 right-8 bg-slate-900/90 text-white p-4 rounded-lg z-10 shadow-lg border border-slate-700/50";

      const title = document.createElement("h4");
      title.className = "font-bold text-center mb-2 text-blue-300";
      title.textContent = "Kualitas Udara";
      legend.appendChild(title);

      const categories = [
        { color: "#00e676", label: "Baik" },
        { color: "#ffee58", label: "Sedang" },
        { color: "#ff9800", label: "Tidak Sehat" },
        { color: "#f44336", label: "Sangat Tidak Sehat" },
        { color: "#9c27b0", label: "Berbahaya" },
      ];

      categories.forEach(cat => {
        const item = document.createElement("div");
        item.className = "flex items-center my-2";

        const colorBox = document.createElement("div");
        colorBox.className = "w-5 h-5 rounded-full mr-3";
        colorBox.style.backgroundColor = cat.color;

        const label = document.createElement("span");
        label.className = "text-sm";
        label.textContent = cat.label;

        item.appendChild(colorBox);
        item.appendChild(label);
        legend.appendChild(item);
      });

      const hint = document.createElement("p");
      hint.className = "text-xs mt-4 text-gray-300 italic text-center";
      hint.textContent = "Klik area pada peta untuk detail";
      legend.appendChild(hint);

      peta.getContainer().appendChild(legend);
    };

    peta.on("load", saatMuat);
    if (peta.loaded()) saatMuat();

    return () => {
      if (peta) {
        ["kualitas_udara-fill", "kualitas_udara-line", "kualitas_udara-labels", "highlight-udara"].forEach(id => {
          if (peta.getLayer(id)) peta.removeLayer(id);
        });
        if (peta.getSource("kualitas_udara")) peta.removeSource("kualitas_udara");
        document.getElementById("legend-udara")?.remove();
        document.getElementById("loading-indicator")?.remove();
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Panel informasi */}
      <div className="absolute top-4 left-4 z-10 transition-all duration-300 transform translate-x-0">
        <div
          className="bg-slate-900/90 text-white rounded-lg shadow-lg border border-slate-700/50 max-h-screen overflow-hidden flex flex-col"
          style={{ width: "360px" }}
        >
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-800 to-indigo-900">
          <div className="flex items-center">
            <h2 className="font-bold text-xl">Indeks Kualitas Udara</h2>
            </div>

          </div>

          {/* Loading State */}
          {!sudahMuat && !kesalahan && (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-300">Memuat data kualitas udara...</p>
            </div>
          )}

          {/* Error State */}
          {kesalahan && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg m-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p className="text-red-200">{kesalahan}</p>
              </div>
              <button
                className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors w-full"
                onClick={() => window.location.reload()}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Info Wilayah Terpilih */}
          {wilayahTerpilih && sudahMuat && !kesalahan && (
            <div className="p-5 bg-gradient-to-b from-blue-900/30 to-blue-800/10 border-b border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <span
                    className="inline-block w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: getKategoriColor(wilayahTerpilih.kategori) }}
                  ></span>
                  <h3 className="font-bold text-xl text-white">{wilayahTerpilih.nama}</h3>
                </div>
                <button
                  onClick={() => setWilayahTerpilih(null)}
                  className="bg-blue-600/30 hover:bg-blue-500/40 rounded-full p-1 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
              </div>

              <div className="flex mb-3">
                <span
                  className="px-3 py-1 rounded-full text-white text-xs font-medium"
                  style={{ backgroundColor: getKategoriColor(wilayahTerpilih.kategori) }}
                >
                  {wilayahTerpilih.kategori}
                </span>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-3 mt-3">
                <div className="text-sm mb-2 text-blue-300 font-medium">Indeks Kualitas Udara:</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-blue-200">
                          ISPU: {wilayahTerpilih.ispu}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-slate-700">
                      <div
                        style={{
                          width: `${Math.min(100, (wilayahTerpilih.ispu / 500) * 100)}%`,
                          backgroundColor: getKategoriColor(wilayahTerpilih.kategori),
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">PM10</div>
                  <div className="text-lg font-bold">{wilayahTerpilih.pm10 || '-'} <span className="text-xs font-normal">µg/m³</span></div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">PM2.5</div>
                  <div className="text-lg font-bold">{wilayahTerpilih.pm25 || '-'} <span className="text-xs font-normal">µg/m³</span></div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">SO₂</div>
                  <div className="text-lg font-bold">{wilayahTerpilih.so2 || '-'} <span className="text-xs font-normal">µg/m³</span></div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">CO</div>
                  <div className="text-lg font-bold">{wilayahTerpilih.co || '-'} <span className="text-xs font-normal">ppm</span></div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">O₃</div>
                  <div className="text-lg font-bold">{wilayahTerpilih.o3 || '-'} <span className="text-xs font-normal">µg/m³</span></div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">NO₂</div>
                  <div className="text-lg font-bold">{wilayahTerpilih.no2 || '-'} <span className="text-xs font-normal">µg/m³</span></div>
                </div>
              </div>

              {wilayahTerpilih.parameterKritis && (
                <div className="mt-4 bg-blue-900/30 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <span className="text-sm font-medium">Parameter Pencemar Kritis:</span>
                  </div>
                  <div className="mt-1 pl-7">
                    <span className="text-lg font-bold text-yellow-300">{wilayahTerpilih.parameterKritis}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-400 mt-4">
                Pembaruan terakhir: {wilayahTerpilih.tanggal ? new Date(wilayahTerpilih.tanggal).toLocaleDateString('id-ID') : 'Tidak tersedia'}
              </div>
            </div>
          )}

          {/* Daftar Wilayah */}
          {!wilayahTerpilih && sudahMuat && !kesalahan && (
            <div className="p-4">
              <h3 className="font-semibold mb-2 text-blue-300">Daftar Kualitas Udara</h3>
              <div className="grid grid-cols-1 gap-2">
                {daftarWilayah.map((wilayah) => (
                  <div
                    key={wilayah.id}
                    className="p-3 rounded-lg text-sm transition-all cursor-pointer hover:bg-slate-700/50 bg-slate-800/50 flex justify-between items-center"
                    onClick={() => {
                      setWilayahTerpilih(wilayah);
                      const peta = window.map;
                      if (peta) {
                        const center = calculateCenter(wilayah.geometry);
                        peta.flyTo({
                          center,
                          zoom: 12,
                          pitch: 60,
                          bearing: 30,
                          duration: 1500,
                        });
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getKategoriColor(wilayah.kategori) }}
                      ></span>
                      <div className="font-medium">{wilayah.nama}</div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-300 text-xs mr-2">
                        ISPU: <strong>{wilayah.ispu}</strong>
                      </span>
                      <div
                        className="px-2 py-1 rounded-full text-white text-xs"
                        style={{ backgroundColor: getKategoriColor(wilayah.kategori) }}
                      >
                        {wilayah.kategori}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UdaraLayer;