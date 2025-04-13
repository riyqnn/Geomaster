import React, { useState, useRef, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import MapSidebar from "../Components/Sidebar";
import Maps from "../Pages/Maps";
import TabelSampah from "../Components/Table";

const MapsLayout = () => {
  const [showSampah, setShowSampah] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeLayer, setActiveLayer] = useState(null);
  const [tableHeight, setTableHeight] = useState(288); // Default height in pixels
  const resizeRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // Optimasi: Gunakan useCallback untuk memoize fungsi resize
  const handleResize = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = Math.max(100, Math.min(containerRect.bottom - e.clientY, window.innerHeight * 0.8));
    setTableHeight(newHeight);
  }, []);

  const stopDragging = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopDragging);
    document.body.style.userSelect = "auto";
  }, [handleResize]);

  const startDragging = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopDragging);
    document.body.style.userSelect = "none";
  }, [handleResize, stopDragging]);

  // Handle resize logic dengan performa optimal
  useEffect(() => {
    const resizeHandle = resizeRef.current;
    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", startDragging);
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener("mousedown", startDragging);
      }
      stopDragging(); // Pastikan event dibersihkan
    };
  }, [showSampah, startDragging, stopDragging]);

  // Lebar sidebar
  const sidebarWidth = sidebarExpanded ? "w-72" : "w-20"; // Sesuai dengan MapSidebar.jsx

  return (
    <div className="flex h-screen overflow-hidden">
      <MapSidebar
        onToggleSampah={setShowSampah}
        expanded={sidebarExpanded}
        toggleExpand={() => setSidebarExpanded((prev) => !prev)}
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
      />

      <div ref={containerRef} className="flex-1 relative flex flex-col">
        <div className="absolute inset-0">
          <Maps
            showSampah={showSampah}
            isJumlahVisible={activeLayer === "jumlah-penduduk"}
            activeLayer={activeLayer}
          />
        </div>

        {showSampah && (
          <div
            className={`absolute bottom-0 z-10 overflow-hidden bg-[#1a1a1a] ${sidebarWidth === "w-72" ? "left-72" : "left-20"} right-0 md:left-20 md:right-4`}
            style={{
              height: `${tableHeight}px`,
              transition: "left 0.3s ease-in-out", // Animasi hanya untuk left
            }}
          >
            <div
              ref={resizeRef}
              className="w-full h-4 bg-blue-900 cursor-ns-resize flex items-center justify-center touch-none select-none"
            >
              <div className="w-16 h-1 bg-blue-300 rounded-full" />
            </div>
            <div className="h-[calc(100%-16px)] overflow-y-auto">
              <TabelSampah />
            </div>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default MapsLayout;