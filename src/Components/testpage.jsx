// File: testpage.jsx
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function TestPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [lng, setLng] = useState(117.0);
  const [lat, setLat] = useState(-2.5);
  const [zoom, setZoom] = useState(4);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [environmentalData, setEnvironmentalData] = useState({
    temperature: 28,
    rainfall: 2500,
    elevation: 500,
    population_density: 200,
    forest_coverage: 40,
  });

  // List of diseases with assigned colors
  const diseases = [
    { name: "Rabies", color: "bg-blue-500" },
    { name: "Leptospirosis", color: "bg-green-500" },
    { name: "Malaria", color: "bg-red-500" },
    { name: "Dengue", color: "bg-orange-500" },
    { name: "Avian Influenza", color: "bg-purple-500" },
    { name: "Anthrax", color: "bg-black" },
    { name: "Japanese Encephalitis", color: "bg-yellow-500" },
    { name: "Chikungunya", color: "bg-pink-500" },
    { name: "Brucellosis", color: "bg-teal-500" },
    { name: "Tuberculosis (zoonotic TB)", color: "bg-indigo-500" },
    { name: "Ebola", color: "bg-red-700" },
    { name: "Zika Virus", color: "bg-orange-300" },
    { name: "COVID-19", color: "bg-gray-500" },
    { name: "Plague (Pes)", color: "bg-rose-500" },
    { name: "Hantavirus", color: "bg-lime-500" },
    { name: "Toxoplasmosis", color: "bg-cyan-500" },
    { name: "Lyme Disease", color: "bg-emerald-500" },
    { name: "Q Fever", color: "bg-amber-500" },
    { name: "Salmonellosis", color: "bg-violet-500" },
    { name: "Campylobacteriosis", color: "bg-fuchsia-500" },
    { name: "Lassa Fever", color: "bg-red-400" },
    { name: "Nipah Virus", color: "bg-purple-700" },
    { name: "Monkeypox", color: "bg-orange-700" },
    { name: "Swine Influenza", color: "bg-blue-300" },
    { name: "Trypanosomiasis (Sleeping Sickness)", color: "bg-green-700" },
    { name: "Leishmaniasis", color: "bg-yellow-300" },
    { name: "Cryptosporidiosis", color: "bg-teal-300" },
    { name: "Taeniasis/Cysticercosis", color: "bg-indigo-300" },
    { name: "Echinococcosis", color: "bg-pink-300" },
    { name: "Psittacosis", color: "bg-gray-300" },
  ];

  // Initialize Leaflet map
  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: zoom,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }),
      ],
    });

    // Update coordinates on map move
    mapInstance.current.on('moveend', () => {
      const center = mapInstance.current.getCenter();
      setLng(center.lng.toFixed(4));
      setLat(center.lat.toFixed(4));
      setZoom(mapInstance.current.getZoom().toFixed(2));
    });

    // Handle map click
    mapInstance.current.on('click', (e) => {
      setSelectedLocation(e.latlng);
      setShowForm(true);

      // Remove previous marker
      if (markerRef.current) {
        mapInstance.current.removeLayer(markerRef.current);
      }

      // Add new marker
      markerRef.current = L.marker(e.latlng, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-3 h-3 bg-red-500 rounded-full"></div>`,
        }),
      }).addTo(mapInstance.current);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, zoom]);

  // Handle environmental data input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEnvironmentalData((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  // Predict disease
  const predictDisease = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      const response = await fetch('http://your-api-url/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          ...environmentalData,
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Error predicting disease:', error);
      alert('Error predicting disease.');
    } finally {
      setLoading(false);
      setShowForm(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar Panel */}
      <div className="w-full md:w-96 p-6 overflow-y-auto bg-white shadow-lg md:shadow-none z-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Zoonosis Disease Prediction
        </h1>
        <p className="text-gray-600 mb-6">
          Click on the map to select a location and predict zoonotic disease risk.
        </p>

        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <p className="text-sm text-gray-700">
            Lon: {lng} | Lat: {lat} | Zoom: {zoom}
          </p>
        </div>

        {selectedLocation && showForm && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Environmental Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Location: {selectedLocation.lng.toFixed(4)}, {selectedLocation.lat.toFixed(4)}
            </p>

            {[
              { label: 'Temperature (°C)', name: 'temperature', step: '0.1' },
              { label: 'Rainfall (mm/year)', name: 'rainfall', step: '100' },
              { label: 'Elevation (m)', name: 'elevation', step: '10' },
              { label: 'Population Density (per km²)', name: 'population_density', step: '10' },
              { label: 'Forest Coverage (%)', name: 'forest_coverage', step: '5', min: '0', max: '100' },
            ].map((field) => (
              <div key={field.name} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  name={field.name}
                  value={environmentalData[field.name]}
                  onChange={handleInputChange}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}

            <div className="flex gap-3 mt-4">
              <button
                onClick={predictDisease}
                disabled={loading}
                className={`flex-1 py-2 rounded-md text-white font-medium ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {loading ? 'Processing...' : 'Predict Disease'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {prediction && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Prediction Result</h2>
            <p className="text-gray-700 mb-2">
              Predicted Disease:{' '}
              <span className="font-bold">{prediction.predicted_disease}</span>
            </p>
            <p className="text-gray-600 text-sm mb-3">
              Coordinates: {prediction.coordinates[0].toFixed(4)},{' '}
              {prediction.coordinates[1].toFixed(4)}
            </p>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Disease Probabilities:</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              {prediction.probabilities.map(([disease, probability]) => (
                <li key={disease}>
                  {disease}: {(probability * 100).toFixed(2)}%
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500 bg-yellow-50 p-3 rounded-md">
              <strong>Note:</strong> This prediction is for reference only and does not replace
              professional medical diagnosis. Consult a healthcare professional for further evaluation.
            </p>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Disease Legend</h3>
          <div className="grid grid-cols-2 gap-2">
            {diseases.map((item) => (
              <div key={item.name} className="flex items-center">
                <span className={`w-4 h-4 ${item.color} rounded-full mr-2`}></span>
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="flex-1 h-64 md:h-full relative z-0" />
    </div>
  );
}

export default TestPage;