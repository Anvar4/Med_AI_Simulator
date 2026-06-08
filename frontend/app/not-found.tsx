'use client'

/* eslint-disable @next/next/no-img-element */
import { useT } from '@/lib/language-context'
import { motion } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  const { t } = useT()

  return (
    <main className='min-h-screen bg-secondary flex items-center justify-center px-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='text-center max-w-md'
      >
        <img src='/logotip.png' alt='Med AI Simulator' className='h-16 w-auto mx-auto mb-6 object-contain' />

        <p className='text-7xl sm:text-8xl font-extrabold text-primary/80 leading-none'>404</p>
        <h1 className='text-2xl font-bold text-text-primary mt-4'>{t('notFound.title')}</h1>
        <p className='text-text-secondary mt-2'>{t('notFound.desc')}</p>

        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 mt-8'>
          <Link href='/'
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors'>
            <Home className='w-4 h-4' /> {t('notFound.home')}
          </Link>
          <button onClick={() => window.history.back()}
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:text-text-primary hover:border-primary/40 transition-colors'>
            <ArrowLeft className='w-4 h-4' /> {t('notFound.back')}
          </button>
        </div>
      </motion.div>
    </main>
  )
}
