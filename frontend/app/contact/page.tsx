'use client'

import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/language-context'
import { motion } from 'framer-motion'
import { Bot, Clock, Mail, Send } from 'lucide-react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

// Central contact details (kept in sync with the subscription page).
const CONTACT = {
  telegram: '@AnvarKucharov',
  email: 'support@medaisimulator.uz',
  supportBot: 'Med_AI_Simulator_Supportbot',
}

export default function ContactPage() {
  const { user } = useAuth()
  const { t } = useT()

  const inner = (
    <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6'>
        <h1 className='text-3xl font-bold text-text-primary'>{t('contact.title')}</h1>
        <p className='text-sm text-text-secondary mt-1'>{t('contact.subtitle')}</p>
      </motion.div>

      {/* Support bot — primary channel */}
      <motion.a
        href={`https://t.me/${CONTACT.supportBot}`}
        target='_blank'
        rel='noopener noreferrer'
        initial='hidden' animate='visible' variants={fadeIn}
        className='block glass border-2 border-primary/40 rounded-2xl p-5 mb-4 hover:border-primary transition-colors'
      >
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0'>
            <Bot className='w-6 h-6 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-bold text-text-primary'>{t('contact.support')}</p>
            <p className='text-sm text-text-secondary mt-0.5'>{t('contact.supportDesc')}</p>
            <span className='mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold'>
              <Send className='w-4 h-4' /> {t('contact.openBot')}
            </span>
          </div>
        </div>
      </motion.a>

      {/* Other channels */}
      <motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <a href={`https://t.me/${CONTACT.telegram.replace('@', '')}`} target='_blank' rel='noopener noreferrer'
          className='glass border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition-colors'>
          <Send className='w-5 h-5 text-primary shrink-0' />
          <div className='min-w-0'>
            <p className='text-xs text-text-secondary'>{t('contact.telegram')}</p>
            <p className='text-sm font-semibold text-text-primary truncate'>{CONTACT.telegram}</p>
          </div>
        </a>

        <a href={`mailto:${CONTACT.email}`} className='glass border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition-colors'>
          <Mail className='w-5 h-5 text-primary shrink-0' />
          <div className='min-w-0'>
            <p className='text-xs text-text-secondary'>{t('contact.email')}</p>
            <p className='text-sm font-semibold text-text-primary truncate'>{CONTACT.email}</p>
          </div>
        </a>

        <div className='glass border border-border rounded-2xl p-4 flex items-center gap-3'>
          <Clock className='w-5 h-5 text-primary shrink-0' />
          <p className='text-sm text-text-secondary'>{t('contact.workHours')}</p>
        </div>
      </motion.div>
    </div>
  )

  // Signed-in users get the app shell (sidebar); guests get a bare page.
  if (user) {
    return (
      <div className='min-h-screen bg-secondary'>
        <Sidebar />
        <main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>{inner}</main>
      </div>
    )
  }
  return <main className='min-h-screen bg-secondary'>{inner}</main>
}
