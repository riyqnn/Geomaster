import { useEffect, useState } from "react";

const TabelSampah = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig ] = useState({ key: "status", direction: "desc" });

  useEffect(() => {
    setIsLoading(true);
    fetch(
      "http://localhost:8080/geoserver/sampah/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sampah:sampah&outputFormat=application/json"
    )
      .then((res) => res.json())
      .then((json) => {
        setData(json.features);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal fetch data:", err);
        setIsLoading(false);
      });
  }, []);

  const handleZoom = (feature) => {
    const coords = feature.geometry?.coordinates;
    if (coords && window.map) {
      window.map.flyTo({ center: coords, zoom: 15 });
    } else {
      alert("Koordinat tidak tersedia untuk lokasi ini.");
    }
  };

  const hasValidCoordinates = (feature) => {
    return feature.geometry?.coordinates && 
      Array.isArray(feature.geometry.coordinates) && 
      feature.geometry.coordinates.length >= 2;
  };

  const getStatusClass = (feature) => {
    return hasValidCoordinates(feature) ? "bg-green-700" : "bg-red-700";
  };

  const getStatusText = (feature) => {
    return hasValidCoordinates(feature) ? "Aktif" : "Tidak Aktif";
  };

  // Sort data function
  const sortedData = [...data].sort((a, b) => {
    if (sortConfig.key === "status") {
      const statusA = hasValidCoordinates(a);
      const statusB = hasValidCoordinates(b);
      
      if (sortConfig.direction === "desc") {
        return statusA === statusB ? 0 : statusA ? -1 : 1;
      } else {
        return statusA === statusB ? 0 : statusA ? 1 : -1;
      }
    }
    
    // Add more sorting options if needed
    return 0;
  });

  const filteredData = sortedData.filter((feature) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (feature.properties.nama_tps && feature.properties.nama_tps.toLowerCase().includes(searchLower)) ||
      (feature.properties.full_address && feature.properties.full_address.toLowerCase().includes(searchLower)) ||
      (feature.properties.jenis_tps && feature.properties.jenis_tps.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="w-full h-full shadow-lg rounded-t-lg overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#1a1a1a] text-white border-t border-white/30 p-3 rounded-t-lg">
        <div className="flex items-center flex-wrap">
          <div className="flex items-center justify-center w-8 h-8 text-blue-400 text-lg mr-2">
            <i className="fas fa-trash-alt"></i>
          </div>
          <h2 className="text-lg font-semibold">Data Lokasi Sampah</h2>
          <span className="ml-3 px-2 py-0.5 bg-blue-600 text-xs rounded-full text-white">
            {filteredData.length} lokasi
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-[#1a1a1a] overflow-y-auto h-[calc(100%-48px)]">
        {/* Search Bar */}
        <div className="sticky top-0 p-3 bg-[#1a1a1a] border-b border-white/10 z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari lokasi sampah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 bg-blue-950 border border-blue-800 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
              <i className="fas fa-search"></i>
            </div>
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-white"
                onClick={() => setSearchTerm("")}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Table/Cards */}
        <div className="px-2 md:px-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-blue-400">
              <i className="fas fa-circle-notch fa-spin text-2xl mr-3"></i>
              <span>Memuat data...</span>
            </div>
          ) : filteredData.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full border-collapse">
                  <thead className="sticky top-16 bg-[#1a1a1a]">
                    <tr>
                      <th className="p-3 text-left border-b-2 border-blue-800 text-blue-300 font-medium w-1/4">Nama TPS</th>
                      <th className="p-3 text-left border-b-2 border-blue-800 text-blue-300 font-medium w-1/3">Alamat</th>
                      <th className="p-3 text-left border-b-2 border-blue-800 text-blue-300 font-medium w-1/15">Jenis</th>
                      <th className="p-3 text-left border-b-2 border-blue-800 text-blue-300 font-medium w-1/15">Status</th>
                      <th className="p-3 text-left border-b-2 border-blue-800 text-blue-300 font-medium w-1/15">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((feature, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-white/10 hover:bg-blue-900/30 text-gray-300 transition-colors duration-200"
                      >
                        <td className="p-3 font-medium">{feature.properties.nama_tps}</td>
                        <td className="p-3">{feature.properties.full_address}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-blue-950 rounded-full text-xs min-w-20 text-center">
                            {feature.properties.jenis_tps}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 ${getStatusClass(feature)} rounded-full text-xs text-white min-w-20 text-center`}>
                            {getStatusText(feature)}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleZoom(feature);
                            }}
                            className={`px-3 py-1 ${hasValidCoordinates(feature) ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"} text-white rounded-lg transition-colors duration-300 flex items-center text-sm`}
                            disabled={!hasValidCoordinates(feature)}
                          >
                            <i className="fas fa-map-marker-alt mr-1"></i> Lihat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 mt-2">
                {filteredData.map((feature, index) => (
                  <div 
                    key={index} 
                    className="bg-[#1f1f1f] p-3 rounded-lg border border-blue-900/40 shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white mr-2">{feature.properties.nama_tps}</h3>
                      <span className={`shrink-0 px-2 py-1 ${getStatusClass(feature)} rounded-full text-xs text-white min-w-16 text-center`}>
                        {getStatusText(feature)}
                      </span>
                    </div>
                    
                    <div className="text-gray-400 text-sm mb-3 break-words">
                      <i className="fas fa-map-marker-alt mr-1 text-blue-400"></i> 
                      {feature.properties.full_address}
                    </div>
                    
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-950 rounded-full text-xs text-blue-300 min-w-20 text-center">
                        {feature.properties.jenis_tps}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoom(feature);
                        }}
                        className={`px-3 py-1 ${hasValidCoordinates(feature) ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"} text-white rounded-lg transition-colors duration-300 flex items-center text-sm`}
                        disabled={!hasValidCoordinates(feature)}
                      >
                        <i className="fas fa-map-marker-alt mr-1"></i> Lihat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <i className="fas fa-search text-4xl mb-3 text-blue-400"></i>
              <p>Tidak ada data yang sesuai dengan pencarian</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabelSampah;