import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: { month: string; revenue: number; sales: number }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-serif font-bold text-[#171A18]">Revenue & Sales Trend</h3>
          <p className="text-xs text-[#171A18]/70">Monthly revenue growth across all real estate projects</p>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0B4F3C" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#0B4F3C" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#0B4F3C" strokeOpacity={0.1} />
            <XAxis dataKey="month" stroke="#171A18" fontSize={12} opacity={0.7} />
            <YAxis stroke="#171A18" fontSize={12} opacity={0.7} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#0B4F3C', borderRadius: '12px', color: '#171A18', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#0B4F3C" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
