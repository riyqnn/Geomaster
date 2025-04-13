import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom"; 
import Globe from "react-globe.gl";
import '../index.css'

const WelcomePage = () => {
  const { t } = useTranslation();
  const globeRef = useRef();
  const [isAnimating, setIsAnimating] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      let newSize;
      if (width < 640) newSize = Math.min(300, width - 40);
      else if (width < 1024) newSize = 400;
      else newSize = 500;
      setDimensions({ width: newSize, height: newSize });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // Expanded global connections
  const globalConnections = [
    { startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278, color: ["#ff6b6b", "#4ecdc4"] },  // NY - London
    { startLat: -33.8688, startLng: 151.2093, endLat: 37.7749, endLng: -122.4194, color: ["#45b7d1", "#96c93d"] }, // Sydney - SF
    { startLat: 35.6762, startLng: 139.6503, endLat: 48.8566, endLng: 2.3522, color: ["#f7d794", "#778beb"] },    // Tokyo - Paris
    { startLat: 19.4326, startLng: -99.1332, endLat: -34.6037, endLng: -58.3816, color: ["#ff9f1c", "#2ab7ca"] }, // Mexico City - Buenos Aires
    { startLat: 55.7558, startLng: 37.6173, endLat: 31.2304, endLng: 121.4737, color: ["#e63946", "#a8dadc"] },   // Moscow - Shanghai
    { startLat: 28.6139, startLng: 77.2090, endLat: -26.2041, endLng: 28.0473, color: ["#f4a261", "#e76f51"] },   // Delhi - Johannesburg
    { startLat: 39.9042, startLng: 116.4074, endLat: 1.3521, endLng: 103.8198, color: ["#2a9d8f", "#e9c46a"] },  // Beijing - Singapore
    { startLat: 52.5200, startLng: 13.4050, endLat: -23.5505, endLng: -46.6333, color: ["#264653", "#f4a261"] },  // Berlin - São Paulo
    { startLat: 25.2048, startLng: 55.2708, endLat: 41.9028, endLng: 12.4964, color: ["#e76f51", "#2a9d8f"] },    // Dubai - Rome
    { startLat: 43.6532, startLng: -79.3832, endLat: 64.1355, endLng: -21.8174, color: ["#a8dadc", "#457b9d"] }  // Toronto - Reykjavik
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Text Section */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              <i className="fas fa-globe text-3xl sm:text-4xl text-blue-400 animate-spin-slow"></i>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {t('welcomePage.title.first')}
                <span className="text-blue-400 ml-2">{t('welcomePage.title.highlight')}</span>
              </h1>

            </div>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0">
              {t('welcomePage.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <NavLink 
                to="/maps" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 sm:px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                {t('welcomePage.exploreButton')}
              </NavLink>
              
              <button 
                onClick={toggleAnimation}
                className="border border-white/30 text-white py-2.5 px-6 sm:px-8 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {isAnimating ? (
                  <>
                    <i className="fas fa-pause"></i>
                    <span>{t('welcomePage.pauseVisualization')}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-play"></i>
                    <span>{t('welcomePage.resumeVisualization')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Globe Visualization */}
          <div className="relative flex justify-center items-center">
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              arcsData={isAnimating ? globalConnections : []}
              arcDashLength={0.4}
              arcDashGap={0.2}
              arcDashAnimateTime={4000}
              arcStroke={0.5}
              arcAltitudeAutoScale={0.3}
              atmosphereColor="#3b82f6"
              atmosphereAltitude={0.2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;