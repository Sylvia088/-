
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { AnalysisResponse } from '../types';

interface ComparisonChartProps {
  stocks: AnalysisResponse[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ stocks }) => {
  // 合併所有股票的成交量資料到一個適合 Recharts 的格式
  const labels = Array.from(new Set(stocks.flatMap(s => s.data.volumeHistory.map(v => v.label))));
  
  const chartData = labels.map(label => {
    const entry: any = { label };
    stocks.forEach(stock => {
      const volData = stock.data.volumeHistory.find(v => v.label === label);
      entry[stock.data.ticker] = volData ? volData.volume : 0;
    });
    return entry;
  });

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="h-[400px] w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <i className="fas fa-chart-area text-blue-600"></i>
        成交量趨勢比較
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={formatVolume}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [formatVolume(value), "成交量"]}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {stocks.map((stock, idx) => (
            <Line 
              key={stock.data.ticker} 
              type="monotone" 
              dataKey={stock.data.ticker} 
              name={`${stock.data.ticker} (${stock.data.name})`}
              stroke={colors[idx % colors.length]} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
