'use client'

import { AdminTopUp, api } from '@/lib/api'
import { Check, ExternalLink, Wallet, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

function receiptHref(url: string): string {
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`
}

export default function AdminTopUpsTab() {
  const [topups, setTopups] = useState<AdminTopUp[]>([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback((st: string) => {
    setLoading(true)
    api.paymentAdmin.listTopUps(st || undefined).then(d => setTopups(d.topups)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load(status) }, [status, load])

  async function approve(id: string) {
    setBusy(id)
    try { await api.paymentAdmin.approveTopUp(id); load(status) } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik') } finally { setBusy(null) }
  }
  async function reject(id: string) {
    const reason = prompt('Rad etish sababini yozing:')
    if (!reason) return
    setBusy(id)
    try { await api.paymentAdmin.rejectTopUp(id, reason); load(status) } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik') } finally { setBusy(null) }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 flex-wrap'>
        <h3 className='text-lg font-semibold text-text-primary inline-flex items-center gap-2'><Wallet className='w-5 h-5 text-primary' /> Balans arizalari</h3>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className='ml-auto bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary'>
          <option value='pending'>Kutilmoqda</option>
          <option value='approved'>Tasdiqlangan</option>
          <option value='rejected'>Rad etilgan</option>
          <option value=''>Barchasi</option>
        </select>
      </div>

      {loading ? <p className='text-sm text-text-secondary py-6 text-center'>Yuklanmoqda...</p>
        : topups.length === 0 ? <p className='text-sm text-text-secondary py-6 text-center'>Ariza yo&apos;q.</p>
          : (
            <div className='space-y-2'>
              {topups.map(t => {
                const u = typeof t.user === 'string' ? null : t.user
                const c = typeof t.card === 'string' ? null : t.card
                const reviewer = typeof t.reviewedByAdmin === 'string' ? null : t.reviewedByAdmin
                return (
                  <div key={t._id} className='p-3 rounded-xl border border-border bg-surface-light'>
                    <div className='flex flex-wrap items-center gap-3'>
                      <div className='flex-1 min-w-50'>
                        <p className='text-sm font-semibold text-text-primary'>{u?.name || 'Foydalanuvchi'}</p>
                        <p className='text-xs text-text-secondary'>{u?.email}{u?.phone ? ` · ${u.phone}` : ''}</p>
                      </div>
                      <div className='text-sm font-bold text-primary'>{t.amount.toLocaleString()} so&apos;m</div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        t.status === 'approved' ? 'bg-success/15 text-success' : t.status === 'pending' ? 'bg-warning/15 text-warning' : 'bg-accent/15 text-accent'
                      }`}>{t.status === 'approved' ? 'Tasdiqlangan' : t.status === 'pending' ? 'Kutilmoqda' : 'Rad etilgan'}</span>
                    </div>
                    <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary'>
                      {c && <span>💳 {c.cardNumber} · {c.cardHolderName} · {c.bankName}</span>}
                      <a href={receiptHref(t.receiptUrl)} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-1 text-primary hover:underline'>
                        <ExternalLink className='w-3.5 h-3.5' /> Chekni ko&apos;rish
                      </a>
                      <span>{new Date(t.createdAt).toLocaleString('uz')}</span>
                      {reviewer && <span>· Tekshirdi: {reviewer.name}</span>}
                      {t.rejectionReason && <span className='text-accent'>· Sabab: {t.rejectionReason}</span>}
                    </div>
                    {t.status === 'pending' && (
                      <div className='mt-3 flex gap-2'>
                        <button onClick={() => approve(t._id)} disabled={busy === t._id}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50'>
                          <Check className='w-4 h-4' /> Tasdiqlash
                        </button>
                        <button onClick={() => reject(t._id)} disabled={busy === t._id}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-sm font-medium disabled:opacity-50'>
                          <X className='w-4 h-4' /> Rad etish
                        </button>
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
