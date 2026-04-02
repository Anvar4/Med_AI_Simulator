'use client'

import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME = 'Assalomu alaykum! Sizga qanday yordam bera olaman?'

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show for all logged-in users
  const canSee = !!user

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!canSee) return null

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const updated: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await api.chat.send(updated.filter(m => m.role !== 'assistant' || m.content !== WELCOME).concat())
      setMessages([...updated, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className='fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors'
            aria-label='Chatni ochish'
          >
            <MessageCircle className='w-6 h-6 text-secondary' />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='fixed bottom-6 right-6 z-50 w-90 max-w-[calc(100vw-1.5rem)] h-130 max-h-[calc(100vh-2rem)] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden'
          >
            {/* Header */}
            <div className='flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0'>
              <div className='w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center'>
                <MessageCircle className='w-4 h-4 text-primary' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-text-primary leading-tight'>Med AI Yordam</p>
                <p className='text-xs text-primary'>Tibbiy maslahat</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            {/* Messages */}
            <div className='flex-1 overflow-y-auto p-4 space-y-3'>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-secondary rounded-br-sm'
                        : 'bg-surface-light text-text-primary rounded-bl-sm border border-border'
                    }`}
                  >
                    {msg.role === 'user' ? msg.content : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className='mb-1 last:mb-0'>{children}</p>,
                          ul: ({ children }) => <ul className='list-disc pl-4 space-y-0.5 my-1'>{children}</ul>,
                          ol: ({ children }) => <ol className='list-decimal pl-4 space-y-0.5 my-1'>{children}</ol>,
                          li: ({ children }) => <li className='text-sm'>{children}</li>,
                          strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
                          em: ({ children }) => <em className='italic'>{children}</em>,
                          h1: ({ children }) => <h1 className='text-base font-bold mt-2 mb-1'>{children}</h1>,
                          h2: ({ children }) => <h2 className='text-sm font-bold mt-2 mb-1'>{children}</h2>,
                          h3: ({ children }) => <h3 className='text-sm font-semibold mt-1.5 mb-0.5'>{children}</h3>,
                          code: ({ children }) => <code className='bg-black/10 rounded px-1 text-xs font-mono'>{children}</code>,
                          blockquote: ({ children }) => <blockquote className='border-l-2 border-primary/40 pl-2 italic opacity-80 my-1'>{children}</blockquote>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className='flex justify-start'>
                  <div className='bg-surface-light border border-border rounded-2xl rounded-bl-sm px-4 py-3'>
                    <div className='flex gap-1'>
                      <span className='w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0ms]' />
                      <span className='w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:150ms]' />
                      <span className='w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:300ms]' />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className='px-4 py-3 border-t border-border shrink-0'>
              <form
                onSubmit={e => { e.preventDefault(); send() }}
                className='flex gap-2 items-center'
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder='Savol yozing...'
                  disabled={loading}
                  className='flex-1 bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50'
                />
                <button
                  type='submit'
                  disabled={loading || !input.trim()}
                  className='w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0'
                >
                  <Send className='w-4 h-4 text-secondary' />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
