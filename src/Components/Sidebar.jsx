import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.png";

const MapSidebar = ({
  onToggleSampah,
  expanded,
  toggleExpand,
  activeLayer,
  onLayerChange,
}) => {
  const [sampahActive, setSampahActive] = useState(false);
  const [jumlahActive, setJumlahActive] = useState(false);
  const [udaraActive, setUdaraActive] = useState(false);
  const [zoonosisActive, setZoonosisActive] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

  // Memoize fungsi untuk performa optimal
  const deactivateExclusiveLayers = useCallback((exceptLayer) => {
    if (exceptLayer !== "indeks-kualitas-udara") setUdaraActive(false);
    if (exceptLayer !== "penyakit-zoonosis") setZoonosisActive(false);
  }, []);

  const handleToggleSampah = useCallback(() => {
    const newState = !sampahActive;
    setSampahActive(newState);
    onToggleSampah(newState);

    // Jika Sampah aktif, prioritaskan sebagai activeLayer
    if (newState) {
      onLayerChange("sampah");
      setZoonosisActive(false);
      setUdaraActive(false);
    } else {
      // Jika Sampah dimatikan, gunakan Jumlah Penduduk jika aktif
      onLayerChange(jumlahActive ? "jumlah-penduduk" : null);
    }
  }, [sampahActive, jumlahActive, onToggleSampah, onLayerChange]);

  const handleToggleJumlah = useCallback(() => {
    const newState = !jumlahActive;
    setJumlahActive(newState);
    deactivateExclusiveLayers("jumlah-penduduk");

    // Jika Jumlah aktif, prioritaskan sebagai activeLayer kecuali Sampah juga aktif
    if (newState) {
      onLayerChange(sampahActive ? "sampah" : "jumlah-penduduk");
      setZoonosisActive(false);
      setUdaraActive(false);
    } else {
      // Jika Jumlah dimatikan, gunakan Sampah jika aktif
      onLayerChange(sampahActive ? "sampah" : null);
    }
  }, [jumlahActive, sampahActive, onLayerChange, deactivateExclusiveLayers]);

  const handleToggleUdara = useCallback(() => {
    const newState = !udaraActive;
    setUdaraActive(newState);
    if (newState) {
      setSampahActive(false);
      setJumlahActive(false);
      setZoonosisActive(false);
      onToggleSampah(false);
      onLayerChange("indeks-kualitas-udara");
    } else {
      onLayerChange(null);
    }
  }, [udaraActive, onToggleSampah, onLayerChange]);

  const handleToggleZoonosis = useCallback(() => {
    const newState = !zoonosisActive;
    setZoonosisActive(newState);
    if (newState) {
      setSampahActive(false);
      setJumlahActive(false);
      setUdaraActive(false);
      onToggleSampah(false);
      onLayerChange("penyakit-zoonosis");
    } else {
      onLayerChange(null);
    }
  }, [zoonosisActive, onToggleSampah, onLayerChange]);

  const goToHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const toggleSubmenu = useCallback((index) => {
    setActiveMenu((prev) => (prev === index ? null : index));
  }, []);

  const menuItems = [
    {
      icon: "fa-virus",
      label: "Penyebaran Zoonosis",
      id: "penyakit-zoonosis",
      action: handleToggleZoonosis,
      isActive: zoonosisActive,
    },
    {
      icon: "fa-user",
      label: "Perilaku Manusia",
      subItems: ["Educated", "Uneducated"],
    },
    {
      icon: "fa-wind",
      label: "Indeks Kualitas Udara",
      id: "indeks-kualitas-udara",
      action: handleToggleUdara,
      isActive: udaraActive,
    },
    { icon: "fa-dog", label: "Analysist" },
    {
      icon: "fa-users",
      label: "Jumlah Penduduk",
      id: "jumlah-penduduk",
      action: handleToggleJumlah,
      isActive: jumlahActive,
    },
  ];

  return (
    <div
      className={`h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/30 flex flex-col transition-all duration-300 shadow-xl fixed md:static z-20
        ${expanded ? "w-64 md:w-72" : "w-16 md:w-20"}`}
    >
      {/* Logo & Toggle Expand */}
      <div className="p-3 md:p-5 border-b border-slate-700/30 flex items-center justify-between shrink-0">
        <button
          onClick={goToHome}
          className="bg-slate-800/50 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          aria-label="Go to home"
        >
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
        </button>
        {expanded && (
          <span className="text-lg md:text-xl font-semibold ml-2 md:ml-3 text-white transition-opacity duration-300 whitespace-nowrap">
            BioSecureLand
          </span>
        )}
        <button
          onClick={toggleExpand}
          className="bg-blue-900/70 rounded-full p-1 md:p-2 hover:bg-blue-800 transition-colors duration-300 shadow-lg"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <i
            className={`fas fa-chevron-${expanded ? "left" : "right"} text-blue-200 text-sm md:text-base`}
          />
        </button>
      </div>

      {/* Menu Section */}
      <div className="flex-1 py-2 px-2 md:py-3 md:px-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 md:space-y-2">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                className={`w-full flex items-center p-2 md:p-4 rounded-xl ${
                  item.isActive
                    ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-700/30"
                    : "hover:bg-blue-900/40 text-slate-300"
                } transition-colors duration-200 group`}
                onClick={() => {
                  if (item.action) item.action();
                  else if (item.id) onLayerChange(item.id === activeLayer ? null : item.id);
                  else if (item.subItems) toggleSubmenu(index);
                }}
                aria-label={item.label}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl ${
                    item.isActive ? "text-blue-200" : "text-blue-400"
                  }`}
                >
                  <i className={`fas ${item.icon}`} />
                </div>
                {expanded && (
                  <div className="ml-2 md:ml-3 flex-1 flex items-center justify-between">
                    <span className="font-medium text-sm md:text-base">
                      {item.label}
                    </span>
                    {item.subItems && (
                      <i
                        className={`fas fa-chevron-${
                          activeMenu === index ? "down" : "right"
                        } text-xs md:text-sm transition-transform duration-200`}
                      />
                    )}
                  </div>
                )}
                {!expanded && (
                  <span className="absolute left-16 md:left-20 ml-1 md:ml-2 px-2 md:px-4 py-2 md:py-3 bg-slate-800 text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg border border-slate-700/50">
                    {item.label}
                  </span>
                )}
              </button>

              {expanded && item.subItems && activeMenu === index && (
                <div className="ml-8 md:ml-10 mt-1 space-y-1 pl-3 md:pl-4 border-l-2 border-blue-600">
                  {item.subItems.map((sub, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left text-slate-300 hover:text-white px-2 md:px-4 py-1 md:py-2 rounded-lg hover:bg-blue-800/50 transition-colors duration-200 text-xs md:text-sm flex items-center"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-1 md:mr-2" />
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tombol Sampah */}
          <button
            onClick={handleToggleSampah}
            className={`w-full flex items-center p-2 md:p-4 rounded-xl ${
              sampahActive
                ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-700/30"
                : "hover:bg-blue-900/40 text-slate-300"
            } transition-colors duration-200 group`}
            aria-label="Pengelolaan Sampah"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl ${
                sampahActive ? "text-white" : "text-blue-400"
              }`}
            >
              <i className="fas fa-trash-alt" />
            </div>
            {expanded && (
              <span className="ml-2 md:ml-3 font-medium text-sm md:text-base">
                Pengelolaan Sampah
              </span>
            )}
            {!expanded && (
              <span className="absolute left-16 md:left-20 ml-1 md:ml-2 px-2 md:px-4 py-2 md:py-3 bg-slate-800 text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg border border-slate-700/50">
                Pengelolaan Sampah
              </span>
            )}
          </button>
        </div>

        {/* Informasi Layer Aktif */}
        {expanded && (sampahActive || jumlahActive || udaraActive || zoonosisActive) && (
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl border border-blue-500/30 shadow-lg">
            <h4 className="text-sm md:text-base font-medium text-blue-200 mb-2 md:mb-3 flex items-center">
              <i className="fas fa-layer-group mr-1 md:mr-2" />
              Layer Aktif:
            </h4>
            <div className="flex flex-col gap-2 md:gap-3">
              {sampahActive && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">
                    Lokasi Sampah
                  </span>
                </div>
              )}
              {jumlahActive && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">
                    Jumlah Penduduk
                  </span>
                </div>
              )}
              {udaraActive && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">
                    Indeks Kualitas Udara
                  </span>
                </div>
              )}
              {zoonosisActive && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-red-500/30 hover:bg-red-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">
                    Penyakit Zoonosis
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {expanded && (
        <div className="p-3 md:p-5 border-t border-slate-700/30 text-sm md:text-base text-slate-400 text-center bg-slate-900/50 shrink-0">
          © {new Date().getFullYear()} BioSecureLand
        </div>
      )}
    </div>
  );
};

export default MapSidebar;