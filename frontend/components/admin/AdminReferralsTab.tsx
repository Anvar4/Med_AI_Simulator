'use client'

import { api, ReferralAnalytics } from '@/lib/api'
import { Coins, Gift, Loader2, Users, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Admin referral accounting: program totals + top-referrer leaderboard. */
export default function AdminReferralsTab() {
  const [data, setData] = useState<ReferralAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.getReferrals().then(d => setData(d.referrals)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className='flex items-center justify-center h-40'><Loader2 className='w-7 h-7 text-primary animate-spin' /></div>
  }
  if (!data) {
    return <p className='text-text-secondary'>Referal ma&apos;lumotlarini yuklab bo&apos;lmadi.</p>
  }

  const t = data.totals

  return (
    <div className='space-y-6'>
      <h3 className='text-lg font-semibold text-text-primary inline-flex items-center gap-2'>
        <Gift className='w-5 h-5 text-primary' /> Referal hisob-kitobi
      </h3>

      {/* Program totals */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='glass border border-border rounded-2xl p-4'>
          <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-1.5'><Users className='w-4 h-4' /> Referrerlar</div>
          <p className='text-2xl font-bold text-text-primary'>{t.referrerCount}</p>
        </div>
        <div className='glass border border-border rounded-2xl p-4'>
          <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-1.5'><Users className='w-4 h-4' /> Taklif qilinganlar</div>
          <p className='text-2xl font-bold text-text-primary'>{t.invitedCount}</p>
        </div>
        <div className='glass border border-border rounded-2xl p-4'>
          <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-1.5'><Wallet className='w-4 h-4' /> To&apos;langan bonus</div>
          <p className='text-2xl font-bold text-success'>{t.totalPaid.toLocaleString()} <span className='text-sm text-text-secondary'>so&apos;m</span></p>
        </div>
        <div className='glass border border-border rounded-2xl p-4'>
          <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-1.5'><Coins className='w-4 h-4' /> Berilgan ball</div>
          <p className='text-2xl font-bold text-warning'>{t.totalPoints.toLocaleString()}</p>
        </div>
      </div>

      {/* Top referrers leaderboard */}
      <div className='glass border border-border rounded-2xl overflow-hidden'>
        <div className='px-4 py-3 border-b border-border'>
          <p className='text-sm font-bold text-text-primary'>Eng faol referrerlar</p>
        </div>
        {data.top.length === 0 ? (
          <p className='text-sm text-text-secondary text-center py-8'>Hozircha referal yo&apos;q</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-text-secondary text-xs uppercase tracking-wider border-b border-border/50'>
                  <th className='px-4 py-2.5 font-medium'>#</th>
                  <th className='px-4 py-2.5 font-medium'>Foydalanuvchi</th>
                  <th className='px-4 py-2.5 font-medium text-right'>Takliflar</th>
                  <th className='px-4 py-2.5 font-medium text-right'>Bonus</th>
                  <th className='px-4 py-2.5 font-medium text-right'>Ball</th>
                  <th className='px-4 py-2.5 font-medium text-right'>Oxirgi</th>
                </tr>
              </thead>
              <tbody>
                {data.top.map((r, i) => (
                  <tr key={r.userId} className='border-b border-border/30 last:border-0 hover:bg-surface-light/30'>
                    <td className='px-4 py-3 text-text-secondary'>{i + 1}</td>
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-text-primary'>{r.name}</p>
                      {r.username && <p className='text-xs text-text-secondary'>@{r.username}</p>}
                    </td>
                    <td className='px-4 py-3 text-right font-semibold text-text-primary'>{r.invitedCount}</td>
                    <td className='px-4 py-3 text-right text-success font-semibold'>{r.earned.toLocaleString()} so&apos;m</td>
                    <td className='px-4 py-3 text-right text-warning font-semibold'>{r.points}</td>
                    <td className='px-4 py-3 text-right text-text-secondary text-xs'>{fmtDate(r.lastInviteAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
