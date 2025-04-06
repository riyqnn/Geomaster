import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Search from "../Components/Search";
import Sampah from "../Layers/sampah";

function Maps({ showSampah }) {
  const MAP_SERVICE_KEY = import.meta.env.VITE_MAP_SERVICE_KEY;
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://basemap.mapid.io/styles/dark/style.json?key=${MAP_SERVICE_KEY}`,
      center: [106.82717425766694, -6.175403054116954],
      zoom: 15.5,
      pitch: 60,
    });

    map.current.on("load", () => {
      window.map = map.current;
    });

    return () => {
      map.current?.remove();
      window.map = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <Search />
      {showSampah && <Sampah />}
    </div>
  );
}

export default Maps;
