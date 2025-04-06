import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Globe from "react-globe.gl";

const WelcomePage = () => {
  const { t } = useTranslation();
  const globeRef = useRef();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Load Font Awesome dynamically
    const link = document.createElement('link');
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2 }, 2000);
    }
  }, []);

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const globalConnections = [
    { 
      startLat: 40.7128, 
      startLng: -74.006, 
      endLat: 51.5074, 
      endLng: -0.1278, 
      color: ["rgba(255,0,0,0.7)", "rgba(0,0,255,0.7)"] 
    },
    { 
      startLat: -33.8688, 
      startLng: 151.2093, 
      endLat: 37.7749, 
      endLng: -122.4194, 
      color: ["rgba(128,0,128,0.7)", "rgba(255,0,0,0.7)"] 
    },
    { 
      startLat: 35.6762, 
      startLng: 139.6503, 
      endLat: 48.8566, 
      endLng: 2.3522, 
      color: ["rgba(0,255,0,0.7)", "rgba(255,165,0,0.7)"] 
    }
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      <div className="relative grid md:grid-cols-2 gap-10 w-full max-w-6xl mx-auto px-6 py-12 z-10">
        {/* Text Section */}
        <div className="flex flex-col justify-center space-y-6 z-10">
          <div className="flex items-center space-x-4 mb-4">
            <i className="fas fa-globe text-4xl text-blue-400"></i>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {t('welcomePage.title.first')} <span className="text-blue-400">{t('welcomePage.title.highlight')}</span>
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            {t('welcomePage.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>{t('welcomePage.exploreButton')}</span>
            </button>
            
            <button 
              onClick={toggleAnimation}
              className="border border-white/30 text-white py-3 px-8 rounded-full hover:bg-white/10 transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              {isAnimating ? (
                <>
                  <i className="fas fa-pause mr-2"></i>
                  <span>{t('welcomePage.pauseVisualization')}</span>
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  <span>{t('welcomePage.resumeVisualization')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Globe Visualization */}
        <div className="flex justify-center items-center">
          <div className="w-full max-w-[500px] opacity-90 relative">
            <Globe
              ref={globeRef}
              width={500}
              height={500}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              arcsData={isAnimating ? globalConnections : []}
              arcDashLength={0.4}
              arcDashGap={0.2}
              arcDashAnimateTime={4000}
              atmosphereColor="rgba(100,149,237,0.2)"
              atmosphereAltitude={0.25}
              enableZoom={false}
              enableRotate={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;