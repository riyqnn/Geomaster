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
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://basemap.mapid.io/styles/dark/style.json?key=${MAP_SERVICE_KEY}`,
      center: [106.82717425766694, -6.175403054116954],
      zoom: 15.5,
      pitch: 60,
    });
    
    // Tambahkan kontrol navigasi default (termasuk zoom in/out)
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    map.current.on("load", () => {
      window.map = map.current;
      setIsMapLoaded(true);
    });
    
    return () => {
      map.current?.remove();
      window.map = null;
    };
  }, [MAP_SERVICE_KEY]);

  const isUdaraVisible = activeLayer === 'indeks-kualitas-udara';
  const isZoonosisVisible = activeLayer === 'penyakit-zoonosis';

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <Search sidebarExpanded={sidebarExpanded} tableHeight={tableHeight} />
      {isJumlahVisible && <Jumlah isVisible={isJumlahVisible} />}
      {showSampah && <Sampah />}
      <UdaraLayer isVisible={isUdaraVisible} />
      <Zoonosis isVisible={isZoonosisVisible} />
    </div>
  );
}

export default Maps;