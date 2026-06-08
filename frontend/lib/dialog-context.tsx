'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface PromptOptions {
  title?: string
  message: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>
  prompt: (opts: PromptOptions | string) => Promise<string | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

type Pending =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; opts: PromptOptions; resolve: (v: string | null) => void }

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const o = typeof opts === 'string' ? { message: opts } : opts
    return new Promise<boolean>(resolve => setPending({ kind: 'confirm', opts: o, resolve }))
  }, [])

  const prompt = useCallback((opts: PromptOptions | string) => {
    const o = typeof opts === 'string' ? { message: opts } : opts
    setInput('')
    return new Promise<string | null>(resolve => setPending({ kind: 'prompt', opts: o, resolve }))
  }, [])

  const close = (value: boolean | string | null) => {
    if (!pending) return
    if (pending.kind === 'confirm') pending.resolve(value as boolean)
    else pending.resolve(value as string | null)
    setPending(null)
  }

  const isPrompt = pending?.kind === 'prompt'
  const danger = pending?.kind === 'confirm' && pending.opts.danger

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className='fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
            onClick={() => close(isPrompt ? null : false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className='glass border border-border rounded-2xl p-5 w-full max-w-sm shadow-xl'
            >
              {pending.opts.title && (
                <div className='flex items-center gap-2 mb-2'>
                  {danger && <AlertTriangle className='w-5 h-5 text-accent' />}
                  <h3 className='font-bold text-text-primary'>{pending.opts.title}</h3>
                </div>
              )}
              <p className='text-sm text-text-secondary'>{pending.opts.message}</p>

              {isPrompt && (
                <input
                  ref={inputRef}
                  autoFocus
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && input.trim()) close(input.trim()) }}
                  placeholder={(pending.opts as PromptOptions).placeholder || ''}
                  className='mt-3 w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'
                />
              )}

              <div className='flex items-center justify-end gap-2 mt-5'>
                <button
                  onClick={() => close(isPrompt ? null : false)}
                  className='px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:text-text-primary'
                >
                  {pending.opts.cancelText || 'Bekor qilish'}
                </button>
                <button
                  onClick={() => close(isPrompt ? (input.trim() || null) : true)}
                  disabled={isPrompt && !input.trim()}
                  className={`px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${danger ? 'bg-accent' : 'bg-primary'}`}
                >
                  {pending.opts.confirmText || 'OK'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  )
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}
