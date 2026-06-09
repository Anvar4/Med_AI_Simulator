'use client'

import { useT } from '@/lib/language-context'
import {
  BarChart3,
  BookOpen,
  FileQuestion,
  LayoutDashboard,
  PlayCircle,
  Stethoscope,
  Zap,
} from 'lucide-react'

export type CMTab =
  | 'dashboard'
  | 'cases'
  | 'emergency'
  | 'library'
  | 'courses'
  | 'exams'
  | 'analytics'

const TABS: { key: CMTab; labelKey: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', labelKey: 'cm.dashboard', icon: LayoutDashboard },
  { key: 'cases', labelKey: 'cm.cases', icon: Stethoscope },
  { key: 'emergency', labelKey: 'cm.emergency', icon: Zap },
  { key: 'library', labelKey: 'cm.library', icon: BookOpen },
  { key: 'courses', labelKey: 'cm.courses', icon: PlayCircle },
  { key: 'exams', labelKey: 'cm.exams', icon: FileQuestion },
  { key: 'analytics', labelKey: 'cm.analytics', icon: BarChart3 },
]

/** Gorizontal, scroll qilinadigan tab bar — 7 ta CM moduli. */
export default function CMTabBar({ active, onChange }: { active: CMTab; onChange: (t: CMTab) => void }) {
  const { t } = useT()
  return (
    <div className='flex gap-1.5 overflow-x-auto pb-1 mb-6 -mx-1 px-1'>
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              isActive
                ? 'bg-primary text-secondary'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-light'
            }`}
          >
            <Icon className='w-4 h-4' />
            {t(tab.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
