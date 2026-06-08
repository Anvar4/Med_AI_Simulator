'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, Info, X, XCircle } from 'lucide-react'
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const STYLES: Record<ToastType, { icon: typeof Check; cls: string }> = {
  success: { icon: Check, cls: 'border-success/40 text-success' },
  error: { icon: XCircle, cls: 'border-accent/40 text-accent' },
  warning: { icon: AlertTriangle, cls: 'border-warning/40 text-warning' },
  info: { icon: Info, cls: 'border-primary/40 text-primary' },
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, type, message }])
    // Auto-dismiss after 4s (errors linger a touch longer).
    const ttl = type === 'error' ? 6000 : 4000
    setTimeout(() => remove(id), ttl)
  }, [remove])

  const value: ToastContextValue = {
    toast,
    success: useCallback((m: string) => toast(m, 'success'), [toast]),
    error: useCallback((m: string) => toast(m, 'error'), [toast]),
    info: useCallback((m: string) => toast(m, 'info'), [toast]),
    warning: useCallback((m: string) => toast(m, 'warning'), [toast]),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className='fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[92vw] sm:max-w-sm'>
        <AnimatePresence>
          {toasts.map(t => {
            const meta = STYLES[t.type]
            const Icon = meta.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                className={`glass border ${meta.cls} rounded-xl shadow-lg px-4 py-3 flex items-start gap-3`}
              >
                <Icon className='w-5 h-5 shrink-0 mt-0.5' />
                <p className='text-sm text-text-primary flex-1 leading-relaxed'>{t.message}</p>
                <button onClick={() => remove(t.id)} className='text-text-secondary hover:text-text-primary shrink-0'>
                  <X className='w-4 h-4' />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
