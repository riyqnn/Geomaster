import { useEffect, useState, useRef, useCallback } from 'react';

const Zoonosis = ({ isVisible, sidebarExpanded, tableHeight }) => {
  const [sudahMuat, setSudahMuat] = useState(false);
  const [kesalahan, setKesalahan] = useState(null);
  const [wilayahTerpilih, setWilayahTerpilih] = useState(null);
  const [daftarWilayah, setDaftarWilayah] = useState([]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dataFetchedRef = useRef(false);
  const geojsonDataRef = useRef(null);
  const toggleTimeoutRef = useRef(null);
  const dataSourceUrl = 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/zoonosis.json';

  const getDeathRateColorClass = useCallback((rate) => {
    if (rate >= 50) return 'bg-red-900/70 text-red-200';
    if (rate >= 30) return 'bg-red-800/70 text-red-200';
    if (rate >= 15) return 'bg-amber-800/70 text-amber-200';
    return 'bg-slate-700/70 text-slate-300';
  }, []);

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
    if (document.getElementById('zoonosis-legend')) return;
    const legend = document.createElement('div');
    legend.id = 'zoonosis-legend';
    legend.className = `absolute bottom-4 bg-slate-900/90 text-white p-2 rounded-lg z-10 shadow-lg border border-slate-700/50 text-xs md:bottom-[${tableHeight + 16}px] left-2`;
    legend.innerHTML = `
      <h4 class="font-bold text-center mb-1 text-red-300 text-xs">Tingkat Keparahan</h4>
      <div class="w-full h-2 rounded mb-1" style="background: linear-gradient(to right, #ffffcc, #fd8d3c, #f03b20, #bd0026)"></div>
      <div class="flex justify-between text-xs">
        <span>Rendah</span>
        <span>Kritis</span>
      </div>
      <div class="mt-2 pt-1 border-t border-slate-700 flex items-center">
        <input type="checkbox" id="heatmap-toggle" class="mr-1" checked />
        <label for="heatmap-toggle" class="text-xs">Heatmap</label>
      </div>
    `;
    peta.getContainer().appendChild(legend);
    const checkbox = legend.querySelector('#heatmap-toggle');
    checkbox.addEventListener('change', (e) => {
      peta.setLayoutProperty('penyebaran-heatmap', 'visibility', e.target.checked ? 'visible' : 'none');
    });
  }, [tableHeight]);

  const initializeLayers = useCallback((peta, data, daftar, severityMin, severityMax) => {
    const step1 = severityMin + (severityMax - severityMin) / 3;
    const step2 = severityMin + (2 * (severityMax - severityMin)) / 3;

    if (!peta.getSource('penyebaran')) {
      peta.addSource('penyebaran', { type: 'geojson', data, promoteId: 'id' });
    } else {
      peta.getSource('penyebaran').setData(data);
    }

    const mapLayers = [
      {
        id: 'penyebaran-fill',
        type: 'fill',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'zoonosis_indeks_severity'],
            severityMin, '#ffffcc',
            step1, '#fd8d3c',
            step2, '#f03b20',
            severityMax, '#bd0026',
          ],
          'fill-opacity': 0.7,
        },
      },
      {
        id: 'penyebaran-line',
        type: 'line',
        paint: { 'line-color': '#000', 'line-width': 1, 'line-opacity': 0.5 },
      },
      {
        id: 'penyebaran-label',
        type: 'symbol',
        layout: {
          'text-field': ['get', 'Kota'],
          'text-font': ['Open Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 0, 10, 10],
          'text-offset': [0, 0.6],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1.5 },
      },
      {
        id: 'penyebaran-heatmap',
        type: 'heatmap',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'zoonosis_indeks_severity'], severityMin, 0, severityMax, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0.5],
        },
      },
    ];

    mapLayers.forEach(layer => {
      if (!peta.getLayer(layer.id)) {
        peta.addLayer({ id: layer.id, type: layer.type, source: 'penyebaran', layout: layer.layout || {}, paint: layer.paint || {} });
      }
    });

    peta.on('click', 'penyebaran-fill', (e) => {
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
        periodData: properti.zoonosis_periode_data || 'Tidak ada data',
        geometry: e.features[0].geometry,
      });
      if (isMobile && !panelVisible) setPanelVisible(true);
      if (peta.getLayer('highlight-layer')) peta.removeLayer('highlight-layer');
      peta.addLayer({
        id: 'highlight-layer',
        type: 'line',
        source: 'penyebaran',
        filter: ['==', ['id'], e.features[0].id],
        paint: { 'line-color': '#FFFF00', 'line-width': 4, 'line-opacity': 1 },
      });
      const center = calculateCenter(e.features[0].geometry);
      peta.flyTo({ center, zoom: 12, pitch: 60, bearing: 30, duration: 800 });
    });

    peta.on('mouseenter', 'penyebaran-fill', () => { peta.getCanvas().style.cursor = 'pointer'; });
    peta.on('mouseleave', 'penyebaran-fill', () => { peta.getCanvas().style.cursor = ''; });

    addLegend(peta, severityMin, severityMax);
  }, [addLegend, calculateCenter, isMobile, panelVisible]);

  const processZoonosisData = useCallback(async (peta) => {
    if (!peta || (dataFetchedRef.current && geojsonDataRef.current)) {
      if (geojsonDataRef.current) {
        const daftar = Array.from(new Map(geojsonDataRef.current.wilayahMap).values());
        initializeLayers(peta, geojsonDataRef.current.data, daftar, geojsonDataRef.current.severityMin, geojsonDataRef.current.severityMax);
        setSudahMuat(true);
      }
      return;
    }

    const indikatorMuat = document.createElement('div');
    indikatorMuat.id = 'loading-indicator';
    indikatorMuat.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 text-white p-2 rounded-lg z-50 flex items-center space-x-1';
    indikatorMuat.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-t-2 border-red-500 border-r-2 border-red-500"></div><span class="text-xs">Memuat...</span>';
    peta.getContainer().appendChild(indikatorMuat);

    try {
      const response = await fetch(`${dataSourceUrl}?_=${Date.now() % 1000}`, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data.features || data.features.length === 0) throw new Error('Tidak ada data fitur yang ditemukan');

      const petaWilayah = new Map();
      const processedFeatures = data.features.map(f => {
        if (!f.properties || !f.properties.Kota) return f;
        const kota = f.properties.Kota;
        if (kota === 'Jakarta Selatan') {
          f.properties.zoonosis_jumlah_kasus = 288;
          f.properties.zoonosis_jumlah_kematian = 1;
        } else if (kota === 'Jakarta Timur') {
          f.properties.zoonosis_jumlah_kasus = 58;
          f.properties.zoonosis_jumlah_kematian = 38;
        }
        const jumlahKasus = parseInt(f.properties.zoonosis_jumlah_kasus || 0, 10);
        const jumlahKematian = parseInt(f.properties.zoonosis_jumlah_kematian || 0, 10);
        const tingkatKematian = jumlahKasus > 0 ? (jumlahKematian / jumlahKasus * 100) : 0;
        const indeksSeverity = jumlahKasus * (1 + tingkatKematian / 50);
        f.properties.zoonosis_tingkat_kematian = tingkatKematian;
        f.properties.zoonosis_indeks_severity = indeksSeverity;
        petaWilayah.set(kota, {
          id: f.id,
          kota,
          jumlahKasus,
          jumlahKematian,
          tingkatKematian,
          indeksSeverity,
          periodData: f.properties.zoonosis_periode_data || 'Tidak ada data',
          geometry: f.geometry,
        });
        return f;
      });

      data.features = processedFeatures;
      const daftar = Array.from(petaWilayah.values()).sort((a, b) => b.indeksSeverity - a.indeksSeverity);
      if (daftar.length === 0) throw new Error('Tidak berhasil mengekstrak data wilayah');
      setDaftarWilayah(daftar);

      const nilaiSeverity = daftar.map(w => w.indeksSeverity).filter(value => !isNaN(value) && value !== null);
      if (nilaiSeverity.length === 0) throw new Error('Tidak ada data severity yang valid');
      let severityMin = Math.min(...nilaiSeverity);
      let severityMax = Math.max(...nilaiSeverity);
      if (severityMin === severityMax) {
        severityMin = Math.max(0, severityMin - 1);
        severityMax = severityMax + 1;
      }

      geojsonDataRef.current = { data, wilayahMap: petaWilayah, severityMin, severityMax };
      dataFetchedRef.current = true;
      setSudahMuat(true);
      initializeLayers(peta, data, daftar, severityMin, severityMax);
      document.getElementById('loading-indicator')?.remove();
    } catch (err) {
      setKesalahan(err.message);
      document.getElementById('loading-indicator')?.remove();
    }
  }, [initializeLayers]);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible) return;

    const handleLoad = () => processZoonosisData(peta);
    if (peta.loaded()) handleLoad();
    else peta.on('load', handleLoad);

    return () => {
      peta.off('load', handleLoad);
      ['penyebaran-fill', 'penyebaran-line', 'penyebaran-label', 'penyebaran-heatmap', 'highlight-layer'].forEach(id => {
        if (peta.getLayer(id)) peta.removeLayer(id);
      });
      document.getElementById('zoonosis-legend')?.remove();
      document.getElementById('loading-indicator')?.remove();
    };
  }, [isVisible, processZoonosisData]);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible || !sudahMuat || !geojsonDataRef.current) return;
    const daftar = Array.from(new Map(geojsonDataRef.current.wilayahMap).values());
    initializeLayers(peta, geojsonDataRef.current.data, daftar, geojsonDataRef.current.severityMin, geojsonDataRef.current.severityMax);
  }, [isVisible, sudahMuat, initializeLayers]);

  useEffect(() => {
    const checkViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !panelVisible) setPanelVisible(true);
      if (mobile && !dataFetchedRef.current) setPanelVisible(false);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
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
        className={`fixed z-20 bottom-16 bg-red-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center md:hidden ${sidebarExpanded ? 'right-[80px]' : 'right-2'}`}
        aria-label={panelVisible ? 'Hide panel' : 'Show panel'}
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
          panelVisible ? 'translate-x-0' : 'translate-x-[100%] md:translate-x-0'
        } ${isMobile ? 'right-0' : 'right-2'}`}
      >
        <div
          className="bg-slate-900/95 text-white md:rounded-lg shadow-lg border border-slate-700/50 h-full md:h-auto flex flex-col custom-scrollbar"
          style={{ width: isMobile ? '85vw' : '320px', maxHeight: isMobile ? '100vh' : `calc(100vh - ${tableHeight + 16}px)`, maxWidth: isMobile ? '320px' : 'none' }}
        >
          <div className="flex justify-between items-center p-2 bg-gradient-to-r from-red-800 to-rose-900 sticky top-0 z-10">
            <h2 className="font-bold text-sm md:text-lg flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Penyebaran Zoonosis
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
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500 mb-2"></div>
                <p className="text-slate-300 text-xs">Memuat data...</p>
              </div>
            )}

            {kesalahan && (
              <div className="p-2 bg-red-900/50 border border-red-700 rounded-lg m-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <p className="text-red-200 text-xs">{kesalahan}</p>
                </div>
                <button
                  className="mt-1 px-2 py-1 bg-red-700 hover:bg-red-600 rounded-lg text-xs font-medium transition-colors w-full"
                  onClick={() => window.location.reload()}
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {wilayahTerpilih && sudahMuat && !kesalahan && (
              <div className="p-2 md:p-3 bg-gradient-to-b from-red-900/30 to-red-800/10 border-b border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <h3 className="font-bold text-sm md:text-base text-white truncate">{wilayahTerpilih.kota}</h3>
                  </div>
                  <button
                    onClick={() => setWilayahTerpilih(null)}
                    className="bg-red-600/30 hover:bg-red-500/40 rounded-full p-1 transition-colors"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="bg-slate-800/50 rounded-lg p-1.5">
                    <div className="text-[10px] text-red-300 mb-0.5">Jumlah Kasus</div>
                    <div className="text-sm md:text-base font-bold">{wilayahTerpilih.jumlahKasus.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-1.5">
                    <div className="text-[10px] text-red-300 mb-0.5">Jumlah Kematian</div>
                    <div className="text-sm md:text-base font-bold">{wilayahTerpilih.jumlahKematian.toLocaleString()}</div>
                  </div>
                </div>
                <div className={`mt-1 p-1.5 rounded-lg ${getDeathRateColorClass(wilayahTerpilih.tingkatKematian)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] opacity-90">Tingkat Kematian</span>
                    <span className="text-xs font-bold">{wilayahTerpilih.tingkatKematian.toFixed(1)}% CFR</span>
                  </div>
                  <div className="w-full bg-slate-600/50 rounded-full h-1 mt-0.5">
                    <div
                      className="bg-gradient-to-r from-red-400 to-red-600 h-1 rounded-full"
                      style={{ width: `${Math.min(wilayahTerpilih.tingkatKematian, 100)}%` }}
                    ></div>
                  </div>
                </div>
                {wilayahTerpilih.tingkatKematian > 30 && (
                  <div className="mt-1 p-1.5 rounded bg-red-900/30 border border-red-800/50 text-[10px] flex items-center">
                    <svg className="w-3 h-3 mr-1 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <span className="text-red-300">Tingkat kematian sangat tinggi!</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-1">Periode: {wilayahTerpilih.periodData}</div>
              </div>
            )}

            {!wilayahTerpilih && sudahMuat && !kesalahan && (
              <div className="p-2 md:p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-xs text-red-300 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Daftar Kota
                  </h3>
                  <span className="text-[10px] text-slate-400">{daftarWilayah.length} wilayah</span>
                </div>
                <div className="grid grid-cols-1 gap-1 max-h-[calc(100vh-100px)] md:max-h-[calc(80vh-100px)] overflow-y-auto custom-scrollbar">
                  {daftarWilayah.map(wilayah => (
                    <div
                      key={wilayah.id}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer hover:bg-slate-700/50 bg-slate-800/50 flex flex-col ${
                        wilayahTerpilih?.id === wilayah.id ? 'border-l-3 border-red-500 pl-1' : ''
                      }`}
                      onClick={() => {
                        setWilayahTerpilih(wilayah);
                        const peta = window.map;
                        if (peta) {
                          const center = calculateCenter(wilayah.geometry);
                          peta.flyTo({ center, zoom: 12, pitch: 60, bearing: 30, duration: 800 });
                          if (peta.getLayer('highlight-layer')) peta.removeLayer('highlight-layer');
                          peta.addLayer({
                            id: 'highlight-layer',
                            type: 'line',
                            source: 'penyebaran',
                            filter: ['==', ['id'], wilayah.id],
                            paint: { 'line-color': '#FFFF00', 'line-width': 4, 'line-opacity': 1 },
                          });
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium truncate mr-1">{wilayah.kota}</div>
                        <div
                          className={`text-[10px] px-1 py-0.5 rounded-full ${
                            wilayah.jumlahKasus > 200 ? 'bg-red-900/70 text-red-200' :
                            wilayah.jumlahKasus > 100 ? 'bg-amber-800/70 text-amber-200' :
                            'bg-slate-700/70 text-slate-300'
                          }`}
                        >
                          {wilayah.jumlahKasus.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span className="text-[10px] text-rose-300">{wilayah.jumlahKematian.toLocaleString()}</span>
                        </div>
                        <div className={`text-[10px] px-1 py-0.5 rounded-full ${getDeathRateColorClass(wilayah.tingkatKematian)}`}>
                          {wilayah.tingkatKematian.toFixed(1)}% CFR
                        </div>
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

export default Zoonosis;