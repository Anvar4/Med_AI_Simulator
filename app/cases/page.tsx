'use client'

import CaseCard from '@/components/cases/CaseCard';
import Sidebar from '@/components/layout/Sidebar';
import { api, BackendCase, RecommendedCase } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/language-context';
import { motion } from 'framer-motion';
import { Filter, Loader2, Search, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const types = [
	{ value: 'all', label: 'Barchasi' },
	{ value: 'diagnostika', label: 'Diagnostika' },
	{ value: 'jarrohlik', label: 'Jarrohlik' },
	{ value: 'shoshilinch', label: 'Shoshilinch' },
]

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.08 } },
}

export default function CasesPage() {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('Barchasi')
	const [selectedType, setSelectedType] = useState('all')
	const [cases, setCases] = useState<BackendCase[]>([])
	const [categories, setCategories] = useState<string[]>([])
	const [loading, setLoading] = useState(true)
	const [recommendations, setRecommendations] = useState<RecommendedCase[]>([])
	const { user } = useAuth()
	const { t } = useT()
	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const loadCases = useCallback(async (search: string, category: string, type: string) => {
		setLoading(true)
		try {
			const res = await api.cases.getAll({
				search: search || undefined,
				category: category === 'Barchasi' ? undefined : category,
				type: type === 'all' ? undefined : type,
				status: 'published',
				withMedia: true,
				limit: 50,
			})
			setCases(res.cases)
		} catch {
			// silent
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		async function loadCategories() {
			try {
				const res = await api.cases.getCategories()
				setCategories(res.categories)
			} catch { /* silent */ }
		}
		loadCategories()
	}, [])

	useEffect(() => { loadCases(searchQuery, selectedCategory, selectedType) }, [selectedCategory, selectedType, loadCases, searchQuery])

	// Adaptive recommendations for the signed-in learner.
	useEffect(() => {
		if (!user) { setRecommendations([]); return }
		api.learning.recommendations({ limit: 4 })
			.then(res => setRecommendations(res.recommendations))
			.catch(() => setRecommendations([]))
	}, [user])

	function handleSearchChange(v: string) {
		setSearchQuery(v)
		if (searchTimeout.current) clearTimeout(searchTimeout.current)
		searchTimeout.current = setTimeout(() => loadCases(v, selectedCategory, selectedType), 400)
	}

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'>
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='mb-8'
					>
						<h1 className='text-2xl sm:text-3xl font-bold text-text-primary mb-2'>
							{t('nav.cases')}
						</h1>
						<p className='text-text-secondary'>
								{t('cases.subtitle')}
						</p>
					</motion.div>

					{/* Adaptive recommendations */}
					{recommendations.length > 0 && (
						<motion.div
							initial='hidden'
							animate='visible'
							variants={fadeIn}
							className='mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5'
						>
							<div className='flex items-center gap-2 mb-3'>
								<Sparkles className='w-4 h-4 text-primary' />
								<h2 className='text-sm font-bold text-text-primary'>{t('cases.recommendedForYou')}</h2>
								<span className='text-xs text-text-secondary'>{t('cases.adaptedToLevel')}</span>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
								{recommendations.map(c => (
									<a
										key={c._id}
										href={`/cases/${c._id}`}
										className='block rounded-xl border border-border bg-surface p-3 hover:border-primary/50 transition-colors'
									>
										<div className='flex items-center gap-1.5 mb-1.5'>
											<span className='text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary'>{c.category}</span>
											<span className='text-[10px] text-text-secondary'>{'★'.repeat(Math.min(5, c.difficulty))}</span>
										</div>
										<p className='text-sm font-semibold text-text-primary line-clamp-2'>{c.title}</p>
									</a>
								))}
							</div>
						</motion.div>
					)}

					{/* Filters */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='mb-6 space-y-4'
					>
						{/* Search */}
						<div className='relative max-w-md'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary' />
							<input
								type='text'
									placeholder={t('cases.searchPlaceholder')}
								value={searchQuery}
								onChange={e => handleSearchChange(e.target.value)}
								className='w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
							/>
						</div>

						{/* Category tabs */}
						<div className='flex flex-wrap gap-2'>
							{['Barchasi', ...categories].map(cat => (
								<button
									key={cat}
									onClick={() => setSelectedCategory(cat)}
									className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
										selectedCategory === cat
											? 'bg-primary text-secondary'
											: 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/30'
									}`}
								>
									{cat}
								</button>
							))}
						</div>

						{/* Type filter */}
						<div className='flex items-center gap-2'>
							<Filter className='w-4 h-4 text-text-secondary' />
							<div className='flex gap-2'>
								{types.map(t => (
									<button
										key={t.value}
										onClick={() => setSelectedType(t.value)}
										className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
											selectedType === t.value
												? 'bg-primary/15 text-primary border border-primary/20'
												: 'bg-surface-light text-text-secondary hover:text-text-primary'
										}`}
									>
										{t.label}
									</button>
								))}
							</div>
						</div>
					</motion.div>

					{/* Cases Grid */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={stagger}
						className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
					>
						{loading ? (
							<div className='col-span-full flex justify-center py-16'>
								<Loader2 className='w-8 h-8 text-primary animate-spin' />
							</div>
						) : cases.map(c => (
							<motion.div key={c._id} variants={fadeIn}>
								<CaseCard
									id={c._id}
									title={c.title}
									authorName={c.authorName}
									category={c.category}
									difficulty={c.difficulty}
									type={c.type}
									isPremium={c.isPremium}
									completionRate={0}
								/>
							</motion.div>
						))}
					</motion.div>

					{!loading && cases.length === 0 && (
						<div className='text-center py-16'>
							<p className='text-text-secondary text-lg'>
									Hech qanday klinik holat topilmadi
							</p>
							<p className='text-text-secondary text-sm mt-2'>
								Filtrlarni o&apos;zgartirib ko&apos;ring
							</p>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
