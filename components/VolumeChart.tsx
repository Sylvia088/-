
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Rectangle
} from 'recharts';
import { StockVolumeData } from '../types';

interface VolumeChartProps {
  data: StockVolumeData[];
}

const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="h-[350px] w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">半年內成交量趨勢</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => formatVolume(value)}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              padding: '12px'
            }}
            itemStyle={{ fontWeight: 'bold', color: '#1e40af' }}
            formatter={(value: number) => [value.toLocaleString(), "成交量"]}
          />
          <Bar 
            dataKey="volume" 
            radius={[4, 4, 0, 0]} 
            fill="#3b82f6"
            activeBar={<Rectangle fill="#1d4ed8" stroke="#1e40af" />}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} className="transition-all duration-200 cursor-pointer" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumeChart;
