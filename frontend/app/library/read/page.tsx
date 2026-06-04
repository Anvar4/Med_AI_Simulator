'use client'

import Sidebar from '@/components/layout/Sidebar';
import { BOOKS, BookSource, getBookSources, isEmbeddableSource, SOURCE_LABELS } from '@/lib/library-data';
import { useT } from '@/lib/language-context';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronDown,
    ExternalLink,
    Loader2,
    Maximize2,
    Minimize2,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

function displayCover(cover: string): string {
	return cover === '[BOOK]' ? '📘' : cover
}

// Source type icon
function SourceIcon({ type }: { type: BookSource['type'] }) {
	const icons: Record<BookSource['type'], string> = {
		archive: '🏛️',
		ncbi: '🧬',
		google: '📖',
		pdf: '📄',
		web: '🌐',
	}
	return <span>{icons[type]}</span>
}

// Iframe loader + error UI
function IframeReader({ src, title }: { src: string; title: string }) {
	const { t } = useT()
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)

	const handleLoad = useCallback(() => setLoading(false), [])
	const handleError = useCallback(() => { setLoading(false); setError(true) }, [])

	return (
		<div className='relative w-full h-full'>
			{/* Loading */}
			{loading && !error && (
				<div className='absolute inset-0 flex flex-col items-center justify-center bg-surface z-10 gap-4'>
					<Loader2 className='w-8 h-8 text-primary animate-spin' />
					<p className='text-sm text-text-secondary'>{t('library.loadingBook')}</p>
				</div>
			)}

			{/* Error */}
			{error && (
				<div className='absolute inset-0 flex flex-col items-center justify-center bg-surface z-10 p-8'>
					<div className='max-w-md w-full text-center'>
						<div className='w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4'>
							<AlertTriangle className='w-7 h-7 text-accent' />
						</div>
						<h3 className='text-base font-semibold text-text-primary mb-2'>{t('library.loadFailed')}</h3>
						<p className='text-sm text-text-secondary mb-5'>
							{t('library.blockedHint')}
						</p>
						<div className='flex gap-3 justify-center'>
							<button onClick={() => { setLoading(true); setError(false); setRetryKey(k => k + 1) }}
								className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light border border-border text-sm text-text-secondary hover:text-text-primary transition-colors'>
								<RefreshCw className='w-4 h-4' /> {t('common.retry')}
							</button>
							<a href={src} target='_blank' rel='noopener noreferrer'
								className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors'>
								<ExternalLink className='w-4 h-4' /> Yangi oynada ochish
							</a>
						</div>
					</div>
				</div>
			)}

			<iframe
				key={`${src}-${retryKey}`}
				ref={iframeRef}
				src={src}
				title={title}
				onLoad={handleLoad}
				onError={handleError}
				className={`w-full h-full border-none transition-opacity duration-300 ${loading || error ? 'opacity-0' : 'opacity-100'}`}
				allow='fullscreen'
			/>
		</div>
	)
}

function ReaderContent() {
	const { t } = useT()
	const params = useSearchParams()
	const bookId = params.get('id')
	const book = BOOKS.find(b => b.id === bookId)
	const sources = book ? getBookSources(book) : []

	const [activeSource, setActiveSource] = useState(0)
	const [showSources, setShowSources] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const activeSourceIndex = Math.min(activeSource, Math.max(sources.length - 1, 0))
	const source = sources[activeSourceIndex] ?? sources[0]
	const cover = displayCover(book?.cover ?? '')

	const toggleFullscreen = useCallback(() => {
		const el = containerRef.current
		if (!el) return
		if (!document.fullscreenElement) {
			el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
		} else {
			document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
		}
	}, [])

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement)
		document.addEventListener('fullscreenchange', handler)
		return () => document.removeEventListener('fullscreenchange', handler)
	}, [])

	if (!book) {
		return (
			<div className='min-h-screen bg-secondary'>
				<Sidebar />
				<main className='lg:pl-64 pt-16 lg:pt-0 flex items-center justify-center min-h-screen'>
					<div className='text-center'>
						<div className='text-5xl mb-4'>📚</div>
						<h2 className='text-xl font-bold text-text-primary mb-2'>{t('library.bookNotFound')}</h2>
						<Link href='/library' className='text-primary hover:underline text-sm'>← Kutubxonaga qaytish</Link>
					</div>
				</main>
			</div>
		)
	}

	if (!source) {
		return (
			<div className='min-h-screen bg-secondary'>
				<Sidebar />
				<main className='lg:pl-64 pt-16 lg:pt-0 flex items-center justify-center min-h-screen'>
					<div className='text-center'>
						<div className='text-5xl mb-4'>🔗</div>
						<h2 className='text-xl font-bold text-text-primary mb-2'>{t('library.sourceNotFound')}</h2>
						<Link href='/library' className='text-primary hover:underline text-sm'>← Kutubxonaga qaytish</Link>
					</div>
				</main>
			</div>
		)
	}

	const embedUrl = source && isEmbeddableSource(source) ? source.embedUrl!.trim() : undefined
	const directUrl = source?.url

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 flex flex-col h-dvh'>
				{/* Top bar */}
				<div className='shrink-0 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-border bg-surface/60 backdrop-blur-sm'>
					<Link href='/library'
						className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'>
						<ArrowLeft className='w-4 h-4' />
					</Link>

					<div className='min-w-0 flex-1 flex items-center gap-3'>
						<span className='text-xl shrink-0'>{cover}</span>
						<div className='min-w-0'>
							<h1 className='text-sm font-bold text-text-primary truncate'>{book.title}</h1>
							<p className='text-xs text-text-secondary truncate'>{book.author} · {book.year}</p>
						</div>
					</div>

					{/* Source selector */}
					<div className='relative shrink-0'>
						<button onClick={() => setShowSources(!showSources)}
							className='flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-light border border-border text-xs font-medium text-text-primary hover:border-primary/30 transition-colors'>
							<SourceIcon type={source.type} />
							<span className='hidden sm:inline'>{source?.label}</span>
							<ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform ${showSources ? 'rotate-180' : ''}`} />
						</button>

						<AnimatePresence>
							{showSources && (
								<motion.div
									initial={{ opacity: 0, y: -6, scale: 0.97 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -6, scale: 0.97 }}
									transition={{ duration: 0.15 }}
									className='absolute right-0 top-full mt-1.5 w-52 bg-surface border border-border rounded-xl shadow-xl z-30 overflow-hidden'
								>
									{sources.map((s, i) => {
										const meta = SOURCE_LABELS[s.type]
										return (
											<button key={i} onClick={() => { setActiveSource(i); setShowSources(false) }}
												className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-surface-light text-left ${
													activeSourceIndex === i ? 'text-primary bg-primary/5' : 'text-text-secondary'
												}`}>
												<SourceIcon type={s.type} />
												<div className='min-w-0'>
													<p className={`text-xs font-medium ${activeSourceIndex === i ? 'text-primary' : 'text-text-primary'}`}>{s.label}</p>
													<p className='text-[10px] text-text-secondary'>{meta.label}</p>
												</div>
											</button>
										)
									})}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* External link */}
					{directUrl && (
						<a href={directUrl} target='_blank' rel='noopener noreferrer'
							className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'
							title='Yangi oynada ochish'>
							<ExternalLink className='w-4 h-4' />
						</a>
					)}

					{/* Fullscreen */}
					<button onClick={toggleFullscreen}
						className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'>
						{isFullscreen ? <Minimize2 className='w-4 h-4' /> : <Maximize2 className='w-4 h-4' />}
					</button>
				</div>

				{/* Source info bar */}
				{source && (
					<div className={`shrink-0 flex items-center justify-between px-4 sm:px-6 py-2 border-b border-border ${SOURCE_LABELS[source.type].bg}`}>
						<div className='flex items-center gap-2'>
							<span className='text-sm'><SourceIcon type={source.type} /></span>
							<span className={`text-xs font-medium ${SOURCE_LABELS[source.type].color}`}>
								{SOURCE_LABELS[source.type].label} — {source.label}
							</span>
						</div>
						<a href={directUrl} target='_blank' rel='noopener noreferrer'
							className={`text-xs font-medium flex items-center gap-1 hover:underline ${SOURCE_LABELS[source.type].color}`}>
							To&apos;g&apos;ridan-to&apos;g&apos;ri o&apos;tish <ExternalLink className='w-3 h-3' />
						</a>
					</div>
				)}

				{/* Reader area */}
				<div ref={containerRef} className='flex-1 overflow-hidden bg-white dark:bg-[#1a1f2e]'>
					{embedUrl ? (
						<IframeReader key={embedUrl} src={embedUrl} title={book.title} />
					) : (
						<div className='h-full flex flex-col items-center justify-center p-8'>
							<div className='max-w-sm text-center'>
								<div className='text-6xl mb-4'>{cover}</div>
								<h2 className='text-lg font-bold text-text-primary mb-2'>{book.title}</h2>
								<p className='text-sm text-text-secondary mb-6'>
									Bu kitob bevosita o&apos;qish uchun mavjud emas. Quyidagi havoladan o&apos;qishingiz mumkin:
								</p>
								{sources.map((s, i) => (
									<a key={i} href={s.url} target='_blank' rel='noopener noreferrer'
										className='flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border hover:border-primary/30 text-sm font-medium text-text-primary hover:text-primary transition-all mb-2'>
										<SourceIcon type={s.type} />
										<span>{s.label}</span>
										<ExternalLink className='w-3.5 h-3.5 ml-auto text-text-secondary' />
									</a>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Bottom: other source quick-switch */}
				{sources.length > 1 && (
					<div className='shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2 border-t border-border bg-surface/50 overflow-x-auto'>
						<span className='text-xs text-text-secondary shrink-0'>{t('library.otherSources')}</span>
						{sources.map((s, i) => {
							if (i === activeSourceIndex) return null
							const meta = SOURCE_LABELS[s.type]
							return (
								<button key={i} onClick={() => setActiveSource(i)}
									className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${meta.bg} ${meta.color}`}>
									<SourceIcon type={s.type} />
									{s.label}
								</button>
							)
						})}
					</div>
				)}
			</main>
		</div>
	)
}

export default function LibraryReadPage() {
	return (
		<Suspense fallback={
			<div className='min-h-screen bg-secondary flex items-center justify-center'>
				<Loader2 className='w-8 h-8 text-primary animate-spin' />
			</div>
		}>
			<ReaderContent />
		</Suspense>
	)
}
