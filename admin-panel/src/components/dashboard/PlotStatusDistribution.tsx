import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PlotStatusDistributionProps {
  data: { name: string; value: number; color: string }[];
}

export const PlotStatusDistribution: React.FC<PlotStatusDistributionProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex flex-col">
      <h3 className="text-base font-serif font-bold text-[#171A18]">Plot Inventory Status</h3>
      <p className="text-xs text-[#171A18]/70 mb-4">Real-time status breakdown across inventory</p>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#0B4F3C', borderRadius: '12px', color: '#171A18', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
