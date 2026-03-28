import { HealthResponse, PredictionResponse, PollutantType } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Mock generator for offline/demo mode
const generateMockPrediction = (currentValue: number, hoursAhead: number, pollutant: string): PredictionResponse => {
  const predictions: number[] = [];
  const timestamps: string[] = [];
  const now = new Date();
  
  // Simulate realistic air quality patterns
  for (let i = 0; i < hoursAhead; i++) {
    const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
    timestamps.push(time.toISOString());
    
    const hour = time.getHours();
    // Daily cycle: peaks in morning (8-9am) and evening (6-7pm)
    const morningPeak = Math.exp(-Math.pow(hour - 9, 2) / 8) * 15;
    const eveningPeak = Math.exp(-Math.pow(hour - 19, 2) / 8) * 20;
    const dailyPattern = morningPeak + eveningPeak;
    
    // Random variations
    const noise = (Math.random() - 0.5) * 5;
    
    // Decay from current value towards a mean (50) over time
    const decayFactor = Math.pow(0.95, i);
    const meanValue = 50;
    
    let val = (currentValue - meanValue) * decayFactor + meanValue + dailyPattern + noise;
    
    // Ensure positive values
    predictions.push(Math.max(5, val));
  }

  return {
    current_value: currentValue,
    predictions,
    timestamps,
    unit: "µg/m³",
    pollutant,
    mode: "simulation",
    note: "Backend unreachable. Using client-side simulation for demo."
  };
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return false;
    const data: HealthResponse = await response.json();
    return data.model_loaded;
  } catch (error) {
    return false;
  }
};

export const getPrediction = async (
  currentValue: number,
  hoursAhead: number,
  pollutant: PollutantType
): Promise<PredictionResponse> => {
  try {
    const url = new URL(`${API_BASE_URL}/predict/simple`);
    url.searchParams.append('current_value', currentValue.toString());
    url.searchParams.append('hours_ahead', hoursAhead.toString());
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('API Error');
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend API unreachable, switching to simulation mode.", error);
    return generateMockPrediction(currentValue, hoursAhead, pollutant);
  }
};