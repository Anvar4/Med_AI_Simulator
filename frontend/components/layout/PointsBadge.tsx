'use client'

import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Coins } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

/**
 * Compact ranking-points pill shown in the top bars (like the balance). Reads
 * from /balance/me and refreshes on a slow poll + when the global balance event
 * fires (e.g. after a top-up or a referral reward). Links to the referral page.
 */
export const POINTS_REFRESH_EVENT = 'med-ai-points-refresh'

export default function PointsBadge({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  const [points, setPoints] = useState<number | null>(null)

  const load = useCallback(() => {
    if (!user) return
    api.balance.me().then(d => setPoints(d.points ?? 0)).catch(() => {})
  }, [user])

  useEffect(() => {
    load()
    const id = setInterval(load, 60000) // slow poll
    const onRefresh = () => load()
    window.addEventListener(POINTS_REFRESH_EVENT, onRefresh)
    return () => { clearInterval(id); window.removeEventListener(POINTS_REFRESH_EVENT, onRefresh) }
  }, [load])

  if (!user || points === null) return null

  return (
    <Link href='/referrals'
      title='Reyting ballari — taklif qiling, ball yiging'
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold hover:bg-warning/20 transition-colors ${className}`}>
      <Coins className='w-3.5 h-3.5' />
      <span>{points.toLocaleString()}</span>
    </Link>
  )
}
