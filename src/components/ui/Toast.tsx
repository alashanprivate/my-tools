import { useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ToastContext, type ToastType } from './useToast'

interface Toast {
  id: string
  message: string
  type: ToastType
}

const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'min-w-[300px] max-w-md rounded-md p-4 shadow-lg',
              'animate-in slide-in-from-right',
              {
                'bg-destructive text-destructive-foreground': toast.type === 'error',
                'bg-green-600 text-white': toast.type === 'success',
                'bg-primary text-primary-foreground': toast.type === 'info',
              }
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export { ToastProvider }
