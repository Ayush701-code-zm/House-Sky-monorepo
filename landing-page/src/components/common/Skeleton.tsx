import React from 'react';

export const PropertyCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-900/10 p-4 space-y-4 shadow-sm animate-pulse"
        >
          <div className="w-full h-48 bg-emerald-950/10 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-emerald-950/10 rounded"></div>
            <div className="h-3 w-1/2 bg-emerald-950/5 rounded"></div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-emerald-900/5">
            <div className="h-6 w-28 bg-emerald-950/10 rounded"></div>
            <div className="h-8 w-24 bg-emerald-950/10 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
