/* eslint-disable @next/next/no-img-element */
'use client'

import Sidebar from '@/components/layout/Sidebar'
import { api, ReferralStats } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import { Check, Coins, Copy, Gift, Loader2, Share2, UserPlus, Users, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ReferralsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    api.referrals.me().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { if (user) load() }, [user, load])

  const shareLink = data && typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${data.referralCode}`
    : ''

  const copy = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const share = async () => {
    if (!shareLink) return
    const text = `Med AI Simulator — tibbiy klinik simulyatorga qo'shiling! Mening havolam: ${shareLink}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Med AI Simulator', text, url: shareLink }) } catch { /* cancelled */ }
    } else {
      copy()
    }
  }

  return (
    <div className='min-h-screen bg-secondary'>
      <Sidebar />
      <main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6'>
            <h1 className='text-3xl font-bold text-text-primary'>Do&apos;stlarni taklif qiling</h1>
            <p className='text-sm text-text-secondary mt-1'>
              Har bir taklif qilingan do&apos;stingiz ro&apos;yxatdan o&apos;tganda{' '}
              <span className='text-success font-semibold'>{(data?.bonusPerInvite ?? 1000).toLocaleString()} so&apos;m</span> va{' '}
              <span className='text-warning font-semibold'>{data?.pointsPerInvite ?? 5} ball</span> olasiz.
            </p>
          </motion.div>

          {loading ? (
            <div className='flex justify-center py-20'><Loader2 className='w-8 h-8 text-primary animate-spin' /></div>
          ) : data ? (
            <>
              {/* Totals */}
              <motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-3 gap-3 mb-6'>
                <div className='glass border border-border rounded-2xl p-4 text-center'>
                  <Users className='w-5 h-5 text-primary mx-auto mb-1.5' />
                  <p className='text-2xl font-bold text-text-primary'>{data.totals.invitedCount}</p>
                  <p className='text-[11px] text-text-secondary mt-0.5'>Taklif qilingan</p>
                </div>
                <div className='glass border border-border rounded-2xl p-4 text-center'>
                  <Wallet className='w-5 h-5 text-success mx-auto mb-1.5' />
                  <p className='text-2xl font-bold text-text-primary'>{data.totals.totalEarned.toLocaleString()}</p>
                  <p className='text-[11px] text-text-secondary mt-0.5'>so&apos;m ishlangan</p>
                </div>
                <div className='glass border border-border rounded-2xl p-4 text-center'>
                  <Coins className='w-5 h-5 text-warning mx-auto mb-1.5' />
                  <p className='text-2xl font-bold text-text-primary'>{data.totals.totalPoints}</p>
                  <p className='text-[11px] text-text-secondary mt-0.5'>ball yig&apos;ilgan</p>
                </div>
              </motion.div>

              {/* Share link */}
              <motion.div initial='hidden' animate='visible' variants={fadeIn}
                className='glass border border-border rounded-2xl p-5 mb-6'>
                <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-3'>
                  <Gift className='w-4 h-4' /> Sizning taklif havolangiz
                </div>
                <div className='flex items-center gap-2'>
                  <div className='flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-surface-light/50 border border-border text-sm text-text-primary truncate font-mono'>
                    {shareLink}
                  </div>
                  <button onClick={copy}
                    className='shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold'>
                    {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
                    <span className='hidden sm:inline'>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                  <button onClick={share}
                    className='shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-semibold'>
                    <Share2 className='w-4 h-4' />
                    <span className='hidden sm:inline'>Ulashish</span>
                  </button>
                </div>
                <p className='text-xs text-text-secondary mt-3'>
                  Taklif kodi: <span className='font-mono font-bold text-text-primary'>{data.referralCode}</span>
                </p>
              </motion.div>

              {/* Invited users */}
              <motion.div initial='hidden' animate='visible' variants={fadeIn}>
                <h2 className='text-lg font-bold text-text-primary mb-3'>Taklif qilganlaringiz</h2>
                {data.invited.length === 0 ? (
                  <div className='glass border border-border rounded-2xl p-8 text-center'>
                    <UserPlus className='w-9 h-9 text-text-secondary mx-auto mb-2' />
                    <p className='text-text-primary font-semibold'>Hali hech kim taklif qilinmagan</p>
                    <p className='text-sm text-text-secondary mt-1'>Havolangizni do&apos;stlaringizga ulashing va bonus oling.</p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {data.invited.map((inv, i) => (
                      <div key={inv.id || i} className='glass border border-border rounded-2xl p-4 flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0'>
                          {inv.avatar
                            ? <img src={inv.avatar} alt={inv.name} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
                            : inv.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='font-semibold text-text-primary truncate'>{inv.name}</p>
                          <p className='text-xs text-text-secondary'>{fmtDate(inv.joinedAt)} {inv.isPremium && '· Pro'}</p>
                        </div>
                        <div className='text-right shrink-0'>
                          <p className='text-sm font-bold text-success'>+{inv.amount.toLocaleString()} so&apos;m</p>
                          <p className='text-[11px] text-warning'>+{inv.points} ball</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            <p className='text-center text-text-secondary py-20'>Ma&apos;lumotni yuklab bo&apos;lmadi.</p>
          )}
        </div>
      </main>
    </div>
  )
}
