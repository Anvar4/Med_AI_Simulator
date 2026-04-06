'use client'

import CaseCard from '@/components/cases/CaseCard';
import ActivityChart from '@/components/charts/ActivityChart';
import Sidebar from '@/components/layout/Sidebar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import StatCard from '@/components/ui/StatCard';
import { api, BackendCase, DashboardStats } from '@/lib/api';
import { canAccessContentManager, useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Calendar, Flame, Loader2, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
}

const DAY_LABELS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

function makeDemoCase(
	id: string,
	title: string,
	category: string,
	type: BackendCase['type'],
	difficulty: number,
	isPremium = false,
	authorName = 'Dr. Demo'
): BackendCase {
	const now = new Date().toISOString()
	return {
		_id: id,
		caseId: id,
		title,
		authorName,
		category,
		difficulty,
		type,
		isPremium,
		description: 'Demo klinik holat',
		status: 'published',
		patient: {
			name: 'Demo Bemor',
			age: 45,
			gender: 'Erkak',
			ageGroup: 'Katta yoshli',
			vitals: { bp: '130/85', hr: '88', temp: '36.7', spo2: '97' },
			complaints: 'Demo shikoyatlari',
			history: 'Demo anamnez',
		},
		correctDiagnosis: 'Demo tashxis',
		correctTreatment: 'Demo davolash rejasi',
		tests: ['EKG', 'QON ANALIZ'],
		timeLimit: type === 'shoshilinch' ? 300 : 600,
		createdAt: now,
		updatedAt: now,
	}
}

const DEMO_DASHBOARD_CASES: BackendCase[] = [
	makeDemoCase('demo-case-1', 'Ko‘krak og‘rig‘i va nafas qisilishi', 'Kardiologiya', 'diagnostika', 3, false, 'Dr. Sardor Karimov'),
	makeDemoCase('demo-case-2', 'Qorin og‘rig‘i va isitma', 'Jarrohlik', 'shoshilinch', 4, true, 'Dr. Nilufar Toirova'),
	makeDemoCase('demo-case-3', 'Keskin bosh og‘rig‘i', 'Nevrologiya', 'diagnostika', 2, false, 'Dr. Dildora Islomova'),
]

const DEMO_DASHBOARD_STATS: DashboardStats = {
	totalCases: 34,
	avgScore: 78.6,
	weeklyCount: 11,
	streak: 6,
	categoryScores: [
		{ _id: 'Kardiologiya', avgScore: 82.4, count: 10 },
		{ _id: 'Nevrologiya', avgScore: 75.2, count: 8 },
		{ _id: 'Jarrohlik', avgScore: 69.8, count: 7 },
		{ _id: 'Pediatriya', avgScore: 80.1, count: 9 },
	],
	weeklyActivity: [
		{ _id: 0, count: 1 },
		{ _id: 1, count: 2 },
		{ _id: 2, count: 1 },
		{ _id: 3, count: 3 },
		{ _id: 4, count: 2 },
		{ _id: 5, count: 1 },
		{ _id: 6, count: 1 },
	],
	recentAttempts: [],
}

export default function DashboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [cases, setCases] = useState<BackendCase[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (user && canAccessContentManager(user.role)) {
			router.replace('/content-manager')
			return
		}
	}, [user, router])

	useEffect(() => {
		if (user && canAccessContentManager(user.role)) return
		async function load() {
			try {
				const [dashRes, casesRes] = await Promise.all([
					api.attempts.getDashboard(),
					api.cases.getAll({ limit: 3 }),
				])
				setStats(dashRes.stats)
				setCases(casesRes.cases)
			} catch {
				// silent
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [user])

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

	const hasRealStats = !!stats && (
		stats.totalCases > 0 ||
		stats.weeklyCount > 0 ||
		stats.categoryScores.length > 0 ||
		stats.weeklyActivity.length > 0
	)

	const safeStats = hasRealStats ? stats! : DEMO_DASHBOARD_STATS
	const safeCases = cases.length > 0 ? cases : DEMO_DASHBOARD_CASES
	const isDemoMode = !hasRealStats || cases.length === 0

	const weeklyActivity = (safeStats.weeklyActivity ?? []).map(w => ({ day: DAY_LABELS[w._id] ?? `${w._id}`, count: w.count }))
	const continueAttempt = safeStats.continueCase
	const continueCaseData = (continueAttempt?.case as BackendCase | undefined) ?? safeCases[0]

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'>
					{/* Header */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='mb-8'
					>
						<h1 className='text-2xl sm:text-3xl font-bold text-text-primary mb-2'>
							Xush kelibsiz! 👋
						</h1>
						<p className='text-text-secondary'>
							Bugungi mashg&apos;ulotingizni davom eting
						</p>
						{isDemoMode && (
							<p className='text-xs text-primary mt-2'>Demo ma&apos;lumotlar ko&apos;rsatilmoqda</p>
						)}
					</motion.div>

					{/* Stats Grid */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={stagger}
						className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'
					>
						<motion.div variants={fadeIn}>
							<StatCard
								icon={<BookOpen className='w-5 h-5' />}
								value={safeStats.totalCases}
								label='Jami yechilgan klinik holatlar'
							/>
						</motion.div>
						<motion.div variants={fadeIn}>
							<StatCard
								icon={<Target className='w-5 h-5' />}
								value={Math.round(safeStats.avgScore)}
								label="O'rtacha ball"
							/>
						</motion.div>
						<motion.div variants={fadeIn}>
							<StatCard
								icon={<Calendar className='w-5 h-5' />}
								value={safeStats.weeklyCount}
								label='Bu hafta'
							/>
						</motion.div>
						<motion.div variants={fadeIn}>
							<StatCard
								icon={<Flame className='w-5 h-5' />}
								value={`${safeStats.streak} kun 🔥`}
								label='Streak'
							/>
						</motion.div>
					</motion.div>

					<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
						{/* Activity Chart */}
						<motion.div
							initial='hidden'
							animate='visible'
							variants={fadeIn}
							className='lg:col-span-2'
						>
							<Card hover={false}>
								<h3 className='text-lg font-semibold text-text-primary mb-6'>
									Haftalik Faollik
								</h3>
								<ActivityChart data={weeklyActivity} />
							</Card>
						</motion.div>

						{/* Career Progress */}
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false} className='h-full'>
								<h3 className='text-lg font-semibold text-text-primary mb-6'>
									Karyera Progress
								</h3>
								<div className='space-y-5'>
									{(safeStats.categoryScores ?? []).map(
										(cat) => (
											<div key={cat._id}>
												<div className='flex justify-between items-center mb-2'>
													<span className='text-sm text-text-secondary'>
														{cat._id}
													</span>
													<span className='text-sm font-semibold text-text-primary'>
														{Math.round(cat.avgScore)}%
													</span>
												</div>
												<ProgressBar
													value={Math.round(cat.avgScore)}
													color={
														cat.avgScore >= 90
															? 'success'
															: cat.avgScore >= 70
																? 'primary'
																: cat.avgScore >= 50
																	? 'warning'
																	: 'danger'
													}
												/>
											</div>
										),
									)}
								</div>
							</Card>
						</motion.div>
					</div>

					{/* Continue Learning */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='mb-8'
					>
						{continueCaseData && (
						<Card hover={false}>
							<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
								<div className='flex-1'>
									<div className='flex items-center gap-2 mb-2'>
										<Badge>{continueCaseData.category}</Badge>
										<span className='text-xs text-text-secondary'>
											{continueAttempt ? 'Davom etilmoqda' : 'Demo tavsiya'}
										</span>
									</div>
									<h3 className='text-base font-semibold text-text-primary mb-3'>
										{continueCaseData.title}
									</h3>
								</div>
								<Link href={`/cases/${continueCaseData._id}`}>
									<Button size='sm'>
										Davom ettirish <ArrowRight className='w-4 h-4' />
									</Button>
								</Link>
							</div>
						</Card>
						)}
					</motion.div>

					{/* Recommended Cases */}
					<motion.div initial='hidden' animate='visible' variants={stagger}>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-lg font-semibold text-text-primary'>
								Tavsiya etilgan klinik holatlar
							</h3>
							<Link href='/cases'>
								<Button variant='ghost' size='sm'>
									Barchasi <ArrowRight className='w-4 h-4' />
								</Button>
							</Link>
						</div>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
							{safeCases.map(c => (
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
						</div>
					</motion.div>
				</div>
			</main>
		</div>
	)
}
