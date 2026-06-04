'use client'

import { AppNotification, api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Bell, Check } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const TYPE_DOT: Record<string, string> = {
  success: 'bg-success', warning: 'bg-warning', error: 'bg-accent', info: 'bg-primary',
}

/** Bell with unread badge + dropdown list of in-app notifications. */
export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    if (!user) return
    api.balance.notifications().then(d => { setItems(d.notifications); setUnread(d.unread) }).catch(() => {})
  }, [user])

  useEffect(() => {
    load()
    const id = setInterval(load, 60000) // poll every minute
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      api.balance.markRead().then(() => setUnread(0)).catch(() => {})
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    }
  }

  if (!user) return null

  return (
    <div ref={ref} className='relative'>
      <button onClick={toggle} className='relative p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-colors' aria-label='Bildirishnomalar'>
        <Bell className='w-5 h-5' />
        {unread > 0 && (
          <span className='absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl glass border border-border shadow-lg z-50 overflow-hidden'>
          <div className='px-4 py-3 border-b border-border flex items-center justify-between'>
            <p className='text-sm font-bold text-text-primary'>Bildirishnomalar</p>
          </div>
          <div className='max-h-96 overflow-y-auto'>
            {items.length === 0 ? (
              <p className='text-sm text-text-secondary text-center py-8'>Bildirishnomalar yo&apos;q</p>
            ) : (
              items.map(n => (
                <div key={n._id} className='px-4 py-3 border-b border-border/50 last:border-0'>
                  <div className='flex items-start gap-2'>
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[n.type] || 'bg-primary'}`} />
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-text-primary'>{n.title}</p>
                      <p className='text-xs text-text-secondary mt-0.5 leading-relaxed'>{n.message}</p>
                      <p className='text-[10px] text-text-secondary/70 mt-1'>{new Date(n.createdAt).toLocaleString('uz')}</p>
                    </div>
                    {n.isRead && <Check className='w-3.5 h-3.5 text-text-secondary/40 shrink-0 mt-1' />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
