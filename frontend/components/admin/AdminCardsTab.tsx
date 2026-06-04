'use client'

import { AdminCard, api } from '@/lib/api'
import { CreditCard, Pencil, Plus, Power, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const empty = { cardNumber: '', cardHolderName: '', bankName: '', description: '', sortOrder: 0, isActive: true }

export default function AdminCardsTab() {
  const [cards, setCards] = useState<AdminCard[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<AdminCard | 'new' | null>(null)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.paymentAdmin.listCards().then(d => setCards(d.cards)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const openNew = () => { setForm(empty); setEditing('new'); setError('') }
  const openEdit = (c: AdminCard) => {
    setForm({ cardNumber: c.cardNumber, cardHolderName: c.cardHolderName, bankName: c.bankName, description: c.description || '', sortOrder: c.sortOrder, isActive: c.isActive })
    setEditing(c); setError('')
  }

  async function save() {
    if (!form.cardNumber || !form.cardHolderName || !form.bankName) { setError('Karta raqami, egasi va bank majburiy'); return }
    setSaving(true); setError('')
    try {
      if (editing === 'new') await api.paymentAdmin.createCard(form)
      else if (editing) await api.paymentAdmin.updateCard(editing._id, form)
      setEditing(null); load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik') } finally { setSaving(false) }
  }

  async function toggleActive(c: AdminCard) {
    try { await api.paymentAdmin.updateCard(c._id, { isActive: !c.isActive }); load() } catch { /* silent */ }
  }
  async function remove(c: AdminCard) {
    if (!confirm('Kartani o\'chirasizmi?')) return
    try { await api.paymentAdmin.deleteCard(c._id); load() } catch { /* silent */ }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-text-primary inline-flex items-center gap-2'><CreditCard className='w-5 h-5 text-primary' /> To&apos;lov kartalari</h3>
        <button onClick={openNew} className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold'><Plus className='w-4 h-4' /> Karta qo&apos;shish</button>
      </div>

      {loading ? <p className='text-sm text-text-secondary py-6 text-center'>Yuklanmoqda...</p>
        : cards.length === 0 ? <p className='text-sm text-text-secondary py-6 text-center'>Karta yo&apos;q.</p>
          : (
            <div className='space-y-2'>
              {cards.map(c => (
                <div key={c._id} className='flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-surface-light'>
                  <div className='flex-1 min-w-50'>
                    <p className='font-mono text-sm text-text-primary tracking-wider'>{c.cardNumber}</p>
                    <p className='text-xs text-text-secondary'>{c.cardHolderName} · {c.bankName}{c.description ? ` · ${c.description}` : ''}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.isActive ? 'bg-success/15 text-success' : 'bg-text-secondary/15 text-text-secondary'}`}>{c.isActive ? 'Faol' : 'Nofaol'}</span>
                  <div className='flex gap-1'>
                    <button onClick={() => toggleActive(c)} title='Faol/Nofaol' className='p-1.5 rounded-lg text-text-secondary hover:text-primary'><Power className='w-4 h-4' /></button>
                    <button onClick={() => openEdit(c)} title='Tahrirlash' className='p-1.5 rounded-lg text-text-secondary hover:text-primary'><Pencil className='w-4 h-4' /></button>
                    <button onClick={() => remove(c)} title='Ochirish' className='p-1.5 rounded-lg text-text-secondary hover:text-accent'><Trash2 className='w-4 h-4' /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Edit/Create modal */}
      {editing && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm' onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className='w-full max-w-sm glass border border-border rounded-2xl p-5 space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='font-bold text-text-primary'>{editing === 'new' ? 'Yangi karta' : 'Kartani tahrirlash'}</h4>
              <button onClick={() => setEditing(null)} className='text-text-secondary'><X className='w-5 h-5' /></button>
            </div>
            {([['cardNumber', 'Karta raqami'], ['cardHolderName', 'Karta egasi F.I.Sh.'], ['bankName', 'Bank nomi'], ['description', 'Izoh (ixtiyoriy)']] as const).map(([k, label]) => (
              <input key={k} value={(form as Record<string, string | number | boolean>)[k] as string} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                placeholder={label} className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary' />
            ))}
            <div className='flex items-center gap-3'>
              <input type='number' value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                placeholder='Tartib' className='w-24 bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary' />
              <label className='flex items-center gap-2 text-sm text-text-secondary'>
                <input type='checkbox' checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Faol
              </label>
            </div>
            {error && <p className='text-sm text-accent'>{error}</p>}
            <button onClick={save} disabled={saving} className='w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60'>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
