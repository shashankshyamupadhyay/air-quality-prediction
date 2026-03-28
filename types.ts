export interface PredictionResponse {
  current_value: number;
  predictions: number[];
  timestamps: string[];
  unit: string;
  pollutant: string;
  mode: string;
  note: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  version: string;
  timestamp: string;
}

export enum PollutantType {
  CO = "CO",
  PM25 = "PM2.5",
  PM10 = "PM10",
  NO2 = "NO2",
  SO2 = "SO2",
  O3 = "O3"
}

export interface ChartDataPoint {
  time: string;
  value: number;
}