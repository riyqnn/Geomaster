import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import MapSidebar from '../Components/Sidebar';
import Maps from '../Pages/Maps';
import TabelSampah from '../Components/Table';

const MapsLayout = () => {
  const [showSampah, setShowSampah] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [tableHeight, setTableHeight] = useState(300); // Increased default height for better visibility
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const resizeRef = useRef(null);
  const containerRef = useRef(null);
  const tableContainerRef = useRef(null);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  // Improved resize handler with smoother operation
  const handleResize = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const minHeight = 150; // Minimum table height
    const maxHeight = window.innerHeight * 0.7; // Maximum table height (70% of viewport)
    
    // Calculate new height based on drag direction
    const deltaY = lastY.current - e.clientY;
    lastY.current = e.clientY;
    
    const newHeight = Math.max(
      minHeight, 
      Math.min(tableHeight + deltaY, maxHeight)
    );
    
    // Only update if there's a significant change
    if (Math.abs(newHeight - tableHeight) > 1) {
      setTableHeight(newHeight);
      
      // Ensure table container updates its scrollbar
      if (tableContainerRef.current) {
        tableContainerRef.current.style.height = `${newHeight - 35}px`; // Subtract resize handle height
      }
    }
  }, [tableHeight]);

  const stopDragging = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopDragging);
    document.removeEventListener('touchmove', handleTouchResize);
    document.removeEventListener('touchend', stopDragging);
    document.body.style.userSelect = 'auto';
    document.body.style.overflow = 'auto';
  }, [handleResize]);

  // Touch events for mobile support
  const handleTouchResize = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleResize({ clientY: touch.clientY });
  }, [handleResize]);

  const startDragging = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    lastY.current = e.clientY;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopDragging);
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden'; // Prevent scroll during resize
  }, [handleResize, stopDragging]);

  const startTouchDragging = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    const touch = e.touches[0];
    lastY.current = touch.clientY;
    document.addEventListener('touchmove', handleTouchResize, { passive: false });
    document.addEventListener('touchend', stopDragging);
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden';
  }, [handleTouchResize, stopDragging]);

  useEffect(() => {
    const resizeHandle = resizeRef.current;
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', startDragging);
      resizeHandle.addEventListener('touchstart', startTouchDragging, { passive: false });
    }
    
    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener('mousedown', startDragging);
        resizeHandle.removeEventListener('touchstart', startTouchDragging);
      }
      stopDragging();
    };
  }, [startDragging, stopDragging, startTouchDragging]);

  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #1f2937;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #3b82f6;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #2563eb;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarExpanded(false);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

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
            isJumlahVisible={activeLayer === 'jumlah-penduduk'}
            activeLayer={activeLayer}
            sidebarExpanded={sidebarExpanded}
            tableHeight={tableHeight}
          />
        </div>
        {showSampah && (
          <div
            className={`absolute bottom-0 z-30 rounded-t-lg overflow-hidden shadow-lg
              ${isMobile ? 'left-16 right-4' : (sidebarExpanded ? 'left-72 right-4' : 'left-20 right-4')}`}
            style={{ 
              height: `${tableHeight}px`, 
              transition: 'left 0.3s ease-in-out, right 0.3s ease-in-out',
              display: 'flex',
              flexDirection: 'column' 
            }}
          >
            <div
              ref={resizeRef}
              className="w-full h-6 bg-blue-900 cursor-ns-resize flex items-center justify-center touch-none select-none hover:bg-blue-800 transition-colors"
              role="slider"
              aria-label="Sesuaikan tinggi tabel"
            >
              <div className="w-12 h-1 bg-blue-300 rounded-full" />
            </div>
            <div 
              ref={tableContainerRef}
              className="flex-1 overflow-hidden"
              style={{ height: `${tableHeight - 24}px` }}
            >
              <TabelSampah
                sidebarExpanded={sidebarExpanded}
                setTableHeight={setTableHeight}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default MapsLayout;