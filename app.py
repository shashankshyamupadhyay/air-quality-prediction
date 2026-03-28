from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timedelta
import random
import math

# Attempt to import ML libraries, but continue gracefully if they fail (e.g., Python 3.14)
try:
    import numpy as np
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("INFO: TensorFlow/NumPy not available. Running in Lightweight Simulation Mode.")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None
MODEL_FILENAME = "air_quality_model (2).h5"

@app.on_event("startup")
async def startup_event():
    global model
    print(f"INFO: Server starting up at {datetime.now()}")
    
    if not TF_AVAILABLE:
        print("INFO: Running in Lightweight Simulation Mode (No ML libraries detected).")
        return

    try:
        if os.path.exists(MODEL_FILENAME):
            model = tf.keras.models.load_model(MODEL_FILENAME)
            print(f"SUCCESS: Loaded {MODEL_FILENAME}")
        else:
            print(f"WARNING: {MODEL_FILENAME} not found. Server will run in SIMULATION MODE.")
    except Exception as e:
        print(f"ERROR: Failed to load model: {e}")

@app.get("/health")
def health_check():
    """Endpoint for frontend to check if backend is online"""
    return {
        "status": "active",
        "model_loaded": model is not None,
        "mode": "lightweight" if not TF_AVAILABLE else "tensorflow",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

def simulate_data(start_value, steps):
    """
    Pure Python simulation (No NumPy required) 
    Generates realistic looking air quality curves using math functions.
    """
    data = []
    val = start_value
    
    # Simple day/night cycle simulation
    now_hour = datetime.now().hour
    
    for i in range(steps):
        # Create a synthetic daily curve (peaks at 9am and 7pm)
        current_hour = (now_hour + i) % 24
        morning_peak = 15 * math.exp(-((current_hour - 9) ** 2) / 8)
        evening_peak = 20 * math.exp(-((current_hour - 19) ** 2) / 8)
        base_pollution = 40
        
        # Mean reversion trend
        target = base_pollution + morning_peak + evening_peak
        
        # Random walk
        drift = (target - val) * 0.2
        noise = random.gauss(0, 3)
        val = val + drift + noise
        
        data.append(max(5.0, round(val, 1)))
        
    return data

@app.post("/predict/simple")
def predict(current_value: float, hours_ahead: int):
    timestamps = []
    predictions = []
    now = datetime.now()

    for i in range(hours_ahead):
        t = now + timedelta(hours=i+1)
        timestamps.append(t.isoformat())

    # Use TF only if available AND model is loaded
    if TF_AVAILABLE and model:
        try:
            # TF Inference logic
            input_sequence = np.array([current_value] * 24).reshape(1, 24, 1)
            predicted_val = float(model.predict(input_sequence, verbose=0)[0][0])
            # Extrapolate
            predictions = [predicted_val * (0.95 ** i) for i in range(hours_ahead)]
            mode = "tensorflow_model"
        except Exception as e:
            print(f"Inference Error: {e}. Using simulation.")
            mode = "simulation_fallback"
            predictions = simulate_data(current_value, hours_ahead)
    else:
        # Pure Python Simulation
        mode = "simulation_lightweight"
        predictions = simulate_data(current_value, hours_ahead)

    return {
        "current_value": current_value,
        "predictions": predictions,
        "timestamps": timestamps,
        "unit": "µg/m³",
        "pollutant": "CO", 
        "mode": mode,
        "note": "Prediction generated successfully"
    }