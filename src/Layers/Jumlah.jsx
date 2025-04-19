import { useEffect, useState, useCallback, useRef } from "react";
import maplibregl from "maplibre-gl";

const Jumlah = ({ isVisible, sidebarExpanded, tableHeight }) => {
  const [sudahMuat, setSudahMuat] = useState(false);
  const [kesalahan, setKesalahan] = useState(null);
  const [wilayahTerpilih, setWilayahTerpilih] = useState(null);
  const [daftarWilayah, setDaftarWilayah] = useState([]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dataFetchedRef = useRef(false);
  const geojsonDataRef = useRef(null);
  const toggleTimeoutRef = useRef(null);
  const dataSourceUrl = "https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jumlah_penduduk.json";

  const calculateCenter = useCallback((geometry) => {
    if (!geometry?.coordinates) return [0, 0];
    let x = 0, y = 0, numPoints = 0;
    const processCoords = (coords) => {
      coords.forEach(coord => {
        x += coord[0];
        y += coord[1];
        numPoints++;
      });
    };
    if (geometry.type === 'Polygon') {
      processCoords(geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => processCoords(polygon[0]));
    } else {
      return geometry.coordinates || [0, 0];
    }
    return numPoints > 0 ? [x / numPoints, y / numPoints] : [0, 0];
  }, []);

  const addLegend = useCallback((peta, min, max) => {
    if (document.getElementById("jumlah-legend")) return;
    const legend = document.createElement("div");
    legend.id = "jumlah-legend";
    legend.className = `absolute bottom-4 bg-slate-900/90 text-white p-2 rounded-lg z-10 shadow-lg border border-slate-700/50 text-xs md:bottom-[${tableHeight + 16}px] left-2`;
    legend.innerHTML = `
      <h4 class="font-bold text-center mb-1 text-blue-300 text-xs">Population Density</h4>
      <div class="w-full h-2 rounded mb-1" style="background: linear-gradient(to right, #c6dbef, #4292c6, #084594)"></div>
      <div class="flex justify-between text-xs">
        <span>${min.toLocaleString()}</span>
        <span>${max.toLocaleString()}</span>
      </div>
    `;
    peta.getContainer().appendChild(legend);
  }, [tableHeight]);

  const initializeLayers = useCallback((peta, data, popMin, popMax) => {
    if (!peta.getSource("jumlah_penduduk")) {
      peta.addSource("jumlah_penduduk", { type: "geojson", data, promoteId: "id" });
    } else {
      peta.getSource("jumlah_penduduk").setData(data);
    }

    const mapLayers = [
      {
        id: "jumlah_penduduk-fill",
        type: "fill",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "jumlah_penduduk"],
            popMin, "#c6dbef",
            popMin + (popMax - popMin) / 2, "#4292c6",
            popMax, "#084594",
          ],
          "fill-opacity": 0.7,
        },
      },
      {
        id: "jumlah_penduduk-line",
        type: "line",
        paint: {
          "line-color": "#ff4d4d",
          "line-width": 2.5,
          "line-opacity": 1,
        },
      },
      {
        id: "jumlah_penduduk-label",
        type: "symbol",
        layout: {
          "text-field": ["get", "nama_kab_kota"],
          "text-font": ["Open Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 0, 10, 12],
          "text-offset": [0, 0.6],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1.5,
        },
      },
    ];

    mapLayers.forEach(layer => {
      if (!peta.getLayer(layer.id)) {
        peta.addLayer({ id: layer.id, type: layer.type, source: "jumlah_penduduk", layout: layer.layout || {}, paint: layer.paint || {} });
      }
    });

    const handleClick = (e) => {
      const properti = e.features[0].properties;
      const geometry = e.features[0].geometry;
      setWilayahTerpilih({
        id: e.features[0].id,
        nama: properti.nama_kab_kota,
        populasi: properti.jumlah_penduduk,
        geometry,
      });
      if (isMobile && !panelVisible) setPanelVisible(true);
      if (peta.getLayer("highlight-layer")) peta.removeLayer("highlight-layer");
      peta.addLayer({
        id: "highlight-layer",
        type: "line",
        source: "jumlah_penduduk",
        filter: ["==", ["id"], e.features[0].id],
        paint: {
          "line-color": "#FFFF00",
          "line-width": 4,
          "line-opacity": 1,
        },
      });
      const center = calculateCenter(geometry);
      peta.flyTo({ center, zoom: 12, pitch: 60, bearing: 30, duration: 800 });
    };

    peta.on("click", "jumlah_penduduk-fill", handleClick);
    peta.on("mouseenter", "jumlah_penduduk-fill", () => { peta.getCanvas().style.cursor = "pointer"; });
    peta.on("mouseleave", "jumlah_penduduk-fill", () => { peta.getCanvas().style.cursor = ""; });

    addLegend(peta, popMin, popMax);
  }, [addLegend, calculateCenter, isMobile, panelVisible]);

  const processPopulationData = useCallback(async (peta) => {
    if (!peta || (dataFetchedRef.current && geojsonDataRef.current)) {
      if (geojsonDataRef.current) {
        initializeLayers(peta, geojsonDataRef.current.data, geojsonDataRef.current.popMin, geojsonDataRef.current.popMax);
        setSudahMuat(true);
      }
      return;
    }

    const indikatorMuat = document.createElement("div");
    indikatorMuat.id = "loading-indicator";
    indikatorMuat.className = "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 text-white p-2 rounded-lg z-50 flex items-center space-x-1";
    indikatorMuat.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500 border-r-2 border-blue-500"></div><span class="text-xs">Memuat data populasi...</span>';
    peta.getContainer().appendChild(indikatorMuat);

    try {
      const response = await fetch(`${dataSourceUrl}?_=${Date.now() % 1000}`, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data.features || data.features.length === 0) throw new Error("Tidak ada data fitur yang ditemukan");

      const petaWilayah = new Map();
      data.features.forEach(f => {
        if (!f.properties?.nama_kab_kota || !f.properties.jumlah_penduduk) return;
        const nama = f.properties.nama_kab_kota;
        const populasi = parseInt(f.properties.jumlah_penduduk, 10);
        petaWilayah.set(nama, {
          id: f.id,
          nama,
          populasi,
          geometry: f.geometry,
        });
      });

      const daftar = Array.from(petaWilayah.values()).sort((a, b) => b.populasi - a.populasi);
      if (daftar.length === 0) throw new Error("Tidak berhasil mengekstrak data wilayah");
      setDaftarWilayah(daftar);

      const nilaiPopulasi = daftar.map(w => w.populasi).filter(value => !isNaN(value) && value !== null);
      if (nilaiPopulasi.length === 0) throw new Error("Tidak ada data populasi yang valid");
      let popMin = Math.min(...nilaiPopulasi);
      let popMax = Math.max(...nilaiPopulasi);
      if (popMin === popMax) {
        popMin = Math.max(0, popMin - 1);
        popMax = popMax + 1;
      }

      geojsonDataRef.current = { data, popMin, popMax };
      dataFetchedRef.current = true;
      setSudahMuat(true);
      initializeLayers(peta, data, popMin, popMax);
      document.getElementById("loading-indicator")?.remove();
    } catch (err) {
      setKesalahan(err.message);
      document.getElementById("loading-indicator")?.remove();
    }
  }, [initializeLayers]);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible) return;

    const handleLoad = () => processPopulationData(peta);
    if (peta.loaded()) handleLoad();
    else peta.on("load", handleLoad);

    return () => {
      peta.off("load", handleLoad);
      ["jumlah_penduduk-fill", "jumlah_penduduk-line", "jumlah_penduduk-label", "highlight-layer"].forEach(id => {
        if (peta.getLayer(id)) peta.removeLayer(id);
      });
      document.getElementById("jumlah-legend")?.remove();
      document.getElementById("loading-indicator")?.remove();
    };
  }, [isVisible, processPopulationData]);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible || !sudahMuat || !geojsonDataRef.current) return;
    initializeLayers(peta, geojsonDataRef.current.data, geojsonDataRef.current.popMin, geojsonDataRef.current.popMax);
  }, [isVisible, sudahMuat, initializeLayers]);

  useEffect(() => {
    const checkViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !panelVisible) setPanelVisible(true);
      if (mobile && !dataFetchedRef.current) setPanelVisible(false);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, [panelVisible]);

  const togglePanel = useCallback(() => {
    if (toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
    toggleTimeoutRef.current = setTimeout(() => {
      setPanelVisible(prev => !prev);
    }, 200);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={togglePanel}
        className={`fixed z-20 bottom-16 bg-blue-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center md:hidden ${sidebarExpanded ? "right-[80px]" : "right-2"}`}
        aria-label={panelVisible ? "Hide panel" : "Show panel"}
      >
        {panelVisible ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      <div
        className={`fixed md:absolute top-0 z-10 h-screen md:h-auto transition-all duration-300 transform ${
          panelVisible ? "translate-x-0" : "translate-x-[100%] md:translate-x-0"
        } ${isMobile ? "right-0" : "right-2"}`}
      >
        <div
          className="bg-slate-900/95 text-white md:rounded-lg shadow-lg border border-slate-700/50 h-full md:h-auto flex flex-col custom-scrollbar"
          style={{ width: isMobile ? "85vw" : "320px", maxHeight: isMobile ? "100vh" : `calc(100vh - ${tableHeight + 16}px)`, maxWidth: isMobile ? "320px" : "none" }}
        >
          <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-800 to-indigo-900 sticky top-0 z-10">
            <h2 className="font-bold text-sm md:text-lg flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Jumlah Penduduk
            </h2>
            <button onClick={togglePanel} className="text-white md:hidden" aria-label="Tutup panel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 text-xs md:text-sm">
            {!sudahMuat && !kesalahan && (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-slate-300 text-xs">Memuat data...</p>
              </div>
            )}

            {kesalahan && (
              <div className="p-2 bg-blue-900/50 border border-blue-700 rounded-lg m-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <p className="text-blue-200 text-xs">{kesalahan}</p>
                </div>
                <button
                  className="mt-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs font-medium transition-colors w-full"
                  onClick={() => window.location.reload()}
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {wilayahTerpilih && sudahMuat && !kesalahan && (
              <div className="p-2 md:p-3 bg-gradient-to-b from-blue-900/30 to-blue-800/10 border-b border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <h3 className="font-bold text-sm md:text-base text-white truncate">{wilayahTerpilih.nama}</h3>
                  </div>
                  <button
                    onClick={() => setWilayahTerpilih(null)}
                    className="bg-blue-600/30 hover:bg-blue-500/40 rounded-full p-1 transition-colors"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-1.5">
                  <div className="text-[10px] text-blue-300 mb-0.5">Populasi</div>
                  <div className="text-sm md:text-base font-bold">{wilayahTerpilih.populasi.toLocaleString()}</div>
                </div>
              </div>
            )}

            {!wilayahTerpilih && sudahMuat && !kesalahan && (
              <div className="p-2 md:p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-xs text-blue-300 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Daftar Wilayah
                  </h3>
                  <span className="text-[10px] text-slate-400">{daftarWilayah.length} wilayah</span>
                </div>
                <div className="grid grid-cols-1 gap-1 max-h-[calc(100vh-100px)] md:max-h-[calc(80vh-100px)] overflow-y-auto custom-scrollbar">
                  {daftarWilayah.map(wilayah => (
                    <div
                      key={wilayah.id}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer hover:bg-slate-700/50 bg-slate-800/50 flex flex-col ${
                        wilayahTerpilih?.id === wilayah.id ? "border-l-3 border-blue-500 pl-1" : ""
                      }`}
                      onClick={() => {
                        setWilayahTerpilih(wilayah);
                        const peta = window.map;
                        if (peta) {
                          const center = calculateCenter(wilayah.geometry);
                          peta.flyTo({ center, zoom: 12, pitch: 60, bearing: 30, duration: 800 });
                          if (peta.getLayer("highlight-layer")) peta.removeLayer("highlight-layer");
                          peta.addLayer({
                            id: "highlight-layer",
                            type: "line",
                            source: "jumlah_penduduk",
                            filter: ["==", ["id"], wilayah.id],
                            paint: {
                              "line-color": "#FFFF00",
                              "line-width": 4,
                              "line-opacity": 1,
                            },
                          });
                        }
                      }}
                    >
                      <div className="font-medium truncate mr-1">{wilayah.nama}</div>
                      <div className="text-blue-300 text-[10px] mt-0.5">
                        Populasi: {wilayah.populasi.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-2 bg-slate-800/90 border-t border-slate-700 text-center text-[10px] text-slate-400">
            Klik wilayah di peta untuk detail
          </div>
        </div>
      </div>
    </>
  );
};

export default Jumlah;