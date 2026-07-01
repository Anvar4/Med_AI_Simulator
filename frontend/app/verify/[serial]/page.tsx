'use client'

import { api } from '@/lib/api'
import { useT } from '@/lib/language-context'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Download,
  GraduationCap,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'

interface VerifiedCert {
  serial: string
  recipientName: string
  courseTitle: string
  issuedAt: string
}

const MONTHS: Record<string, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso)
    const months = MONTHS[locale] || MONTHS.uz
    if (locale === 'en') return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`
  } catch {
    return iso
  }
}

export default function VerifyCertificatePage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = use(params)
  const { t, locale } = useT()
  const [loading, setLoading] = useState(true)
  const [cert, setCert] = useState<VerifiedCert | null>(null)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    let alive = true
    api.courses.verifyCertificate(serial)
      .then(res => {
        if (!alive) return
        if (res.valid && res.certificate) setCert(res.certificate)
        else setInvalid(true)
        setLoading(false)
      })
      .catch(() => { if (alive) { setInvalid(true); setLoading(false) } })
    return () => { alive = false }
  }, [serial])

  return (
    <div className='min-h-screen bg-secondary'>
      <div className='max-w-xl mx-auto px-4 sm:px-6 py-10'>
        <Link href='/' className='inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6'>
          <ArrowLeft className='w-4 h-4' /> {t('verify.home')}
        </Link>

        {/* Brand header */}
        <div className='flex items-center gap-3 mb-6'>
          <Image src='/logotip.png' alt='MedAI' width={40} height={40} className='rounded-xl' />
          <div>
            <h1 className='text-xl font-bold text-text-primary'>{t('verify.title')}</h1>
            <p className='text-xs text-text-secondary'>{t('verify.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className='flex flex-col items-center justify-center py-24 gap-4'>
            <Loader2 className='w-8 h-8 text-primary animate-spin' />
            <p className='text-sm text-text-secondary'>{t('verify.checking')}</p>
          </div>
        ) : invalid || !cert ? (
          <div className='glass border border-accent/30 rounded-2xl p-8 text-center'>
            <div className='w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4'>
              <AlertTriangle className='w-7 h-7 text-accent' />
            </div>
            <h2 className='text-lg font-bold text-text-primary mb-2'>{t('verify.invalid')}</h2>
            <p className='text-sm text-text-secondary mb-1'>{t('verify.invalidDesc')}</p>
            <p className='text-xs text-text-secondary font-mono mt-3 px-3 py-1.5 bg-surface-light rounded-lg inline-block'>{serial}</p>
          </div>
        ) : (
          <>
            {/* Valid badge */}
            <div className='glass border border-success/30 rounded-2xl overflow-hidden'>
              <div className='bg-success/10 border-b border-success/20 px-6 py-4 flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center'>
                  <BadgeCheck className='w-6 h-6 text-success' />
                </div>
                <div>
                  <p className='text-sm font-bold text-success'>{t('verify.valid')}</p>
                  <p className='text-xs text-text-secondary'>{t('verify.validDesc')}</p>
                </div>
              </div>

              <div className='p-6 space-y-5'>
                <Field icon={User} label={t('verify.recipient')} value={cert.recipientName} />
                <Field icon={GraduationCap} label={t('verify.course')} value={cert.courseTitle} />
                <Field icon={CalendarDays} label={t('verify.issuedAt')} value={formatDate(cert.issuedAt, locale)} />
                <Field icon={ShieldCheck} label={t('verify.serial')} value={cert.serial} mono />

                <a
                  href={api.courses.certificatePdfUrl(cert.serial)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors'
                >
                  <Download className='w-4 h-4' />
                  {t('verify.downloadPdf')}
                </a>
              </div>
            </div>

            <p className='text-xs text-text-secondary text-center mt-5'>{t('verify.footer')}</p>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value, mono = false }: { icon: typeof User; label: string; value: string; mono?: boolean }) {
  return (
    <div className='flex items-start gap-3'>
      <div className='w-9 h-9 rounded-lg bg-surface-light flex items-center justify-center shrink-0'>
        <Icon className='w-4 h-4 text-primary' />
      </div>
      <div className='min-w-0'>
        <p className='text-xs text-text-secondary mb-0.5'>{label}</p>
        <p className={`text-sm font-semibold text-text-primary break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  )
}
