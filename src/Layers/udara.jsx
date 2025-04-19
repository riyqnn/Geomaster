import { useEffect, useState, useCallback } from 'react';

const UdaraLayer = ({ isVisible, sidebarExpanded, tableHeight }) => {
  const [sudahMuat, setSudahMuat] = useState(false);
  const [kesalahan, setKesalahan] = useState(null);
  const [wilayahTerpilih, setWilayahTerpilih] = useState(null);
  const [daftarWilayah, setDaftarWilayah] = useState([]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const getKategoriColor = useCallback((kategori) => {
    switch (kategori) {
      case 'Baik': return '#00e676';
      case 'Sedang': return '#ffee58';
      case 'Tidak Sehat': return '#ff9800';
      case 'Sangat Tidak Sehat': return '#f44336';
      case 'Berbahaya': return '#9c27b0';
      default: return '#78909c';
    }
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !panelVisible) setPanelVisible(true);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [panelVisible]);

  const calculateCenter = useCallback((geometry) => {
    if (!geometry || !geometry.coordinates) return [0, 0];
    if (geometry.type === 'Polygon') {
      let x = 0, y = 0, numPoints = 0;
      geometry.coordinates[0].forEach(coord => {
        x += coord[0];
        y += coord[1];
        numPoints++;
      });
      return numPoints > 0 ? [x / numPoints, y / numPoints] : [0, 0];
    } else if (geometry.type === 'MultiPolygon') {
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
  }, []);

  const addLegend = useCallback((peta) => {
    if (document.getElementById('legend-udara')) return;
    const legend = document.createElement('div');
    legend.id = 'legend-udara';
    legend.className = `absolute bottom-4 bg-slate-900/90 text-white p-2 rounded-lg z-10 shadow-lg border border-slate-700/50 text-xs md:bottom-[${tableHeight + 16}px] ${isMobile ? 'left-2' : 'left-2'}`;
    legend.innerHTML = `
      <h4 class="font-bold text-center mb-1 text-blue-300 text-xs">Kualitas Udara</h4>
      ${['Baik', 'Sedang', 'Tidak Sehat', 'Sangat Tidak Sehat', 'Berbahaya'].map(cat => `
        <div class="flex items-center my-0.5">
          <div class="w-2 h-2 md:w-3 md:h-3 rounded-full mr-1" style="background-color: ${getKategoriColor(cat)}"></div>
          <span class="text-xs">${cat}</span>
        </div>
      `).join('')}
      <p class="text-xs mt-1 text-gray-300 italic text-center hidden md:block">Klik area untuk detail</p>
    `;
    peta.getContainer().appendChild(legend);
  }, [getKategoriColor, isMobile, tableHeight]);

  const processLayerData = useCallback((data) => {
    const petaWilayah = new Map();
    data.features.forEach(f => {
      if (!f.properties || !f.properties.wilayah) return;
      const nama = f.properties.wilayah;
      const ispu = f.properties.data_udara_final_max || 0;
      let kategori = ispu <= 60 ? 'Baik' : ispu <= 70 ? 'Sedang' : ispu <= 80 ? 'Tidak Sehat' : ispu <= 90 ? 'Sangat Tidak Sehat' : 'Berbahaya';
      petaWilayah.set(nama, {
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
      });
    });
    const daftar = Array.from(petaWilayah.values()).sort((a, b) => b.ispu - a.ispu);
    setDaftarWilayah(daftar);
    return data;
  }, []);

  useEffect(() => {
    const peta = window.map;
    if (!peta || !isVisible) return;
    const cleanup = () => {
      ['kualitas_udara-fill', 'kualitas_udara-line', 'kualitas_udara-labels', 'highlight-udara'].forEach(id => {
        if (peta.getLayer(id)) peta.removeLayer(id);
      });
      if (peta.getSource('kualitas_udara')) peta.removeSource('kualitas_udara');
      document.getElementById('legend-udara')?.remove();
      document.getElementById('loading-indicator')?.remove();
    };

    const saatMuat = async () => {
      if (peta.getSource('kualitas_udara')) {
        setSudahMuat(true);
        return;
      }
      const indikatorMuat = document.createElement('div');
      indikatorMuat.id = 'loading-indicator';
      indikatorMuat.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 text-white p-2 rounded-lg z-50 flex items-center space-x-1';
      indikatorMuat.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500 border-r-2 border-blue-500"></div><span class="text-xs">Memuat...</span>';
      peta.getContainer().appendChild(indikatorMuat);

      try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/data_udara.json?_=${Date.now() % 1000}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const processedData = processLayerData(data);

        ['kualitas_udara-fill', 'kualitas_udara-line', 'kualitas_udara-labels', 'highlight-udara'].forEach(id => {
          if (peta.getLayer(id)) peta.removeLayer(id);
        });
        if (peta.getSource('kualitas_udara')) peta.removeSource('kualitas_udara');

        peta.addSource('kualitas_udara', { type: 'geojson', data: processedData, generateId: true });
        peta.addLayer({
          id: 'kualitas_udara-fill',
          type: 'fill-extrusion',
          source: 'kualitas_udara',
          paint: {
            'fill-extrusion-color': ['step', ['get', 'data_udara_final_max'], '#00e676', 60, '#ffee58', 70, '#ff9800', 80, '#f44336', 90, '#9c27b0'],
            'fill-extrusion-height': ['*', ['get', 'data_udara_final_max'], 20],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.65,
          },
        });
        peta.addLayer({
          id: 'kualitas_udara-line',
          type: 'line',
          source: 'kualitas_udara',
          paint: { 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': 0.8 },
        });
        peta.addLayer({
          id: 'kualitas_udara-labels',
          type: 'symbol',
          source: 'kualitas_udara',
          layout: {
            'text-field': ['to-string', ['get', 'data_udara_final_max']],
            'text-size': 10,
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'symbol-sort-key': ['-', ['get', 'data_udara_final_max']],
          },
          paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1 },
        });

        peta.on('click', 'kualitas_udara-fill', (e) => {
          const properties = e.features[0].properties;
          const ispu = properties.data_udara_final_max || 0;
          const kategori = ispu <= 60 ? 'Baik' : ispu <= 70 ? 'Sedang' : ispu <= 80 ? 'Tidak Sehat' : ispu <= 90 ? 'Sangat Tidak Sehat' : 'Berbahaya';
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
          if (isMobile && !panelVisible) setPanelVisible(true);
          if (peta.getLayer('highlight-udara')) peta.removeLayer('highlight-udara');
          peta.addLayer({
            id: 'highlight-udara',
            type: 'line',
            source: 'kualitas_udara',
            filter: ['==', ['id'], e.features[0].id],
            paint: { 'line-color': '#FFFF00', 'line-width': 2, 'line-opacity': 0.8 },
          });
          const center = calculateCenter(e.features[0].geometry);
          peta.flyTo({ center, zoom: 12, pitch: 60, bearing: 30, duration: 1000 });
        });

        peta.on('mouseenter', 'kualitas_udara-fill', () => { peta.getCanvas().style.cursor = 'pointer'; });
        peta.on('mouseleave', 'kualitas_udara-fill', () => { peta.getCanvas().style.cursor = ''; });

        addLegend(peta);
        document.getElementById('loading-indicator')?.remove();
        setSudahMuat(true);
      } catch (err) {
        setKesalahan(err.message);
        document.getElementById('loading-indicator')?.remove();
      }
    };

    peta.on('load', saatMuat);
    if (peta.loaded()) saatMuat();
    return cleanup;
  }, [isVisible, calculateCenter, processLayerData, addLegend, isMobile, tableHeight]);

  const togglePanel = () => setPanelVisible(!panelVisible);

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={togglePanel}
        className={`fixed z-20 bottom-16 bg-blue-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center md:hidden ${sidebarExpanded ? 'right-[80px]' : 'right-2'}`}
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
          <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-800 to-indigo-900 sticky top-0 z-10">
            <h2 className="font-bold text-sm md:text-lg">Indeks Kualitas Udara</h2>
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
              <div className="p-2 md:p-3 bg-gradient-to-b from-blue-900/30 to-blue-800/10 border-b border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <span
                      className="inline-block w-2 h-2 md:w-3 md:h-3 rounded-full mr-1"
                      style={{ backgroundColor: getKategoriColor(wilayahTerpilih.kategori) }}
                    ></span>
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
                <div className="flex mb-1">
                  <span
                    className="px-1 py-0.5 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: getKategoriColor(wilayahTerpilih.kategori) }}
                  >
                    {wilayahTerpilih.kategori}
                  </span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 mt-1">
                  <div className="text-xs text-blue-300 font-medium mb-1">Indeks Kualitas Udara:</div>
                  <div className="relative pt-1">
                    <div className="flex mb-1 items-center justify-between">
                      <span className="text-xs font-semibold text-blue-200">ISPU: {wilayahTerpilih.ispu}</span>
                    </div>
                    <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded-full bg-slate-700">
                      <div
                        style={{ width: `${Math.min(100, (wilayahTerpilih.ispu / 500) * 100)}%`, backgroundColor: getKategoriColor(wilayahTerpilih.kategori) }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {['pm10', 'pm25', 'so2', 'co', 'o3', 'no2'].map(param => (
                    <div key={param} className="bg-slate-800/50 rounded-lg p-1.5">
                      <div className="text-[10px] text-gray-400 mb-0.5">{param.toUpperCase()}</div>
                      <div className="text-xs md:text-sm font-bold">{wilayahTerpilih[param] || '-'} <span className="text-[10px] font-normal">{param === 'co' ? 'ppm' : 'µg/m³'}</span></div>
                    </div>
                  ))}
                </div>
                {wilayahTerpilih.parameterKritis && (
                  <div className="mt-2 bg-blue-900/30 rounded-lg p-1.5">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                      <span className="text-xs font-medium">Pencemar Kritis:</span>
                    </div>
                    <div className="mt-0.5 pl-4">
                      <span className="text-xs md:text-sm font-bold text-yellow-300">{wilayahTerpilih.parameterKritis}</span>
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-2">
                  Terakhir: {wilayahTerpilih.tanggal ? new Date(wilayahTerpilih.tanggal).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
            )}

            {!wilayahTerpilih && sudahMuat && !kesalahan && (
              <div className="p-2 md:p-3">
                <h3 className="font-semibold mb-1 text-blue-300 text-xs">Daftar Kualitas Udara</h3>
                <div className="grid grid-cols-1 gap-1 max-h-[calc(100vh-100px)] md:max-h-[calc(80vh-100px)] overflow-y-auto custom-scrollbar">
                  {daftarWilayah.map(wilayah => (
                    <div
                      key={wilayah.id}
                      className="p-1.5 rounded-lg text-xs transition-all cursor-pointer hover:bg-slate-700/50 bg-slate-800/50 flex justify-between items-center"
                      onClick={() => {
                        setWilayahTerpilih(wilayah);
                        const peta = window.map;
                        if (peta) {
                          const center = calculateCenter(wilayah.geometry);
                          peta.flyTo({ center, zoom: 12, pitch: 60, bearing: 30, duration: 1000 });
                        }
                      }}
                    >
                      <div className="flex items-center overflow-hidden">
                        <span
                          className="flex-shrink-0 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1"
                          style={{ backgroundColor: getKategoriColor(wilayah.kategori) }}
                        ></span>
                        <div className="font-medium truncate text-xs">{wilayah.nama}</div>
                      </div>
                      <div className="flex items-center ml-1 flex-shrink-0">
                        <span className="text-blue-300 text-[10px] mr-1 hidden sm:inline">ISPU: <strong>{wilayah.ispu}</strong></span>
                        <span className="text-blue-300 text-[10px] mr-1 sm:hidden"><strong>{wilayah.ispu}</strong></span>
                        <div
                          className="px-1 py-0.5 rounded-full text-white text-[10px]"
                          style={{ backgroundColor: getKategoriColor(wilayah.kategori) }}
                        >
                          <span className="hidden sm:inline">{wilayah.kategori}</span>
                          <span className="sm:hidden">
                            {wilayah.kategori === 'Baik' ? 'B' : 
                             wilayah.kategori === 'Sedang' ? 'S' : 
                             wilayah.kategori === 'Tidak Sehat' ? 'TS' : 
                             wilayah.kategori === 'Sangat Tidak Sehat' ? 'STS' : 'BH'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UdaraLayer;