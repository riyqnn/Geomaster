import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.png";

const MapSidebar = ({ onToggleSampah }) => {
  const [sampahActive, setSampahActive] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  const handleToggleSampah = () => {
    const newState = !sampahActive;
    setSampahActive(newState);
    onToggleSampah(newState);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const goToHome = () => {
    navigate("/");
  };

  const menuItems = [
    { icon: "fa-virus", label: "Penyakit Zoonosis" },
    { icon: "fa-dog", label: "Populasi Hewan" },
    {
      icon: "fa-user",
      label: "Perilaku Manusia",
      subItems: ["Educated", "Uneducated"],
    },
    { icon: "fa-wind", label: "Indeks Kualitas Udara" },
  ];

  return (
    <div
      className={`h-screen bg-[#1a1a1a] overflow-hidden border-r border-white/30 flex flex-col transition-all duration-300 ${
        expanded ? "w-72" : "w-20"
      }`}
    >
      {/* Logo & Toggle */}
      <div className="p-5 border-b border-white/30 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={goToHome} className="bg-[#1a1a1a] p-1 rounded-lg">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          </button>
          {expanded && (
            <span className="text-xl font-semibold ml-3 text-white transition-opacity duration-300">
              BioSecureLand
            </span>
          )}
        </div>

        <button
          onClick={toggleExpand}
          className="bg-blue-950 rounded-full p-2 hover:bg-blue-900 transition-colors duration-300"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <i
            className={`fas fa-chevron-${expanded ? "left" : "right"} text-blue-300`}
          ></i>
        </button>
      </div>

      {/* Menu Section */}
      <div className="flex-1 py-3 px-4 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item, index) =>
            item.subItems ? (
              <div key={index}>
                <div className="w-full flex items-center p-4 rounded-xl hover:bg-blue-950 text-gray-300 transition-all duration-300 group">
                  <div className="flex items-center justify-center w-10 h-10 text-blue-400 text-xl">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  {expanded ? (
                    <span className="ml-3 font-medium text-base">
                      {item.label}
                    </span>
                  ) : (
                    <span className="absolute left-20 ml-3 px-4 py-2 bg-blue-950 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </div>

                {/* Submenu muncul hanya jika expanded */}
                {expanded && (
                  <div className="ml-14 mt-1 space-y-1">
                    {item.subItems.map((sub, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left text-gray-300 hover:text-white px-2 py-1 rounded-lg hover:bg-blue-950 transition duration-300 text-sm"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={index}
                className="w-full flex items-center p-4 rounded-xl hover:bg-blue-950 text-gray-300 transition-all duration-300 group"
              >
                <div className="flex items-center justify-center w-10 h-10 text-blue-400 text-xl">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                {expanded ? (
                  <span className="ml-3 font-medium text-base">
                    {item.label}
                  </span>
                ) : (
                  <span className="absolute left-20 ml-3 px-4 py-2 bg-blue-950 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg">
                    {item.label}
                  </span>
                )}
              </button>
            )
          )}

          {/* Layer Sampah */}
          <button
            onClick={handleToggleSampah}
            className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 group ${
              sampahActive
                ? "bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white"
                : "hover:bg-blue-950 text-gray-300"
            }`}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 text-xl ${
                sampahActive ? "text-white" : "text-blue-400"
              }`}
            >
              <i className="fas fa-trash-alt"></i>
            </div>
            {expanded ? (
              <span className="ml-3 font-medium text-base">
                Pengelolaan Sampah
              </span>
            ) : (
              <span className="absolute left-20 ml-3 px-4 py-2 bg-blue-950 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg">
                Layer Sampah
              </span>
            )}
          </button>
        </div>

        {/* Active Layer Info */}
        {expanded && sampahActive && (
          <div className="mt-6 p-4 bg-blue-950 rounded-xl transition-all duration-500 border border-white/30">
            <h4 className="text-base font-medium text-blue-300 mb-3">
              Layer Aktif:
            </h4>
            <div className="flex items-center gap-3 p-3 bg-blue-900 rounded-lg shadow-md hover:shadow-blue-800/50 hover:bg-blue-800 transition-all duration-300">
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <span className="text-base text-white">Lokasi Sampah</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {expanded && (
        <div className="p-5 border-t border-white/30 text-base text-gray-400 text-center">
          © {new Date().getFullYear()} BioSecureLand
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
