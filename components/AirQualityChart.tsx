import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ChartDataPoint } from '../types';

interface Props {
  data: ChartDataPoint[];
}

export const AirQualityChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        No data to display
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Pollutant Forecast Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              try {
                return new Date(value).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              } catch (e) {
                return value;
              }
            }}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            unit=" µg"
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value: number) => [`${value.toFixed(2)} µg/m³`, 'Concentration']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#667eea" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};