'use client'

import Sidebar from '@/components/layout/Sidebar'
import BalanceTopUpModal from '@/components/subscription/BalanceTopUpModal'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Check, CheckCircle, Clock, CreditCard, History, Loader2, Send, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const CONTACT = { telegram: '@AnvarKucharov' }

interface BalanceInfo {
  balance: number
  isPremium: boolean
  subscription?: { plan: string; status: string; expiresAt?: string }
  prices: { monthly: number; yearly: number; yearlyOld: number }
}

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [info, setInfo] = useState<BalanceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(() => {
    api.balance.me().then(d => setInfo(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { if (user) load() }, [user, load])

  const buy = async (plan: 'monthly' | 'yearly') => {
    setBuying(plan); setMsg(null)
    try {
      const res = await api.balance.subscribe(plan)
      setInfo(i => i ? { ...i, balance: res.balance } : i)
      setMsg({ type: 'success', text: res.message })
      load()
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Xatolik'
      setMsg({ type: 'error', text })
    } finally {
      setBuying(null)
    }
  }

  const discount = info ? info.prices.yearlyOld - info.prices.yearly : 170000
  const discountPct = info && info.prices.yearlyOld ? Math.round((discount / info.prices.yearlyOld) * 100) : 24

  const subStatus = info?.subscription?.status === 'active' && info?.subscription?.expiresAt && new Date(info.subscription.expiresAt) > new Date()
  const expiresStr = info?.subscription?.expiresAt ? new Date(info.subscription.expiresAt).toLocaleDateString('uz') : null

  return (
    <div className='min-h-screen bg-secondary'>
      <Sidebar />
      <main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6 flex items-start justify-between gap-3'>
            <div>
              <h1 className='text-3xl font-bold text-text-primary'>Obuna va balans</h1>
              <p className='text-sm text-text-secondary mt-1'>Balansni to&apos;ldiring va Pro obunani faollashtiring.</p>
            </div>
            <Link href='/history'
              className='shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:text-text-primary hover:border-primary/40'>
              <History className='w-4 h-4' /> Tarix
            </Link>
          </motion.div>

          {loading ? (
            <div className='flex justify-center py-20'><Loader2 className='w-8 h-8 text-primary animate-spin' /></div>
          ) : (
            <>
              {/* Status + balance */}
              <motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                <div className='glass border border-border rounded-2xl p-5'>
                  <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-2'>
                    <CheckCircle className='w-4 h-4' /> Joriy holat
                  </div>
                  {subStatus ? (
                    <>
                      <p className='text-2xl font-bold text-primary'>Pro</p>
                      <p className='text-sm text-text-secondary mt-1 inline-flex items-center gap-1'><Clock className='w-3.5 h-3.5' /> {expiresStr} gacha</p>
                    </>
                  ) : (
                    <>
                      <p className='text-2xl font-bold text-text-primary'>Bepul</p>
                      <p className='text-sm text-text-secondary mt-1'>Pro obuna faollashtirilmagan</p>
                    </>
                  )}
                </div>
                <div className='glass border border-border rounded-2xl p-5'>
                  <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-2'>
                    <Wallet className='w-4 h-4' /> Balans
                  </div>
                  <p className='text-2xl font-bold text-text-primary'>{(info?.balance ?? 0).toLocaleString()} <span className='text-base text-text-secondary'>so&apos;m</span></p>
                  <button onClick={() => setTopUpOpen(true)}
                    className='mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold'>
                    <CreditCard className='w-4 h-4' /> Balansni to&apos;ldirish
                  </button>
                </div>
              </motion.div>

              {msg && (
                <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${msg.type === 'success' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
                  {msg.text}
                </div>
              )}

              {/* Plans */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6'>
                {/* Monthly */}
                <motion.div initial='hidden' animate='visible' variants={fadeIn} className='glass border border-border rounded-2xl p-5 flex flex-col'>
                  <h3 className='text-lg font-bold text-text-primary'>Pro — 1 oy</h3>
                  <p className='text-3xl font-bold text-text-primary mt-2'>{(info?.prices.monthly ?? 60000).toLocaleString()} <span className='text-sm text-text-secondary'>so&apos;m</span></p>
                  <p className='text-xs text-text-secondary mt-1'>30 kun</p>
                  <ul className='mt-4 space-y-1.5 text-sm text-text-secondary flex-1'>
                    {['Barcha klinik holatlar', 'AI tahlil', 'Shoshilinch rejim', 'Cheksiz urinishlar'].map(f => (
                      <li key={f} className='flex items-center gap-2'><Check className='w-4 h-4 text-success shrink-0' /> {f}</li>
                    ))}
                  </ul>
                  <button onClick={() => buy('monthly')} disabled={buying === 'monthly'}
                    className='mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2'>
                    {buying === 'monthly' ? <Loader2 className='w-4 h-4 animate-spin' /> : null} 1 oylik obuna sotib olish
                  </button>
                </motion.div>

                {/* Yearly */}
                <motion.div initial='hidden' animate='visible' variants={fadeIn} className='glass border-2 border-primary/50 rounded-2xl p-5 flex flex-col relative'>
                  <span className='absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white'>{discountPct}% CHEGIRMA</span>
                  <h3 className='text-lg font-bold text-text-primary'>Pro — 1 yil</h3>
                  <div className='mt-2 flex items-end gap-2'>
                    <p className='text-3xl font-bold text-text-primary'>{(info?.prices.yearly ?? 550000).toLocaleString()}</p>
                    <p className='text-sm text-text-secondary line-through mb-1'>{(info?.prices.yearlyOld ?? 720000).toLocaleString()}</p>
                  </div>
                  <p className='text-xs text-success mt-1'>{discount.toLocaleString()} so&apos;m tejaysiz · 365 kun</p>
                  <ul className='mt-4 space-y-1.5 text-sm text-text-secondary flex-1'>
                    {['Oylikning barcha imkoniyatlari', 'Eng katta chegirma', 'Yil davomida uzluksiz'].map(f => (
                      <li key={f} className='flex items-center gap-2'><Check className='w-4 h-4 text-success shrink-0' /> {f}</li>
                    ))}
                  </ul>
                  <button onClick={() => buy('yearly')} disabled={buying === 'yearly'}
                    className='mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2'>
                    {buying === 'yearly' ? <Loader2 className='w-4 h-4 animate-spin' /> : null} 1 yillik obuna sotib olish
                  </button>
                </motion.div>

                {/* Organization */}
                <motion.div initial='hidden' animate='visible' variants={fadeIn} className='glass border border-border rounded-2xl p-5 flex flex-col'>
                  <div className='flex items-center gap-2'><Building2 className='w-5 h-5 text-primary' /><h3 className='text-lg font-bold text-text-primary'>Universitet / Klinika</h3></div>
                  <p className='text-2xl font-bold text-text-primary mt-2'>Kelishilgan holda</p>
                  <p className='text-xs text-text-secondary mt-1'>Tashkilotlar uchun maxsus tarif</p>
                  <div className='mt-4 space-y-2 text-sm flex-1'>
                    <a href={`https://t.me/${CONTACT.telegram.replace('@', '')}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-text-primary hover:text-primary'>
                      <Send className='w-4 h-4 text-primary' /> {CONTACT.telegram}
                    </a>
                  </div>
                  <a href={`https://t.me/${CONTACT.telegram.replace('@', '')}`} target='_blank' rel='noopener noreferrer'
                    className='mt-4 w-full py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-semibold text-center'>
                    Bog&apos;lanish
                  </a>
                </motion.div>
              </div>

              {/* Legal links */}
              <div className='text-center text-xs text-text-secondary'>
                <Link href='/privacy-policy' className='hover:text-primary hover:underline'>Maxfiylik siyosati</Link>
                <span className='mx-2'>·</span>
                <Link href='/payment-terms' className='hover:text-primary hover:underline'>To&apos;lov shartlari</Link>
              </div>
            </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {topUpOpen && (
          <BalanceTopUpModal onClose={() => setTopUpOpen(false)} onSuccess={() => { setTopUpOpen(false); load() }} />
        )}
      </AnimatePresence>
    </div>
  )
}
