import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'We encountered an error while communicating with the server. Please verify your connection or try again.',
  onRetry,
}) => {
  return (
    <div className="bg-red-50/50 border border-red-200 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto my-6 animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-sm">
        <AlertTriangle className="w-7 h-7 text-red-600" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-serif font-bold text-red-900">{title}</h3>
        <p className="text-xs text-red-700/80 max-w-sm mx-auto leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
