import { useState, useCallback, useRef, useEffect } from "react";

function Search({ sidebarExpanded, tableHeight, mapRef }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Handle clicks outside of results list to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (resultsRef.current && !resultsRef.current.contains(event.target) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setResults([]);
        setShowHistory(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (!value) {
      setResults([]);
      return;
    }
    
    // Auto-search after typing
    if (value.length > 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 500);
    }
  }, []);

  const performSearch = async (searchQuery) => {
    if (!searchQuery) return;
    
    setIsLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=8`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      
      // Add result types for better display
      const enhancedData = data.map(item => ({
        ...item,
        type: getLocationType(item.type, item.class)
      }));
      
      setResults(enhancedData);
    } catch (error) {
      console.error("Error fetching location:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get user-friendly location types
  const getLocationType = (type, itemClass) => {
    if (type === "city" || type === "administrative") return "City";
    if (type === "suburb" || itemClass === "place") return "Area";
    if (type === "building" || type === "amenity") return "Building";
    if (type === "highway" || type === "road") return "Street";
    return "Location";
  };

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    performSearch(query);
  }, [query]);

  const flyToLocation = (lat, lon, name) => {
    if (mapRef.current) {
      // Save to search history
      const historyItem = { name, lat, lon };
      setSearchHistory(prev => {
        // Remove duplicates and keep the latest 5 searches
        const filteredHistory = prev.filter(item => item.name !== name);
        return [historyItem, ...filteredHistory].slice(0, 5);
      });
      
      // Fly to location
      mapRef.current.flyTo({
        center: [parseFloat(lon), parseFloat(lat)],
        zoom: 16,
        pitch: 60,
        duration: 1200,
      });
    }
  };

  const handleResultClick = useCallback((location) => {
    flyToLocation(location.lat, location.lon, location.display_name);
    setQuery(location.display_name);
    setResults([]);
    setIsVisible(false);
  }, []);

  const handleHistoryItemClick = (item) => {
    flyToLocation(item.lat, item.lon, item.name);
    setQuery(item.name);
    setShowHistory(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setShowHistory(false);
  };

  // Compute left position based on sidebarExpanded
  const leftPosition = sidebarExpanded ? 'left-[88px]' : 'left-6';

  return (
    <div
      className={`fixed z-50 ${
        isVisible ? 'top-2 left-2' : `top-2 sm:top-4 sm:${leftPosition}`
      }`}
    >
      {/* Toggle button for mobile */}
      <button
        className="sm:hidden bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-all duration-200"
        onClick={() => setIsVisible(!isVisible)}
      >
        <i
          className={`fas ${isVisible ? 'fa-times' : 'fa-search'} text-white w-5 h-5`}
        ></i>
      </button>

      {/* Search form */}
      <div
        className={`sm:block ${isVisible ? 'block' : 'hidden'} w-[80vw] sm:w-80 max-w-[280px] sm:max-w-[320px]`}
      >
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
              placeholder="Cari lokasi..."
              className="w-full pl-10 sm:pl-12 py-2 sm:py-3 bg-[#1a1a1a] text-white text-sm sm:text-base border border-blue-500/30 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition-all duration-200"
            />
            <button 
              type="submit"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400 text-sm sm:text-base hover:text-blue-300 transition-colors"
            >
              <i className="fas fa-search"></i>
            </button>
            
            {query && (
              <button
                type="button"
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setQuery("")}
              >
                <i className="fas fa-times text-xs sm:text-sm"></i>
              </button>
            )}
            
            {isLoading && (
              <div className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {showHistory && searchHistory.length > 0 && !results.length && (
            <div ref={resultsRef} className="absolute top-full mt-1 w-full bg-[#1a1a1a] border border-blue-500/20 rounded-lg shadow-lg max-h-48 sm:max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center px-3 sm:px-4 py-2 border-b border-blue-500/20">
                <span className="text-xs sm:text-sm text-gray-400">Pencarian Terakhir</span>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Hapus Semua
                </button>
              </div>
              <ul>
                {searchHistory.map((item, index) => (
                  <li
                    key={`history-${index}`}
                    onClick={() => handleHistoryItemClick(item)}
                    className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-blue-900/50 cursor-pointer flex items-center space-x-2 sm:space-x-3 border-b border-blue-500/10 last:border-b-0 transition-all duration-200"
                  >
                    <i className="fas fa-history text-blue-400 text-xs sm:text-sm"></i>
                    <span className="text-xs sm:text-sm text-white truncate">
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.length > 0 && (
            <ul ref={resultsRef} className="absolute top-full mt-1 w-full bg-[#1a1a1a] border border-blue-500/20 rounded-lg shadow-lg max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar">
              {results.map((location, index) => (
                <li
                  key={`${location.place_id}-${index}`}
                  onClick={() => handleResultClick(location)}
                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-blue-900/50 cursor-pointer flex items-center border-b border-blue-500/10 last:border-b-0 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <i className="fas fa-map-marker-alt text-red-400 text-xs sm:text-sm min-w-4"></i>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs sm:text-sm text-white truncate">
                        {location.display_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {location.type}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>
    </div>
  );
}

export default Search;