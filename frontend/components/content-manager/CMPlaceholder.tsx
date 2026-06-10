'use client'

import { useT } from '@/lib/language-context'
import { LucideIcon } from 'lucide-react'

/** Keyingi bosqichda qo'shiladigan modullar uchun professional "tez orada" holati. */
export default function CMPlaceholder({ icon: Icon, titleKey }: { icon: LucideIcon; titleKey: string }) {
  const { t } = useT()
  return (
    <div className='flex flex-col items-center justify-center text-center py-20 px-4'>
      <div className='w-16 h-16 rounded-2xl bg-surface-light border border-border flex items-center justify-center mb-5'>
        <Icon className='w-8 h-8 text-text-secondary/60' />
      </div>
      <h3 className='text-lg font-bold text-text-primary mb-1'>{t(titleKey)}</h3>
      <span className='inline-flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 px-3 py-1 rounded-full mb-3'>
        {t('cm.comingSoon')}
      </span>
      <p className='text-sm text-text-secondary max-w-sm'>{t('cm.comingSoonDesc')}</p>
    </div>
  )
}
