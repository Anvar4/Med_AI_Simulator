'use client'

import CaseCard from '@/components/cases/CaseCard';
import Sidebar from '@/components/layout/Sidebar';
import { api, BackendCase } from '@/lib/api';
import { motion } from 'framer-motion';
import { Filter, Loader2, Search } from 'lucide-react';
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
							Klinik Holatlar
						</h1>
						<p className='text-text-secondary'>
								O&apos;zingizga mos klinik holatni tanlang
						</p>
					</motion.div>

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
									placeholder='Klinik holat qidiring...'
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
