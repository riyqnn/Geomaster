import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import JakartaMap from '../Components/JakartaMap';
import ChartComponent from '../Components/ChartComponent';
import { getChartData } from '../utils/chartData';

function Dashboard() {
  const { t, i18n } = useTranslation();
  const [selectedRegionKey, setSelectedRegionKey] = useState('eastJakarta');
  const [activeTab, setActiveTab] = useState('summary');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [data, setData] = useState({
    zoonosis: { features: [] },
    waste: { features: [] },
    airQuality: { features: [] },
    population: { features: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Language changed to:', i18n.language);
  }, [i18n.language]);

  const DATA_URLS = {
    airQuality: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/data_udara.json',
    waste: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/sampah1.json'
  };

  const regionKeys = {
    eastJakarta: 'eastJakarta',
    northJakarta: 'northJakarta',
    southJakarta: 'southJakarta',
    westJakarta: 'westJakarta',
    centralJakarta: 'centralJakarta'
  };

  const tabKeys = {
    SUMMARY: 'summary',
    RINGKASAN: 'summary',
    'Zoonotic Diseases': 'zoonoticDiseases',
    'Penyakit Zoonosis': 'zoonoticDiseases',
    'Air Quality Index': 'airQualityIndex',
    'Indeks Kualitas Udara': 'airQualityIndex',
    'Waste Management': 'wasteManagement',
    'Pengelolaan Sampah': 'wasteManagement'
  };

  const regions = [
    'eastJakarta',
    'northJakarta',
    'southJakarta',
    'westJakarta',
    'centralJakarta'
  ];

  const tabs = [
    'summary',
    'zoonoticDiseases',
    'airQualityIndex',
    'wasteManagement'
  ];

  const regionToKota = {
    eastJakarta: 'Jakarta Timur',
    northJakarta: 'Jakarta Utara',
    southJakarta: 'Jakarta Selatan',
    westJakarta: 'Jakarta Barat',
    centralJakarta: 'Jakarta Pusat'
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(
        Object.entries(DATA_URLS).map(async ([key, url]) => {
          for (let i = 0; i < 3; i++) {
            try {
              const res = await fetch(`${url}?_=${Date.now() % 1000}`);
              if (!res.ok) throw new Error(`Failed to fetch ${key} data: ${res.status}`);
              return { key, data: await res.json() };
            } catch (err) {
              if (i === 2) {
                console.warn(`Failed to fetch ${key} after retries:`, err);
                return { key, data: { features: [] } };
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
          }
        })
      );

      const newData = {
        zoonosis: { features: [] },
        waste: responses.find(r => r.key === 'waste')?.data || { features: [] },
        airQuality: responses.find(r => r.key === 'airQuality')?.data || { features: [] },
        population: { features: [] }
      };

      newData.airQuality.features = newData.airQuality.features.filter(
        f => f.properties.wilayah !== 'Kepulauan Seribu'
      );
      newData.waste.features = newData.waste.features.filter(
        f => f.properties.wilayah_kota_kab !== 'Kepulauan Seribu'
      );

      console.log('Fetched data:', newData);
      setData(newData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(t('dashboard.fetchError'));
      setData({
        zoonosis: { features: [] },
        waste: { features: [] },
        airQuality: { features: [] },
        population: { features: [] }
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    const timer = setTimeout(() => setMapLoaded(true), 500);
    fetchData();

    return () => {
      document.head.removeChild(link);
      clearTimeout(timer);
    };
  }, [fetchData]);

  const fetchChartData = useCallback(async () => {
    if (loading) return;
    try {
      const regionDisplayName = t(`regions.${selectedRegionKey}`);
      console.log('Fetching chart data for tab:', activeTab, 'region:', regionDisplayName, 'language:', i18n.language);
      const config = await getChartData(activeTab, regionDisplayName, t, data);
      setChartData(config);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(null);
    }
  }, [activeTab, selectedRegionKey, t, data, loading, i18n.language]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const getRegionDisplayName = (regionKey) => {
    return t(`regions.${regionKey}`);
  };

  const getTabDisplayName = (tabKey) => {
    return t(`tabs.${tabKey}`);
  };

  const getTabKey = (displayName) => {
    return tabKeys[displayName] || 'summary';
  };

  const getTabData = (tabKey) => {
    const kota = regionToKota[selectedRegionKey];
    if (!kota) {
      console.warn(`No kota mapping for region: ${selectedRegionKey}`);
      return {
        chartTitle: t('tabData.error.title'),
        description: t('tabData.error.description'),
        stats: []
      };
    }

    const zoonosisData = [
      { kota: "Jakarta Selatan", jumlah_kasus: 288, jumlah_kematian: 1, periode_data: "Maret 2024" },
      { kota: "Jakarta Pusat", jumlah_kasus: 918, jumlah_kematian: 4, periode_data: "Juni 2024" },
      { kota: "Jakarta Barat", jumlah_kasus: 969, jumlah_kematian: 0, periode_data: "Maret 2024" },
      { kota: "Jakarta Timur", jumlah_kasus: 58, jumlah_kematian: 38, periode_data: "Oktober 2024" },
      { kota: "Jakarta Utara", jumlah_kasus: 563, jumlah_kematian: 0, periode_data: "Juni 2023" }
    ];

    const populationData = [
      { kota: "Jakarta Selatan", 2023: 2235606 },
      { kota: "Jakarta Timur", 2023: 3079618 },
      { kota: "Jakarta Pusat", 2023: 1049314 },
      { kota: "Jakarta Barat", 2023: 2470054 },
      { kota: "Jakarta Utara", 2023: 1808985 }
    ];

    const airQuality = data.airQuality?.features.find(f => f.properties.wilayah === kota);
    const ispu = airQuality?.properties.data_udara_final_max || 0;
    const kategori = ispu <= 60 ? 'Good' : ispu <= 70 ? 'Moderate' : ispu <= 80 ? 'Unhealthy' : ispu <= 90 ? 'Very Unhealthy' : 'Hazardous';

    const tpsCount = data.waste?.features.filter(f => f.properties.wilayah_kota_kab === kota).length || 0;

    const dataStructure = {
      summary: {
        chartTitle: t('tabData.summary.chartTitle'),
        description: t('tabData.summary.description'),
        stats: [
          {
            label: t('tabData.summary.stats.diseaseIncidents'),
            value: zoonosisData.find(f => f.kota === kota)?.jumlah_kasus ?? 'N/A',
            color: 'bg-red-500'
          },
          {
            label: t('tabData.summary.stats.airQualityIndex'),
            value: ispu.toFixed(1),
            color: 'bg-orange-500'
          },
          {
            label: t('tabData.summary.stats.wasteLocations'),
            value: tpsCount,
            color: 'bg-green-500'
          },
          {
            label: t('tabData.summary.stats.population'),
            value: populationData.find(f => f.kota === kota)?.[2023] ?? 'N/A',
            color: 'bg-blue-500'
          }
        ]
      },
      zoonoticDiseases: {
        chartTitle: t('tabData.zoonoticDiseases.chartTitle'),
        description: t('tabData.zoonoticDiseases.description'),
        stats: [
          {
            label: t('tabData.zoonoticDiseases.stats.totalCases'),
            value: zoonosisData.find(f => f.kota === kota)?.jumlah_kasus ?? '0',
            color: 'bg-red-500'
          },
          {
            label: t('tabData.zoonoticDiseases.stats.deaths'),
            value: zoonosisData.find(f => f.kota === kota)?.jumlah_kematian ?? '0',
            color: 'bg-orange-500'
          },
          {
            label: t('tabData.zoonoticDiseases.stats.dataPeriod'),
            value: zoonosisData.find(f => f.kota === kota)?.periode_data ?? 'N/A',
            color: 'bg-yellow-500'
          },
          {
            label: t('tabData.zoonoticDiseases.stats.caseFatalityRate'),
            value: (() => {
              const cases = zoonosisData.find(f => f.kota === kota)?.jumlah_kasus ?? 0;
              const deaths = zoonosisData.find(f => f.kota === kota)?.jumlah_kematian ?? 0;
              return cases > 0 ? `${((deaths / cases) * 100).toFixed(1)}%` : '0%';
            })(),
            color: 'bg-green-500'
          }
        ]
      },
      airQualityIndex: {
        chartTitle: t('tabData.airQualityIndex.chartTitle'),
        description: t('tabData.airQualityIndex.description'),
        stats: [
          {
            label: t('tabData.airQualityIndex.stats.ispu'),
            value: ispu.toFixed(1),
            color: 'bg-orange-500'
          },
          {
            label: t('tabData.airQualityIndex.stats.category'),
            value: t(`tabData.airQualityIndex.stats.categories.${kategori.toLowerCase()}`),
            color: 'bg-yellow-500'
          },
          {
            label: t('tabData.airQualityIndex.stats.criticalPollutant'),
            value: airQuality?.properties.data_udara_final_parameter_pencemar_kritis || 'N/A',
            color: 'bg-red-500'
          },
          {
            label: t('tabData.airQualityIndex.stats.pm25'),
            value: airQuality?.properties.data_udara_final_pm_duakomalima?.toFixed(1) || 'N/A',
            color: 'bg-blue-500'
          }
        ]
      },
      wasteManagement: {
        chartTitle: t('tabData.wasteManagement.chartTitle'),
        description: t('tabData.wasteManagement.description'),
        stats: [
          {
            label: t('tabData.wasteManagement.stats.tpsCount'),
            value: tpsCount,
            color: 'bg-green-500'
          },
          {
            label: t('tabData.wasteManagement.stats.organic'),
            value: '50',
            color: 'bg-blue-500'
          },
          {
            label: t('tabData.wasteManagement.stats.plastic'),
            value: '20',
            color: 'bg-yellow-500'
          },
          {
            label: t('tabData.wasteManagement.stats.hazardous'),
            value: '5',
            color: 'bg-red-500'
          }
        ]
      }
    };
    return dataStructure[tabKey] || dataStructure['summary'];
  };

  const renderChart = () => {
    const tabKey = getTabKey(activeTab);
    const currentTabData = getTabData(tabKey);

    if (!chartData) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-400">
          {t('dashboard.loadingChart')}
        </div>
      );
    }

    return (
      <div className="h-80 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-700 p-4 shadow-lg">
        <ChartComponent 
          type={chartData.type} 
          data={chartData.data} 
          title={currentTabData.chartTitle}
          options={chartData.options}
        />
      </div>
    );
  };

  const renderContent = () => {
    const tabKey = getTabKey(activeTab);
    const currentTabData = getTabData(tabKey);

    if (loading) {
      return <div className="text-gray-400 text-center py-10">{t('dashboard.loading')}</div>;
    }

    if (error) {
      return <div className="text-red-400 text-center py-10">{error}</div>;
    }

    return (
      <div className="space-y-6">
        <div className="p-6 bg-gray-800/40 backdrop-blur-md rounded-xl border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-3 text-white">{currentTabData.chartTitle}</h2>
          <p className="text-gray-300">{currentTabData.description}</p>
        </div>

        {renderChart()}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentTabData.stats.map((stat, index) => (
            <div key={index} className="bg-gray-800/40 backdrop-blur-md p-4 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getRiskLevel = () => {
    const kota = regionToKota[selectedRegionKey];
    const zoonosisData = [
      { kota: "Jakarta Selatan", jumlah_kasus: 288 },
      { kota: "Jakarta Pusat", jumlah_kasus: 918 },
      { kota: "Jakarta Barat", jumlah_kasus: 969 },
      { kota: "Jakarta Timur", jumlah_kasus: 58 },
      { kota: "Jakarta Utara", jumlah_kasus: 563 }
    ];
    const cases = zoonosisData.find(f => f.kota === kota)?.jumlah_kasus ?? 0;
    if (cases > 500) return { label: t('map.risk.high'), color: 'bg-red-500' };
    if (cases > 100) return { label: t('map.risk.medium'), color: 'bg-yellow-500' };
    return { label: t('map.risk.low'), color: 'bg-green-500' };
  };

  const getAverageAQI = () => {
    if (!data.airQuality?.features?.length) return 112;
    const total = data.airQuality.features.reduce((sum, f) => sum + (f.properties.data_udara_final_max ?? 0), 0);
    const count = data.airQuality.features.length;
    return count > 0 ? Math.round(total / count) : 112;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white pt-24">
      <style>
        {`
          @media (max-width: 1024px) {
            .lg\\:col-span-1 {
              position: relative;
              z-index: 10;
            }
            .lg\\:col-span-2 {
              margin-top: 1.5rem;
            }
            .map-container {
              height: 60vh;
            }
            .chart-container {
              height: 50vh;
            }
          }
          @media (max-width: 640px) {
            .chart-container {
              height: 40vh;
            }
          }
        `}
      </style>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('dashboard.title')} <span className="text-blue-400">{t('dashboard.monitoring')}</span>
            </h1>
            <p className="text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              {t('dashboard.share')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-md p-5 rounded-xl border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('dashboard.selectRegion')}</label>
              <select 
                value={selectedRegionKey}
                onChange={(e) => setSelectedRegionKey(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                {regions.map(regionKey => (
                  <option key={regionKey} value={regionKey} className="bg-gray-800">
                    {getRegionDisplayName(regionKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-gray-700/50 p-5">
              <h3 className="text-lg font-medium text-gray-300 mb-4">{t('dashboard.dataCategories')}</h3>
              <div className="space-y-2">
                {tabs.map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(getTabDisplayName(tabKey))}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center ${
                      getTabKey(activeTab) === tabKey 
                        ? 'bg-blue-600/80 text-white' 
                        : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-3 ${getTabKey(activeTab) === tabKey ? 'bg-white' : 'bg-gray-500'}`}></span>
                    {getTabDisplayName(tabKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-md p-5 rounded-xl border border-blue-700/30">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">{t('dashboard.aboutDashboard.title')}</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {t('dashboard.aboutDashboard.description')}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {renderContent()}

            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md p-5 rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                    {t('map.title')}
                  </h2>
                  <p className="text-sm text-gray-400">{t('map.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm backdrop-blur-md flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                    {getRegionDisplayName(selectedRegionKey)}
                  </div>
                  <button className="bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/50 p-2 rounded-lg transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/50 p-2 rounded-lg transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="relative map-container h-96 bg-gray-700/20 rounded-lg overflow-hidden border border-gray-600/30 shadow-inner">
                <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/40 flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-300">{t('map.risk.high')}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-300">{t('map.risk.medium')}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-300">{t('map.risk.low')}</span>
                  </div>
                </div>
                
                <div className="absolute inset-0">
                  <JakartaMap selectedRegion={getRegionDisplayName(selectedRegionKey)} riskLevel={getRiskLevel().label || 'Low'} />
                </div>
                
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/40">
                    <div className="text-xs text-gray-400">{t('map.monitoringStations')}</div>
                    <div className="text-lg font-semibold text-white">24</div>
                  </div>
                  <div className="bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/40">
                    <div className="text-xs text-gray-400">{t('map.averageAQI')}</div>
                    <div className="text-lg font-semibold text-yellow-400">{getAverageAQI()}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400">{t('map.metrics.riskLevel.label')}</div>
                    <div className={`px-1.5 py-0.5 ${getRiskLevel().color}/20 text-${getRiskLevel().color.replace('bg-', '')} text-xs rounded`}>
                      {getRiskLevel().label}
                    </div>
                  </div>
                  <div className="text-sm font-medium mt-1">{t('map.metrics.riskLevel.description')}</div>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400">{t('map.metrics.casesToday.label')}</div>
                    <div className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                      {(() => {
                        const zoonosisData = [
                          { kota: "Jakarta Selatan", jumlah_kasus: 288 },
                          { kota: "Jakarta Pusat", jumlah_kasus: 918 },
                          { kota: "Jakarta Barat", jumlah_kasus: 969 },
                          { kota: "Jakarta Timur", jumlah_kasus: 58 },
                          { kota: "Jakarta Utara", jumlah_kasus: 563 }
                        ];
                        return zoonosisData.find(f => f.kota === regionToKota[selectedRegionKey])?.jumlah_kasus ?? '0';
                      })()}
                    </div>
                  </div>
                  <div className="text-sm font-medium mt-1">{t('map.metrics.casesToday.description')}</div>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400">{t('map.metrics.population.label')}</div>
                    <div className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {(() => {
                        const populationData = [
                          { kota: "Jakarta Selatan", 2023: 2235606 },
                          { kota: "Jakarta Timur", 2023: 3079618 },
                          { kota: "Jakarta Pusat", 2023: 1049314 },
                          { kota: "Jakarta Barat", 2023: 2470054 },
                          { kota: "Jakarta Utara", 2023: 1808985 }
                        ];
                        return populationData.find(f => f.kota === regionToKota[selectedRegionKey])?.[2023] ?? 'N/A';
                      })()}
                    </div>
                  </div>
                  <div className="text-sm font-medium mt-1">{t('map.metrics.population.description')}</div>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400">{t('map.metrics.preventionIndex.label')}</div>
                    <div className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">{t('map.metrics.preventionIndex.value')}</div>
                  </div>
                  <div className="text-sm font-medium mt-1">{t('map.metrics.preventionIndex.description')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;