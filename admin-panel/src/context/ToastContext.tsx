import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let idSeq = 1;

const STYLES: Record<ToastType, { icon: React.ReactNode; ring: string }> = {
  success: { icon: <CheckCircle2 className="w-5 h-5 text-[#0B4F3C]" />, ring: 'border-[#0B4F3C]/30 bg-white' },
  error: { icon: <XCircle className="w-5 h-5 text-red-600" />, ring: 'border-red-300 bg-white' },
  info: { icon: <Info className="w-5 h-5 text-[#0B4F3C]" />, ring: 'border-[#0B4F3C]/30 bg-white' }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = idSeq++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const value: ToastContextType = {
    showToast,
    success: (m) => showToast(m, 'success'),
    error: (m) => showToast(m, 'error'),
    info: (m) => showToast(m, 'info')
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border ${STYLES[t.type].ring} shadow-xl animate-in slide-in-from-right-4 fade-in duration-200`}
          >
            <div className="flex-shrink-0 mt-0.5">{STYLES[t.type].icon}</div>
            <p className="flex-1 text-xs text-[#171A18] font-bold leading-relaxed">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-[#171A18]/50 hover:text-[#171A18]">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
