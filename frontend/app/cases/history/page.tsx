'use client'

import Sidebar from '@/components/layout/Sidebar'
import { api, Attempt, BackendCase } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Loader2,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const TYPE_LABEL: Record<string, string> = { diagnostika: 'Diagnostika', jarrohlik: 'Jarrohlik', shoshilinch: 'Shoshilinch' }

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success bg-success/10'
  if (score >= 60) return 'text-primary bg-primary/10'
  if (score >= 40) return 'text-warning bg-warning/10'
  return 'text-accent bg-accent/10'
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} daq ${s} son` : `${s} son`
}

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CasesHistoryPage() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(() => {
    api.attempts.getMy({ status: 'completed', limit: 50 })
      .then(d => setAttempts(d.attempts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { if (user) load() }, [user, load])

  const completed = attempts.length
  const avgScore = completed ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / completed) : 0

  return (
    <div className='min-h-screen bg-secondary'>
      <Sidebar />
      <main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6'>
            <h1 className='text-3xl font-bold text-text-primary'>Ishlangan klinik masalalar</h1>
            <p className='text-sm text-text-secondary mt-1'>Yakunlangan holatlaringiz, olingan ballar va kamchiliklar tahlili.</p>
          </motion.div>

          {loading ? (
            <div className='flex justify-center py-20'><Loader2 className='w-8 h-8 text-primary animate-spin' /></div>
          ) : completed === 0 ? (
            <motion.div initial='hidden' animate='visible' variants={fadeIn}
              className='glass border border-border rounded-2xl p-10 text-center'>
              <ClipboardList className='w-10 h-10 text-text-secondary mx-auto mb-3' />
              <p className='text-text-primary font-semibold'>Hozircha ishlangan masala yo&apos;q</p>
              <p className='text-sm text-text-secondary mt-1'>Klinik holatni yechganingizdan so&apos;ng natijalaringiz shu yerda saqlanadi.</p>
              <Link href='/cases'
                className='mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold'>
                <Stethoscope className='w-4 h-4' /> Klinik holatlarga o&apos;tish
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Summary */}
              <motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-2 gap-4 mb-6'>
                <div className='glass border border-border rounded-2xl p-5'>
                  <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-2'>
                    <CheckCircle2 className='w-4 h-4' /> Yakunlangan
                  </div>
                  <p className='text-2xl font-bold text-text-primary'>{completed} ta</p>
                </div>
                <div className='glass border border-border rounded-2xl p-5'>
                  <div className='flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider mb-2'>
                    <TrendingUp className='w-4 h-4' /> O&apos;rtacha ball
                  </div>
                  <p className='text-2xl font-bold text-text-primary'>{avgScore}%</p>
                </div>
              </motion.div>

              {/* List */}
              <motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-3'>
                {attempts.map(a => {
                  const c = (typeof a.case === 'object' ? a.case : null) as BackendCase | null
                  const open = openId === a._id
                  return (
                    <div key={a._id} className='glass border border-border rounded-2xl overflow-hidden'>
                      <button onClick={() => setOpenId(open ? null : a._id)}
                        className='w-full flex items-center gap-4 p-4 text-left hover:bg-surface-light/40 transition-colors'>
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${scoreColor(a.score)}`}>
                          {a.score}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='font-semibold text-text-primary truncate'>{c?.title || 'Klinik holat'}</p>
                          <div className='flex items-center gap-2 mt-1 text-xs text-text-secondary flex-wrap'>
                            {c?.category && <span>{c.category}</span>}
                            {c?.type && <><span>·</span><span>{TYPE_LABEL[c.type] || c.type}</span></>}
                            <span>·</span>
                            <span className='inline-flex items-center gap-1'><Clock className='w-3 h-3' /> {fmtTime(a.timeSpent)}</span>
                            <span>·</span>
                            <span>{fmtDate(a.completedAt || a.createdAt)}</span>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>

                      {open && (
                        <div className='px-4 pb-4 pt-1 border-t border-border/50 space-y-4'>
                          {/* AI feedback */}
                          {a.aiFeedback && (
                            <div>
                              <p className='text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1'>AI xulosasi</p>
                              <p className='text-sm text-text-primary leading-relaxed'>{a.aiFeedback}</p>
                            </div>
                          )}

                          {/* Weaknesses — the requested "kamchiliklar" */}
                          {a.weaknesses && a.weaknesses.length > 0 && (
                            <div>
                              <p className='text-xs font-semibold text-accent uppercase tracking-wider mb-1.5 inline-flex items-center gap-1'>
                                <AlertTriangle className='w-3.5 h-3.5' /> Kamchiliklar
                              </p>
                              <ul className='space-y-1'>
                                {a.weaknesses.map((w, i) => (
                                  <li key={i} className='text-sm text-text-primary flex items-start gap-2'>
                                    <span className='mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0' /> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Strengths */}
                          {a.strengths && a.strengths.length > 0 && (
                            <div>
                              <p className='text-xs font-semibold text-success uppercase tracking-wider mb-1.5 inline-flex items-center gap-1'>
                                <CheckCircle2 className='w-3.5 h-3.5' /> Kuchli tomonlar
                              </p>
                              <ul className='space-y-1'>
                                {a.strengths.map((s, i) => (
                                  <li key={i} className='text-sm text-text-primary flex items-start gap-2'>
                                    <span className='mt-1.5 w-1.5 h-1.5 rounded-full bg-success shrink-0' /> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Your answer vs correct */}
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            <div className='rounded-xl bg-surface-light/40 p-3'>
                              <p className='text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1'>Sizning tashxisingiz</p>
                              <p className='text-sm text-text-primary'>{a.diagnosis || '—'}</p>
                            </div>
                            {c?.correctDiagnosis && (
                              <div className='rounded-xl bg-success/5 p-3'>
                                <p className='text-[11px] font-semibold text-success uppercase tracking-wider mb-1'>To&apos;g&apos;ri tashxis</p>
                                <p className='text-sm text-text-primary'>{c.correctDiagnosis}</p>
                              </div>
                            )}
                          </div>

                          {c?._id && (
                            <Link href={`/cases/${c._id}`}
                              className='inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline'>
                              <Stethoscope className='w-4 h-4' /> Holatni qayta ko&apos;rish
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
