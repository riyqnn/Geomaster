import { useState } from "react";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setResults(data);

      if (data.length > 0 && window.map) {
        const { lat, lon } = data[0];
        window.map.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 15,
        });
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (location) => {
    if (window.map) {
      window.map.flyTo({
        center: [parseFloat(location.lon), parseFloat(location.lat)],
        zoom: 15,
      });
      setQuery(location.display_name);
      setResults([]);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari lokasi..."
            className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] text-white border border-white/30 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition-all duration-300"
          />
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/60"></i>
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <ul className="absolute top-full mt-2 w-full bg-blue-950 border border-white/30 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((location, index) => (
              <li 
                key={index} 
                onClick={() => handleResultClick(location)}
                className="px-4 py-3 hover:bg-blue-900 cursor-pointer flex items-center space-x-3 border-b border-white/10 last:border-b-0"
              >
                <i className="fas fa-map-pin text-blue-400"></i>
                <span className="text-sm text-white truncate">
                  {location.display_name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

export default Search;
