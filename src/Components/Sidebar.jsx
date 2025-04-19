import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '/logo.png';

const MapSidebar = ({ onToggleSampah, expanded, toggleExpand, onLayerChange }) => {
  const [localActiveLayer, setLocalActiveLayer] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

  const handleToggleLayer = useCallback((layerId) => {
    setLocalActiveLayer(prev => {
      const newLayer = prev === layerId ? null : layerId;
      if (layerId === 'sampah') {
        onToggleSampah(newLayer === 'sampah');
      }
      onLayerChange(newLayer);
      return newLayer;
    });
  }, [onToggleSampah, onLayerChange]);

  const goToHome = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const toggleSubmenu = useCallback((index) => {
    setActiveMenu(prev => prev === index ? null : index);
  }, []);

  const menuItems = useMemo(() => [
    { icon: 'fa-virus', label: 'Penyebaran Zoonosis', id: 'penyakit-zoonosis' },
    { icon: 'fa-wind', label: 'Indeks Kualitas Udara', id: 'indeks-kualitas-udara' },
    { icon: 'fa-users', label: 'Jumlah Penduduk', id: 'jumlah-penduduk' },
  ], []);

  return (
    <div className={`h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/30 flex flex-col transition-all duration-300 shadow-xl fixed md:static z-20 ${expanded ? 'w-64 md:w-72' : 'w-16 md:w-20'}`}>
      <div className="p-3 md:p-5 border-b border-slate-700/30 flex items-center justify-between shrink-0">
        <button
          onClick={goToHome}
          className="bg-slate-800/50 p-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
          aria-label="Go to home"
        >
          <img src={logo} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        </button>
        {expanded && (
          <span className="text-lg md:text-xl font-semibold ml-2 md:ml-3 text-white transition-opacity duration-300 whitespace-nowrap">
            BioSecureLand
          </span>
        )}
        <button
          onClick={toggleExpand}
          className="bg-blue-900/70 rounded-full p-1 md:p-2 hover:bg-blue-800 transition-colors duration-300 shadow-lg"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <i className={`fas fa-chevron-${expanded ? 'left' : 'right'} text-blue-200 text-sm md:text-base`} />
        </button>
      </div>
      <div className="flex-1 py-2 px-2 md:py-3 md:px-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 md:space-y-2">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                className={`w-full flex items-center p-2 md:p-4 rounded-xl touch-action-none ${
                  localActiveLayer === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-600/30'
                    : 'hover:bg-blue-800/30 text-slate-300'
                } transition-colors duration-200 group`}
                onClick={() => handleToggleLayer(item.id)}
                aria-label={item.label}
              >
                <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl ${
                  localActiveLayer === item.id ? 'text-blue-200 animate-pulse' : 'text-blue-400'
                }`}>
                  <i className={`fas ${item.icon}`} />
                </div>
                {expanded && (
                  <div className="ml-2 md:ml-3 flex-1 flex items-center justify-between">
                    <span className="font-medium text-sm md:text-base">{item.label}</span>
                    {item.subItems && (
                      <i className={`fas fa-chevron-${activeMenu === index ? 'down' : 'right'} text-xs md:text-sm transition-transform duration-200`} />
                    )}
                  </div>
                )}
                {!expanded && (
                  <span className={`absolute left-16 md:left-20 ml-1 md:ml-2 px-2 md:px-4 py-2 md:py-3 bg-slate-800 text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg border border-slate-700/50`}>
                    {item.label}
                  </span>
                )}
              </button>
            </div>
          ))}
          <button
            className={`w-full flex items-center p-2 md:p-4 rounded-xl touch-action-none ${
              localActiveLayer === 'sampah'
                ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-600/30'
                : 'hover:bg-blue-800/30 text-slate-300'
            } transition-colors duration-200 group`}
            onClick={() => handleToggleLayer('sampah')}
            aria-label="Pengelolaan Sampah"
          >
            <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl ${
              localActiveLayer === 'sampah' ? 'text-white animate-pulse' : 'text-blue-400'
            }`}>
              <i className="fas fa-trash-alt" />
            </div>
            {expanded && (
              <span className="ml-2 md:ml-3 font-medium text-sm md:text-base">Pengelolaan Sampah</span>
            )}
            {!expanded && (
              <span className={`absolute left-16 md:left-20 ml-1 md:ml-2 px-2 md:px-4 py-2 md:py-3 bg-slate-800 text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 ease-in-out transform group-hover:translate-x-1 whitespace-nowrap z-10 shadow-lg border border-slate-700/50`}>
                Pengelolaan Sampah
              </span>
            )}
          </button>
        </div>
        {expanded && localActiveLayer && (
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl border border-blue-500/30 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <h4 className="text-sm md:text-base font-medium text-blue-200 mb-2 md:mb-3 flex items-center">
              <i className="fas fa-layer-group mr-1 md:mr-2" /> Layer Aktif:
            </h4>
            <div className="flex flex-col gap-2 md:gap-3">
              {localActiveLayer === 'sampah' && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">Lokasi Sampah</span>
                </div>
              )}
              {localActiveLayer === 'jumlah-penduduk' && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">Jumlah Penduduk</span>
                </div>
              )}
              {localActiveLayer === 'indeks-kualitas-udara' && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">Indeks Kualitas Udara</span>
                </div>
              )}
              {localActiveLayer === 'penyakit-zoonosis' && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-800/70 rounded-lg shadow-md hover:shadow-red-500/30 hover:bg-red-700 transition-colors duration-200 cursor-pointer">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full" />
                  <span className="text-sm md:text-base text-white">Penyakit Zoonosis</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {expanded && (
        <div className="p-3 md:p-5 border-t border-slate-700/30 text-sm md:text-base text-slate-400 text-center bg-slate-900/50 shrink-0">
          © {new Date().getFullYear()} BioSecureLand
        </div>
      )}
    </div>
  );
};

export default MapSidebar;