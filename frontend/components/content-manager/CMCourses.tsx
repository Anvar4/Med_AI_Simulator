'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { api, CourseDetail, CourseInput, CoursePlaylist, CourseSummary, CourseVideo } from '@/lib/api'
import { useDialog } from '@/lib/dialog-context'
import { useT } from '@/lib/language-context'
import { useToast } from '@/lib/toast-context'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Film, GripVertical, Loader2, Play, Plus, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const inputCls = 'w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'

/* ─── Upload a file to /api/upload, returns the public URL ─── */
async function uploadFile(file: File): Promise<string> {
  const token = (() => { try { return JSON.parse(localStorage.getItem('med-ai-auth') || '{}').token } catch { return '' } })()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(`${apiUrl}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  const data = await r.json()
  if (!data.file?.url) throw new Error(data.message || 'Fayl yuklashda xatolik')
  return data.file.url
}

/* ─── Top level: course list + create form ─── */
export default function CMCourses() {
  const { t } = useT()
  const toast = useToast()
  const dialog = useDialog()
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CourseDetail | null>(null)
  const [showForm, setShowForm] = useState(false)

  const emptyForm = (): CourseInput => ({ title: '', description: '', category: '', instructor: '', language: 'uz', level: 'beginner', durationLabel: '', isPremium: false, coverImage: '' })
  const [form, setForm] = useState<CourseInput>(emptyForm())
  const [coverUploading, setCoverUploading] = useState(false)
  const [error, setError] = useState('')

  const loadCourses = useCallback(async () => {
    setLoading(true)
    try { const res = await api.courses.list({ mine: true }); setCourses(res.courses) }
    catch { /* silent */ } finally { setLoading(false) }
  }, [])

  const openCourse = useCallback(async (slug: string) => {
    try { const res = await api.courses.get(slug); setSelected(res.course) } catch { /* silent */ }
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError(t('cm.courseTitle')); return }
    try {
      await api.courses.createCourse(form)
      setShowForm(false); setForm(emptyForm()); loadCourses()
      toast.success(t('cm.create'))
    } catch (err) { setError(err instanceof Error ? err.message : 'Xatolik') }
  }

  async function handleCover(file: File | null) {
    if (!file) return
    setCoverUploading(true)
    try { const url = await uploadFile(file); setForm(f => ({ ...f, coverImage: url })) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Xatolik') }
    finally { setCoverUploading(false) }
  }

  async function handleDelete(id: string) {
    const ok = await dialog.confirm({ title: t('cm.delete'), message: t('cm.courseDesc'), danger: true, confirmText: t('cm.delete') })
    if (!ok) return
    try { await api.courses.deleteCourse(id); if (selected?._id === id) setSelected(null); toast.success(t('cm.delete')); loadCourses() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik') }
  }

  if (selected) {
    return <CourseDetailManager course={selected} onBack={() => { setSelected(null); loadCourses() }} onRefresh={() => openCourse(selected.slug)} />
  }

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-text-primary'>{t('cm.courses')}</h2>
        <Button size='sm' onClick={() => setShowForm(v => !v)}><Plus className='w-4 h-4' /> {t('cm.newCourse')}</Button>
      </div>

      {showForm && (
        <Card hover={false}>
          <form onSubmit={handleCreate} className='space-y-3'>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('cm.courseTitle')} className={inputCls} />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t('cm.courseDesc')} rows={2} className={inputCls} />
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={t('cm.category')} className={inputCls} />
              <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder={t('cm.instructor')} className={inputCls} />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value as CourseInput['language'] }))} className={inputCls}>
                <option value='uz'>O&apos;zbekcha</option><option value='ru'>Русский</option><option value='en'>English</option>
              </select>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as CourseInput['level'] }))} className={inputCls}>
                <option value='beginner'>{t('cm.levelBeginner')}</option>
                <option value='intermediate'>{t('cm.levelIntermediate')}</option>
                <option value='advanced'>{t('cm.levelAdvanced')}</option>
              </select>
              <input value={form.durationLabel} onChange={e => setForm(f => ({ ...f, durationLabel: e.target.value }))} placeholder={t('cm.duration')} className={inputCls} />
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              <label className='flex items-center gap-2 text-sm text-text-secondary cursor-pointer'>
                <input type='file' accept='image/*' className='hidden' onChange={e => handleCover(e.target.files?.[0] ?? null)} />
                <span className='px-3 py-1.5 rounded-lg bg-surface-light border border-border hover:border-primary/50'>
                  {coverUploading ? <Loader2 className='w-4 h-4 animate-spin inline' /> : t('cm.thumbnail')}
                </span>
              </label>
              {form.coverImage && <span className='text-xs text-success'>✓</span>}
              <label className='flex items-center gap-2 text-sm text-text-secondary ml-auto'>
                <input type='checkbox' checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} /> {t('cm.premiumCourse')}
              </label>
            </div>
            {error && <p className='text-sm text-accent'>{error}</p>}
            <div className='flex gap-2'>
              <Button size='sm' type='submit'>{t('cm.create')}</Button>
              <Button size='sm' variant='secondary' type='button' onClick={() => setShowForm(false)}>{t('cm.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className='text-sm text-text-secondary py-6 text-center'>{t('cm.loading')}</p>
      ) : courses.length === 0 ? (
        <Card hover={false}><p className='text-sm text-text-secondary py-6 text-center'>{t('cm.noCourses')}</p></Card>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {courses.map(c => (
            <Card key={c._id} hover={false}>
              <div className='flex items-start justify-between gap-2'>
                <button onClick={() => openCourse(c.slug)} className='text-left flex-1'>
                  <p className='text-sm font-semibold text-text-primary'>{c.title}</p>
                  <p className='text-xs text-text-secondary mt-0.5'>{c.category} · {c.videoCount} {t('cm.lessonCount')}{c.isPremium ? ' · Premium' : ''}</p>
                  {c.instructor && <p className='text-xs text-text-secondary/70 mt-0.5'>{c.instructor}</p>}
                </button>
                <button onClick={() => handleDelete(c._id)} className='p-1.5 rounded-lg text-text-secondary hover:text-accent'><Trash2 className='w-4 h-4' /></button>
              </div>
              <button onClick={() => openCourse(c.slug)} className='mt-2 text-xs text-primary hover:underline'>{t('cm.playlistsAndVideos')} →</button>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Sortable video row ─── */
function SortableVideo({ video, onDelete }: { video: CourseVideo; onDelete: () => void }) {
  const { t } = useT()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video._id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <li ref={setNodeRef} style={style} className='flex items-center gap-2 text-sm text-text-secondary bg-surface-light rounded-lg px-2 py-1.5'>
      <button {...attributes} {...listeners} className='cursor-grab touch-none text-text-secondary/50 hover:text-text-secondary' title={t('cm.dragHint')}>
        <GripVertical className='w-4 h-4' />
      </button>
      {video.source === 'upload' ? <Play className='w-3.5 h-3.5 text-primary shrink-0' /> : <Film className='w-3.5 h-3.5 text-accent shrink-0' />}
      <span className='flex-1 line-clamp-1'>{video.title}</span>
      <span className='text-[10px] text-text-secondary/60'>{video.source === 'upload' ? t('cm.uploaded') : t('cm.youtube')}</span>
      <button onClick={onDelete} className='p-1 rounded text-text-secondary hover:text-accent'><Trash2 className='w-3.5 h-3.5' /></button>
    </li>
  )
}

/* ─── Single course: playlists + videos + add video (YouTube/Upload) ─── */
function CourseDetailManager({ course, onBack, onRefresh }: { course: CourseDetail; onBack: () => void; onRefresh: () => void }) {
  const { t } = useT()
  const toast = useToast()
  const dialog = useDialog()
  const [newPlaylist, setNewPlaylist] = useState('')
  // Per-playlist add-video form state
  const [vForms, setVForms] = useState<Record<string, { source: 'youtube' | 'upload'; title: string; url: string; uploading: boolean }>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const vf = (pid: string) => vForms[pid] ?? { source: 'youtube' as const, title: '', url: '', uploading: false }
  const setVF = (pid: string, patch: Partial<{ source: 'youtube' | 'upload'; title: string; url: string; uploading: boolean }>) =>
    setVForms(s => ({ ...s, [pid]: { ...vf(pid), ...patch } }))

  async function addPlaylist() {
    if (!newPlaylist.trim()) return
    try { await api.courses.createPlaylist(course._id, { title: newPlaylist.trim() }); setNewPlaylist(''); onRefresh() } catch { /* silent */ }
  }
  async function delPlaylist(id: string) {
    const ok = await dialog.confirm({ title: t('cm.delete'), message: t('cm.noVideos'), danger: true, confirmText: t('cm.delete') })
    if (!ok) return
    try { await api.courses.deletePlaylist(id); toast.success(t('cm.delete')); onRefresh() } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik') }
  }

  async function addYoutubeVideo(playlistId: string) {
    const f = vf(playlistId)
    if (!f.title.trim() || !f.url.trim()) return
    try {
      await api.courses.createVideo(playlistId, { title: f.title.trim(), source: 'youtube', url: f.url.trim() })
      setVF(playlistId, { title: '', url: '' }); onRefresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik') }
  }

  async function addUploadVideo(playlistId: string, file: File) {
    const f = vf(playlistId)
    const title = f.title.trim() || file.name.replace(/\.[^.]+$/, '')
    setVF(playlistId, { uploading: true })
    try {
      const url = await uploadFile(file)
      await api.courses.createVideo(playlistId, { title, source: 'upload', videoUrl: url })
      setVF(playlistId, { title: '', uploading: false }); onRefresh()
      toast.success(t('cm.uploaded'))
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Xatolik'); setVF(playlistId, { uploading: false }) }
  }

  async function delVideo(id: string) {
    try { await api.courses.deleteVideo(id); onRefresh() } catch { /* silent */ }
  }

  async function onDragEnd(playlist: CoursePlaylist, e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = playlist.videos.map(v => v._id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    const reordered = arrayMove(ids, from, to)
    try { await api.courses.reorderVideos(playlist._id, reordered); onRefresh() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Xatolik') }
  }

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
      <button onClick={onBack} className='text-sm text-primary hover:underline'>← {t('cm.backToCourses')}</button>
      <div>
        <h2 className='text-lg font-semibold text-text-primary'>{course.title}</h2>
        <p className='text-xs text-text-secondary'>{course.category} · {course.level}{course.isPremium ? ' · Premium' : ''}</p>
      </div>

      <div className='flex gap-2'>
        <input value={newPlaylist} onChange={e => setNewPlaylist(e.target.value)} placeholder={t('cm.newPlaylist')} className={inputCls} />
        <Button size='sm' onClick={addPlaylist}><Plus className='w-4 h-4' /> {t('cm.addPlaylist')}</Button>
      </div>

      {course.playlists.length === 0 ? (
        <Card hover={false}><p className='text-sm text-text-secondary py-4 text-center'>{t('cm.noPlaylists')}</p></Card>
      ) : (
        course.playlists.map(pl => {
          const f = vf(pl._id)
          return (
            <Card key={pl._id} hover={false}>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-bold text-text-primary'>{pl.title}</h3>
                <button onClick={() => delPlaylist(pl._id)} className='p-1.5 rounded-lg text-text-secondary hover:text-accent'><Trash2 className='w-4 h-4' /></button>
              </div>

              {/* Video list (drag & drop) */}
              {pl.videos.length === 0 ? (
                <p className='text-xs text-text-secondary/60 mb-3'>{t('cm.noVideos')}</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => onDragEnd(pl, e)}>
                  <SortableContext items={pl.videos.map(v => v._id)} strategy={verticalListSortingStrategy}>
                    <ul className='space-y-1.5 mb-3'>
                      {pl.videos.map(v => <SortableVideo key={v._id} video={v} onDelete={() => delVideo(v._id)} />)}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}

              {/* Add video — source toggle */}
              <div className='border-t border-border pt-3 space-y-2'>
                <div className='flex gap-2'>
                  <button onClick={() => setVF(pl._id, { source: 'youtube' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${f.source === 'youtube' ? 'bg-primary text-secondary' : 'bg-surface-light text-text-secondary'}`}>
                    <Film className='w-3.5 h-3.5' /> {t('cm.sourceYoutube')}
                  </button>
                  <button onClick={() => setVF(pl._id, { source: 'upload' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${f.source === 'upload' ? 'bg-primary text-secondary' : 'bg-surface-light text-text-secondary'}`}>
                    <Upload className='w-3.5 h-3.5' /> {t('cm.sourceUpload')}
                  </button>
                </div>

                <input value={f.title} onChange={e => setVF(pl._id, { title: e.target.value })} placeholder={t('cm.videoTitle')} className={inputCls} />

                {f.source === 'youtube' ? (
                  <div className='flex flex-col sm:flex-row gap-2'>
                    <input value={f.url} onChange={e => setVF(pl._id, { url: e.target.value })} placeholder={t('cm.youtubeUrl')} className={inputCls} />
                    <Button size='sm' onClick={() => addYoutubeVideo(pl._id)}><Plus className='w-4 h-4' /> {t('cm.addVideo')}</Button>
                  </div>
                ) : (
                  <label className='flex items-center justify-center gap-2 w-full h-16 border-2 border-dashed border-border rounded-xl cursor-pointer text-text-secondary hover:border-primary/50 hover:text-primary text-xs'>
                    <input type='file' accept='video/mp4,video/webm' className='hidden' disabled={f.uploading}
                      onChange={e => { const file = e.target.files?.[0]; if (file) addUploadVideo(pl._id, file) }} />
                    {f.uploading ? <><Loader2 className='w-4 h-4 animate-spin' /> {t('cm.uploading')}</> : <><Upload className='w-4 h-4' /> {t('cm.selectVideoFile')}</>}
                  </label>
                )}
              </div>
            </Card>
          )
        })
      )}
    </motion.div>
  )
}
