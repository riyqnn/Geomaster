import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import debounce from "lodash/debounce";

const TabelSampah = ({ sidebarExpanded, setTableHeight, isMobile }) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig] = useState({ key: "status", direction: "desc" });
  const [panelVisible, setPanelVisible] = useState(false);
  const panelRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch data
  useEffect(() => {
    setIsLoading(true);
    fetch("https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/sampah2.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json.features || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal fetch data:", err);
        setIsLoading(false);
      });
  }, []);

  // Update table height
  useEffect(() => {
    if (panelRef.current && setTableHeight && panelVisible) {
      const height = panelRef.current.offsetHeight;
      setTableHeight(height);
    }
  }, [panelVisible, setTableHeight]);

  const handleZoom = useCallback((feature) => {
    const coords = feature.geometry?.coordinates;
    if (coords && window.map) {
      window.map.flyTo({ center: coords, zoom: 15, duration: 800 });
    } else {
      alert("Koordinat tidak tersedia untuk lokasi ini.");
    }
  }, []);

  const hasValidCoordinates = useCallback((feature) => {
    return (
      feature.geometry?.coordinates &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2 &&
      feature.geometry.coordinates.every((coord) => typeof coord === "number" && !isNaN(coord))
    );
  }, []);

  const getStatusClass = useCallback(
    (feature) => (hasValidCoordinates(feature) ? "bg-green-700" : "bg-red-700"),
    [hasValidCoordinates]
  );

  const getStatusText = useCallback(
    (feature) => (hasValidCoordinates(feature) ? "Aktif" : "Tidak Aktif"),
    [hasValidCoordinates]
  );

  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  }, []);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortConfig.key === "status") {
        const statusA = hasValidCoordinates(a);
        const statusB = hasValidCoordinates(b);
        return sortConfig.direction === "desc"
          ? statusA === statusB
            ? 0
            : statusA
            ? -1
            : 1
          : statusA === statusB
          ? 0
          : statusA
          ? 1
          : -1;
      }
      return 0;
    });
  }, [data, sortConfig, hasValidCoordinates]);

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return sortedData.filter((feature) =>
      [
        feature.properties.nama_tps,
        feature.properties.full_address,
        feature.properties.jenis_tps,
      ].some((prop) => prop?.toLowerCase().includes(searchLower))
    );
  }, [sortedData, searchTerm]);

  const togglePanel = useCallback(() => {
    setPanelVisible((prev) => !prev);
  }, []);

  return (
    <>
      {isMobile && (
        <button
          onClick={togglePanel}
          className={`fixed z-30 bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center transition-all duration-300
            ${sidebarExpanded ? "right-20" : "right-4"} 
            ${panelVisible ? "rotate-180" : ""}`}
          aria-label={panelVisible ? "Sembunyikan tabel" : "Tampilkan tabel"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      <div
        ref={panelRef}
        className={`bg-[#1a1a1a] rounded-t-lg overflow-hidden transition-all duration-300
          ${isMobile ? (panelVisible ? "block" : "hidden") : "block"}`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 to-indigo-900 p-3 rounded-t-lg border-t border-white/30">
          <div className="flex items-center">
            <i className="fas fa-trash-alt text-blue-400 text-lg mr-2" />
            <h2 className="text-base font-semibold text-white">Data Lokasi Sampah</h2>
            <span className="ml-3 px-2 py-0.5 bg-blue-600 text-xs rounded-full text-white">
              {filteredData.length} lokasi
            </span>
          </div>
          {isMobile && (
            <button
              onClick={togglePanel}
              className="text-white"
              aria-label="Tutup panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
          {/* Search Bar */}
          <div className="sticky top-0 p-3 bg-[#1a1a1a] border-b border-white/10 z-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari lokasi sampah..."
                onChange={handleSearch}
                className="w-full py-2 pl-10 bg-blue-950 border border-blue-800 rounded-lg text-white text-sm placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Cari lokasi sampah"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white"
                  onClick={() => setSearchTerm("")}
                  aria-label="Hapus pencarian"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>

          {/* Table/Cards */}
          <div className="p-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-32 text-blue-400">
                <i className="fas fa-circle-notch fa-spin text-2xl mr-3" />
                <span className="text-sm">Memuat data...</span>
              </div>
            ) : filteredData.length > 0 ? (
              <>
                {/* Desktop/Tablet Table View */}
                <div className="hidden md:block">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-[#1a1a1a] z-10">
                      <tr>
                        {["Nama TPS", "Alamat", "Jenis", "Status", "Aksi"].map((header, idx) => (
                          <th
                            key={idx}
                            className="p-3 text-left border-b-2 border-blue-800 text-blue-300 font-medium"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((feature, index) => (
                        <tr
                          key={index}
                          className="border-b border-white/10 hover:bg-blue-900/30 text-gray-300"
                        >
                          <td className="p-3 truncate max-w-[200px]">{feature.properties.nama_tps || "-"}</td>
                          <td className="p-3 truncate max-w-[250px]">{feature.properties.full_address || "-"}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-950 rounded-full text-center">
                              {feature.properties.jenis_tps || "-"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 ${getStatusClass(
                                feature
                              )} rounded-full text-white text-center`}
                            >
                              {getStatusText(feature)}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleZoom(feature)}
                              className={`px-3 py-1 text-sm ${
                                hasValidCoordinates(feature)
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-gray-600 cursor-not-allowed"
                              } text-white rounded-lg flex items-center`}
                              disabled={!hasValidCoordinates(feature)}
                              aria-label="Lihat lokasi di peta"
                            >
                              <i className="fas fa-map-marker-alt mr-1" /> Lihat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredData.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-[#1f1f1f] p-3 rounded-lg border border-blue-900/40 hover:bg-slate-700/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-white text-sm truncate">
                          {feature.properties.nama_tps || "-"}
                        </h3>
                        <span
                          className={`px-2 py-1 ${getStatusClass(
                            feature
                          )} rounded-full text-xs text-white`}
                        >
                          {getStatusText(feature)}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs mb-2 break-words">
                        <i className="fas fa-map-marker-alt mr-1 text-blue-400" />
                        {feature.properties.full_address || "-"}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-1 bg-blue-950 rounded-full text-xs text-blue-300">
                          {feature.properties.jenis_tps || "-"}
                        </span>
                        <button
                          onClick={() => handleZoom(feature)}
                          className={`px-2 py-1 text-xs ${
                            hasValidCoordinates(feature)
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-600 cursor-not-allowed"
                          } text-white rounded-lg flex items-center`}
                          disabled={!hasValidCoordinates(feature)}
                          aria-label="Lihat lokasi di peta"
                        >
                          <i className="fas fa-map-marker-alt mr-1" /> Lihat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <i className="fas fa-search text-4xl mb-3 text-blue-400" />
                <p className="text-sm">Tidak ada data yang sesuai dengan pencarian</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TabelSampah;