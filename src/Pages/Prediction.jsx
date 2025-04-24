import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Custom data fetching hook with caching
const useFetchPrediction = () => {
  const cache = useRef({});
  const fetchPrediction = async (data) => {
    const cacheKey = JSON.stringify(data);
    if (cache.current[cacheKey]) return cache.current[cacheKey];
    try {
      const response = await axios.post('https://tumbalwoilah.pythonanywhere.com/predict', data);
      cache.current[cacheKey] = response.data;
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  return fetchPrediction;
};

const ZoonosisPredictor = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    latitude: -6.2,
    longitude: 106.8,
    temperature: 28,
    rainfall: 2500,
    elevation: 500,
    population_density: 200,
    forest_coverage: 40,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('input');
  const [mapStyle, setMapStyle] = useState('dark');
  const [isMobile, setIsMobile] = useState(false);
  const [showGuide, setShowGuide] = useState(true); // Added showGuide state
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const fetchPrediction = useFetchPrediction();

  // MapID API Key untuk Vite
  const MAP_SERVICE_KEY = import.meta.env.VITE_MAP_SERVICE_KEY || 'YOUR_MAPID_API_KEY';

  // Responsive layout detection
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setActiveSidebar(!mobile);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Validasi API Key
    if (!MAP_SERVICE_KEY || MAP_SERVICE_KEY === 'YOUR_MAPID_API_KEY') {
      console.warn('MapID API key is missing. Please set VITE_MAP_SERVICE_KEY in your .env file.');
      return;
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://basemap.mapid.io/styles/${mapStyle}/style.json?key=${MAP_SERVICE_KEY}`,
      center: selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [106.8, -6.2],
      zoom: selectedLocation ? 10 : 6,
    });

    // Add zoom controls
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    // Handle map click
    mapRef.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setFormData((prev) => ({ ...prev, latitude: lat.toFixed(4), longitude: lng.toFixed(4) }));
      setTempMarker({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
      mapRef.current.flyTo({ center: [lng, lat], duration: 500 });
      if (isMobile) {
        setActiveSidebar(true);
        setActiveTab('input');
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Update map style when mapStyle changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(
        `https://basemap.mapid.io/styles/${mapStyle}/style.json?key=${MAP_SERVICE_KEY}`
      );
      // Re-add markers after style change
      setTimeout(() => {
        updateMarkers();
      }, 500);
    }
  }, [mapStyle, MAP_SERVICE_KEY]);

  // Update markers when tempMarker or selectedLocation changes
  const updateMarkers = useCallback(() => {
    // Remove existing markers
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    // Add temporary marker
    if (tempMarker) {
      const el = document.createElement('div');
      el.className = 'custom-3d-marker';
      el.innerHTML = `<div class="marker-pin"></div><div class="marker-pulse"></div>`;

      tempMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(tempMarker.lng), parseFloat(tempMarker.lat)])
        .setPopup(
          new maplibregl.Popup().setHTML(`
            <div class="text-center">
              <p class="font-semibold text-gray-200">${t('map1.temporaryLocation')}</p>
              <p class="text-sm">${t('map1.lat')}: ${tempMarker.lat}</p>
              <p class="text-sm">${t('map1.lng')}: ${tempMarker.lng}</p>
            </div>
          `)
        )
        .addTo(mapRef.current);
    }

    // Add selected location marker
    if (selectedLocation && predictionResult) {
      const el = document.createElement('div');
      el.className = 'custom-3d-marker';
      el.innerHTML = `<div class="marker-pin"></div><div class="marker-pulse"></div>`;

      selectedMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(selectedLocation.lng), parseFloat(selectedLocation.lat)])
        .setPopup(
          new maplibregl.Popup().setHTML(`
            <div class="text-center">
              <p class="font-semibold text-blue-400">${predictionResult.prediction.disease}</p>
              <p class="text-sm">${t('map1.confidence')}: <span class="text-green-400">${
                predictionResult.prediction.confidence_score
              }%</span></p>
              <p class="text-xs text-gray-400">${t('map1.coordinates')}: ${selectedLocation.lat}, ${
                selectedLocation.lng
              }</p>
            </div>
          `)
        )
        .addTo(mapRef.current);
    }
  }, [tempMarker, selectedLocation, predictionResult, t]);

  useEffect(() => {
    if (mapRef.current) {
      updateMarkers();
    }
  }, [tempMarker, selectedLocation, predictionResult, updateMarkers]);

  // Memoized fields
  const fields = useMemo(
    () => [
      {
        name: 'latitude',
        label: t('form.fields.latitude.label'),
        placeholder: t('form.fields.latitude.placeholder'),
        min: -90,
        max: 90,
        step: '0.01',
        required: true,
        icon: '🌐',
      },
      {
        name: 'longitude',
        label: t('form.fields.longitude.label'),
        placeholder: t('form.fields.longitude.placeholder'),
        min: -180,
        max: 180,
        step: '0.01',
        required: true,
        icon: '🌐',
      },
      {
        name: 'temperature',
        label: t('form.fields.temperature.label'),
        placeholder: t('form.fields.temperature.placeholder'),
        min: -50,
        max: 60,
        step: '0.1',
        icon: '🌡️',
      },
      {
        name: 'rainfall',
        label: t('form.fields.rainfall.label'),
        placeholder: t('form.fields.rainfall.placeholder'),
        min: 0,
        max: 10000,
        step: '1',
        icon: '🌧️',
      },
      {
        name: 'elevation',
        label: t('form.fields.elevation.label'),
        placeholder: t('form.fields.elevation.placeholder'),
        min: -500,
        max: 9000,
        step: '1',
        icon: '⛰️',
      },
      {
        name: 'population_density',
        label: t('form.fields.population_density.label'),
        placeholder: t('form.fields.population_density.placeholder'),
        min: 0,
        max: 50000,
        step: '1',
        icon: '👥',
      },
      {
        name: 'forest_coverage',
        label: t('form.fields.forest_coverage.label'),
        placeholder: t('form.fields.forest_coverage.placeholder'),
        min: 0,
        max: 100,
        step: '0.1',
        icon: '🌳',
      },
    ],
    [t]
  );

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        temperature: parseFloat(formData.temperature),
        rainfall: parseFloat(formData.rainfall),
        elevation: parseFloat(formData.elevation),
        population_density: parseFloat(formData.population_density),
        forest_coverage: parseFloat(formData.forest_coverage),
      };
      const response = await fetchPrediction(data);
      setPredictionResult(response);
      setSelectedLocation({ lat: response.location.latitude, lng: response.location.longitude });
      setTempMarker(null);
      setActiveTab('result');
      if (mapRef.current) {
        mapRef.current.flyTo(
          {
            center: [response.location.longitude, response.location.latitude],
            zoom: 12,
          },
          { duration: 1500 }
        );
      }
      if (isMobile) setActiveSidebar(false);
    } catch (err) {
      setError(t('error.prediction'));
    } finally {
      setLoading(false);
    }
  };

  // Chart.js data
  const chartData = useMemo(() => {
    if (!predictionResult || !predictionResult.prediction?.top_diseases) {
      return {
        labels: [],
        datasets: [],
      };
    }
    const diseases = predictionResult.prediction.top_diseases.slice(0, 3);
    return {
      labels: diseases.map((d) => (d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name)),
      datasets: [
        {
          label: t('chart1.yAxisLabel'),
          data: diseases.map((d) => d.probability_percent || 0),
          backgroundColor: 'rgba(127, 90, 240, 0.6)',
          borderColor: 'rgba(127, 90, 240, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(127, 90, 240, 0.8)',
          hoverBorderColor: 'rgba(127, 90, 240, 1)',
        },
      ],
    };
  }, [predictionResult, t]);

  // Chart.js options
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: t('chart1.title'),
          color: '#e5e7eb',
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          titleColor: '#e5e7eb',
          bodyColor: '#e5e7eb',
          borderColor: '#4b5563',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#9ca3af',
            font: {
              size: 10,
            },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#9ca3af',
            font: {
              size: 10,
            },
            callback: (value) => `${value}%`,
          },
          grid: {
            color: '#4b5563',
            borderDash: [2, 4],
          },
        },
      },
    }),
    [t]
  );

  // Toggle map style
  const toggleMapStyle = useCallback(() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark'), [mapStyle]);

  // Animations
  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white pt-25">
      <style>
        {`
          .custom-3d-marker .marker-pin {
            width: 20px;
            height: 20px;
            border-radius: 50% 50% 50% 0;
            background: #7f5af0;
            position: absolute;
            transform: rotate(-45deg);
            left: 50%;
            top: 50%;
            margin: -15px 0 0 -15px;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
          }
          .custom-3d-marker .marker-pulse {
            width: 30px;
            height: 30px;
            background: rgba(127, 90, 240, 0.4);
            border-radius: 50%;
            position: absolute;
            left: 50%;
            top: 50%;
            margin: -15px 0 0 -15px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
          .maplibregl-popup-content {
            background-color: rgba(17, 24, 39, 0.95);
            color: #e5e7eb;
            border-radius: 8px;
            border: 1px solid rgba(75, 85, 99, 0.5);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            padding: 10px;
          }
          .maplibregl-popup-tip {
            border-top-color: rgba(17, 24, 39, 0.95) !important;
            border-bottom-color: rgba(17, 24, 39, 0.95) !important;
          }
          .scrollbar-custom::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-custom::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 3px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 3px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          .maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out {
            width: 36px !important;
            height: 36px !important;
            line-height: 36px !important;
            font-size: 18px !important;
            background-color: #1f2937 !important;
            color: #e5e7eb !important;
            border: 1px solid #4b5563 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
          }
          .maplibregl-ctrl-zoom-out {
            border-top: none !important;
          }
        `}
      </style>

      {/* Header */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('app.title')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs flex items-center">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
              {t('status.modelActive')}
            </span>
            <button
              onClick={toggleMapStyle}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5"
            >
              {t(`mapStyle.${mapStyle}`)}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Mobile Sidebar Toggle */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setActiveSidebar(!activeSidebar)}
          aria-label={t(activeSidebar ? 'accessibility.closeSidebar' : 'accessibility.openSidebar')}
          className="lg:hidden fixed top-24 left-4 z-50 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        >
          {activeSidebar ? '◀' : '▶'}
        </motion.button>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <motion.aside
            initial={false}
            animate={activeSidebar ? 'open' : 'closed'}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed lg:static top-0 left-0 z-40 w-80 lg:w-96 h-full lg:h-auto"
          >
            <div className="bg-gray-800/80 rounded-xl p-5 h-[calc(100vh-80px)] lg:h-[calc(100vh-180px)] flex flex-col shadow-xl">
              {/* Tabs */}
              <div className="Organic Chemistryflex border-b border-gray-700 mb-4">
                {['input', 'result'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={tab === 'result' && !predictionResult}
                    className={`flex-1 py-2 text-sm ${
                      activeTab === tab
                        ? 'text-blue-400 border-b-2 border-blue-400 font-medium'
                        : 'text-gray-400 hover:text-gray-300'
                    } ${tab === 'result' && !predictionResult ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {t(`sidebar.${tab}Tab`)}
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto scrollbar-custom">
                <AnimatePresence mode="wait">
                  {activeTab === 'input' ? (
                    <motion.div
                      key="input"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 pb-4"
                    >
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map((field, index) => (
                          <motion.div
                            key={field.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-700/50 p-4 rounded-lg"
                          >
                            <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
                              <span>{field.icon}</span>
                              {field.label}
                            </label>
                            <input
                              type="number"
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleInputChange}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              required={field.required}
                              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={field.placeholder}
                            />
                          </motion.div>
                        ))}
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-3 rounded-lg font-medium transition-all sticky bottom-0 z-10 ${
                            loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              {t('form.processing')}
                            </div>
                          ) : (
                            t('form.submit')
                          )}
                        </motion.button>
                      </form>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-900/20 rounded-lg text-red-300 text-sm flex items-start gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-400 mt-0.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p>{error}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 pb-4"
                    >
                      {predictionResult ? (
                        <>
                          <div className="bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-blue-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold">{t('result.title')}</h3>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-400">{t('result.detectedDisease.label')}</p>
                              <p className="text-lg font-bold text-blue-400">{predictionResult.prediction.disease}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-gray-800 p-3 rounded-lg">
                                <p className="text-sm text-gray-400">{t('result.confidence.level')}</p>
                                <p className="text-base font-semibold text-green-400">
                                  {predictionResult.prediction.confidence_level}
                                </p>
                              </div>
                              <div className="bg-gray-800 p-3 rounded-lg">
                                <p className="text-sm text-gray-400">{t('result.confidence.score')}</p>
                                <p className="text-base font-semibold text-green-400">
                                  {predictionResult.prediction.confidence_score}%
                                </p>
                              </div>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-2">{t('result.location.title')}</p>
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-sm text-gray-400">{t('result.location.latitude')}</p>
                                  <p className="text-base font-semibold">{selectedLocation?.lat}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">{t('result.location.longitude')}</p>
                                  <p className="text-base font-semibold">{selectedLocation?.lng}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-700/50 p-4 rounded-lg">
                            <h4 className="text-base font-semibold mb-3">{t('result.visualization')}</h4>
                            <div className="flex justify-center">
                              <div className="w-full max-w-[280px] h-[180px]">
                                {chartData.labels.length > 0 ? (
                                  <Bar data={chartData} options={chartOptions} />
                                ) : (
                                  <p className="text-gray-400 text-sm text-center">{t('result.noData')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-700/50 p-4 rounded-lg">
                            <h4 className="text-base font-semibold mb-3">{t('result.topDiseases')}</h4>
                            {(predictionResult.prediction.top_diseases || []).slice(0, 3).map((disease, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0"
                              >
                                <span className="text-sm text-gray-300">{disease.name}</span>
                                <span className="text-sm font-semibold text-blue-400">{disease.probability_percent}%</span>
                              </div>
                            ))}
                          </div>
                          <motion.button
                            onClick={() => setActiveTab('input')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all sticky bottom-0 z-10"
                          >
                            {t('result.backToInput')}
                          </motion.button>
                        </>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex flex-col items-center justify-center text-gray-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mb-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6a1 1 0 110 2H7a1 1 0 110-2zm0 4h6a1 1 0 110 2H7a1 1 0 110-2zm0 4h6a1 1 0 110 2H7a1 1 0 110-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-sm text-center mb-4">{t('result.noResults')}</p>
                          <motion.button
                            onClick={() => setActiveTab('input')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                          >
                            {t('result.backToInput')}
                          </motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>

          {/* Map Container */}
          <div className="flex-1">
            <div
              ref={mapContainerRef}
              className="h-[calc(100vh-180px)] w-full z-0 rounded-xl"
            />
          </div>
        </div>

        {/* Guide Tooltip */}
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.4 }}
            className="fixed bottom-4 right-4 bg-gray-800/90 rounded-lg p-3 shadow-lg max-w-xs z-[998]"
          >
            <div className="flex justify-between items-start">
              <div className="pr-6">
                <p className="text-sm font-semibold text-white mb-1">{t('guide.title')}</p>
                <p className="text-xs text-gray-300">{t('guide.description')}</p>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                aria-label={t('accessibility.closeGuide')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ZoonosisPredictor;