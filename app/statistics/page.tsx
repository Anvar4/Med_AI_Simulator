'use client'

import Sidebar from '@/components/layout/Sidebar'
import Card from '@/components/ui/Card'
import { api, UserStats } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import { Activity, Award, BarChart3, BookOpen, Brain, Stethoscope, Target, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

function SummaryCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
	return (
		<div className='bg-surface rounded-2xl p-4 border border-border flex items-start gap-3'>
			<div className='p-2.5 bg-primary/10 rounded-xl shrink-0'><Icon className='w-5 h-5 text-primary' /></div>
			<div>
				<p className='text-2xl font-bold text-text-primary'>{value}</p>
				<p className='text-xs text-text-secondary mt-0.5'>{label}</p>
				{sub && <p className='text-xs text-primary mt-0.5'>{sub}</p>}
			</div>
		</div>
	)
}

function ScoreBar({ value, max = 100, color = 'bg-primary' }: { value: number; max?: number; color?: string }) {
	const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
	return (
		<div className='w-full bg-surface-light rounded-full h-2 overflow-hidden'>
			<div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
		</div>
	)
}

export default function StatisticsPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [stats, setStats] = useState<UserStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!user) { router.push('/login'); return }
		api.stats.getMyStats()
			.then(data => setStats(data.stats))
			.catch(e => setError(e.message || 'Xatolik yuz berdi'))
			.finally(() => setLoading(false))
	}, [user, router])

	if (!user) return null

	if (loading) return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6 flex items-center justify-center min-h-screen'>
				<div className='flex flex-col items-center gap-3'>
					<div className='w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
					<p className='text-text-secondary text-sm'>Statistika yuklanmoqda...</p>
				</div>
			</main>
		</div>
	)

	if (error) return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6 flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<p className='text-accent'>{error}</p>
					<button onClick={() => window.location.reload()} className='mt-3 text-primary hover:underline text-sm'>Qayta urinish</button>
				</div>
			</main>
		</div>
	)

	const maxMonthCount = stats ? Math.max(...stats.monthlyActivity.map(m => m.count), 1) : 1

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6'>
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<h1 className='text-2xl sm:text-3xl font-bold text-text-primary mb-1'>Statistika</h1>
						<p className='text-text-secondary text-sm'>Sizning taraqqiyotingiz va natijalaringiz</p>
					</motion.div>

					{!stats || stats.totalAttempts === 0 ? (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='text-center py-10 space-y-3'>
									<BarChart3 className='w-12 h-12 text-text-secondary/30 mx-auto' />
									<p className='text-text-primary font-semibold'>Hozircha ma&apos;lumot yo&apos;q</p>
									<p className='text-text-secondary text-sm'>Klinik holatlarni yeching va statistikangiz shu yerda ko&apos;rinadi</p>
									<button onClick={() => router.push('/cases')} className='bg-primary text-secondary font-semibold px-5 py-2 rounded-xl text-sm mt-2'>
										Keyslarni boshlash
									</button>
								</div>
							</Card>
						</motion.div>
					) : (
						<>
							{/* Summary Cards */}
							<motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
								<SummaryCard label='Jami urinishlar' value={stats.totalAttempts} icon={BookOpen} />
							<SummaryCard label="O'rtacha ball" value={`${stats.avgScore}%`} icon={Target} sub={stats.avgScore >= 70 ? 'Yaxshi' : stats.avgScore >= 50 ? "O'rtacha" : 'Yaxshilash kerak'} />
							<SummaryCard label='Eng yaxshi natija' value={`${stats.bestResult?.score ?? 0}%`} icon={Award} />
								<SummaryCard label='Kategoriyalar' value={stats.categoryPerformance.length} icon={Brain} />
							</motion.div>

							{/* Monthly Activity */}
							<motion.div initial='hidden' animate='visible' variants={fadeIn}>
								<Card hover={false}>
									<div className='flex items-center gap-3 mb-5'>
										<div className='p-2.5 bg-primary/10 rounded-xl'><Activity className='w-5 h-5 text-primary' /></div>
										<h3 className='font-semibold text-text-primary'>Oylik faollik (oxirgi 6 oy)</h3>
									</div>
									<div className='flex items-end gap-2 h-40'>
										{stats.monthlyActivity.map(m => {
											const pct = maxMonthCount === 0 ? 0 : (m.count / maxMonthCount) * 100
											return (
												<div key={m.month} className='flex-1 flex flex-col items-center gap-1'>
													<p className='text-xs text-text-secondary'>{m.count}</p>
													<div className='w-full flex flex-col justify-end' style={{ height: '100px' }}>
														<div className='bg-primary/70 hover:bg-primary rounded-t-lg w-full transition-all duration-700' style={{ height: `${Math.max(4, pct)}%` }} />
													</div>
													<p className='text-[10px] text-text-secondary'>{m.month}</p>
												</div>
											)
										})}
									</div>
								</Card>
							</motion.div>

							{/* Category Performance */}
							{stats.categoryPerformance.length > 0 && (
								<motion.div initial='hidden' animate='visible' variants={fadeIn}>
									<Card hover={false}>
										<div className='flex items-center gap-3 mb-5'>
											<div className='p-2.5 bg-primary/10 rounded-xl'><Stethoscope className='w-5 h-5 text-primary' /></div>
											<h3 className='font-semibold text-text-primary'>Kategoriyalar bo&apos;yicha natijalar</h3>
										</div>
										<div className='space-y-4'>
											{stats.categoryPerformance.map(cat => (
												<div key={cat.category}>
													<div className='flex items-center justify-between mb-1'>
														<p className='text-sm text-text-primary capitalize'>{cat.category}</p>
														<div className='flex items-center gap-3'>
															<span className='text-xs text-text-secondary'>{cat.count} urinish</span>
															<span className='text-sm font-semibold text-text-primary'>{cat.avgScore}%</span>
														</div>
													</div>
													<ScoreBar value={cat.avgScore} color={cat.avgScore >= 75 ? 'bg-primary' : cat.avgScore >= 50 ? 'bg-yellow-500' : 'bg-accent'} />
												</div>
											))}
										</div>
									</Card>
								</motion.div>
							)}

							{/* Difficulty & Score Distribution */}
							<motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<Card hover={false}>
									<div className='flex items-center gap-3 mb-4'>
										<div className='p-2.5 bg-primary/10 rounded-xl'><TrendingUp className='w-5 h-5 text-primary' /></div>
										<h3 className='font-semibold text-text-primary'>Qiyinlik darajalari</h3>
									</div>
									<div className='space-y-3'>
										{stats.difficultyPerformance.length === 0 ? <p className='text-sm text-text-secondary'>Ma&apos;lumot yo&apos;q</p> : stats.difficultyPerformance.map(d => (
											<div key={d.difficulty}>
												<div className='flex justify-between text-sm mb-1'>
										<span className='text-text-primary capitalize'>{d.difficulty <= 2 ? 'Oson' : d.difficulty <= 3 ? "O'rta" : 'Qiyin'}</span>
													<span className='text-text-secondary font-medium'>{d.avgScore}% · {d.count}</span>
												</div>
												<ScoreBar value={d.avgScore} />
											</div>
										))}
									</div>
								</Card>

								<Card hover={false}>
									<div className='flex items-center gap-3 mb-4'>
										<div className='p-2.5 bg-primary/10 rounded-xl'><BarChart3 className='w-5 h-5 text-primary' /></div>
										<h3 className='font-semibold text-text-primary'>Ball taqsimoti</h3>
									</div>
									<div className='space-y-3'>
										{(() => {
											const dist = { '90-100': 0, '70-89': 0, '50-69': 0, '0-49': 0 }
											for (const r of stats.recentResults) {
												if (r.score >= 90) dist['90-100']++
												else if (r.score >= 70) dist['70-89']++
												else if (r.score >= 50) dist['50-69']++
												else dist['0-49']++
											}
											return ([
												{ label: '90-100%', key: '90-100' as const, color: 'bg-primary' },
												{ label: '70-89%', key: '70-89' as const, color: 'bg-yellow-500' },
												{ label: '50-69%', key: '50-69' as const, color: 'bg-orange-500' },
												{ label: '0-49%', key: '0-49' as const, color: 'bg-accent' },
											]).map(({ label, key, color }) => (
												<div key={key}>
													<div className='flex justify-between text-sm mb-1'>
														<span className='text-text-primary'>{label}</span>
														<span className='text-text-secondary'>{dist[key]}</span>
													</div>
													<ScoreBar value={dist[key]} max={Math.max(stats.totalAttempts, 1)} color={color} />
												</div>
											))
										})()}
									</div>
								</Card>
							</motion.div>

							{/* Recent Results */}
							{stats.recentResults.length > 0 && (
								<motion.div initial='hidden' animate='visible' variants={fadeIn}>
									<Card hover={false}>
										<div className='flex items-center gap-3 mb-4'>
											<div className='p-2.5 bg-primary/10 rounded-xl'><BookOpen className='w-5 h-5 text-primary' /></div>
											<h3 className='font-semibold text-text-primary'>So&apos;nggi natijalar</h3>
										</div>
										<div className='space-y-2'>
											{stats.recentResults.map((r, i) => (
												<div key={i} className='flex items-center justify-between p-3 bg-surface-light rounded-xl'>
													<div className='min-w-0 flex-1'>
														<p className='text-sm font-medium text-text-primary truncate'>{typeof r.case === 'object' ? r.case.title : 'Klinik holat'}</p>
														<p className='text-xs text-text-secondary'>{new Date(r.completedAt ?? r.createdAt).toLocaleDateString('uz-UZ')}</p>
													</div>
													<div className={`ml-3 text-sm font-bold px-2.5 py-1 rounded-lg ${r.score >= 70 ? 'bg-primary/10 text-primary' : r.score >= 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-accent/10 text-accent'}`}>
														{r.score}%
													</div>
												</div>
											))}
										</div>
									</Card>
								</motion.div>
							)}
						</>
					)}
				</div>
			</main>
		</div>
	)
}

