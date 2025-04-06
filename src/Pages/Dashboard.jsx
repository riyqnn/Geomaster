import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState('East Jakarta');
  const [activeTab, setActiveTab] = useState('SUMMARY');

  const regions = [
    'East Jakarta',
    'North Jakarta',
    'South Jakarta',
    'West Jakarta',
    'Central Jakarta'
  ];

  const tabs = [
    'SUMMARY',
    'LAND COVER',
    'FOREST CHANGE',
    'FIRES',
    'CLIMATE'
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white pt-24">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-6 py-8 z-10">
        {/* Left Section */}
        <div className="space-y-8 z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h1 className="text-4xl font-bold tracking-tight">
            Zoonotic <span className="text-blue-400">Monitoring</span>
            </h1>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2">
              <i className="fas fa-share" />
              {t('dashboard.share')}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-lg mb-4 font-medium">{t('dashboard.selectRegion')}</label>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                {regions.map(region => (
                  <option key={region} value={region} className="bg-gray-800">
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-6 backdrop-blur-sm bg-gray-800/30 p-6 rounded-2xl border border-gray-600/50">
              <p className="text-xl leading-relaxed text-gray-300">
                {t('dashboard.stats', {
                  year: 2023,
                  region: selectedRegion,
                  area: '3.68 Gha',
                  percentage: '28%',
                  loss: '23.9 Mha',
                  emissions: '14.7 Gt'
                })}
              </p>
            </div>
          </div>

          <div className="border-b border-gray-600/50" />

          <div className="flex flex-wrap gap-4 pb-4">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section - Map */}
        <div className="h-[600px] md:h-[800px] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
          <img
            src="https://storage.googleapis.com/a1aa/image/1kNC-dQX078_JbMPlS4r_ey5DM_n_z3RI-CDrwHaTVc.jpg"
            alt="Forest Cover Map"
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-6 py-8 z-10">
        <div className="backdrop-blur-sm bg-gray-800/30 p-8 rounded-2xl border border-gray-600/50 hover:bg-gray-800/50 transition-all duration-300">
          <p className="text-lg leading-relaxed text-gray-300">
            {t('dashboard.exploreText')}
          </p>
        </div>

        <div className="backdrop-blur-sm bg-gray-800/30 p-8 rounded-2xl border border-gray-600/50">
          <h3 className="text-2xl font-bold mb-6">{t('dashboard.primaryLoss')}</h3>
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-400 shadow-glow-blue" />
              <span className="text-gray-300">{t('dashboard.primaryForest')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-pink-400 shadow-glow-pink" />
              <span className="text-gray-300">{t('dashboard.treeLoss')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;