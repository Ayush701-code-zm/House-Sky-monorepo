import React from 'react';

export const StatsCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/15 shadow-sm space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-7 w-36 bg-gray-200 rounded"></div>
          <div className="h-3 w-24 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 bg-[#E8F0EC]/50 border-b border-[#0B4F3C]/15 flex items-center justify-between">
        <div className="h-4 w-40 bg-gray-200 rounded"></div>
        <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={`h-4 bg-gray-200 rounded ${
                  cIdx === 0 ? 'w-1/4' : 'w-1/6'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProjectCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#0B4F3C]/15 p-5 space-y-4 shadow-sm animate-pulse"
        >
          <div className="w-full h-44 bg-gray-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="h-10 bg-gray-100 rounded-lg"></div>
            <div className="h-10 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-44 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-100 rounded"></div>
      </div>
      <div className="h-64 w-full bg-gray-100 rounded-xl flex items-end justify-between p-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-gray-200 rounded-t"
            style={{ height: `${Math.floor(20 + Math.random() * 70)}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};
