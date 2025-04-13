from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import json
import os
import logging

app = Flask(__name__)
CORS(app)  # Mengizinkan permintaan cross-origin

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path ke file model dan data
MODEL_PATH = 'zoonosis_geo_model.pkl'
GRID_DATA_PATH = 'zoonosis_predictions.geojson'
SAMPLE_DATA_PATH = 'api_sample_data.geojson'

# Load model prediksi
try:
    model = pickle.load(open(MODEL_PATH, 'rb'))
    logger.info("Model berhasil dimuat")
except Exception as e:
    logger.error(f"Error saat memuat model: {e}")
    model = None

def predict_disease_for_location(model, lat, lon, temp, rainfall, elevation, population_density, forest_coverage):
    try:
        # Buat DataFrame dengan nama kolom yang sesuai
        features = pd.DataFrame({
            'latitude': [lat],
            'longitude': [lon],
            'temperature': [temp],
            'rainfall': [rainfall],
            'elevation': [elevation],
            'population_density': [population_density],
            'forest_coverage': [forest_coverage]
        })
        
        # Prediksi penyakit
        predicted_disease = model.predict(features)[0]
        
        # Dapatkan probabilitas
        probabilities = model.predict_proba(features)[0]
        
        # Buat dictionary probabilitas
        disease_probs = {disease: float(prob) for disease, prob in zip(model.classes_, probabilities)}
        
        # Urutkan berdasarkan probabilitas tertinggi
        sorted_probs = sorted(disease_probs.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'predicted_disease': predicted_disease,
            'coordinates': [float(lon), float(lat)],
            'probabilities': sorted_probs[:3]
        }
    except Exception as e:
        logger.error(f"Error di predict_disease_for_location: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Model belum dimuat'}), 500
            
        data = request.get_json()
        
        # Validasi input
        required_fields = ['latitude', 'longitude']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} diperlukan'}), 400
        
        # Ambil data input
        lat = float(data['latitude'])
        lon = float(data['longitude'])
        
        # Parameter opsional dengan nilai default
        temp = float(data.get('temperature', 28))
        rainfall = float(data.get('rainfall', 2500))
        elevation = float(data.get('elevation', 500))
        population_density = float(data.get('population_density', 200))
        forest_coverage = float(data.get('forest_coverage', 40))
        
        # Prediksi
        result = predict_disease_for_location(
            model, lat, lon, temp, rainfall, elevation, 
            population_density, forest_coverage
        )
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error di /predict: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/grid', methods=['GET'])
def get_grid_predictions():
    try:
        if not os.path.exists(GRID_DATA_PATH):
            if os.path.exists(SAMPLE_DATA_PATH):
                with open(SAMPLE_DATA_PATH, 'r') as f:
                    geojson_data = json.load(f)
                logger.info("Menggunakan sample data sebagai fallback")
            else:
                return jsonify({'error': 'Data grid prediksi tidak ditemukan'}), 404
        else:
            with open(GRID_DATA_PATH, 'r') as f:
                geojson_data = json.load(f)
        
        return jsonify(geojson_data)
    except Exception as e:
        logger.error(f"Error di /grid: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/data', methods=['GET'])
def get_sample_data():
    try:
        if not os.path.exists(SAMPLE_DATA_PATH):
            return jsonify({'error': 'Data sampel tidak ditemukan'}), 404
            
        with open(SAMPLE_DATA_PATH, 'r') as f:
            sample_data = json.load(f)
            
        return jsonify(sample_data)
    except Exception as e:
        logger.error(f"Error di /data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_location', methods=['POST'])
def add_location():
    try:
        if model is None:
            return jsonify({'error': 'Model belum dimuat'}), 500
            
        data = request.get_json()
        
        # Validasi input
        required_fields = ['latitude', 'longitude', 'disease', 'temperature', 
                          'rainfall', 'elevation', 'population_density', 'forest_coverage']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} diperlukan'}), 400
        
        # Persiapkan data baru
        new_location = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [float(data['longitude']), float(data['latitude'])]
            },
            'properties': {
                'actual_disease': data['disease'],
                'temperature': float(data['temperature']),
                'rainfall': float(data['rainfall']),
                'elevation': float(data['elevation']),
                'population_density': float(data['population_density']),
                'forest_coverage': float(data['forest_coverage'])
            }
        }
        
        # Tambahkan prediksi
        prediction = predict_disease_for_location(
            model,
            float(data['latitude']), float(data['longitude']),
            float(data['temperature']), float(data['rainfall']),
            float(data['elevation']), float(data['population_density']),
            float(data['forest_coverage'])
        )
        
        new_location['properties']['predicted_disease'] = prediction['predicted_disease']
        new_location['properties']['probabilities'] = dict(prediction['probabilities'])
        
        # Baca data sampel yang ada
        if os.path.exists(SAMPLE_DATA_PATH):
            with open(SAMPLE_DATA_PATH, 'r') as f:
                sample_data = json.load(f)
                
            # Tambahkan lokasi baru
            sample_data['features'].append(new_location)
            
            # Simpan kembali data
            with open(SAMPLE_DATA_PATH, 'w') as f:
                json.dump(sample_data, f)
                
            return jsonify({'status': 'success', 'message': 'Lokasi berhasil ditambahkan'})
        else:
            # Buat file baru jika belum ada
            new_data = {
                'type': 'FeatureCollection',
                'features': [new_location]
            }
            
            with open(SAMPLE_DATA_PATH, 'w') as f:
                json.dump(new_data, f)
                
            return jsonify({'status': 'success', 'message': 'File data sampel baru dibuat'})
    except Exception as e:
        logger.error(f"Error di /add_location: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)