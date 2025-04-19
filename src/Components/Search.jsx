import { useState, useCallback, useRef } from "react";

function Search({ sidebarExpanded, tableHeight }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const debounceRef = useRef(null);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value) setResults([]);
  }, []);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      setResults(data);

      if (data.length > 0 && window.map) {
        const { lat, lon } = data[0];
        window.map.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 15,
          duration: 800,
        });
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleResultClick = useCallback((location) => {
    if (window.map) {
      window.map.flyTo({
        center: [parseFloat(location.lon), parseFloat(location.lat)],
        zoom: 15,
        duration: 800,
      });
      setQuery(location.display_name);
      setResults([]);
      setIsVisible(false);
    }
  }, []);

  const debounceSearch = useCallback(
    (e) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => handleSearch(e), 300);
    },
    [handleSearch]
  );

  // Compute left position based on sidebarExpanded
  const leftPosition = sidebarExpanded ? 'left-[88px]' : 'left-6'; // left-6 = 24px

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
          className={`fas ${isVisible ? 'fa-times' : 'fa-search'} text-red-200 w-5 h-5`}
        ></i>
      </button>

      {/* Search form */}
      <div
        className={`sm:block ${isVisible ? 'block' : 'hidden'} w-[80vw] sm:w-80 max-w-[280px] sm:max-w-[320px]`}
      >
        <form onSubmit={debounceSearch} className="relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Cari lokasi..."
              className="w-full pl-10 sm:pl-12 py-2 sm:py-3 bg-[#1a1a1a] text-white text-sm sm:text-base border border-blue-500/30 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition-all duration-200"
            />
            <i className="fas fa-search absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400 text-sm sm:text-base"></i>
            {isLoading && (
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <ul className="absolute top-full mt-1 w-full bg-[#1a1a1a] border border-blue-500/20 rounded-lg shadow-lg max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar">
              {results.map((location, index) => (
                <li
                  key={`${location.place_id}-${index}`}
                  onClick={() => handleResultClick(location)}
                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-blue-900/50 cursor-pointer flex items-center space-x-2 sm:space-x-3 border-b border-blue-500/10 last:border-b-0 transition-all duration-200"
                >
                  <i className="fas fa-map-pin text-red-400 text-xs sm:text-sm"></i>
                  <span className="text-xs sm:text-sm text-white truncate">
                    {location.display_name}
                  </span>
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