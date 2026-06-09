'use client'

import Card from '@/components/ui/Card'
import { api, CMDashboardStats } from '@/lib/api'
import { useT } from '@/lib/language-context'
import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  CheckCircle,
  FileQuestion,
  FileText,
  Layers,
  Loader2,
  PlayCircle,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// Grafik ranglari (SVG da CSS var ishlamaydi — aniq hex)
const COLORS = {
  primary: '#2f80ed',
  success: '#22c55e',
  warning: '#f59e0b',
  accent: '#f4607a',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
}
const STATUS_COLORS: Record<string, string> = {
  published: COLORS.success,
  draft: COLORS.warning,
  review: COLORS.cyan,
  rejected: COLORS.accent,
}
const PIE_PALETTE = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.accent, COLORS.purple, COLORS.cyan]

function StatCard({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: number; color: string }) {
  return (
    <Card hover={false}>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-xs text-text-secondary mb-1'>{label}</p>
          <p className='text-2xl font-bold text-text-primary'>{value.toLocaleString()}</p>
        </div>
        <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-surface-light'>
          <Icon className='w-5 h-5' style={{ color }} />
        </div>
      </div>
    </Card>
  )
}

export default function CMDashboard() {
  const { t } = useT()
  const [stats, setStats] = useState<CMDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.admin
      .getCMDashboard()
      .then(res => { if (alive) setStats(res.dashboard) })
      .catch(() => { /* silent — bo'sh holat ko'rsatiladi */ })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center py-24'>
        <Loader2 className='w-7 h-7 text-primary animate-spin' />
      </div>
    )
  }

  if (!stats) {
    return <p className='text-center text-text-secondary py-16'>{t('cm.loading')}</p>
  }

  const cards = [
    { icon: FileText, label: t('cm.totalCases'), value: stats.totalCases, color: COLORS.primary },
    { icon: Zap, label: t('cm.totalEmergency'), value: stats.totalEmergencyCases, color: COLORS.accent },
    { icon: PlayCircle, label: t('cm.totalCourses'), value: stats.totalCourses, color: COLORS.purple },
    { icon: Layers, label: t('cm.totalVideos'), value: stats.totalVideos, color: COLORS.cyan },
    { icon: Award, label: t('cm.totalCertificates'), value: stats.totalCertificates, color: COLORS.success },
    { icon: Users, label: t('cm.totalUsers'), value: stats.totalUsers, color: COLORS.primary },
    { icon: CheckCircle, label: t('cm.published'), value: stats.publishedCases, color: COLORS.success },
    { icon: FileQuestion, label: t('cm.draft'), value: stats.draftCases, color: COLORS.warning },
  ]

  const categoryData = stats.casesByCategory.slice(0, 8)
  const difficultyData = stats.casesByDifficulty.map(d => ({ name: `${d.level}★`, count: d.count }))
  const statusData = stats.casesByStatus.map(s => ({ name: t(`cm.${s.status === 'published' ? 'published' : s.status === 'draft' ? 'draft' : 'review'}`), value: s.count, key: s.status }))

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-6'>
      {/* Stat cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {cards.map(c => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} color={c.color} />
        ))}
      </div>

      {/* Usage row */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card hover={false}>
          <p className='text-xs text-text-secondary mb-1'>{t('cm.completionRate')}</p>
          <p className='text-2xl font-bold text-text-primary'>{stats.completionRate}%</p>
          <div className='mt-2 h-2 rounded-full bg-surface-light overflow-hidden'>
            <div className='h-full rounded-full bg-success' style={{ width: `${stats.completionRate}%` }} />
          </div>
        </Card>
        <Card hover={false}>
          <p className='text-xs text-text-secondary mb-1'>{t('cm.avgScore')}</p>
          <p className='text-2xl font-bold text-text-primary'>{stats.avgScore}</p>
        </Card>
        <Card hover={false}>
          <p className='text-xs text-text-secondary mb-1'>{t('cm.totalAttempts')}</p>
          <p className='text-2xl font-bold text-text-primary'>{stats.totalAttempts.toLocaleString()}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Category bar */}
        <Card hover={false}>
          <p className='text-sm font-semibold text-text-primary mb-4'>{t('cm.byCategory')}</p>
          {categoryData.length === 0 ? (
            <p className='text-xs text-text-secondary py-8 text-center'>—</p>
          ) : (
            <ResponsiveContainer width='100%' height={240}>
              <BarChart data={categoryData} layout='vertical' margin={{ left: 8, right: 16 }}>
                <XAxis type='number' tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type='category' dataKey='category' width={110} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey='count' fill={COLORS.primary} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status pie */}
        <Card hover={false}>
          <p className='text-sm font-semibold text-text-primary mb-4'>{t('cm.byStatus')}</p>
          {statusData.length === 0 ? (
            <p className='text-xs text-text-secondary py-8 text-center'>—</p>
          ) : (
            <ResponsiveContainer width='100%' height={240}>
              <PieChart>
                <Pie data={statusData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map(entry => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className='flex flex-wrap gap-3 justify-center mt-2'>
            {statusData.map(s => (
              <span key={s.key} className='flex items-center gap-1.5 text-xs text-text-secondary'>
                <span className='w-2.5 h-2.5 rounded-full' style={{ background: STATUS_COLORS[s.key] || COLORS.primary }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </Card>

        {/* Difficulty bar */}
        <Card hover={false}>
          <p className='text-sm font-semibold text-text-primary mb-4'>{t('cm.byDifficulty')}</p>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={difficultyData} margin={{ left: -16, right: 8 }}>
              <XAxis dataKey='name' tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey='count' radius={[6, 6, 0, 0]}>
                {difficultyData.map((_, i) => (
                  <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Type breakdown */}
        <Card hover={false}>
          <p className='text-sm font-semibold text-text-primary mb-4'>{t('cm.byType')}</p>
          <div className='space-y-3 pt-2'>
            {stats.casesByType.map((tp, i) => {
              const max = Math.max(...stats.casesByType.map(x => x.count), 1)
              return (
                <div key={tp.type}>
                  <div className='flex items-center justify-between text-xs text-text-secondary mb-1'>
                    <span className='capitalize'>{tp.type}</span>
                    <span className='font-medium text-text-primary'>{tp.count}</span>
                  </div>
                  <div className='h-2 rounded-full bg-surface-light overflow-hidden'>
                    <div className='h-full rounded-full' style={{ width: `${(tp.count / max) * 100}%`, background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
