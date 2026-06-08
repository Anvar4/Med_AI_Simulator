'use client'

import { api, SupportStats, SupportTicket } from '@/lib/api'
import { useDialog } from '@/lib/dialog-context'
import { useToast } from '@/lib/toast-context'
import {
  CheckCircle2,
  Clock,
  FileText,
  ImageIcon,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: 'Yangi', cls: 'bg-warning/15 text-warning' },
  in_progress: { label: 'Ko\'rib chiqilmoqda', cls: 'bg-primary/15 text-primary' },
  resolved: { label: 'Hal qilingan', cls: 'bg-success/15 text-success' },
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('uz', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminSupportTab() {
  const toast = useToast()
  const dialog = useDialog()
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const loadStats = useCallback(() => {
    api.admin.getSupportStats().then(d => setStats(d.stats)).catch(() => {})
  }, [])
  const loadTickets = useCallback((st: string) => {
    setLoading(true)
    api.admin.getSupportTickets({ status: st || undefined }).then(d => setTickets(d.tickets)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadTickets(filter) }, [filter, loadTickets])

  async function setStatus(id: string, status: 'open' | 'in_progress' | 'resolved') {
    setBusy(id)
    try {
      await api.admin.updateTicketStatus(id, status)
      toast.success('Holat yangilandi')
      loadTickets(filter); loadStats()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik') } finally { setBusy(null) }
  }

  async function sendReply(id: string) {
    if (!replyText.trim()) return
    setBusy(id)
    try {
      const res = await api.admin.replyToTicket(id, replyText.trim())
      toast[res.delivered ? 'success' : 'warning'](res.message)
      setReplyFor(null); setReplyText('')
      loadTickets(filter); loadStats()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik') } finally { setBusy(null) }
  }

  async function removeTicket(id: string) {
    const ok = await dialog.confirm({ title: 'O\'chirish', message: 'Bu murojaatni o\'chirasizmi?', danger: true, confirmText: 'O\'chirish' })
    if (!ok) return
    setBusy(id)
    try { await api.admin.deleteTicket(id); toast.success('O\'chirildi'); loadTickets(filter); loadStats() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik') } finally { setBusy(null) }
  }

  async function openAttachment(ticketId: string, index: number) {
    try {
      const res = await api.admin.getTicketAttachment(ticketId, index)
      window.open(res.url, '_blank', 'noopener,noreferrer')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Faylni ochib bo\'lmadi') }
  }

  const FILTERS = [
    { id: '', label: 'Hammasi' },
    { id: 'open', label: 'Yangi' },
    { id: 'in_progress', label: 'Jarayonda' },
    { id: 'resolved', label: 'Hal qilingan' },
  ]

  return (
    <div className='space-y-5'>
      <h3 className='text-lg font-semibold text-text-primary inline-flex items-center gap-2'>
        <MessageSquare className='w-5 h-5 text-primary' /> Foydalanuvchi murojaatlari
      </h3>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <StatBox icon={Inbox} label='Jami' value={stats?.total ?? 0} cls='text-text-primary' />
        <StatBox icon={Clock} label='Bajarilmagan' value={stats?.pending ?? 0} cls='text-warning' />
        <StatBox icon={MessageSquare} label='Jarayonda' value={stats?.inProgress ?? 0} cls='text-primary' />
        <StatBox icon={CheckCircle2} label='Bajarilgan' value={stats?.resolved ?? 0} cls='text-success' />
      </div>

      {/* Filters */}
      <div className='flex items-center gap-2 flex-wrap'>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.id ? 'bg-primary text-white' : 'bg-surface-light border border-border text-text-secondary hover:text-text-primary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className='flex justify-center py-12'><Loader2 className='w-7 h-7 text-primary animate-spin' /></div>
      ) : tickets.length === 0 ? (
        <p className='text-sm text-text-secondary text-center py-10'>Murojaatlar yo&apos;q.</p>
      ) : (
        <div className='space-y-3'>
          {tickets.map(t => {
            const meta = STATUS_META[t.status]
            const u = t.user
            return (
              <div key={t._id} className='glass border border-border rounded-2xl p-4'>
                <div className='flex items-start justify-between gap-3 mb-2'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-mono text-xs text-text-secondary'>#{t._id.slice(-6)}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
                    <span className='text-[11px] text-text-secondary'>{fmtDate(t.createdAt)}</span>
                  </div>
                  <button onClick={() => removeTicket(t._id)} disabled={busy === t._id} className='text-text-secondary hover:text-accent shrink-0'>
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>

                {/* Requester identity */}
                <div className='flex items-center gap-2 text-sm mb-2'>
                  <UserIcon className='w-4 h-4 text-primary shrink-0' />
                  {u ? (
                    <span className='text-text-primary font-medium'>{u.name}</span>
                  ) : (
                    <span className='text-text-secondary'>{t.telegramName || 'Telegram foydalanuvchi'}</span>
                  )}
                  {t.telegramUsername && (
                    <a href={`https://t.me/${t.telegramUsername}`} target='_blank' rel='noopener noreferrer' className='text-primary text-xs hover:underline'>@{t.telegramUsername}</a>
                  )}
                </div>

                {/* Linked account details (admin can view) */}
                {u && (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary mb-2 pl-6'>
                    <span className='inline-flex items-center gap-1'><Mail className='w-3 h-3' /> {u.email}</span>
                    {u.phone && <span className='inline-flex items-center gap-1'><Phone className='w-3 h-3' /> {u.phone}</span>}
                    {u.isPremium && <span className='text-success'>Pro</span>}
                    <a href={`/admin?tab=users&q=${encodeURIComponent(u.email)}`} className='text-primary hover:underline'>Akkauntni boshqarish →</a>
                  </div>
                )}

                {/* Message */}
                {t.message && <p className='text-sm text-text-primary bg-surface-light/50 rounded-xl px-3 py-2'>{t.message}</p>}

                {/* Attachments (photos / documents from the bot) */}
                {t.attachments && t.attachments.length > 0 && (
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {t.attachments.map((a, i) => (
                      <button key={i} onClick={() => openAttachment(t._id, i)}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20'>
                        {a.type === 'photo' ? <ImageIcon className='w-3.5 h-3.5' /> : <FileText className='w-3.5 h-3.5' />}
                        {a.type === 'photo' ? 'Rasmni ochish' : (a.fileName || 'Faylni ochish')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Replies */}
                {t.replies.length > 0 && (
                  <div className='mt-2 space-y-1.5'>
                    {t.replies.map((r, i) => (
                      <div key={i} className='text-xs bg-primary/5 border border-primary/15 rounded-lg px-3 py-2'>
                        <span className='text-primary font-semibold'>Admin: </span>
                        <span className='text-text-primary'>{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {replyFor === t._id ? (
                  <div className='mt-3 flex items-center gap-2'>
                    <input
                      autoFocus
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendReply(t._id) }}
                      placeholder='Javob yozing...'
                      className='flex-1 bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'
                    />
                    <button onClick={() => sendReply(t._id)} disabled={busy === t._id || !replyText.trim()}
                      className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50'>
                      <Send className='w-4 h-4' /> Yuborish
                    </button>
                    <button onClick={() => { setReplyFor(null); setReplyText('') }} className='text-text-secondary text-sm px-2'>Bekor</button>
                  </div>
                ) : (
                  <div className='mt-3 flex items-center gap-2 flex-wrap'>
                    <button onClick={() => { setReplyFor(t._id); setReplyText('') }}
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20'>
                      <Send className='w-3.5 h-3.5' /> Javob berish
                    </button>
                    {t.status !== 'in_progress' && (
                      <button onClick={() => setStatus(t._id, 'in_progress')} disabled={busy === t._id}
                        className='px-3 py-1.5 rounded-lg bg-surface-light border border-border text-text-secondary text-xs font-medium hover:text-text-primary'>
                        Jarayonga olish
                      </button>
                    )}
                    {t.status !== 'resolved' && (
                      <button onClick={() => setStatus(t._id, 'resolved')} disabled={busy === t._id}
                        className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20'>
                        <CheckCircle2 className='w-3.5 h-3.5' /> Hal qilindi
                      </button>
                    )}
                    {t.status === 'resolved' && (
                      <button onClick={() => setStatus(t._id, 'open')} disabled={busy === t._id}
                        className='px-3 py-1.5 rounded-lg bg-surface-light border border-border text-text-secondary text-xs font-medium hover:text-text-primary'>
                        Qayta ochish
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatBox({ icon: Icon, label, value, cls }: { icon: typeof Inbox; label: string; value: number; cls: string }) {
  return (
    <div className='glass border border-border rounded-2xl p-4'>
      <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-1.5'>
        <Icon className='w-4 h-4' /> {label}
      </div>
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  )
}
