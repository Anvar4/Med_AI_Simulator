'use client'

/* eslint-disable @next/next/no-img-element */

import Flag, { FlagCode } from '@/components/ui/Flag'
import { api, Book, BookInput } from '@/lib/api'
import { useDialog } from '@/lib/dialog-context'
import { useT } from '@/lib/language-context'
import { useToast } from '@/lib/toast-context'
import {
  BookOpen,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type SourceMode = 'upload' | 'external'

interface BookForm {
  title: string
  author: string
  description: string
  category: string
  language: Book['language']
  year: string
  pages: string
  coverImage: string
  tags: string
  fileUrl: string
  sourceMode: SourceMode
  isFeatured: boolean
}

const emptyForm: BookForm = {
  title: '', author: '', description: '', category: '', language: 'uz',
  year: '', pages: '', coverImage: '', tags: '', fileUrl: '',
  sourceMode: 'upload', isFeatured: false,
}

function bookToForm(b: Book): BookForm {
  return {
    title: b.title, author: b.author, description: b.description,
    category: b.category, language: b.language,
    year: b.year ? String(b.year) : '', pages: b.pages ? String(b.pages) : '',
    coverImage: b.coverImage || '', tags: b.tags.join(', '),
    fileUrl: b.fileUrl, sourceMode: b.sourceType, isFeatured: b.isFeatured,
  }
}

async function uploadToServer(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const token = (() => { try { const d = JSON.parse(localStorage.getItem('med-ai-auth') || '{}'); return d.token } catch { return '' } })()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiUrl}/api/upload`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.file?.url) resolve(data.file.url)
        else reject(new Error(data.message || 'Fayl yuklashda xatolik'))
      } catch { reject(new Error('Fayl yuklashda xatolik')) }
    }
    xhr.onerror = () => reject(new Error('Tarmoq xatosi'))
    const fd = new FormData()
    fd.append('file', file)
    xhr.send(fd)
  })
}

export default function CMLibrary() {
  const { t } = useT()
  const toast = useToast()
  const { confirm } = useDialog()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [form, setForm] = useState<BookForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof BookForm>(k: K, v: BookForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.books.adminList()
      setBooks(res.books)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('library.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setUploadPct(null)
    setShowForm(true)
  }

  function openEdit(b: Book) {
    setEditing(b)
    setForm(bookToForm(b))
    setUploadPct(null)
    setShowForm(true)
  }

  async function handlePdf(file: File | null) {
    if (!file) return
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      toast.error(t('library.onlyPdf'))
      return
    }
    setUploadPct(0)
    try {
      const url = await uploadToServer(file, pct => setUploadPct(pct))
      set('fileUrl', url)
      set('sourceMode', 'upload')
      toast.success(t('library.uploaded'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('library.loadFailed'))
    } finally {
      setUploadPct(null)
    }
  }

  async function handleCover(file: File | null) {
    if (!file) return
    setCoverUploading(true)
    try {
      const url = await uploadToServer(file)
      set('coverImage', url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('library.loadFailed'))
    } finally {
      setCoverUploading(false)
    }
  }

  async function save() {
    if (!form.title.trim()) { toast.error(t('library.titleRequired')); return }
    if (!form.fileUrl.trim()) { toast.error(t('library.fileRequired')); return }
    setSaving(true)
    try {
      const payload: BookInput = {
        title: form.title.trim(),
        author: form.author.trim(),
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        language: form.language,
        year: form.year ? parseInt(form.year) : undefined,
        pages: form.pages ? parseInt(form.pages) : undefined,
        coverImage: form.coverImage.trim() || undefined,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        fileUrl: form.fileUrl.trim(),
        sourceType: form.sourceMode,
        isFeatured: form.isFeatured,
      }
      if (editing) {
        await api.books.update(editing._id, payload)
        toast.success(t('library.updated'))
      } else {
        await api.books.create(payload)
        toast.success(t('library.created'))
      }
      setShowForm(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('library.loadFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(b: Book) {
    const ok = await confirm({ title: t('library.deleteConfirm'), message: b.title, confirmText: t('common.delete'), danger: true })
    if (!ok) return
    try {
      await api.books.delete(b._id)
      toast.success(t('library.deleted'))
      setBooks(bs => bs.filter(x => x._id !== b._id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('library.loadFailed'))
    }
  }

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <BookOpen className='w-5 h-5 text-primary' />
          <h2 className='text-lg font-bold text-text-primary'>{t('cm.library')}</h2>
          <span className='text-sm text-text-secondary'>({books.length})</span>
        </div>
        <button onClick={openCreate}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors'>
          <Plus className='w-4 h-4' /> {t('library.addBook')}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='w-7 h-7 text-primary animate-spin' />
        </div>
      ) : books.length === 0 ? (
        <div className='text-center py-16 bg-surface border border-border rounded-2xl'>
          <BookOpen className='w-10 h-10 text-text-secondary/40 mx-auto mb-3' />
          <p className='text-sm text-text-secondary'>{t('library.noBooksCm')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {books.map(b => (
            <div key={b._id} className='bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3'>
              <div className='flex items-start gap-3'>
                {b.coverImage
                  ? <img src={b.coverImage} alt={b.title} className='w-11 h-14 rounded-lg object-cover shrink-0' />
                  : <div className='w-11 h-14 rounded-lg bg-surface-light flex items-center justify-center text-xl shrink-0'>📘</div>}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1.5 mb-1'>
                    <Flag code={b.language as FlagCode} className='w-4 h-2.5 rounded-xs' />
                    {!b.isPublished && <span className='text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20'>{t('library.draft')}</span>}
                    {b.isFeatured && <span className='text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20'>★</span>}
                  </div>
                  <h3 className='text-sm font-semibold text-text-primary line-clamp-2 leading-tight'>{b.title}</h3>
                  <p className='text-xs text-text-secondary truncate'>{b.author}</p>
                </div>
              </div>
              <div className='flex items-center gap-3 text-xs text-text-secondary'>
                <span className='px-1.5 py-0.5 rounded bg-surface-light border border-border'>{b.category}</span>
                <span className='inline-flex items-center gap-1'><Eye className='w-3 h-3' /> {b.views}</span>
                <span className='inline-flex items-center gap-1'>
                  {b.sourceType === 'upload' ? <FileText className='w-3 h-3' /> : <Link2 className='w-3 h-3' />}
                  {b.sourceType === 'upload' ? 'PDF' : t('library.external')}
                </span>
              </div>
              <div className='flex gap-2 pt-1 border-t border-border'>
                <a href={`/library/read?id=${b._id}`} target='_blank' rel='noopener noreferrer'
                  className='flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-light border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors'>
                  <ExternalLink className='w-3.5 h-3.5' /> {t('library.preview')}
                </a>
                <button onClick={() => openEdit(b)}
                  className='p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors'>
                  <Edit3 className='w-4 h-4' />
                </button>
                <button onClick={() => remove(b)}
                  className='p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors'>
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm' onClick={() => !saving && setShowForm(false)}>
          <div className='w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surface z-10'>
              <h3 className='text-base font-bold text-text-primary'>{editing ? t('library.editBook') : t('library.addBook')}</h3>
              <button onClick={() => setShowForm(false)} className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='p-6 space-y-4'>
              {/* Title */}
              <div>
                <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.bookTitle')} *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
              </div>

              {/* Author + Category */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.author')}</label>
                  <input value={form.author} onChange={e => set('author', e.target.value)}
                    className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.category')}</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)} placeholder='Kardiologiya'
                    className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
                </div>
              </div>

              {/* Language + Year + Pages */}
              <div className='grid grid-cols-3 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.language')}</label>
                  <select value={form.language} onChange={e => set('language', e.target.value as Book['language'])}
                    className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50'>
                    <option value='uz'>O&apos;zbekcha</option>
                    <option value='ru'>Русский</option>
                    <option value='en'>English</option>
                  </select>
                </div>
                <div>
                  <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.year')}</label>
                  <input value={form.year} onChange={e => set('year', e.target.value.replace(/[^0-9]/g, ''))} maxLength={4}
                    className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.pages')}</label>
                  <input value={form.pages} onChange={e => set('pages', e.target.value.replace(/[^0-9]/g, ''))}
                    className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.description')}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                  className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50 resize-none' />
              </div>

              {/* Tags */}
              <div>
                <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.tags')}</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder='kardiologiya, EKG, ...'
                  className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
              </div>

              {/* Cover */}
              <div>
                <label className='block text-xs font-semibold text-text-secondary mb-1.5'>{t('library.cover')}</label>
                <div className='flex items-center gap-3'>
                  {form.coverImage
                    ? <img src={form.coverImage} alt='' className='w-12 h-16 rounded-lg object-cover border border-border' />
                    : <div className='w-12 h-16 rounded-lg bg-surface-light border border-border flex items-center justify-center text-xl'>📘</div>}
                  <input ref={coverInputRef} type='file' accept='image/*' className='hidden' onChange={e => handleCover(e.target.files?.[0] || null)} />
                  <button onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                    className='inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-light border border-border text-sm text-text-secondary hover:text-text-primary transition-colors'>
                    {coverUploading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Upload className='w-4 h-4' />}
                    {t('library.uploadCover')}
                  </button>
                  {form.coverImage && (
                    <button onClick={() => set('coverImage', '')} className='text-xs text-accent hover:underline'>{t('common.delete')}</button>
                  )}
                </div>
              </div>

              {/* PDF source */}
              <div className='pt-2 border-t border-border'>
                <label className='block text-xs font-semibold text-text-secondary mb-2'>{t('library.pdfSource')} *</label>
                <div className='flex gap-2 mb-3'>
                  <button onClick={() => set('sourceMode', 'upload')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      form.sourceMode === 'upload' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-light border-border text-text-secondary'
                    }`}>
                    <Upload className='w-4 h-4' /> {t('library.uploadPdf')}
                  </button>
                  <button onClick={() => set('sourceMode', 'external')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      form.sourceMode === 'external' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-light border-border text-text-secondary'
                    }`}>
                    <Link2 className='w-4 h-4' /> {t('library.externalUrl')}
                  </button>
                </div>

                {form.sourceMode === 'upload' ? (
                  <div>
                    <input ref={pdfInputRef} type='file' accept='application/pdf,.pdf' className='hidden' onChange={e => handlePdf(e.target.files?.[0] || null)} />
                    {uploadPct !== null ? (
                      <div className='w-full'>
                        <div className='flex items-center justify-between text-xs text-text-secondary mb-1'>
                          <span>{t('library.uploading')}</span><span>{uploadPct}%</span>
                        </div>
                        <div className='h-2 rounded-full bg-surface-light overflow-hidden'>
                          <div className='h-full bg-primary transition-all' style={{ width: `${uploadPct}%` }} />
                        </div>
                      </div>
                    ) : form.fileUrl && form.sourceMode === 'upload' ? (
                      <div className='flex items-center gap-2 px-3 py-2 rounded-xl bg-success/5 border border-success/20 text-sm text-success'>
                        <FileText className='w-4 h-4' /> <span className='truncate flex-1'>{form.fileUrl.split('/').pop()}</span>
                        <button onClick={() => pdfInputRef.current?.click()} className='text-xs text-text-secondary hover:underline'>{t('library.replace')}</button>
                      </div>
                    ) : (
                      <button onClick={() => pdfInputRef.current?.click()}
                        className='w-full inline-flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-border text-sm text-text-secondary hover:border-primary/40 hover:text-primary transition-colors'>
                        <Upload className='w-5 h-5' /> {t('library.choosePdf')}
                      </button>
                    )}
                  </div>
                ) : (
                  <input value={form.sourceMode === 'external' ? form.fileUrl : ''} onChange={e => set('fileUrl', e.target.value)}
                    placeholder='https://example.com/book.pdf'
                    className='w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary/50' />
                )}
              </div>

              {/* Featured */}
              <label className='flex items-center gap-2 cursor-pointer'>
                <input type='checkbox' checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className='rounded accent-primary' />
                <span className='text-sm text-text-secondary'>{t('library.featuredFlag')}</span>
              </label>
            </div>

            <div className='sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-surface'>
              <button onClick={() => setShowForm(false)} disabled={saving}
                className='px-4 py-2 rounded-xl bg-surface-light border border-border text-sm text-text-secondary hover:text-text-primary transition-colors'>
                {t('common.cancel')}
              </button>
              <button onClick={save} disabled={saving || uploadPct !== null}
                className='inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors'>
                {saving && <Loader2 className='w-4 h-4 animate-spin' />}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
