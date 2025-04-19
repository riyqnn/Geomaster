import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';

function JakartaMap({ selectedRegion }) {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const [mapStats, setMapStats] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Map translated region names to English keys
  const regionNameMap = useMemo(() => ({
    [t('regions.eastJakarta')]: 'East Jakarta',
    [t('regions.northJakarta')]: 'North Jakarta',
    [t('regions.southJakarta')]: 'South Jakarta',
    [t('regions.westJakarta')]: 'West Jakarta',
    [t('regions.centralJakarta')]: 'Central Jakarta'
  }), [t]);

  // Normalize selectedRegion to English key
  const normalizedRegion = regionNameMap[selectedRegion] || 'East Jakarta'; // Fallback to East Jakarta

  // GeoServer endpoints
  const regionEndpoints = useMemo(() => ({
    'East Jakarta': {
      primary: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jaktim.json',
      fallback: '/data/jaktim.json'
    },
    'North Jakarta': {
      primary: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jakut.json',
      fallback: '/data/jakut.json'
    },
    'South Jakarta': {
      primary: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jaksel.json',
      fallback: '/data/jaksel.json'
    },
    'West Jakarta': {
      primary: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jakbar.json',
      fallback: '/data/jakbar.json'
    },
    'Central Jakarta': {
      primary: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/jakpus.json',
      fallback: '/data/jakpus.json'
    }
  }), []);

  // Color scheme
  const regionColors = useMemo(() => ({
    'East Jakarta': { 
      primary: '#4361EE', 
      gradient: ['#4361EE', '#3A0CA3'],
      riskScale: scaleLinear().domain([0, 50, 100]).range(['#4CAF50', '#FFD740', '#FF5252'])
    },
    'North Jakarta': { 
      primary: '#3A86FF', 
      gradient: ['#3A86FF', '#0077B6'],
      riskScale: scaleLinear().domain([0, 50, 100]).range(['#4CAF50', '#FFD740', '#FF5252'])
    },
    'South Jakarta': { 
      primary: '#7209B7', 
      gradient: ['#7209B7', '#560BAD'],
      riskScale: scaleLinear().domain([0, 50, 100]).range(['#4CAF50', '#FFD740', '#FF5252'])
    },
    'West Jakarta': { 
      primary: '#F72585', 
      gradient: ['#F72585', '#B5179E'],
      riskScale: scaleLinear().domain([0, 50, 100]).range(['#4CAF50', '#FFD740', '#FF5252'])
    },
    'Central Jakarta': { 
      primary: '#FFA500', 
      gradient: ['#FFA500', '#FF6B00'],
      riskScale: scaleLinear().domain([0, 50, 100]).range(['#4CAF50', '#FFD740', '#FF5252'])
    }
  }), []);

  // Generate region statistics
  const generateRegionStats = (region) => {
    const seed = region.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min, max) => {
      const x = Math.sin(seed + 1) * 10000;
      const r = x - Math.floor(x);
      return Math.floor(r * (max - min + 1) + min);
    };

    return {
      riskScore: random(30, 85),
      aqiValue: random(50, 180),
      monitoringStations: random(4, 12),
      populationExposed: random(150000, 900000),
      alertLevel: ['Low', 'Moderate', 'High', 'Severe'][random(0, 3)],
      trend: ['Improving', 'Stable', 'Worsening'][random(0, 2)]
    };
  };

  // Initialize map
  useEffect(() => {
    const jakartaCenter = [-6.2088, 106.8456];
    
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
        inertia: true,
        zoomSnap: 0.1,
        scrollWheelZoom: true
      }).setView(jakartaCenter, 11);
      
      const zoomControl = L.control.zoom({ position: 'bottomright' });
      zoomControl.addTo(mapInstanceRef.current);
      
      setTimeout(() => {
        const zoomInButton = document.querySelector('.leaflet-control-zoom-in');
        const zoomOutButton = document.querySelector('.leaflet-control-zoom-out');
        
        if (zoomInButton && zoomOutButton) {
          zoomInButton.style.backgroundColor = '#2A2A2A';
          zoomInButton.style.color = 'white';
          zoomInButton.style.borderRadius = '4px 4px 0 0';
          zoomInButton.style.border = 'none';
          zoomOutButton.style.backgroundColor = '#2A2A2A';
          zoomOutButton.style.color = 'white';
          zoomOutButton.style.borderRadius = '0 0 4px 4px';
          zoomOutButton.style.border = 'none';
          zoomOutButton.style.borderTop = '1px solid #444';
        }
      }, 0);
      
      L.control.attribution({
        position: 'bottomleft',
        prefix: '<span class="map-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a></span>'
      }).addTo(mapInstanceRef.current);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(mapInstanceRef.current);

      const scaleControl = L.control.scale({
        position: 'bottomleft',
        maxWidth: 100,
        metric: true,
        imperial: false
      });
      scaleControl.addTo(mapInstanceRef.current);
      
      const fullscreenButton = L.control({ position: 'topright' });
      fullscreenButton.onAdd = function() {
        const div = L.DomUtil.create('div', 'custom-fullscreen-control');
        div.innerHTML = '<button aria-label="Toggle fullscreen"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>';
        div.onclick = toggleFullscreen;
        return div;
      };
      fullscreenButton.addTo(mapInstanceRef.current);

      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      setTimeout(() => {
        setIsInitialLoad(false);
      }, 1000);
    }
    
    return () => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const mapElement = mapRef.current?.parentElement;
    
    if (!mapElement) return;

    if (!document.fullscreenElement) {
      if (mapElement.requestFullscreen) {
        mapElement.requestFullscreen();
      } else if (mapElement.mozRequestFullScreen) {
        mapElement.mozRequestFullScreen();
      } else if (mapElement.webkitRequestFullscreen) {
        mapElement.webkitRequestFullscreen();
      } else if (mapElement.msRequestFullscreen) {
        mapElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Load region data
  useEffect(() => {
    if (!mapInstanceRef.current || !normalizedRegion) return;

    let isMounted = true;

    const loadRegionData = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      const stats = generateRegionStats(normalizedRegion);
      if (isMounted) setMapStats(stats);

      const endpoints = regionEndpoints[normalizedRegion];
      if (!endpoints) {
        console.error(`No endpoints found for region: ${normalizedRegion}`);
        if (isMounted) {
          setIsLoading(false);
          showErrorNotification(`Invalid region: ${selectedRegion}`);
        }
        return;
      }

      if (layersRef.current[normalizedRegion]) {
        if (!mapInstanceRef.current) return;
        
        Object.keys(layersRef.current).forEach(key => {
          if (key !== normalizedRegion && mapInstanceRef.current?.hasLayer(layersRef.current[key])) {
            mapInstanceRef.current.removeLayer(layersRef.current[key]);
          }
        });

        if (!mapInstanceRef.current.hasLayer(layersRef.current[normalizedRegion])) {
          layersRef.current[normalizedRegion].addTo(mapInstanceRef.current);
        }

        mapInstanceRef.current.fitBounds(layersRef.current[normalizedRegion].getBounds(), {
          padding: [20, 20],
          maxZoom: 13,
          animate: true,
          duration: 1
        });

        if (isMounted) {
          addLegend(mapInstanceRef.current, normalizedRegion, stats);
          setIsLoading(false);
        }
        return;
      }

      try {
        let response = await fetch(endpoints.primary, { signal: AbortSignal.timeout(5000) });

        if (!response.ok) {
          response = await fetch(endpoints.fallback);
        }

        if (!response.ok) {
          throw new Error(`Failed to load data for ${normalizedRegion}`);
        }

        const data = await response.json();
        if (!isMounted || !mapInstanceRef.current) return;

        Object.keys(layersRef.current).forEach(key => {
          if (mapInstanceRef.current?.hasLayer(layersRef.current[key])) {
            mapInstanceRef.current.removeLayer(layersRef.current[key]);
          }
        });

        const color = regionColors[normalizedRegion];

        const newLayer = L.geoJSON(data, {
          style: {
            color: color.primary,
            weight: 3,
            opacity: 0.9,
            fillColor: color.primary,
            fillOpacity: 0.25,
            dashArray: '5, 5',
            lineCap: 'round',
            lineJoin: 'round'
          },
          onEachFeature: (feature, layer) => {
            const districtRisk = feature.properties?.risk_level || Math.floor(Math.random() * 100);
            const riskColor = color.riskScale(districtRisk);

            layer.setStyle({
              fillColor: riskColor,
              fillOpacity: 0.35
            });

            if (feature.properties) {
              const areaName = feature.properties.name || feature.properties.NAME || 'Unknown Area';
              const popupContent = `
                <div class="custom-popup">
                  <h3>${areaName}</h3>
                  <p class="region-label">${selectedRegion}</p>
                  <div class="risk-meter">
                    <div class="risk-label">Risk Level: ${districtRisk < 33 ? t('map.risk.low') : districtRisk < 66 ? t('map.risk.medium') : t('map.risk.high')}</div>
                    <div class="risk-bar">
                      <div class="risk-fill" style="width: ${districtRisk}%; background: ${riskColor};"></div>
                    </div>
                  </div>
                  <div class="popup-stats">
                    <div class="stat">
                      <span class="label">${t('tabData.airQualityIndex.stats.ispu')}</span>
                      <span class="value">${Math.floor(stats.aqiValue * (0.8 + Math.random() * 0.4))}</span>
                    </div>
                    <div class="stat">
                      <span class="label">${t('map.metrics.population.label')}</span>
                      <span class="value">${(Math.floor(Math.random() * 300) + 50).toLocaleString()}k</span>
                    </div>
                  </div>
                  <div class="popup-footer">
                    <span>${t('map.lastUpdated')}: ${new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              `;
              layer.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup-container'
              });
            }

            layer.on({
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 5,
                  color: '#FFFFFF',
                  dashArray: '',
                  fillOpacity: 0.6
                });
                layer.bringToFront();
                layer.bindTooltip(feature.properties?.name || feature.properties?.NAME || 'District', {
                  permanent: false,
                  direction: 'center',
                  className: 'custom-tooltip'
                }).openTooltip();
              },
              mouseout: (e) => {
                newLayer.resetStyle(e.target);
                layer.closeTooltip();
              },
              click: (e) => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.fitBounds(e.target.getBounds(), {
                    padding: [50, 50],
                    maxZoom: 14,
                    animate: true,
                    duration: 0.5
                  });
                }
              }
            });
          }
        });

        if (!mapInstanceRef.current) return;
        newLayer.addTo(mapInstanceRef.current);
        layersRef.current[normalizedRegion] = newLayer;

        if (isMounted) {
          addLegend(mapInstanceRef.current, normalizedRegion, stats);

          const bounds = newLayer.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [20, 20],
              maxZoom: 13,
              animate: true,
              duration: 1
            });
          }

          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error loading ${normalizedRegion} data:`, error);
        if (!isMounted || !mapInstanceRef.current) return;

        showErrorNotification(t('map.errorLoading', { region: selectedRegion }));
        if (isMounted) setIsLoading(false);
      }
    };

    loadRegionData();

    return () => {
      isMounted = false;
    };
  }, [normalizedRegion, regionEndpoints, regionColors, selectedRegion, t]);

  // Show error notification
  const showErrorNotification = (message) => {
    if (!mapInstanceRef.current) return;

    const errorControl = L.control({ position: 'topright' });
    errorControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-error-notification');
      div.innerHTML = `<div>${message}</div>`;
      setTimeout(() => {
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      }, 5000);
      return div;
    };
    errorControl.addTo(mapInstanceRef.current);
  };

  // Add legend
  const addLegend = (map, region, stats) => {
    if (!map) return;

    if (map._legendControl) {
      map.removeControl(map._legendControl);
    }

    const legendControl = L.control({ position: 'topright' });

    legendControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-legend');
      const regionColor = regionColors[region].primary;

      if (!isFullscreen) {
        div.innerHTML = ``;
      } else {
        div.innerHTML = `
          <h4>${t('map.legendTitle', { region: selectedRegion })}</h4>
          <div class="legend-item">
            <div class="color-box" style="background: #FF5252;"></div>
            <span>${t('map.risk.high')} (70-100)</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background: #FFD740;"></div>
            <span>${t('map.risk.medium')} (30-70)</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background: #4CAF50;"></div>
            <span>${t('map.risk.low')} (0-30)</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background: ${regionColor}; opacity: 0.3;"></div>
            <span>${t('map.districtBoundary')}</span>
          </div>
        `;
      }
      return div;
    };

    legendControl.addTo(map);
    map._legendControl = legendControl;

    if (stats && isFullscreen && mapRef.current) {
      if (map._statsCard) {
        map._statsCard.remove();
      }

      const statsCard = L.DomUtil.create('div', 'map-stats-card');

      let alertClass = '';
      switch (stats.alertLevel) {
        case 'Low': alertClass = 'alert-low'; break;
        case 'Moderate': alertClass = 'alert-moderate'; break;
        case 'High': alertClass = 'alert-high'; break;
        case 'Severe': alertClass = 'alert-severe'; break;
        default: alertClass = 'alert-moderate';
      }

      let trendIcon = '';
      let trendClass = '';
      switch (stats.trend) {
        case 'Improving': 
          trendIcon = '↓'; 
          trendClass = 'trend-improving';
          break;
        case 'Stable': 
          trendIcon = '→'; 
          trendClass = 'trend-stable';
          break;
        case 'Worsening': 
          trendIcon = '↑'; 
          trendClass = 'trend-worsening';
          break;
        default: 
          trendIcon = '→'; 
          trendClass = 'trend-stable';
      }

      statsCard.innerHTML = `
        <div class="stats-card-header">
          <h3 class="stats-card-title">${t('map.statsTitle', { region: selectedRegion })}</h3>
          <span class="stats-card-alert ${alertClass}">${t(`map.alertLevels.${stats.alertLevel.toLowerCase()}`)}</span>
        </div>
        <div class="stats-card-content">
          <div class="stats-card-item">
            <span class="stats-card-label">${t('map.metrics.riskLevel.label')}</span>
            <span class="stats-card-value">${stats.riskScore}/100</span>
          </div>
          <div class="stats-card-item">
            <span class="stats-card-label">${t('tabData.airQualityIndex.stats.ispu')}</span>
            <span class="stats-card-value">${stats.aqiValue}</span>
          </div>
          <div class="stats-card-item">
            <span class="stats-card-label">${t('map.monitoringStations')}</span>
            <span class="stats-card-value">${stats.monitoringStations}</span>
          </div>
          <div class="stats-card-item">
            <span class="stats-card-label">${t('map.metrics.populationExposed.label')}</span>
            <span class="stats-card-value">${(stats.populationExposed / 1000).toFixed(0)}k</span>
          </div>
        </div>
        <div class="stats-card-footer">
          <span>${t('map.lastUpdated')}: ${new Date().toLocaleDateString()}</span>
          <span class="stats-trend ${trendClass}">
            <span class="stats-trend-icon">${trendIcon}</span>
            ${t(`map.trends.${stats.trend.toLowerCase()}`)}
          </span>
        </div>
      `;

      mapRef.current.appendChild(statsCard);
      map._statsCard = statsCard;
    } else {
      if (map._statsCard) {
        map._statsCard.remove();
        map._statsCard = null;
      }
    }
  };

  // CSS styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-popup-container .leaflet-popup-content-wrapper {
        background: rgba(30, 30, 30, 0.95);
        border-radius: 10px;
        box-shadow: 0 3px 15px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        overflow: hidden;
      }
      .custom-popup-container .leaflet-popup-tip {
        background: rgba(30, 30, 30, 0.95);
      }
      .custom-popup {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #fff;
        padding: 12px 5px;
      }
      .custom-popup h3 {
        margin: 0 0 5px 0;
        font-weight: 600;
        font-size: 16px;
        color: #fff;
        letter-spacing: -0.02em;
      }
      .custom-popup .region-label {
        margin: 0 0 10px 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        font-weight: 500;
      }
      .custom-popup .risk-meter {
        margin: 12px 0;
      }
      .custom-popup .risk-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
      .custom-popup .risk-bar {
        height: 5px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }
      .custom-popup .risk-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 1s ease-out;
      }
      .popup-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 12px;
      }
      .stat {
        display: flex;
        flex-direction: column;
      }
      .label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2px;
      }
      .value {
        font-weight: 600;
        color: white;
        font-size: 14px;
      }
      .popup-footer {
        margin-top: 12px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        text-align: right;
      }
      .map-legend {
        background: rgba(20, 20, 20, 0.85);
        color: white;
        padding: 12px;
        border-radius: 10px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        max-width: 220px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .map-legend h4 {
        margin: 0 0 10px 0;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: rgba(255, 255, 255, 0.9);
      }
      .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
      }
      .color-box {
        width: 12px;
        height: 12px;
        margin-right: 8px;
        border-radius: 3px;
      }
      .map-attribution {
        background: rgba(20, 20, 20, 0.7);
        color: rgba(255, 255, 255, 0.8);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        backdrop-filter: blur(5px);
      }
      .custom-tooltip {
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      .map-stats-card {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(20, 20, 20, 0.85);
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        color: white;
        max-width: 250px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 1000;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        opacity: 0;
        transform: translateY(10px);
        animation: fadeIn 0.5s forwards;
        animation-delay: 0.5s;
      }
      .stats-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .stats-card-title {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        letter-spacing: -0.02em;
      }
      .stats-card-alert {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 500;
      }
      .alert-low { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      .alert-moderate { background: rgba(255, 152, 0, 0.2); color: #FF9800; }
      .alert-high { background: rgba(244, 67, 54, 0.2); color: #F44336; }
      .alert-severe { background: rgba(183, 28, 28, 0.2); color: #B71C1C; }
      .stats-card-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .stats-card-item {
        display: flex;
        flex-direction: column;
      }
      .stats-card-label {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2px;
      }
      .stats-card-value {
        font-size: 14px;
        font-weight: 600;
      }
      .stats-card-footer {
        margin-top: 12px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        display: flex;
        justify-content: space-between;
      }
      .stats-trend {
        display: flex;
        align-items: center;
      }
      .stats-trend-icon {
        margin-right: 3px;
      }
      .trend-improving { color: #4CAF50; }
      .trend-stable { color: #3A86FF; }
      .trend-worsening { color: #F44336; }
      .custom-fullscreen-control button {
        background: rgba(30, 30, 30, 0.8);
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        backdrop-filter: blur(5px);
      }
      .map-error-notification {
        background: rgba(244, 67, 54, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 10px;
        font-size: 12px;
        font-weight: 500;
        animation: fadeIn 0.3s forwards, fadeOut 0.5s forwards 4.5s;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
      .leaflet-control-scale-line {
        background: rgba(30, 30, 30, 0.7) !important;
        color: white !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
        backdrop-filter: blur(5px);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-xl overflow-hidden shadow-lg"
        style={{ 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
      ></div>
      
      {(isLoading || isInitialLoad) && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-xl z-50">
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-16 h-16">
              <div className="absolute w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute w-16 h-16 border-4 border-blue-600 border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <motion.p 
              className="mt-4 text-white font-medium text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {isInitialLoad ? t('map.initializing') : t('map.loading', { region: selectedRegion })}
            </motion.p>
          </motion.div>
        </div>
      )}
      
      {selectedRegion && !isLoading && !isInitialLoad && (
        <motion.div 
          className="absolute top-5 left-5 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold">{selectedRegion}</h2>
        </motion.div>
      )}
    </div>
  );
}

export default JakartaMap;