'use client'

import Sidebar from '@/components/layout/Sidebar'
import { api, SubscriptionTxRow, TopUpRow } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Receipt,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

type Filter = 'all' | 'topup' | 'subscription'

// A unified entry on the timeline — either a balance top-up or a subscription purchase.
interface TimelineEntry {
  id: string
  kind: 'topup' | 'subscription'
  date: string // ISO — used for sorting
  topup?: TopUpRow
  sub?: SubscriptionTxRow
}

const PLAN_LABEL: Record<string, string> = { monthly: '1 oylik Pro', yearly: '1 yillik Pro' }

const TOPUP_STATUS = {
  pending: { label: 'Tekshirilmoqda', cls: 'bg-warning/10 text-warning', Icon: Clock },
  approved: { label: 'Tasdiqlangan', cls: 'bg-success/10 text-success', Icon: CheckCircle2 },
  rejected: { label: 'Rad etilgan', cls: 'bg-accent/10 text-accent', Icon: XCircle },
} as const

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('uz', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [topups, setTopups] = useState<TopUpRow[]>([])
  const [subs, setSubs] = useState<SubscriptionTxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(() => {
    Promise.all([
      api.balance.myTopUps().then(d => d.topups).catch(() => [] as TopUpRow[]),
      api.balance.subscriptions().then(d => d.transactions).catch(() => [] as SubscriptionTxRow[]),
    ])
      .then(([t, s]) => { setTopups(t); setSubs(s) })
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { if (user) load() }, [user, load])

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [
      ...topups.map<TimelineEntry>(t => ({ id: t._id, kind: 'topup', date: t.createdAt, topup: t })),
      ...subs.map<TimelineEntry>(s => ({ id: s._id, kind: 'subscription', date: s.createdAt, sub: s })),
    ]
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (filter === 'all') return entries
    return entries.filter(e => e.kind === filter)
  }, [topups, subs, filter])

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Hammasi' },
    { id: 'topup', label: 'To‘ldirishlar' },
    { id: 'subscription', label: 'Obunalar' },
  ]

  return (
    <div className='min-h-screen bg-secondary'>
      <Sidebar />
      <main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6 flex items-start justify-between gap-3'>
            <div>
              <h1 className='text-3xl font-bold text-text-primary'>Tranzaksiyalar tarixi</h1>
              <p className='text-sm text-text-secondary mt-1'>Balans to&apos;ldirishlar va obuna xaridlari.</p>
            </div>
            <Link href='/subscription'
              className='shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5'>
              <CreditCard className='w-4 h-4' /> Obuna va balans
            </Link>
          </motion.div>

          {/* Filters */}
          <motion.div initial='hidden' animate='visible' variants={fadeIn} className='flex items-center gap-2 mb-5'>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f.id ? 'bg-primary text-white' : 'glass border border-border text-text-secondary hover:text-text-primary'
                }`}>
                {f.label}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className='flex justify-center py-20'><Loader2 className='w-8 h-8 text-primary animate-spin' /></div>
          ) : timeline.length === 0 ? (
            <motion.div initial='hidden' animate='visible' variants={fadeIn}
              className='glass border border-border rounded-2xl p-10 text-center'>
              <Receipt className='w-10 h-10 text-text-secondary mx-auto mb-3' />
              <p className='text-text-primary font-semibold'>Hozircha tranzaksiyalar yo&apos;q</p>
              <p className='text-sm text-text-secondary mt-1'>Balansni to&apos;ldirganingizdan yoki obuna sotib olganingizdan so&apos;ng bu yerda ko&apos;rinadi.</p>
              <Link href='/subscription'
                className='mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold'>
                <CreditCard className='w-4 h-4' /> Balansni to&apos;ldirish
              </Link>
            </motion.div>
          ) : (
            <motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-3'>
              {timeline.map(entry =>
                entry.kind === 'topup' && entry.topup
                  ? <TopUpItem key={entry.id} t={entry.topup} />
                  : entry.sub
                    ? <SubItem key={entry.id} s={entry.sub} />
                    : null
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

function TopUpItem({ t }: { t: TopUpRow }) {
  const meta = TOPUP_STATUS[t.status]
  const card = typeof t.card === 'object' && t.card ? t.card : null
  return (
    <div className='glass border border-border rounded-2xl p-4 flex items-start gap-4'>
      <div className='w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0'>
        <ArrowDownCircle className='w-5 h-5 text-success' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='font-semibold text-text-primary'>Balans to&apos;ldirish</p>
          <p className='font-bold text-success whitespace-nowrap'>+{t.amount.toLocaleString()} so&apos;m</p>
        </div>
        <p className='text-xs text-text-secondary mt-0.5'>{fmtDate(t.createdAt)}</p>
        {card && (
          <p className='text-xs text-text-secondary mt-1'>{card.bankName} · {card.cardNumber}</p>
        )}
        <div className='mt-2 flex items-center gap-2 flex-wrap'>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.cls}`}>
            <meta.Icon className='w-3 h-3' /> {meta.label}
          </span>
          {t.status === 'rejected' && t.rejectionReason && (
            <span className='text-[11px] text-accent'>Sabab: {t.rejectionReason}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SubItem({ s }: { s: SubscriptionTxRow }) {
  return (
    <div className='glass border border-border rounded-2xl p-4 flex items-start gap-4'>
      <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0'>
        <ArrowUpCircle className='w-5 h-5 text-primary' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='font-semibold text-text-primary'>{PLAN_LABEL[s.plan] || 'Pro obuna'}</p>
          <p className='font-bold text-accent whitespace-nowrap'>-{s.amount.toLocaleString()} so&apos;m</p>
        </div>
        <p className='text-xs text-text-secondary mt-0.5'>{fmtDate(s.createdAt)}</p>
        <p className='text-xs text-text-secondary mt-1'>
          Amal qiladi: {new Date(s.expiresAt).toLocaleDateString('uz')} gacha
        </p>
        <div className='mt-2 flex items-center gap-2 flex-wrap'>
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success'>
            <CheckCircle2 className='w-3 h-3' /> Faollashtirilgan
          </span>
          <span className='text-[11px] text-text-secondary'>
            Balans: {s.balanceBefore.toLocaleString()} → {s.balanceAfter.toLocaleString()} so&apos;m
          </span>
        </div>
      </div>
    </div>
  )
}
