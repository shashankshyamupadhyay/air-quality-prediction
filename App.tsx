import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Wind, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  Loader2,
  Terminal,
  Cpu
} from 'lucide-react';
import { checkHealth, getPrediction } from './services/api';
import { getHealthAdvice } from './services/geminiService';
import { AirQualityChart } from './components/AirQualityChart';
import { ChartDataPoint, PollutantType } from './types';

const App: React.FC = () => {
  // Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('--:--');
  const [connectionError, setConnectionError] = useState<string>('');
  
  // Inputs
  const [currentValue, setCurrentValue] = useState<number>(50);
  const [hoursAhead, setHoursAhead] = useState<number>(24);
  const [pollutant, setPollutant] = useState<PollutantType>(PollutantType.CO);
  
  // Outputs
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [predictionMode, setPredictionMode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Gemini State
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Initialize & Polling Logic
  useEffect(() => {
    refreshConnectionStatus();
    const intervalTime = isConnected ? 60000 : 10000; // Poll every 10s if disconnected
    const interval = setInterval(() => refreshConnectionStatus(false), intervalTime);
    return () => clearInterval(interval);
  }, [isConnected]);

  const refreshConnectionStatus = async (showLoading = true) => {
    if (showLoading) setIsChecking(true);
    
    const status = await checkHealth();
    setIsConnected(status.online);
    setIsModelLoaded(status.modelLoaded);
    setConnectionError(status.error || '');
    setLastUpdated(new Date().toLocaleTimeString());
    
    if (showLoading) setIsChecking(false);
  };

  const stats = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0 };
    const values = chartData.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  }, [chartData]);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setAiAdvice('');

    try {
      const data = await getPrediction(currentValue, hoursAhead, pollutant);
      
      setPredictionMode(data.mode);
      setLastUpdated(new Date().toLocaleTimeString());

      // If response was successful, we know we are connected
      if (data.mode !== 'client_simulation') {
        setIsConnected(true);
        // If mode is 'tensorflow_model', model is loaded. 
        // If 'simulation' (from backend), model is not loaded.
        setIsModelLoaded(data.mode === 'tensorflow_model');
      } else {
        setIsConnected(false);
      }

      const transformedData: ChartDataPoint[] = data.timestamps.map((ts, index) => ({
        time: ts,
        value: data.predictions[index]
      }));

      setChartData(transformedData);

      setAiLoading(true);
      const advice = await getHealthAdvice(
        transformedData.reduce((acc, curr) => acc + curr.value, 0) / transformedData.length,
        pollutant,
        Math.max(...data.predictions)
      );
      setAiAdvice(advice);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate predictions");
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return "text-red-500"; // Offline
    if (isModelLoaded) return "text-green-500"; // Online & Model Ready
    return "text-green-600"; // Online & Simulation Mode (Now considered healthy/Green)
  };

  const getStatusText = () => {
    if (isChecking) return "Checking...";
    if (!isConnected) return "Offline";
    if (isModelLoaded) return "Online (ML Active)";
    return "Online (Lightweight)";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary h-64 w-full absolute top-0 left-0 z-0"></div>

      <div className="relative z-10 container mx-auto px-4 pt-10 max-w-6xl">
        <div className="text-center text-white mb-10">
          <h1 className="text-4xl font-bold mb-2 flex justify-center items-center gap-3">
            <Wind className="w-10 h-10" />
            Air Quality Prediction System
          </h1>
          <p className="opacity-90 text-lg">Deep Learning powered forecasting with Gemini AI Insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Activity className="text-primary" />}
            title="Current Input"
            value={`${currentValue}`}
            unit="µg/m³"
            status="Manual Input"
          />
           <StatCard 
            icon={isModelLoaded ? <Cpu className="text-success" /> : <CheckCircle2 className="text-success" />}
            title="Algorithm"
            value={isModelLoaded ? "LSTM-CNN" : "Simulation"}
            unit={isConnected ? "Server-side" : "Client-side"}
            status={isModelLoaded ? "Deep Learning" : "Math Model"}
          />
           <div onClick={() => refreshConnectionStatus(true)} className="cursor-pointer group">
             <StatCard 
              icon={
                isChecking ? <Loader2 className="animate-spin text-blue-500" /> :
                !isConnected ? <WifiOff className="text-red-500" /> :
                <Wifi className={getStatusColor()} />
              }
              title="Server Status"
              value={isConnected ? "Connected" : "Disconnected"}
              unit={isConnected ? "127.0.0.1:8000" : "Unreachable"}
              status={getStatusText()}
            />
           </div>
           <StatCard 
            icon={<RefreshCw className="text-blue-500" />}
            title="Last Updated"
            value={lastUpdated}
            unit="Local Time"
            status="Auto-sync"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Configuration
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Current Value (µg/m³)</label>
                  <input 
                    type="number" 
                    value={currentValue}
                    onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Pollutant</label>
                  <select 
                    value={pollutant}
                    onChange={(e) => setPollutant(e.target.value as PollutantType)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                  >
                    {Object.values(PollutantType).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Forecast Horizon</label>
                  <select 
                    value={hoursAhead}
                    onChange={(e) => setHoursAhead(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                  >
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="48">2 Days</option>
                    <option value="168">1 Week</option>
                  </select>
                </div>

                <button 
                  onClick={handlePredict}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-md transition-all transform hover:-translate-y-1 active:translate-y-0
                    ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:shadow-primary/40'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Processing...
                    </span>
                  ) : (
                    "Generate Prediction"
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Gemini Health Advisor
              </h2>
              
              {aiLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              ) : aiAdvice ? (
                <div className="prose prose-sm prose-indigo">
                  <p className="whitespace-pre-line text-slate-600 leading-relaxed">
                    {aiAdvice}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm italic">
                  Run a prediction to receive personalized AI health recommendations based on air quality trends.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Case: Disconnected (Red) */}
            {!isConnected && (
              <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3">
                   <WifiOff className="w-5 h-5 shrink-0 text-red-600" />
                   <div className="flex-1">
                      <p className="text-red-800 font-semibold text-sm">Backend Disconnected</p>
                      <p className="text-red-700 text-xs mt-0.5">
                        {connectionError ? `Error: ${connectionError}` : "Ensure server is running on port 8000."}
                      </p>
                   </div>
                   <button 
                    onClick={() => refreshConnectionStatus(true)}
                    className="px-3 py-1.5 bg-white border border-red-300 rounded-md text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
                  >
                    Retry
                  </button>
                </div>
                <div className="bg-red-100/50 px-4 py-2 border-t border-red-200 flex items-center gap-2 text-xs text-red-800 font-mono">
                  <Terminal className="w-3 h-3" />
                  <span>Run: uvicorn app:app --reload --port 8000</span>
                </div>
              </div>
            )}

            {/* Case: Connected but No TF (Green/Success now, because this is intentional) */}
            {isConnected && !isModelLoaded && (
               <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold text-sm">Server Running in Lightweight Mode</p>
                    <p className="text-green-700 text-xs mt-0.5">
                      Python 3.14 detected. Using mathematical modeling instead of TensorFlow.
                    </p>
                  </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <AirQualityChart data={chartData} />

            {chartData.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Forecast Average</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.avg.toFixed(1)} <span className="text-xs text-slate-400">µg/m³</span></p>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Predicted Peak</p>
                    <p className="text-2xl font-bold text-red-500">{stats.max.toFixed(1)} <span className="text-xs text-slate-400">µg/m³</span></p>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Forecast Low</p>
                    <p className="text-2xl font-bold text-green-500">{stats.min.toFixed(1)} <span className="text-xs text-slate-400">µg/m³</span></p>
                 </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Hourly Breakdown</h3>
              {chartData.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {chartData.slice(0, 12).map((pt, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg text-center hover:bg-slate-100 transition-colors">
                      <p className="text-xs text-slate-500 mb-1">{new Date(pt.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p className="font-bold text-primary">{pt.value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                 <p className="text-center text-slate-400 py-8">No forecast data available.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>Created by Shashank Upadhyay (A023167024145) | 4DS3-X</p>
          <p className="mt-1">Powered by FastAPI, TensorFlow & React</p>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Top Stats
const StatCard: React.FC<{icon: React.ReactNode, title: string, value: string, unit: string, status?: string}> = ({ icon, title, value, unit, status }) => (
  <div className="bg-white rounded-xl p-5 shadow-lg border-b-4 border-primary transition-transform hover:-translate-y-1">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      {status && <span className={`text-xs font-bold px-2 py-1 rounded-full ${
        status.includes('Checking') ? 'bg-slate-100 text-slate-600' :
        status.includes('Offline') ? 'bg-red-100 text-red-700' : 
        status.includes('ML Active') ? 'bg-green-100 text-green-700' :
        status.includes('Lightweight') ? 'bg-green-100 text-green-700' : // Green for lightweight now too
        'bg-blue-100 text-blue-700' 
      }`}>{status}</span>}
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  </div>
);

export default App;