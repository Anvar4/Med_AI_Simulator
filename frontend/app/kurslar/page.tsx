'use client'

import Sidebar from '@/components/layout/Sidebar'
import { api, CourseDetail, CourseSummary, ExamResult, UserExam, UserQuestion } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/language-context'
import { Award, CheckCircle2, ChevronLeft, GraduationCap, Lock, PlayCircle, Search, User, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Build a playable src for uploaded videos: absolute URLs pass through; a
 *  relative /uploads path is prefixed with the backend origin. */
function resolveVideoSrc(url?: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
  return `${base}${url}`
}

function CourseCatalog({ onOpen }: { onOpen: (slug: string) => void }) {
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [category, setCategory] = useState('Barchasi')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.courses.categories().then(d => setCategories(d.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      api.courses
        .list({ category: category === 'Barchasi' ? undefined : category, search: search || undefined })
        .then(d => setCourses(d.courses))
        .catch(() => setCourses([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [category, search])

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='mb-6'>
        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3'>
          <PlayCircle className='w-3.5 h-3.5' /> Video kurslar
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>Video kurslar</h1>
        <p className='text-sm text-text-secondary mt-2'>Kurslarni tanlang, darslarni ko&apos;ring va sertifikat oling.</p>
      </div>

      <div className='flex flex-col sm:flex-row gap-3 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary' />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Kurs qidirish...'
            className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40'
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className='px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm'
        >
          <option value='Barchasi'>Barcha turkumlar</option>
          {categories.map(c => (
            <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className='text-text-secondary text-sm'>Yuklanmoqda...</p>
      ) : courses.length === 0 ? (
        <div className='bg-surface border border-border rounded-2xl p-10 text-center'>
          <PlayCircle className='w-10 h-10 text-text-secondary mx-auto mb-3' />
          <p className='text-text-secondary'>Hozircha kurslar mavjud emas.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {courses.map(course => (
            <button
              key={course._id}
              onClick={() => onOpen(course.slug)}
              className='text-left bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors'
            >
              <div className='aspect-video bg-linear-to-br from-primary/20 to-surface-light flex items-center justify-center'>
                <PlayCircle className='w-12 h-12 text-primary/70' />
              </div>
              <div className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary'>{course.category}</span>
                  {course.isPremium && (
                    <span className='inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600'>
                      <Lock className='w-3 h-3' /> Premium
                    </span>
                  )}
                </div>
                <h2 className='text-base font-bold text-text-primary leading-snug line-clamp-2'>{course.title}</h2>
                <p className='text-sm text-text-secondary mt-1.5 line-clamp-2'>{course.description}</p>
                <div className='flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-text-secondary'>
                  <span className='inline-flex items-center gap-1'><User className='w-3.5 h-3.5' /> {course.author}</span>
                  <span>{course.videoCount} ta dars</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseViewer({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { user } = useAuth()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [certMsg, setCertMsg] = useState<string | null>(null)
  const [showExam, setShowExam] = useState(false)
  const [examPassed, setExamPassed] = useState(false)
  // Tracks when the current video was opened, so "mark complete" reports real
  // elapsed watch time (the server requires a minimum before completing).
  const watchStartRef = useRef<number>(Date.now())

  const load = useCallback(() => {
    setLoading(true)
    api.courses
      .get(slug)
      .then(d => {
        setCourse(d.course)
        const first = d.course.playlists.flatMap(p => p.videos)[0]
        setActiveVideoId(prev => prev ?? first?._id ?? null)
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => { load() }, [load])

  // Restart the watch timer whenever the active video changes.
  useEffect(() => { watchStartRef.current = Date.now() }, [activeVideoId])

  const allVideos = course?.playlists.flatMap(p => p.videos) ?? []
  const activeVideo = allVideos.find(v => v._id === activeVideoId) ?? null

  const markComplete = async (videoId: string) => {
    if (!user) return
    // Report the real seconds spent on this video; the server validates it.
    const watchedSeconds = Math.floor((Date.now() - watchStartRef.current) / 1000)
    try {
      const res = await api.courses.saveProgress(videoId, watchedSeconds, true)
      if (res.certificate) setCertMsg(`Tabriklaymiz! Sertifikat berildi: ${res.certificate.serial}`)
      load()
    } catch (err) {
      // Surface the entitlement / watch-time errors instead of swallowing them.
      setCertMsg(err instanceof Error ? err.message : null)
    }
  }

  if (loading) return <div className='max-w-7xl mx-auto px-4 py-8 text-text-secondary text-sm'>Yuklanmoqda...</div>
  if (!course) return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <button onClick={onBack} className='inline-flex items-center gap-1 text-sm text-primary mb-4'><ChevronLeft className='w-4 h-4' /> Orqaga</button>
      <p className='text-text-secondary'>Kurs topilmadi.</p>
    </div>
  )

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <button onClick={onBack} className='inline-flex items-center gap-1 text-sm text-primary mb-4'>
        <ChevronLeft className='w-4 h-4' /> Kurslarga qaytish
      </button>

      <div className='mb-5'>
        <h1 className='text-2xl font-bold text-text-primary'>{course.title}</h1>
        <p className='text-sm text-text-secondary mt-1'>{course.description}</p>
        <div className='flex items-center gap-3 mt-3'>
          <div className='flex-1 max-w-xs h-2 rounded-full bg-surface-light overflow-hidden'>
            <div className='h-full bg-primary' style={{ width: `${course.progress.percent}%` }} />
          </div>
          <span className='text-xs text-text-secondary'>{course.progress.completedVideos}/{course.progress.totalVideos} dars · {course.progress.percent}%</span>
        </div>
      </div>

      {certMsg && (
        <div className='mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-medium'>
          <Award className='w-4 h-4' /> {certMsg}
        </div>
      )}

      {/* Final exam — unlocked once every video is completed */}
      {!course.locked && course.progress.totalVideos > 0 && course.progress.completedVideos >= course.progress.totalVideos && (
        <ExamGate courseId={course._id} onPassed={() => { setExamPassed(true); load() }} showExam={showExam} setShowExam={setShowExam} examPassed={examPassed} setCertMsg={setCertMsg} />
      )}

      {course.locked ? (
        <div className='bg-surface border border-border rounded-2xl p-10 text-center'>
          <Lock className='w-10 h-10 text-amber-500 mx-auto mb-3' />
          <p className='text-text-primary font-semibold'>Bu premium kurs</p>
          <p className='text-text-secondary text-sm mt-1'>Darslarni ko&apos;rish uchun Pro obunani faollashtiring.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            {activeVideo ? (
              <div className='bg-surface border border-border rounded-2xl overflow-hidden'>
                <div className='aspect-video bg-black'>
                  {activeVideo.source === 'upload' ? (
                    <video
                      key={activeVideo._id}
                      src={resolveVideoSrc(activeVideo.videoUrl)}
                      controls
                      className='w-full h-full'
                      // Auto-mark complete when the upload video finishes.
                      onEnded={() => { if (user && !activeVideo.completed) markComplete(activeVideo._id) }}
                    />
                  ) : (
                    <iframe
                      key={activeVideo._id}
                      src={`https://www.youtube.com/embed/${activeVideo.youtubeId}`}
                      title={activeVideo.title}
                      className='w-full h-full border-0'
                      loading='lazy'
                      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                      referrerPolicy='strict-origin-when-cross-origin'
                      allowFullScreen
                    />
                  )}
                </div>
                <div className='p-4'>
                  <h2 className='text-lg font-bold text-text-primary'>{activeVideo.title}</h2>
                  <p className='text-sm text-text-secondary mt-1.5'>{activeVideo.description}</p>
                  {user && (
                    <button
                      onClick={() => markComplete(activeVideo._id)}
                      disabled={activeVideo.completed}
                      className='mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white disabled:opacity-50'
                    >
                      {activeVideo.completed ? 'Tugallangan ✓' : 'Tugallangan deb belgilash'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className='text-text-secondary text-sm'>Bu kursda hali video yo&apos;q.</p>
            )}
          </div>

          <div className='space-y-4'>
            {course.playlists.map(pl => (
              <div key={pl._id} className='bg-surface border border-border rounded-2xl p-4'>
                <h3 className='text-sm font-bold text-text-primary mb-3'>{pl.title}</h3>
                <ul className='space-y-1'>
                  {pl.videos.map((v, i) => (
                    <li key={v._id}>
                      <button
                        onClick={() => setActiveVideoId(v._id)}
                        className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm ${
                          v._id === activeVideoId ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-light'
                        }`}
                      >
                        <span className='w-5 text-xs'>{v.completed ? '✓' : i + 1}</span>
                        <span className='flex-1 line-clamp-1'>{v.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function KurslarPage() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  return (
    <div className='min-h-screen bg-secondary'>
      <Sidebar />
      <main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>
        {openSlug ? (
          <CourseViewer slug={openSlug} onBack={() => setOpenSlug(null)} />
        ) : (
          <CourseCatalog onOpen={setOpenSlug} />
        )}
      </main>
    </div>
  )
}

/* ─── Final exam gate (button + modal) ─── */
function ExamGate({ courseId, showExam, setShowExam, examPassed, setCertMsg, onPassed }: {
  courseId: string
  showExam: boolean
  setShowExam: (v: boolean) => void
  examPassed: boolean
  setCertMsg: (v: string | null) => void
  onPassed: () => void
}) {
  const { t } = useT()
  const [exam, setExam] = useState<UserExam | null>(null)
  const [questions, setQuestions] = useState<UserQuestion[]>([])
  const [best, setBest] = useState<{ scorePercent: number; passed: boolean } | null>(null)
  const [answers, setAnswers] = useState<Record<string, { selected: string[]; textAnswer: string }>>({})
  const [result, setResult] = useState<ExamResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.exams.getForUser(courseId).then(d => {
      setExam(d.exam); setQuestions(d.questions); setBest(d.best)
    }).catch(() => {})
  }, [courseId])

  if (!exam) return null // no exam -> certificate flow handled by video completion

  const alreadyPassed = examPassed || best?.passed

  const ans = (qid: string) => answers[qid] ?? { selected: [], textAnswer: '' }
  const setSel = (q: UserQuestion, optId: string) => {
    setAnswers(a => {
      const cur = ans(q._id)
      if (q.type === 'multiple') {
        const has = cur.selected.includes(optId)
        return { ...a, [q._id]: { ...cur, selected: has ? cur.selected.filter(x => x !== optId) : [...cur.selected, optId] } }
      }
      return { ...a, [q._id]: { ...cur, selected: [optId] } }
    })
  }
  const setText = (qid: string, v: string) => setAnswers(a => ({ ...a, [qid]: { ...ans(qid), textAnswer: v } }))

  async function submit() {
    setSubmitting(true)
    try {
      const payload = questions.map(q => ({ question: q._id, selected: ans(q._id).selected, textAnswer: ans(q._id).textAnswer }))
      const res = await api.exams.submit(exam!._id, payload)
      setResult(res.result)
      if (res.result.passed) {
        onPassed()
        if (res.certificate) setCertMsg(`${t('exam.passed')} ${res.certificate.serial}`)
      }
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  return (
    <div className='mb-5'>
      <div className='flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20'>
        <div className='flex items-center gap-2 text-sm'>
          <GraduationCap className='w-5 h-5 text-primary' />
          <span className='font-medium text-text-primary'>{exam.title}</span>
          {alreadyPassed
            ? <span className='text-xs text-emerald-600 flex items-center gap-1'><CheckCircle2 className='w-3.5 h-3.5' /> {t('exam.passed')}</span>
            : <span className='text-xs text-text-secondary'>{t('exam.examRequired')}</span>}
        </div>
        {!alreadyPassed && (
          <button onClick={() => { setResult(null); setShowExam(true) }} className='px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white shrink-0'>
            {best ? t('exam.retake') : t('exam.startExam')}
          </button>
        )}
      </div>

      {/* Exam modal */}
      {showExam && !alreadyPassed && (
        <div className='fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto' onClick={() => setShowExam(false)}>
          <div className='bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl my-8' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-bold text-text-primary'>{exam.title}</h3>
              <button onClick={() => setShowExam(false)} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary'><XCircle className='w-5 h-5' /></button>
            </div>

            {result ? (
              <div className='text-center py-6'>
                {result.passed
                  ? <CheckCircle2 className='w-14 h-14 text-emerald-500 mx-auto mb-3' />
                  : <XCircle className='w-14 h-14 text-accent mx-auto mb-3' />}
                <p className='text-xl font-bold text-text-primary'>{result.passed ? t('exam.passed') : t('exam.failed')}</p>
                <p className='text-sm text-text-secondary mt-1'>{t('exam.yourScore')}: <b>{result.scorePercent}%</b> · {t('exam.passNeeded')}: {result.passingScore}%</p>
                {result.earnedPoints > 0 && <p className='text-sm text-emerald-600 mt-1'>+{result.earnedPoints} {t('exam.earnedPoints').toLowerCase()}</p>}
                <div className='flex gap-2 justify-center mt-5'>
                  {!result.passed && <button onClick={() => { setResult(null); setAnswers({}) }} className='px-4 py-2 rounded-xl text-sm bg-primary text-white'>{t('exam.retake')}</button>}
                  <button onClick={() => setShowExam(false)} className='px-4 py-2 rounded-xl text-sm bg-surface-light text-text-primary'>{t('cm.cancel') /* close */}</button>
                </div>
              </div>
            ) : (
              <div className='space-y-5'>
                {questions.map((q, i) => (
                  <div key={q._id}>
                    <p className='text-sm font-medium text-text-primary mb-2'>{i + 1}. {q.text}</p>
                    {q.type === 'short' ? (
                      <input value={ans(q._id).textAnswer} onChange={e => setText(q._id, e.target.value)} placeholder={t('exam.yourAnswer')}
                        className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40' />
                    ) : (
                      <div className='space-y-1.5'>
                        {q.options.map(o => {
                          const selected = ans(q._id).selected.includes(o._id)
                          return (
                            <button key={o._id} type='button' onClick={() => setSel(q, o._id)}
                              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm border transition-colors ${selected ? 'border-primary bg-primary/10 text-text-primary' : 'border-border bg-surface-light text-text-secondary hover:border-primary/40'}`}>
                              <span className={`w-4 h-4 ${q.type === 'multiple' ? 'rounded-md' : 'rounded-full'} border-2 shrink-0 ${selected ? 'border-primary bg-primary' : 'border-text-secondary/40'}`} />
                              {o.text}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={submit} disabled={submitting} className='w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white disabled:opacity-50'>
                  {submitting ? '...' : t('exam.submit')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
