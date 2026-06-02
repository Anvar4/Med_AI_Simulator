'use client'

import Sidebar from '@/components/layout/Sidebar'
import { api, CourseDetail, CourseSummary } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Award, ChevronLeft, Lock, PlayCircle, Search, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

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

  const allVideos = course?.playlists.flatMap(p => p.videos) ?? []
  const activeVideo = allVideos.find(v => v._id === activeVideoId) ?? null

  const markComplete = async (videoId: string) => {
    if (!user) return
    try {
      const res = await api.courses.saveProgress(videoId, 0, true)
      if (res.certificate) setCertMsg(`Tabriklaymiz! Sertifikat berildi: ${res.certificate.serial}`)
      load()
    } catch {
      // ignore — progress is best-effort
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
