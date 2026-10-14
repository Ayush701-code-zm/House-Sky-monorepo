'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 bg-bg-surface border border-gold-300/30 text-white-100 shadow-2xl rounded-none transition-all duration-200 animate-in slide-in-from-bottom-5',
              t.type === 'error' && 'border-error/60',
              t.type === 'success' && 'border-success/60'
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-gold-300 shrink-0 mt-0.5" />}

            <p className="text-sm font-inter text-white-100 flex-1 leading-snug">{t.message}</p>

            <button
              onClick={() => removeToast(t.id)}
              className="text-white-400 hover:text-white-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
