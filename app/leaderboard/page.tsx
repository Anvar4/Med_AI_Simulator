'use client'

import Sidebar from '@/components/layout/Sidebar';
import Card from '@/components/ui/Card';
import { api, LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { Clock, Medal, Star, Trophy, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.04 } }) }

function formatTime(seconds: number) {
	if (!seconds) return '0 daq'
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	if (h > 0) return `${h} s ${m} daq`
	return `${m} daq`
}

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-400', 'text-amber-600']
const MEDAL_BG = ['bg-yellow-400/10 border-yellow-400/30', 'bg-slate-400/10 border-slate-400/30', 'bg-amber-600/10 border-amber-600/30']

function Avatar({ name, avatar, size = 'md' }: { name: string; avatar: string | null; size?: 'sm' | 'md' | 'lg' }) {
	const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
	const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
	return (
		<div className={`${sizeClass} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden`}>
			{avatar
				// eslint-disable-next-line @next/next/no-img-element
				? <img src={avatar} alt={name} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
				: initials
			}
		</div>
	)
}

export default function LeaderboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [list, setList] = useState<LeaderboardEntry[]>([])
	const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!user) { router.push('/login'); return }
		api.stats.getLeaderboard()
			.then(data => {
				setList(data.leaderboard)
				setMyRank(data.currentUserRank)
			})
			.catch(e => setError(e.message || 'Xatolik yuz berdi'))
			.finally(() => setLoading(false))
	}, [user, router])

	if (!user) return null

	const studentList = useMemo(
		() => list
			.filter(entry => entry.role === 'student')
			.map((entry, idx) => ({
				...entry,
				rank: idx + 1,
				isCurrentUser: entry.userId === user.id || entry.isCurrentUser,
			})),
		[list, user.id],
	)

	const top3 = studentList.slice(0, 3)
	const rest = studentList.slice(3)

	const currentUserRank = useMemo(() => {
		const inTop100 = studentList.find(entry => entry.isCurrentUser)
		if (inTop100) return inTop100

		if (myRank && myRank.role === 'student') {
			return { ...myRank, isCurrentUser: true }
		}

		return null
	}, [studentList, myRank])

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6'>

					{/* Header */}
					<motion.div initial='hidden' animate='visible' custom={0} variants={fadeIn}>
						<div className='flex items-center gap-3 mb-1'>
							<div className='p-2.5 bg-primary/10 rounded-xl'>
								<Trophy className='w-6 h-6 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>Liderlar taxtasi</h1>
								<p className='text-text-secondary text-sm'>Eng yaxshi natijalarga ega foydalanuvchilar</p>
							</div>
						</div>
					</motion.div>

					{loading ? (
						<div className='flex items-center justify-center py-20'>
							<div className='w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
						</div>
					) : error ? (
						<Card hover={false}>
							<p className='text-center text-accent py-8'>{error}</p>
						</Card>
					) : studentList.length === 0 ? (
						<Card hover={false}>
							<div className='text-center py-12 space-y-3'>
								<Users className='w-12 h-12 text-text-secondary/30 mx-auto' />
								<p className='text-text-primary font-semibold'>Hozircha studentlar reytingi bo&apos;sh</p>
								<p className='text-text-secondary text-sm'>Birinchi bo&apos;ling!</p>
								<button onClick={() => router.push('/cases')} className='bg-primary text-secondary font-semibold px-5 py-2 rounded-xl text-sm'>
									Boshlash
								</button>
							</div>
						</Card>
					) : (
						<>
							{/* Top 3 podium */}
							{top3.length >= 1 && (
								<motion.div initial='hidden' animate='visible' custom={1} variants={fadeIn}>
									<div className='grid grid-cols-3 gap-3 items-end'>
										{/* 2nd place */}
										{top3[1] ? (
											<div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${top3[1].isCurrentUser ? 'border-primary bg-primary/5' : MEDAL_BG[1]}`}>
												<Medal className={`w-6 h-6 ${MEDAL_COLORS[1]}`} />
												<Avatar name={top3[1].name} avatar={top3[1].avatar} size='md' />
												<div className='text-center'>
													<p className={`text-sm font-bold truncate max-w-22.5 ${top3[1].isCurrentUser ? 'text-primary' : 'text-text-primary'}`}>{top3[1].name}</p>
													<p className='text-lg font-bold text-text-primary'>{top3[1].avgScore}%</p>
													<p className='text-xs text-text-secondary'>{top3[1].totalCompleted} holat</p>
												</div>
												<span className='text-2xl font-black text-text-secondary/40'>2</span>
											</div>
										) : <div />}

										{/* 1st place */}
										<div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${top3[0].isCurrentUser ? 'border-primary bg-primary/5' : MEDAL_BG[0]}`}>
											<Trophy className={`w-7 h-7 ${MEDAL_COLORS[0]}`} />
											<Avatar name={top3[0].name} avatar={top3[0].avatar} size='lg' />
											<div className='text-center'>
												<p className={`text-sm font-bold truncate max-w-22.5 ${top3[0].isCurrentUser ? 'text-primary' : 'text-text-primary'}`}>{top3[0].name}</p>
												<p className='text-xl font-bold text-text-primary'>{top3[0].avgScore}%</p>
												<p className='text-xs text-text-secondary'>{top3[0].totalCompleted} holat</p>
											</div>
											<span className='text-2xl font-black text-text-secondary/40'>1</span>
										</div>

										{/* 3rd place */}
										{top3[2] ? (
											<div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${top3[2].isCurrentUser ? 'border-primary bg-primary/5' : MEDAL_BG[2]}`}>
												<Medal className={`w-5 h-5 ${MEDAL_COLORS[2]}`} />
												<Avatar name={top3[2].name} avatar={top3[2].avatar} size='md' />
												<div className='text-center'>
													<p className={`text-sm font-bold truncate max-w-22.5 ${top3[2].isCurrentUser ? 'text-primary' : 'text-text-primary'}`}>{top3[2].name}</p>
													<p className='text-lg font-bold text-text-primary'>{top3[2].avgScore}%</p>
													<p className='text-xs text-text-secondary'>{top3[2].totalCompleted} holat</p>
												</div>
												<span className='text-2xl font-black text-text-secondary/40'>3</span>
											</div>
										) : <div />}
									</div>
								</motion.div>
							)}

							{/* Current user's rank card (always visible when available) */}
							{currentUserRank && (
								<motion.div initial='hidden' animate='visible' custom={2} variants={fadeIn}>
									<Card hover={false} className='border-primary/40'>
										<div className='flex items-center gap-3'>
											<span className='text-2xl font-black text-primary w-8 shrink-0'>#{currentUserRank.rank}</span>
											<Avatar name={currentUserRank.name} avatar={currentUserRank.avatar} />
											<div className='flex-1 min-w-0'>
												<p className='font-semibold text-primary truncate'>{currentUserRank.name} (Siz)</p>
												<p className='text-xs text-text-secondary'>Sizning o&apos;rningiz: #{currentUserRank.rank} · {currentUserRank.totalCompleted} ta klinik holat</p>
											</div>
											<div className='text-right shrink-0'>
												<p className='font-bold text-text-primary'>{currentUserRank.avgScore}%</p>
												<p className='text-xs text-text-secondary'>o&apos;rtacha</p>
											</div>
										</div>
									</Card>
								</motion.div>
							)}

							{/* Full list */}
							<motion.div initial='hidden' animate='visible' custom={3} variants={fadeIn}>
								<Card hover={false}>
									{/* Table header */}
									<div className='grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 px-2 pb-3 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wide'>
										<span>#</span>
										<span>Foydalanuvchi</span>
										<span className='text-center hidden sm:block'>Holatlar</span>
										<span className='text-center hidden sm:block'>Eng yaxshi</span>
										<span className='text-right'>O&apos;rtacha</span>
									</div>

									<div className='divide-y divide-border'>
										{studentList.map((entry, idx) => (
											<motion.div
												key={entry.userId}
												initial='hidden'
												animate='visible'
												custom={idx + 4}
												variants={fadeIn}
												className={`grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 items-center py-3 px-2 rounded-xl transition-colors ${entry.isCurrentUser ? 'bg-primary/5' : 'hover:bg-surface-light'}`}
											>
												{/* Rank */}
												<span className={`text-sm font-bold w-6 text-center ${idx < 3 ? MEDAL_COLORS[idx] : 'text-text-secondary'}`}>
													{entry.rank}
												</span>

												{/* User */}
												<div className='flex items-center gap-2 min-w-0'>
													<Avatar name={entry.name} avatar={entry.avatar} size='sm' />
													<div className='min-w-0'>
														<p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? 'text-primary' : 'text-text-primary'}`}>
															{entry.name}{entry.isCurrentUser ? ' (Siz)' : ''}
														</p>
														<div className='flex items-center gap-1 text-xs text-text-secondary sm:hidden'>
															<span>{entry.totalCompleted} holat</span>
															<span>·</span>
															<Clock className='w-3 h-3' />
															<span>{formatTime(entry.totalTimeSpent)}</span>
														</div>
													</div>
												</div>

												{/* Completed */}
												<span className='text-sm text-text-secondary text-center hidden sm:block'>{entry.totalCompleted}</span>

												{/* Best score */}
												<div className='hidden sm:flex items-center justify-center gap-1'>
													<Star className='w-3.5 h-3.5 text-yellow-400' />
													<span className='text-sm text-text-secondary'>{entry.bestScore}%</span>
												</div>

												{/* Avg score */}
												<div className='flex items-center justify-end gap-1'>
													<span className={`text-sm font-bold ${entry.avgScore >= 80 ? 'text-primary' : entry.avgScore >= 60 ? 'text-yellow-500' : 'text-accent'}`}>
														{entry.avgScore}%
													</span>
												</div>
											</motion.div>
										))}
									</div>

									{rest.length === 0 && top3.length === 0 && (
										<p className='text-center text-text-secondary text-sm py-6'>Jadval bo&apos;sh</p>
									)}
								</Card>
							</motion.div>
						</>
					)}
				</div>
			</main>
		</div>
	)
}
