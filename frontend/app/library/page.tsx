'use client'

import Sidebar from '@/components/layout/Sidebar';
import { Book, BookLang, BOOKS, CATEGORIES, getBookSources, isEmbeddableSource, LANG_LABELS, SOURCE_LABELS } from '@/lib/library-data';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    ExternalLink,
    Filter,
    Globe,
    Search,
    Sparkles,
    Star,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const langColor: Record<BookLang, string> = {
	uz: 'text-primary bg-primary/10 border-primary/20',
	ru: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
	en: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

function displayCover(cover: string): string {
	return cover === '[BOOK]' ? '📘' : cover
}

// ─── Book Detail Modal ────────────────────────────────────────────────────────
function BookModal({ book, onClose }: { book: Book; onClose: () => void }) {
	const sources = getBookSources(book)
	const cover = displayCover(book.cover)

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
						<div className='text-5xl shrink-0 w-16 h-20 bg-surface-light rounded-xl flex items-center justify-center'>
							{cover}
						</div>
						<div className='min-w-0 flex-1 pr-8'>
							<div className='flex flex-wrap gap-2 mb-2'>
								<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${langColor[book.lang]}`}>
									{LANG_LABELS[book.lang]}
								</span>
								{book.isNew && (
									<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20'>
										<Sparkles className='w-3 h-3' /> Yangi
									</span>
								)}
								{book.isFeatured && (
									<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20'>
										<Star className='w-3 h-3' /> Tavsiya
									</span>
								)}
							</div>
							<h2 className='text-base font-bold text-text-primary leading-snug'>{book.title}</h2>
							<p className='text-sm text-text-secondary mt-1'>{book.author}</p>
						</div>
					</div>
				</div>

				{/* Body */}
				<div className='p-6 space-y-4'>
					<p className='text-sm text-text-secondary leading-relaxed'>{book.description}</p>

					<div className='grid grid-cols-3 gap-3'>
						<div className='bg-surface-light rounded-xl p-3 text-center'>
							<p className='text-lg font-bold text-text-primary'>{book.year}</p>
							<p className='text-[10px] text-text-secondary'>Yil</p>
						</div>
						<div className='bg-surface-light rounded-xl p-3 text-center'>
							<p className='text-lg font-bold text-text-primary'>{book.pages.toLocaleString()}</p>
							<p className='text-[10px] text-text-secondary'>Sahifa</p>
						</div>
						<div className='bg-surface-light rounded-xl p-3 text-center'>
							<p className='text-xs font-bold text-text-primary'>{CATEGORIES.find(c => c.value === book.category)?.label}</p>
							<p className='text-[10px] text-text-secondary'>Soha</p>
						</div>
					</div>

					<div className='flex flex-wrap gap-1.5'>
						{book.tags.map(tag => (
							<span key={tag} className='px-2.5 py-1 text-xs rounded-lg bg-surface-light text-text-secondary border border-border'>
								#{tag}
							</span>
						))}
					</div>

					{/* Read sources */}
					<div>
						<p className='text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'>O&apos;qish manbalari</p>
						<div className='flex flex-col gap-2'>
							{sources.map((s, i) => {
								const meta = SOURCE_LABELS[s.type]
								const hasEmbed = isEmbeddableSource(s)
								return (
									<div key={i} className='flex items-center gap-2'>
										{hasEmbed ? (
											<Link href={`/library/read?id=${book.id}`} onClick={onClose}
												className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] ${meta.bg} ${meta.color}`}>
												<span className='text-base'>{s.type === 'archive' ? '🏛️' : s.type === 'ncbi' ? '🧬' : s.type === 'pdf' ? '📄' : s.type === 'google' ? '📖' : '🌐'}</span>
												<span className='flex-1 truncate'>{s.label}</span>
												<BookOpen className='w-4 h-4 shrink-0' />
											</Link>
										) : (
											<a href={s.url} target='_blank' rel='noopener noreferrer'
												className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] ${meta.bg} ${meta.color}`}>
												<span className='text-base'>{s.type === 'archive' ? '🏛️' : s.type === 'ncbi' ? '🧬' : s.type === 'pdf' ? '📄' : s.type === 'google' ? '📖' : '🌐'}</span>
												<span className='flex-1 truncate'>{s.label}</span>
												<ExternalLink className='w-4 h-4 shrink-0' />
											</a>
										)}
									</div>
								)
							})}
						</div>
					</div>

					{/* Big read button */}
					<Link href={`/library/read?id=${book.id}`} onClick={onClose}
						className='flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors'>
						<BookOpen className='w-4 h-4' />
						Kitobni o&apos;qish
					</Link>
				</div>
			</motion.div>
		</motion.div>
	)
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
	const cover = displayCover(book.cover)

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
				<div className='w-12 h-14 rounded-xl bg-surface-light flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-300'>
					{cover}
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap gap-1.5 mb-1.5'>
						<span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${langColor[book.lang]}`}>
							{LANG_LABELS[book.lang]}
						</span>
						{book.isNew && (
							<span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-success/10 text-success border border-success/20'>
								<Sparkles className='w-2.5 h-2.5' /> Yangi
							</span>
						)}
						{book.isFeatured && (
							<span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20'>
								<Star className='w-2.5 h-2.5' /> Top
							</span>
						)}
					</div>
					<h3 className='text-sm font-semibold text-text-primary leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200'>
						{book.title}
					</h3>
				</div>
			</div>

			<p className='text-xs text-text-secondary truncate cursor-pointer' onClick={onClick}>{book.author} · {book.year}</p>

			<p className='text-xs text-text-secondary leading-relaxed line-clamp-2 flex-1 cursor-pointer' onClick={onClick}>
				{book.description}
			</p>

			{/* Source badges */}
			<div className='flex flex-wrap gap-1'>
				{book.sources.map((s, i) => {
					const meta = SOURCE_LABELS[s.type]
					return (
						<span key={i} className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border ${meta.bg} ${meta.color}`}>
							{s.type === 'archive' ? '🏛️' : s.type === 'ncbi' ? '🧬' : s.type === 'pdf' ? '📄' : s.type === 'google' ? '📖' : '🌐'} {s.type.toUpperCase()}
						</span>
					)
				})}
			</div>

			{/* Buttons */}
			<div className='flex gap-2 pt-1 border-t border-border'>
				<Link href={`/library/read?id=${book.id}`}
					className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all duration-200'>
					<BookOpen className='w-3.5 h-3.5' />
					O&apos;qish
				</Link>
				<button onClick={onClick}
					className='flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-surface-light border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-border transition-all duration-200'>
					<ChevronRight className='w-3.5 h-3.5' />
					Batafsil
				</button>
			</div>
		</motion.div>
	)
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function LibraryPage() {
	const [search, setSearch] = useState('')
	const [selectedLang, setSelectedLang] = useState<BookLang | 'all'>('all')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [selectedBook, setSelectedBook] = useState<Book | null>(null)
	const [showFilters, setShowFilters] = useState(false)
	const [sortBy, setSortBy] = useState<'title' | 'year' | 'pages'>('title')

	const filtered = useMemo(() => {
		const result = BOOKS.filter(b => {
			const q = search.toLowerCase().trim()
			const matchSearch = !q ||
				b.title.toLowerCase().includes(q) ||
				b.author.toLowerCase().includes(q) ||
				b.tags.some(t => t.toLowerCase().includes(q)) ||
				b.description.toLowerCase().includes(q)
			const matchLang = selectedLang === 'all' || b.lang === selectedLang
			const matchCat = selectedCategory === 'all' || b.category === selectedCategory
			return matchSearch && matchLang && matchCat
		})
		result.sort((a, b) => {
			if (sortBy === 'year') return b.year - a.year
			if (sortBy === 'pages') return b.pages - a.pages
			return a.title.localeCompare(b.title)
		})
		return result
	}, [search, selectedLang, selectedCategory, sortBy])

	const stats = useMemo(() => ({
		total: BOOKS.length,
		uz: BOOKS.filter(b => b.lang === 'uz').length,
		ru: BOOKS.filter(b => b.lang === 'ru').length,
		en: BOOKS.filter(b => b.lang === 'en').length,
	}), [])

	const isFiltered = search || selectedLang !== 'all' || selectedCategory !== 'all'

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
								<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>Tibbiy Kutubxona</h1>
								<p className='text-sm text-text-secondary'>O&apos;zbek · Rus · Ingliz tillarida {stats.total} ta tibbiy adabiyot</p>
							</div>
						</div>
					</motion.div>

					{/* Stats */}
					<motion.div variants={fadeIn} initial='hidden' animate='visible'
						className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
						{[
							{ label: "Jami kitoblar", value: stats.total, icon: '📚', color: 'text-primary' },
							{ label: "O&apos;zbekcha",  value: stats.uz,    icon: '🇺🇿', color: 'text-primary' },
							{ label: 'Ruscha',         value: stats.ru,    icon: '🇷🇺', color: 'text-blue-400' },
							{ label: 'Inglizcha',      value: stats.en,    icon: '🇬🇧', color: 'text-amber-400' },
						].map(s => (
							<div key={s.label} className='bg-surface rounded-xl border border-border p-4 flex items-center gap-3'>
								<span className='text-2xl'>{s.icon}</span>
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
									placeholder="Kitob nomi, muallif yoki kalit so&apos;z..."
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
								<span className='hidden sm:inline'>Filter</span>
							</button>
						</div>

						{/* Language tabs */}
						<div className='flex gap-2 flex-wrap'>
							{([
								{ value: 'all', label: 'Barchasi',  active: 'bg-primary text-white border-primary', inactive: 'bg-surface border-border text-text-secondary hover:text-text-primary' },
								{ value: 'uz',  label: "O'zbek",    active: 'bg-primary text-white border-primary', inactive: 'bg-primary/5 border-primary/15 text-primary' },
								{ value: 'ru',  label: 'Русский',   active: 'bg-blue-500 text-white border-blue-500', inactive: 'bg-blue-400/5 border-blue-400/20 text-blue-400' },
								{ value: 'en',  label: 'English',   active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-amber-400/5 border-amber-400/20 text-amber-400' },
							] as const).map(l => (
								<button key={l.value}
									onClick={() => setSelectedLang(l.value as BookLang | 'all')}
									className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
										selectedLang === l.value ? l.active : l.inactive
									}`}>
									<Globe className='w-3.5 h-3.5' />
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
											<p className='text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'>Kategoriya</p>
											<div className='flex flex-wrap gap-1.5'>
												{CATEGORIES.map(cat => (
													<button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
														className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
															selectedCategory === cat.value
																? 'bg-primary text-white'
																: 'bg-surface-light text-text-secondary hover:text-text-primary border border-border'
														}`}>
														{cat.label}
													</button>
												))}
											</div>
										</div>
										<div>
											<p className='text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'>Saralash</p>
											<div className='flex gap-1.5'>
												{[
													{ value: 'title', label: "Nomi bo&apos;yicha" },
													{ value: 'year',  label: 'Yangi avval' },
													{ value: 'pages', label: "Ko&apos;p betli" },
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
							<span className='font-semibold text-text-primary'>{filtered.length}</span> ta kitob topildi
						</p>
						{isFiltered && (
							<button onClick={() => { setSearch(''); setSelectedLang('all'); setSelectedCategory('all') }}
								className='text-xs text-primary hover:underline flex items-center gap-1'>
								<X className='w-3 h-3' /> Filterni tozalash
							</button>
						)}
					</div>

					{/* Featured */}
					{!isFiltered && (
						<motion.div variants={fadeIn} initial='hidden' animate='visible' className='mb-8'>
							<div className='flex items-center gap-2 mb-4'>
								<Star className='w-4 h-4 text-amber-400' />
								<h2 className='text-base font-bold text-text-primary'>Tavsiya etilgan kitoblar</h2>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
								{BOOKS.filter(b => b.isFeatured).map(book => (
									<BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
								))}
							</div>
						</motion.div>
					)}

					{/* New */}
					{!isFiltered && (
						<motion.div variants={fadeIn} initial='hidden' animate='visible' className='mb-8'>
							<div className='flex items-center gap-2 mb-4'>
								<Sparkles className='w-4 h-4 text-success' />
								<h2 className='text-base font-bold text-text-primary'>Yangi qo&apos;shimchalar</h2>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
								{BOOKS.filter(b => b.isNew).map(book => (
									<BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
								))}
							</div>
						</motion.div>
					)}

					{/* All / Filtered */}
					<motion.div variants={fadeIn} initial='hidden' animate='visible'>
						{!isFiltered && (
							<div className='flex items-center gap-2 mb-4'>
								<BookOpen className='w-4 h-4 text-text-secondary' />
								<h2 className='text-base font-bold text-text-primary'>Barcha kitoblar</h2>
							</div>
						)}

						{filtered.length === 0 ? (
							<div className='text-center py-20'>
								<div className='text-6xl mb-4'>📚</div>
								<h3 className='text-lg font-semibold text-text-primary mb-2'>Kitob topilmadi</h3>
								<p className='text-sm text-text-secondary mb-4'>
									&quot;<strong>{search}</strong>&quot; so&apos;rovi bo&apos;yicha natija yo&apos;q
								</p>
								<button onClick={() => { setSearch(''); setSelectedLang('all'); setSelectedCategory('all') }}
									className='px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors'>
									Filterni tozalash
								</button>
							</div>
						) : (
							<motion.div layout className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
								<AnimatePresence mode='popLayout'>
									{filtered.map(book => (
										<BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
									))}
								</AnimatePresence>
							</motion.div>
						)}
					</motion.div>
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
