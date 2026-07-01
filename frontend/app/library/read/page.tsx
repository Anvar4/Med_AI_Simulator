'use client'

import Sidebar from '@/components/layout/Sidebar';
import { api, Book } from '@/lib/api';
import { useT } from '@/lib/language-context';
import {
    ArrowLeft,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// react-pdf brauzer-only API (DOMMatrix) ishlatadi — SSR/prerender'dan chiqarib,
// faqat client'da yuklaymiz.
const PdfReader = dynamic(() => import('@/components/library/PdfReader'), {
	ssr: false,
	loading: () => (
		<div className='h-full flex items-center justify-center bg-[#525659] dark:bg-[#1a1f2e]'>
			<Loader2 className='w-8 h-8 text-white/80 animate-spin' />
		</div>
	),
})

// Backend bazasi (upload manbalari nisbiy bo'lishi mumkin).
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

function resolveFileUrl(url: string): string {
	if (!url) return url
	if (/^https?:\/\//.test(url)) return url
	return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

function ReaderContent() {
	const { t } = useT()
	const params = useSearchParams()
	const bookId = params.get('id')

	const [book, setBook] = useState<Book | null>(null)
	const [loading, setLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)

	useEffect(() => {
		let alive = true
		if (!bookId) { setNotFound(true); setLoading(false); return }
		setLoading(true); setNotFound(false)
		api.books.get(bookId)
			.then(res => { if (alive) { setBook(res.book); setLoading(false) } })
			.catch(() => { if (alive) { setNotFound(true); setLoading(false) } })
		return () => { alive = false }
	}, [bookId])

	if (loading) {
		return (
			<div className='min-h-screen bg-secondary'>
				<Sidebar />
				<main className='lg:pl-64 pt-16 lg:pt-0 flex items-center justify-center min-h-screen'>
					<Loader2 className='w-8 h-8 text-primary animate-spin' />
				</main>
			</div>
		)
	}

	if (notFound || !book) {
		return (
			<div className='min-h-screen bg-secondary'>
				<Sidebar />
				<main className='lg:pl-64 pt-16 lg:pt-0 flex items-center justify-center min-h-screen'>
					<div className='text-center'>
						<div className='text-5xl mb-4'>📚</div>
						<h2 className='text-xl font-bold text-text-primary mb-2'>{t('library.bookNotFound')}</h2>
						<Link href='/library' className='text-primary hover:underline text-sm'>← {t('library.backToLibrary')}</Link>
					</div>
				</main>
			</div>
		)
	}

	const fileUrl = resolveFileUrl(book.fileUrl)

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

					<div className='min-w-0 flex-1'>
						<h1 className='text-sm font-bold text-text-primary truncate'>{book.title}</h1>
						<p className='text-xs text-text-secondary truncate'>{book.author}{book.year ? ` · ${book.year}` : ''}</p>
					</div>

					<a href={fileUrl} target='_blank' rel='noopener noreferrer'
						className='p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors shrink-0'
						title={t('library.openExternal')}>
						<ExternalLink className='w-4 h-4' />
					</a>
				</div>

				{/* Reader */}
				<div className='flex-1 overflow-hidden'>
					<PdfReader src={fileUrl} title={book.title} />
				</div>
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
