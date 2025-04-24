import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Search from "../Components/Search";
import Sampah from "../Layers/sampah";
import Jumlah from "../Layers/Jumlah";
import UdaraLayer from "../Layers/udara";
import Zoonosis from "../Layers/zoonosis";

function Maps({ showSampah, isJumlahVisible, activeLayer, sidebarExpanded, tableHeight }) {
  const MAP_SERVICE_KEY = import.meta.env.VITE_MAP_SERVICE_KEY;
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const rotationRef = useRef(null);
  const [currentBearing, setCurrentBearing] = useState(0);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://basemap.mapid.io/styles/dark/style.json?key=${MAP_SERVICE_KEY}`,
      center: [106.82717425766694, -6.175403054116954],
      zoom: 15.5,
      pitch: 60,
      bearing: 0,
    });
    
    // Add navigation controls (zoom, compass)
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // Add 3D terrain and sky for better visual experience
    map.current.on("load", () => {
      window.map = map.current;
      setIsMapLoaded(true);
      
      // If your map style supports 3D terrain
      if (map.current.getStyle().terrain) {
        map.current.setTerrain({ source: "terrain", exaggeration: 1.5 });
      }
    });
    
    return () => {
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
      }
      map.current?.remove();
      window.map = null;
    };
  }, [MAP_SERVICE_KEY]);

  // Function to handle 360-degree rotation
  const toggle360Rotation = () => {
    if (isRotating) {
      // Stop rotation
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
      setIsRotating(false);
    } else {
      // Start rotation
      setIsRotating(true);
      startRotation();
    }
  };

  const startRotation = () => {
    const rotate = () => {
      if (!map.current) return;
      
      // Get current bearing and increment it
      const nextBearing = (currentBearing + 0.2) % 360;
      map.current.setBearing(nextBearing);
      setCurrentBearing(nextBearing);
      
      // Continue rotation
      rotationRef.current = requestAnimationFrame(rotate);
    };
    
    rotationRef.current = requestAnimationFrame(rotate);
  };

  // Add control for changing pitch (vertical angle)
  const increasePitch = () => {
    if (!map.current) return;
    const currentPitch = map.current.getPitch();
    map.current.setPitch(Math.min(currentPitch + 10, 85));
  };

  const decreasePitch = () => {
    if (!map.current) return;
    const currentPitch = map.current.getPitch();
    map.current.setPitch(Math.max(currentPitch - 10, 0));
  };

  const isUdaraVisible = activeLayer === 'indeks-kualitas-udara';
  const isZoonosisVisible = activeLayer === 'penyakit-zoonosis';

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Pass the map reference to Search component */}
      <Search 
        sidebarExpanded={sidebarExpanded} 
        tableHeight={tableHeight}
        mapRef={map}
      />
      
      {/* 360° rotation control - positioned higher to avoid license information */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-2">
        <button 
          onClick={toggle360Rotation}
          className={`p-3 rounded-full shadow-lg ${isRotating ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-all duration-200`}
          title={isRotating ? "Stop Rotation" : "Start 360° Rotation"}
        >
          <i className={`fas ${isRotating ? 'fa-stop' : 'fa-sync-alt'} w-5 h-5`}></i>
        </button>
        
        {/* Pitch controls */}
        <button 
          onClick={increasePitch}
          className="p-3 rounded-full shadow-lg bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
          title="Increase Pitch (Look Down)"
        >
          <i className="fas fa-angle-up w-5 h-5"></i>
        </button>
        
        <button 
          onClick={decreasePitch}
          className="p-3 rounded-full shadow-lg bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
          title="Decrease Pitch (Look Up)"
        >
          <i className="fas fa-angle-down w-5 h-5"></i>
        </button>
      </div>
      
      {isJumlahVisible && <Jumlah isVisible={isJumlahVisible} />}
      {showSampah && <Sampah />}
      <UdaraLayer isVisible={isUdaraVisible} />
      <Zoonosis isVisible={isZoonosisVisible} />
    </div>
  );
}

export default Maps;