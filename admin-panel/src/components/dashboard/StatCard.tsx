import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/15 hover:border-[#0B4F3C]/40 transition-all duration-300 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-serif font-bold text-[#171A18] mt-2 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-[#171A18]/70 mt-1">{subtitle}</p>}
          {trend && (
            <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#0B4F3C] border border-[#0B4F3C]/20">
              {trend}
            </span>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#0B4F3C] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};
