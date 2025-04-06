import { useEffect } from "react";
import maplibregl from "maplibre-gl";

const Sampah = () => {
  useEffect(() => {
    const map = window.map;
    if (!map) return;

    const onLoad = () => {
      if (map.getSource("sampah")) return;

      fetch('http://localhost:8080/geoserver/sampah/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sampah:sampah&outputFormat=application/json')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          map.addSource("sampah", {
            type: "geojson",
            data: data
          });

          map.addLayer({
            id: "sampah-layer",
            type: "circle",
            source: "sampah",
            paint: {
              "circle-radius": 6,
              "circle-color": "#ff0000",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff"
            }
          });

          map.on("click", "sampah-layer", (e) => {
            const feature = e.features[0];
            const coords = feature.geometry.coordinates;
            const props = feature.properties;

            new maplibregl.Popup()
              .setLngLat(coords)
              .setHTML(`<strong>Sampah</strong><br/>Jenis: ${props.jenis || "Tidak diketahui"}`)
              .addTo(map);
          });

          map.on("mouseenter", "sampah-layer", () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", "sampah-layer", () => {
            map.getCanvas().style.cursor = "";
          });
        })
        .catch(error => {
          console.error("Error fetching GeoServer data:", error);
        });
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.once("load", onLoad);
    }

    return () => {
      if (map.getLayer("sampah-layer")) {
        map.removeLayer("sampah-layer");
      }
      if (map.getSource("sampah")) {
        map.removeSource("sampah");
      }
    };
  }, []);

  return null;
};

export default Sampah;
