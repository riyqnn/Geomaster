import { useState, useEffect } from 'react';
import JakartaMap from '../Components/JakartaMap';

function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState('East Jakarta');
  const [activeTab, setActiveTab] = useState('SUMMARY');
  const [mapLoaded, setMapLoaded] = useState(false);

  const regions = [
    'East Jakarta',
    'North Jakarta',
    'South Jakarta',
    'West Jakarta',
    'Central Jakarta'
  ];

  const tabs = [
    'SUMMARY',
    'Zoonotic Diseases',
    'Animal Population',
    'Human Behavior',
    'Air Quality Index',
    'Waste Management'
  ];

  // Load leaflet CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
    
    // Set map as loaded after a short delay to ensure everything is ready
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 500);
    
    return () => {
      document.head.removeChild(link);
      clearTimeout(timer);
    };
  }, []);

  // Example data for different tabs
  const tabData = {
    'SUMMARY': {
      chartTitle: 'Environmental Health Overview',
      description: 'Comprehensive overview of key environmental indicators affecting health outcomes in Jakarta regions',
      stats: [
        { label: 'Risk Level', value: 'Moderate', color: 'bg-yellow-500' },
        { label: 'Air Quality Index', value: '110', color: 'bg-orange-500' },
        { label: 'Disease Incidents', value: '24', color: 'bg-red-500' },
        { label: 'Waste Management Score', value: '72/100', color: 'bg-green-500' }
      ]
    },
    'Zoonotic Diseases': {
      chartTitle: 'Zoonotic Disease Distribution',
      description: 'Tracking of disease outbreaks with animal origins across Jakarta regions',
      stats: [
        { label: 'Dengue Cases', value: '127', color: 'bg-red-500' },
        { label: 'Leptospirosis', value: '32', color: 'bg-orange-500' },
        { label: 'Rabies Alerts', value: '5', color: 'bg-yellow-500' },
        { label: 'Bird Flu Risk', value: 'Low', color: 'bg-green-500' }
      ]
    },
    'Animal Population': {
      chartTitle: 'Urban Wildlife Population Trends',
      description: 'Monitoring of urban wildlife populations and their distribution',
      stats: [
        { label: 'Stray Dogs', value: '~2,450', color: 'bg-blue-500' },
        { label: 'Urban Rats', value: 'High', color: 'bg-red-500' },
        { label: 'Bats', value: '~5,200', color: 'bg-purple-500' },
        { label: 'Bird Species', value: '48', color: 'bg-green-500' }
      ]
    },
    'Human Behavior': {
      chartTitle: 'Community Health Practices',
      description: 'Analysis of human behaviors impacting environmental health outcomes',
      stats: [
        { label: 'Waste Sorting', value: '42%', color: 'bg-yellow-500' },
        { label: 'Clean Water Usage', value: '87%', color: 'bg-blue-500' },
        { label: 'Vaccination Rate', value: '76%', color: 'bg-green-500' },
        { label: 'Pest Control', value: '61%', color: 'bg-orange-500' }
      ]
    },
    'Air Quality Index': {
      chartTitle: 'Air Quality Measurements',
      description: 'Real-time air quality monitoring across Jakarta regions',
      stats: [
        { label: 'PM2.5', value: '35.8 μg/m³', color: 'bg-orange-500' },
        { label: 'PM10', value: '57.2 μg/m³', color: 'bg-orange-500' },
        { label: 'Ozone', value: '42 ppb', color: 'bg-yellow-500' },
        { label: 'NO₂', value: '28 ppb', color: 'bg-yellow-500' }
      ]
    },
    'Waste Management': {
      chartTitle: 'Waste Collection & Processing',
      description: 'Overview of waste management efficiency and recycling rates',
      stats: [
        { label: 'Collection Rate', value: '83%', color: 'bg-green-500' },
        { label: 'Recycling', value: '24%', color: 'bg-yellow-500' },
        { label: 'Organic Waste', value: '56%', color: 'bg-blue-500' },
        { label: 'Hazardous Waste', value: '3.2%', color: 'bg-red-500' }
      ]
    }
  };

  const renderChart = () => {
    // Placeholder for actual chart component
    return (
      <div className="h-64 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl flex items-center justify-center border border-gray-700">
        <div className="text-center">
          <div className="text-lg text-gray-400">Chart visualization for</div>
          <div className="text-2xl font-semibold text-white mt-2">{tabData[activeTab].chartTitle}</div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-gray-800/40 backdrop-blur-md rounded-xl border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-3">{tabData[activeTab].chartTitle}</h2>
          <p className="text-gray-300">{tabData[activeTab].description}</p>
        </div>

        {renderChart()}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tabData[activeTab].stats.map((stat, index) => (
            <div key={index} className="bg-gray-800/40 backdrop-blur-md p-4 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <div className="text-xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white pt-25">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Zoonotic <span className="text-blue-400">Monitoring</span>
            </h1>
            <p className="text-gray-400 mt-1">Real-time monitoring and analysis dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Live Data
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Main layout - two column on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - controls and tabs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Region selector */}
            <div className="bg-gray-800/40 backdrop-blur-md p-5 rounded-xl border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Region</label>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                {regions.map(region => (
                  <option key={region} value={region} className="bg-gray-800">
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation tabs - vertical on larger screens */}
            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-gray-700/50 p-5">
              <h3 className="text-lg font-medium text-gray-300 mb-4">Data Categories</h3>
              <div className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center ${
                      activeTab === tab 
                        ? 'bg-blue-600/80 text-white' 
                        : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-3 ${activeTab === tab ? 'bg-white' : 'bg-gray-500'}`}></span>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-md p-5 rounded-xl border border-blue-700/30">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">About This Dashboard</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                This dashboard provides real-time monitoring of environmental health factors across Jakarta's regions. 
                Data is updated hourly from our network of IoT sensors and community reports.
              </p>
            </div>
          </div>

          {/* Right column - main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active tab content */}
            {renderContent()}

            {/* Interactive Map - Replaced placeholder with actual map */}
           {/* Interactive Map - Modernized look and feel */}
<div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md p-5 rounded-xl border border-gray-700/50 shadow-lg">
  <div className="flex justify-between items-center mb-4">
    <div>
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
        Environmental Risk Map
      </h2>
      <p className="text-sm text-gray-400">Real-time monitoring data visualization</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm backdrop-blur-md flex items-center">
        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
        {selectedRegion}
      </div>
      <button className="bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/50 p-2 rounded-lg transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>
      <button className="bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/50 p-2 rounded-lg transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
  
  <div className="relative h-96 bg-gray-700/20 rounded-lg overflow-hidden border border-gray-600/30 shadow-inner">
    <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/40 flex items-center gap-2">
      <div className="flex items-center">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
        <span className="text-xs text-gray-300">High Risk</span>
      </div>
      <div className="w-px h-4 bg-gray-600"></div>
      <div className="flex items-center">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
        <span className="text-xs text-gray-300">Medium Risk</span>
      </div>
      <div className="w-px h-4 bg-gray-600"></div>
      <div className="flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        <span className="text-xs text-gray-300">Low Risk</span>
      </div>
    </div>
    
    <div className="absolute inset-0">
      <JakartaMap selectedRegion={selectedRegion} />
    </div>
    
    {/* Map overlay statistics */}
    <div className="absolute bottom-3 right-3 flex gap-2">
      <div className="bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/40">
        <div className="text-xs text-gray-400">Monitoring Stations</div>
        <div className="text-lg font-semibold text-white">24</div>
      </div>
      <div className="bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/40">
        <div className="text-xs text-gray-400">Average AQI</div>
        <div className="text-lg font-semibold text-yellow-400">112</div>
      </div>
    </div>
  </div>
  
  {/* Metrics below map */}
  <div className="grid grid-cols-4 gap-2 mt-3">
    <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">Risk Level</div>
        <div className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Medium</div>
      </div>
      <div className="text-sm font-medium mt-1">60% of area affected</div>
    </div>
    <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">Cases Today</div>
        <div className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">+12</div>
      </div>
      <div className="text-sm font-medium mt-1">37 total this week</div>
    </div>
    <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">Population</div>
        <div className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">3.2M</div>
      </div>
      <div className="text-sm font-medium mt-1">1.4M in risk zones</div>
    </div>
    <div className="bg-gray-800/30 backdrop-blur-sm p-2 rounded-lg border border-gray-700/30">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">Prevention Index</div>
        <div className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Good</div>
      </div>
      <div className="text-sm font-medium mt-1">78% effectiveness</div>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;