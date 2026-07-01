'use client'

import Sidebar from '@/components/layout/Sidebar';
import Flag, { FlagCode } from '@/components/ui/Flag';
import { api, Book, BookCategory } from '@/lib/api';
import { useT } from '@/lib/language-context';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    Download,
    Filter,
    Loader2,
    Search,
    Star,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const langBadge: Record<Book['language'], string> = {
	uz: 'text-primary bg-primary/10 border-primary/20',
	ru: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
	en: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

function CoverArt({ book, size = 'md' }: { book: Book; size?: 'sm' | 'md' | 'lg' }) {
	const cls = size === 'lg' ? 'w-16 h-20 text-4xl' : size === 'sm' ? 'w-12 h-14 text-2xl' : 'w-12 h-14 text-2xl'
	if (book.coverImage) {
		// eslint-disable-next-line @next/next/no-img-element
		return <img src={book.coverImage} alt={book.title} className={`${cls.split(' text-')[0]} rounded-xl object-cover shrink-0`} />
	}
	return (
		<div className={`${cls} rounded-xl bg-surface-light flex items-center justify-center shrink-0`}>
			📘
		</div>
	)
}

// ─── Book Detail Modal ────────────────────────────────────────────────────────
function BookModal({ book, onClose }: { book: Book; onClose: () => void }) {
	const { t } = useT()
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
			className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
		>
			<motion.div
				initial={{ scale: 0.93, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.93, opacity: 0, y: 20 }}
				transition={{ duration: 0.2 }}
				onClick={e => e.stopPropagation()}
				className='w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden'
			>
				{/* Header */}
				<div className='relative p-6 pb-4 border-b border-border'>
					<button onClick={onClose}
						className='absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors'>
						<X className='w-5 h-5' />
					</button>
					<div className='flex items-start gap-4'>
						<CoverArt book={book} size='lg' />
						<div className='min-w-0 flex-1 pr-8'>
							<div className='flex flex-wrap gap-2 mb-2 items-center'>
								<span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${langBadge[book.language]}`}>
									<Flag code={book.language as FlagCode} className='w-4 h-2.5 rounded-xs' />
									{book.language.toUpperCase()}
								</span>
								{book.isFeatured && (
									<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20'>
										<Star className='w-3 h-3' /> {t('library.featured')}
									</span>
								)}
							</div>
							<h2 className='text-base font-bold text-text-primary leading-snug'>{book.title}</h2>
							{book.author && <p className='text-sm text-text-secondary mt-1'>{book.author}</p>}
						</div>
					</div>
				</div>

				{/* Body */}
				<div className='p-6 space-y-4'>
					{book.description && <p className='text-sm text-text-secondary leading-relaxed'>{book.description}</p>}

					<div className='grid grid-cols-3 gap-3'>
						<div className='bg-surface-light rounded-xl p-3 text-center'>
							<p className='text-lg font-bold text-text-primary'>{book.year || '—'}</p>
							<p className='text-[10px] text-text-secondary'>{t('library.year')}</p>
						</div>
						<div className='bg-surface-light rounded-xl p-3 text-center'>
							<p className='text-lg font-bold text-text-primary'>{book.pages ? book.pages.toLocaleString() : '—'}</p>
							<p className='text-[10px] text-text-secondary'>{t('library.pages')}</p>
						</div>
						<div className='bg-surface-light rounded-xl p-3 text-center'>
							<p className='text-xs font-bold text-text-primary'>{book.category}</p>
							<p className='text-[10px] text-text-secondary'>{t('library.field')}</p>
						</div>
					</div>

					{book.tags.length > 0 && (
						<div className='flex flex-wrap gap-1.5'>
							{book.tags.map(tag => (
								<span key={tag} className='px-2.5 py-1 text-xs rounded-lg bg-surface-light text-text-secondary border border-border'>
									#{tag}
								</span>
							))}
						</div>
					)}

					{/* Big read button */}
					<div className='flex gap-2'>
						<Link href={`/library/read?id=${book._id}`} onClick={onClose}
							className='flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors'>
							<BookOpen className='w-4 h-4' />
							{t('library.read')}
						</Link>
						<a href={book.fileUrl} download target='_blank' rel='noopener noreferrer'
							className='flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-light border border-border text-text-secondary text-sm font-medium hover:text-text-primary transition-colors'
							title={t('library.download')}>
							<Download className='w-4 h-4' />
						</a>
					</div>
				</div>
			</motion.div>
		</motion.div>
	)
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
	const { t } = useT()
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.2 }}
			className='group bg-surface border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col gap-3'
		>
			{/* Cover + badges */}
			<div className='flex items-start gap-3 cursor-pointer' onClick={onClick}>
				<CoverArt book={book} />
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap gap-1.5 mb-1.5 items-center'>
						<span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${langBadge[book.language]}`}>
							<Flag code={book.language as FlagCode} className='w-3.5 h-2.5 rounded-xs' />
							{book.language.toUpperCase()}
						</span>
						{book.isFeatured && (
							<span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20'>
								<Star className='w-2.5 h-2.5' /> {t('library.top')}
							</span>
						)}
					</div>
					<h3 className='text-sm font-semibold text-text-primary leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200'>
						{book.title}
					</h3>
				</div>
			</div>

			<p className='text-xs text-text-secondary truncate cursor-pointer' onClick={onClick}>
				{book.author}{book.year ? ` · ${book.year}` : ''}
			</p>

			{book.description && (
				<p className='text-xs text-text-secondary leading-relaxed line-clamp-2 flex-1 cursor-pointer' onClick={onClick}>
					{book.description}
				</p>
			)}

			{/* Category badge */}
			<div className='flex flex-wrap gap-1'>
				<span className='px-1.5 py-0.5 text-[10px] font-medium rounded border border-border bg-surface-light text-text-secondary'>
					{book.category}
				</span>
			</div>

			{/* Buttons */}
			<div className='flex gap-2 pt-1 border-t border-border'>
				<Link href={`/library/read?id=${book._id}`}
					className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all duration-200'>
					<BookOpen className='w-3.5 h-3.5' />
					{t('library.read')}
				</Link>
				<button onClick={onClick}
					className='flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-surface-light border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-border transition-all duration-200'>
					<ChevronRight className='w-3.5 h-3.5' />
					{t('library.details')}
				</button>
			</div>
		</motion.div>
	)
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function LibraryPage() {
	const { t } = useT()
	const [books, setBooks] = useState<Book[]>([])
	const [categories, setCategories] = useState<BookCategory[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	const [search, setSearch] = useState('')
	const [selectedLang, setSelectedLang] = useState<Book['language'] | 'all'>('all')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [selectedBook, setSelectedBook] = useState<Book | null>(null)
	const [showFilters, setShowFilters] = useState(false)
	const [sortBy, setSortBy] = useState<'title' | 'year' | 'pages'>('title')

	const load = useCallback(async () => {
		setLoading(true); setError(false)
		try {
			const [list, cats] = await Promise.all([
				api.books.list({ limit: 60 }),
				api.books.categories().catch(() => ({ categories: [] as BookCategory[] })),
			])
			setBooks(list.books)
			setCategories(cats.categories)
		} catch {
			setError(true)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => { load() }, [load])

	const filtered = useMemo(() => {
		const result = books.filter(b => {
			const q = search.toLowerCase().trim()
			const matchSearch = !q ||
				b.title.toLowerCase().includes(q) ||
				b.author.toLowerCase().includes(q) ||
				b.tags.some(tg => tg.toLowerCase().includes(q)) ||
				b.description.toLowerCase().includes(q)
			const matchLang = selectedLang === 'all' || b.language === selectedLang
			const matchCat = selectedCategory === 'all' || b.category === selectedCategory
			return matchSearch && matchLang && matchCat
		})
		result.sort((a, b) => {
			if (sortBy === 'year') return (b.year || 0) - (a.year || 0)
			if (sortBy === 'pages') return (b.pages || 0) - (a.pages || 0)
			return a.title.localeCompare(b.title)
		})
		return result
	}, [books, search, selectedLang, selectedCategory, sortBy])

	const stats = useMemo(() => ({
		total: books.length,
		uz: books.filter(b => b.language === 'uz').length,
		ru: books.filter(b => b.language === 'ru').length,
		en: books.filter(b => b.language === 'en').length,
	}), [books])

	const featured = useMemo(() => books.filter(b => b.isFeatured), [books])
	const isFiltered = !!search || selectedLang !== 'all' || selectedCategory !== 'all'

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 pb-12'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

					{/* Header */}
					<motion.div variants={fadeIn} initial='hidden' animate='visible' className='mb-8'>
						<div className='flex items-center gap-3 mb-1'>
							<div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center'>
								<BookOpen className='w-5 h-5 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>{t('library.title')}</h1>
								<p className='text-sm text-text-secondary'>{t('library.subtitle').replace('{count}', String(stats.total))}</p>
							</div>
						</div>
					</motion.div>

					{loading ? (
						<div className='flex flex-col items-center justify-center py-32 gap-4'>
							<Loader2 className='w-8 h-8 text-primary animate-spin' />
							<p className='text-sm text-text-secondary'>{t('library.loadingBook')}</p>
						</div>
					) : error ? (
						<div className='text-center py-32'>
							<div className='text-5xl mb-4'>⚠️</div>
							<h3 className='text-lg font-semibold text-text-primary mb-2'>{t('library.loadFailed')}</h3>
							<button onClick={load}
								className='px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors'>
								{t('common.retry')}
							</button>
						</div>
					) : (
						<>
							{/* Stats */}
							<motion.div variants={fadeIn} initial='hidden' animate='visible'
								className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
								{[
									{ label: t('library.totalBooks'), value: stats.total, flag: null, color: 'text-primary' },
									{ label: "O'zbekcha", value: stats.uz, flag: 'uz' as FlagCode, color: 'text-primary' },
									{ label: 'Ruscha', value: stats.ru, flag: 'ru' as FlagCode, color: 'text-blue-400' },
									{ label: 'Inglizcha', value: stats.en, flag: 'en' as FlagCode, color: 'text-amber-400' },
								].map(s => (
									<div key={s.label} className='bg-surface rounded-xl border border-border p-4 flex items-center gap-3'>
										{s.flag ? <Flag code={s.flag} className='w-7 h-5 rounded-sm ring-1 ring-black/5' /> : <span className='text-2xl'>📚</span>}
										<div>
											<p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
											<p className='text-xs text-text-secondary'>{s.label}</p>
										</div>
									</div>
								))}
							</motion.div>

							{/* Search & filters */}
							<motion.div variants={fadeIn} initial='hidden' animate='visible' className='mb-6 space-y-3'>
								<div className='flex gap-2'>
									<div className='relative flex-1'>
										<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none' />
										<input
											type='text'
											placeholder={t('library.searchPlaceholder')}
											value={search}
											onChange={e => setSearch(e.target.value)}
											className='w-full pl-10 pr-10 py-2.5 text-sm bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all'
										/>
										{search && (
											<button onClick={() => setSearch('')}
												className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors'>
												<X className='w-4 h-4' />
											</button>
										)}
									</div>
									<button onClick={() => setShowFilters(!showFilters)}
										className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
											showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface border-border text-text-secondary hover:text-text-primary'
										}`}>
										<Filter className='w-4 h-4' />
										<span className='hidden sm:inline'>{t('library.filter')}</span>
									</button>
								</div>

								{/* Language tabs */}
								<div className='flex gap-2 flex-wrap'>
									{([
										{ value: 'all', label: t('library.all'), flag: null, active: 'bg-primary text-white border-primary', inactive: 'bg-surface border-border text-text-secondary hover:text-text-primary' },
										{ value: 'uz', label: "O'zbek", flag: 'uz' as FlagCode, active: 'bg-primary text-white border-primary', inactive: 'bg-primary/5 border-primary/15 text-primary' },
										{ value: 'ru', label: 'Русский', flag: 'ru' as FlagCode, active: 'bg-blue-500 text-white border-blue-500', inactive: 'bg-blue-400/5 border-blue-400/20 text-blue-400' },
										{ value: 'en', label: 'English', flag: 'en' as FlagCode, active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-amber-400/5 border-amber-400/20 text-amber-400' },
									] as const).map(l => (
										<button key={l.value}
											onClick={() => setSelectedLang(l.value as Book['language'] | 'all')}
											className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
												selectedLang === l.value ? l.active : l.inactive
											}`}>
											{l.flag ? <Flag code={l.flag} className='w-4 h-2.5 rounded-xs' /> : null}
											{l.label}
										</button>
									))}
								</div>

								{/* Expandable filter */}
								<AnimatePresence>
									{showFilters && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2 }}
											className='overflow-hidden'
										>
											<div className='bg-surface border border-border rounded-xl p-4 space-y-3'>
												<div>
													<p className='text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'>{t('library.category')}</p>
													<div className='flex flex-wrap gap-1.5'>
														<button onClick={() => setSelectedCategory('all')}
															className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
																selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary hover:text-text-primary border border-border'
															}`}>
															{t('library.all')}
														</button>
														{categories.map(cat => (
															<button key={cat.name} onClick={() => setSelectedCategory(cat.name)}
																className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
																	selectedCategory === cat.name
																		? 'bg-primary text-white'
																		: 'bg-surface-light text-text-secondary hover:text-text-primary border border-border'
																}`}>
																{cat.name} <span className='opacity-60'>({cat.count})</span>
															</button>
														))}
													</div>
												</div>
												<div>
													<p className='text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'>{t('library.sort')}</p>
													<div className='flex gap-1.5'>
														{[
															{ value: 'title', label: t('library.sortTitle') },
															{ value: 'year', label: t('library.sortNew') },
															{ value: 'pages', label: t('library.sortPages') },
														].map(s => (
															<button key={s.value} onClick={() => setSortBy(s.value as typeof sortBy)}
																className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
																	sortBy === s.value
																		? 'bg-primary text-white'
																		: 'bg-surface-light text-text-secondary hover:text-text-primary border border-border'
																}`}>
																{s.label}
															</button>
														))}
													</div>
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>

							{/* Results count */}
							<div className='flex items-center justify-between mb-4'>
								<p className='text-sm text-text-secondary'>
									<span className='font-semibold text-text-primary'>{filtered.length}</span> {t('library.booksFound')}
								</p>
								{isFiltered && (
									<button onClick={() => { setSearch(''); setSelectedLang('all'); setSelectedCategory('all') }}
										className='text-xs text-primary hover:underline flex items-center gap-1'>
										<X className='w-3 h-3' /> {t('library.clearFilter')}
									</button>
								)}
							</div>

							{/* Featured */}
							{!isFiltered && featured.length > 0 && (
								<motion.div variants={fadeIn} initial='hidden' animate='visible' className='mb-8'>
									<div className='flex items-center gap-2 mb-4'>
										<Star className='w-4 h-4 text-amber-400' />
										<h2 className='text-base font-bold text-text-primary'>{t('library.featuredBooks')}</h2>
									</div>
									<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
										{featured.map(book => (
											<BookCard key={book._id} book={book} onClick={() => setSelectedBook(book)} />
										))}
									</div>
								</motion.div>
							)}

							{/* All / Filtered */}
							<motion.div variants={fadeIn} initial='hidden' animate='visible'>
								{!isFiltered && (
									<div className='flex items-center gap-2 mb-4'>
										<BookOpen className='w-4 h-4 text-text-secondary' />
										<h2 className='text-base font-bold text-text-primary'>{t('library.allBooks')}</h2>
									</div>
								)}

								{filtered.length === 0 ? (
									<div className='text-center py-20'>
										<div className='text-6xl mb-4'>📚</div>
										<h3 className='text-lg font-semibold text-text-primary mb-2'>{t('library.noBooks')}</h3>
										<button onClick={() => { setSearch(''); setSelectedLang('all'); setSelectedCategory('all') }}
											className='px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors'>
											{t('library.clearFilter')}
										</button>
									</div>
								) : (
									<motion.div layout className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
										<AnimatePresence mode='popLayout'>
											{filtered.map(book => (
												<BookCard key={book._id} book={book} onClick={() => setSelectedBook(book)} />
											))}
										</AnimatePresence>
									</motion.div>
								)}
							</motion.div>
						</>
					)}
				</div>
			</main>

			{/* Modal */}
			<AnimatePresence>
				{selectedBook && (
					<BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
				)}
			</AnimatePresence>
		</div>
	)
}
