import { useEffect } from "react";
import maplibregl from "maplibre-gl";

const Sampah = () => {
  useEffect(() => {
    const map = window.map;
    if (!map) return;

    let animationFrameId = null;

    const onLoad = () => {
      if (map.getSource("sampah")) {
        console.log("Source 'sampah' already exists, skipping source addition.");
        return;
      }

      fetch(
        "http://localhost:8080/geoserver/sampah/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sampah:sampah&outputFormat=application/json"
      )
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          // Validasi dan filter data untuk menghindari koordinat null
          const validData = {
            ...data,
            features: (data.features || []).filter((feature) => {
              const coords = feature.geometry?.coordinates;
              return (
                coords &&
                Array.isArray(coords) &&
                coords.length === 2 &&
                typeof coords[0] === "number" &&
                typeof coords[1] === "number" &&
                !isNaN(coords[0]) &&
                !isNaN(coords[1])
              );
            }),
          };

          if (validData.features.length === 0) {
            console.warn("No valid features found in GeoServer data.");
            return;
          }

          if (!map.getSource("sampah")) {
            map.addSource("sampah", {
              type: "geojson",
              data: validData,
            });
          }

          if (!map.getLayer("sampah-pulse")) {
            map.addLayer({
              id: "sampah-pulse",
              type: "circle",
              source: "sampah",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  8,
                  15,
                  12,
                  20,
                  18,
                ],
                "circle-color": "rgba(255, 65, 65, 0.4)",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ff4141",
                "circle-opacity": 0.4, // Nilai awal statis
              },
            });
          }

          if (!map.getLayer("sampah-layer")) {
            map.addLayer({
              id: "sampah-layer",
              type: "circle",
              source: "sampah",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  5,
                  15,
                  8,
                  20,
                  12,
                ],
                "circle-color": "#ff0000",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              },
            });
          }

          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "300px",
            className: "custom-popup",
          });

          // Optimasi animasi dengan batasan nilai
          let opacity = 0.4; // Mulai dari nilai awal yang aman
          const animatePulse = () => {
            opacity = Math.sin(Date.now() * 0.003) * 0.4 + 0.5; // Sinusoidal animation
            opacity = Math.max(0, Math.min(1, opacity)); // Batasi antara 0 dan 1

            if (map.getLayer("sampah-pulse")) {
              map.setPaintProperty("sampah-pulse", "circle-opacity", opacity);
            }

            animationFrameId = requestAnimationFrame(animatePulse);
          };
          animatePulse();

          const extractCityFromAddress = (address) => {
            if (!address || typeof address !== "string")
              return "Tidak diketahui";
            const parts = address.split(",").map((part) => part.trim());
            return parts[parts.length - 1] || "Tidak diketahui";
          };

          const createPopupHTML = (props = {}, coordinates = [0, 0]) => {
            const headerColor = "#ff0000";
            const longitude = coordinates[0]?.toFixed(6) ?? "N/A";
            const latitude = coordinates[1]?.toFixed(6) ?? "N/A";
            const address = props.full_address || "Alamat tidak tersedia";
            const city = extractCityFromAddress(address);

            return `
              <div class="modern-popup">
                <div class="popup-header" style="background-color: ${headerColor};">
                  <div class="popup-title">
                    <h3>${props.nama_tps || "Lokasi Sampah"}</h3>
                  </div>
                </div>
                <div class="popup-content">
                  <div class="popup-info">
                    <div class="info-row">
                      <span class="info-icon"><i class="fas fa-map-marker-alt"></i></span>
                      <span class="info-text">${address}</span>
                    </div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Longitude</div>
                        <div class="info-value">${longitude}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Latitude</div>
                        <div class="info-value">${latitude}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Kota</div>
                        <div class="info-value">${city}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Kecamatan</div>
                        <div class="info-value">${props.kecamatan || "Tidak diketahui"}</div>
                      </div>
                    </div>
                  </div>
                  <div class="popup-actions">
                    <button class="action-button primary">
                      <i class="fas fa-directions"></i> Rute
                    </button>
                    <button class="action-button secondary">
                      <i class="fas fa-info-circle"></i> Detail
                    </button>
                  </div>
                </div>
                <style>
                  .modern-popup { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); width: 100%; max-width: 300px; }
                  .popup-header { padding: 12px 16px; color: white; }
                  .popup-title { display: flex; justify-content: space-between; align-items: center; }
                  .popup-title h3 { margin: 0; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                  .popup-content { padding: 16px; background: white; }
                  .popup-info { margin-bottom: 16px; }
                  .info-row { display: flex; margin-bottom: 16px; align-items: flex-start; }
                  .info-icon { margin-right: 10px; min-width: 16px; text-align: center; }
                  .info-text { font-size: 14px; color: #333; flex: 1; line-height: 1.4; }
                  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
                  .info-item { background: #f8f8f8; border-radius: 8px; padding: 10px; transition: all 0.2s ease; }
                  .info-item:hover { background: #f0f0f0; }
                  .info-label { font-size: 12px; font-weight: 500; color: #666; margin-bottom: 4px; }
                  .info-value { font-size: 14px; color: #333; font-weight: 500; word-break: break-word; }
                  .popup-actions { display: flex; gap: 8px; margin-top: 16px; }
                  .action-button { flex: 1; padding: 10px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
                  .action-button i { margin-right: 6px; }
                  .action-button.primary { background: #ff0000; color: white; }
                  .action-button.primary:hover { background: #e00000; }
                  .action-button.secondary { background: #f0f0f0; color: #333; }
                  .action-button.secondary:hover { background: #e3e3e3; }
                  @media (max-width: 480px) { .modern-popup { max-width: 280px; } .info-grid { grid-template-columns: 1fr; } .popup-actions { flex-direction: column; } }
                  .maplibregl-popup-content { padding: 0; border-radius: 12px; overflow: hidden; }
                  .maplibregl-popup-close-button { color: white; font-size: 18px; padding: 5px 8px; z-index: 1; background: transparent; border: none; }
                  .maplibregl-popup-close-button:hover { background: rgba(255, 255, 255, 0.1); }
                </style>
              </div>
            `;
          };

          if (!map.listens("click", "sampah-layer")) {
            map.on("click", "sampah-layer", (e) => {
              const feature = e.features?.[0] ?? {};
              const coords = feature.geometry?.coordinates ?? [0, 0];
              const props = feature.properties ?? {};

              map.flyTo({
                center: coords,
                zoom: Math.max(map.getZoom(), 15),
                speed: 0.8,
                curve: 1.2,
              });

              popup
                .setLngLat(coords)
                .setHTML(createPopupHTML(props, coords))
                .addTo(map);

              setTimeout(() => {
                const popupElement = document.querySelector(".custom-popup");
                if (popupElement) {
                  popupElement.style.opacity = "0";
                  popupElement.style.transform = "translateY(10px)";
                  popupElement.style.transition =
                    "opacity 0.3s ease, transform 0.3s ease";
                  setTimeout(() => {
                    popupElement.style.opacity = "1";
                    popupElement.style.transform = "translateY(0)";
                  }, 50);
                }
              }, 50);
            });
          }

          if (!map.listens("mouseenter", "sampah-layer")) {
            map.on("mouseenter", "sampah-layer", () => {
              map.getCanvas().style.cursor = "pointer";
            });
          }

          if (!map.listens("mouseleave", "sampah-layer")) {
            map.on("mouseleave", "sampah-layer", () => {
              map.getCanvas().style.cursor = "";
            });
          }
        })
        .catch((error) => {
          console.warn("Failed to load GeoServer data:", error.message);
        });
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.once("load", onLoad);
    }

    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .maplibregl-popup.custom-popup { z-index: 100; }
      .maplibregl-popup.custom-popup .maplibregl-popup-tip { border-top-color: white !important; border-bottom-color: white !important; }
    `;
    document.head.appendChild(styleElement);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (map.getLayer("sampah-layer")) map.removeLayer("sampah-layer");
      if (map.getLayer("sampah-pulse")) map.removeLayer("sampah-pulse");
      if (map.getSource("sampah")) map.removeSource("sampah");
      if (document.head.contains(styleElement))
        document.head.removeChild(styleElement);
    };
  }, []);

  return null;
};

export default Sampah;