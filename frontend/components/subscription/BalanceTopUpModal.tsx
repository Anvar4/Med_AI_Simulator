'use client'

import { ActiveCard, api } from '@/lib/api'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Copy, CreditCard, Loader2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const MIN_TOPUP = 5000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('med-ai-auth') || '{}').token ?? null } catch { return null }
}

/** Upload a receipt file to /api/upload and return its URL. */
async function uploadReceipt(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
    body: form,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.message) || 'Yuklab bo\'lmadi')
  return data.file.url as string
}

export default function BalanceTopUpModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [cards, setCards] = useState<ActiveCard[]>([])
  const [amount, setAmount] = useState('')
  const [cardId, setCardId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [agree, setAgree] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.balance.cards().then(d => {
      setCards(d.cards)
      if (d.cards[0]) setCardId(d.cards[0]._id)
    }).catch(() => {})
  }, [])

  const selectedCard = cards.find(c => c._id === cardId)
  const amountNum = Math.round(Number(amount) || 0)
  const canSubmit = amountNum >= MIN_TOPUP && cardId && file && agree && !submitting

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, '')).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  async function handleSubmit() {
    if (!canSubmit || !file) return
    setError(''); setSubmitting(true)
    try {
      setUploading(true)
      const receiptUrl = await uploadReceipt(file)
      setUploading(false)
      await api.balance.topup({ amount: amountNum, cardId, receiptUrl })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false); setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className='w-full max-w-md glass border border-border rounded-2xl max-h-[90vh] overflow-y-auto'>

          <div className='flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 glass z-10'>
            <h3 className='text-base font-bold text-text-primary'>Balansni to&apos;ldirish</h3>
            <button onClick={onClose} className='text-text-secondary hover:text-text-primary'><X className='w-5 h-5' /></button>
          </div>

          {done ? (
            <div className='p-6 text-center'>
              <div className='w-14 h-14 rounded-2xl bg-success/15 text-success flex items-center justify-center mx-auto mb-4'>
                <CheckCircle className='w-7 h-7' />
              </div>
              <h4 className='text-lg font-bold text-text-primary mb-2'>Arizangiz tekshiruvga yuborildi</h4>
              <p className='text-sm text-text-secondary mb-5'>
                To&apos;lovlar admin tomonidan qo&apos;lda tekshiriladi. Balans 2–3 soat ichida to&apos;ldiriladi.
              </p>
              <button onClick={onSuccess} className='w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold'>Yopish</button>
            </div>
          ) : (
            <div className='p-5 space-y-4'>
              {/* Amount */}
              <div>
                <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Summa (so&apos;m)</label>
                <input type='number' inputMode='numeric' value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder='Masalan: 60000'
                  className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40' />
                {amount && amountNum < MIN_TOPUP && (
                  <p className='text-xs text-accent mt-1'>Minimal summa {MIN_TOPUP.toLocaleString()} so&apos;m</p>
                )}
              </div>

              {/* Card selection */}
              <div>
                <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Karta tanlang</label>
                {cards.length === 0 ? (
                  <p className='text-xs text-text-secondary p-3 bg-surface-light rounded-xl'>Hozircha to&apos;lov kartalari mavjud emas. Admin bilan bog&apos;laning.</p>
                ) : (
                  <select value={cardId} onChange={e => setCardId(e.target.value)}
                    className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary'>
                    {cards.map(c => <option key={c._id} value={c._id}>{c.bankName} — {c.cardHolderName}</option>)}
                  </select>
                )}
              </div>

              {/* Selected card details */}
              {selectedCard && (
                <div className='rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2'>
                  <div className='flex items-center gap-2 text-primary text-xs font-semibold'><CreditCard className='w-4 h-4' /> Shu kartaga o&apos;tkazing</div>
                  <button onClick={() => copy(selectedCard.cardNumber, 'num')} className='w-full flex items-center justify-between text-left'>
                    <span className='font-mono text-sm text-text-primary tracking-wider'>{selectedCard.cardNumber}</span>
                    {copied === 'num' ? <CheckCircle className='w-4 h-4 text-success' /> : <Copy className='w-4 h-4 text-text-secondary' />}
                  </button>
                  <div className='text-xs text-text-secondary'>
                    <p><span className='text-text-primary font-medium'>Egasi:</span> {selectedCard.cardHolderName}</p>
                    <p><span className='text-text-primary font-medium'>Bank:</span> {selectedCard.bankName}</p>
                    {selectedCard.description && <p className='mt-1'>{selectedCard.description}</p>}
                  </div>
                </div>
              )}

              {/* Receipt upload */}
              <div>
                <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Chek / skrinshot</label>
                <input ref={fileRef} type='file' accept='image/*,application/pdf' className='hidden'
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileRef.current?.click()}
                  className='w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border bg-surface-light text-sm text-text-secondary hover:border-primary/50'>
                  <Upload className='w-4 h-4' />
                  {file ? <span className='text-text-primary truncate'>{file.name}</span> : 'Chek faylini tanlang (rasm yoki PDF)'}
                </button>
              </div>

              {/* Agreement */}
              <label className='flex items-start gap-2 text-xs text-text-secondary cursor-pointer'>
                <input type='checkbox' checked={agree} onChange={e => setAgree(e.target.checked)} className='mt-0.5' />
                <span>
                  Men to&apos;lovni tanlangan kartaga amalga oshirganimni tasdiqlayman hamda{' '}
                  <Link href='/privacy-policy' target='_blank' className='text-primary hover:underline'>Maxfiylik siyosati</Link> va{' '}
                  <Link href='/payment-terms' target='_blank' className='text-primary hover:underline'>To&apos;lov shartlari</Link>ga roziman.
                </span>
              </label>

              <div className='rounded-lg bg-warning/10 text-warning text-[11px] px-3 py-2'>
                ⚠️ To&apos;lovlar admin tomonidan qo&apos;lda tekshiriladi. Balans 2–3 soat ichida to&apos;ldiriladi.
              </div>

              {error && <p className='text-sm text-accent'>{error}</p>}

              <button onClick={handleSubmit} disabled={!canSubmit}
                className='w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2'>
                {submitting ? <><Loader2 className='w-4 h-4 animate-spin' /> {uploading ? 'Chek yuklanmoqda...' : 'Yuborilmoqda...'}</> : 'Arizani yuborish'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
