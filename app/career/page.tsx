'use client'

import Sidebar from '@/components/layout/Sidebar'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { api, UserStats } from '@/lib/api'
import { motion } from 'framer-motion'
import {
    Award,
    BookOpen,
    Briefcase,
    CheckCircle,
    GraduationCap,
    Heart,
    Loader2,
    Shield,
    Star,
    Target,
    TrendingUp,
    Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
}

const careerPaths = [
	{
		title: 'Kardiolog',
		icon: Heart,
		match: 94,
		description: "Yurak-qon tomir kasalliklari diagnostikasi va davolash",
		requirements: ['EKG tahlili', 'Exokardiografiya', 'Koronar angiografiya'],
		completedReqs: 2,
	},
	{
		title: 'Pediatr',
		icon: Star,
		match: 83,
		description: "Bolalar kasalliklari bo'yicha mutaxassislik",
		requirements: ['Neonatalogiya', 'Bolalar infeksiyalari', 'Immunizatsiya'],
		completedReqs: 2,
	},
	{
		title: 'Nevrolog',
		icon: Zap,
		match: 71,
		description: "Nerv tizimi kasalliklarini tashxislash va davolash",
		requirements: ['EEG', 'MRT tahlili', 'Nevrologik tekshiruv'],
		completedReqs: 1,
	},
	{
		title: 'Jarroh',
		icon: Shield,
		match: 52,
		description: "Jarrohlik amaliyotlarini bajarish va boshqarish",
		requirements: ['Laparoskopiya', 'Travmatologiya', 'Anesteziologiya', 'Shoshilinch jarrohlik'],
		completedReqs: 1,
	},
]

const skills = [
	{ name: 'Klinik tafakkur', level: 82, icon: Target },
	{ name: 'Tezkor qaror qabul qilish', level: 68, icon: Zap },
	{ name: 'Diagnostik aniqlik', level: 78, icon: CheckCircle },
	{ name: 'Davolash rejasi', level: 71, icon: BookOpen },
	{ name: 'Jamoa bilan ishlash', level: 85, icon: Briefcase },
]

const achievements = [
	{
		title: 'Birinchi qadam',
		description: 'Birinchi keysni yakunlang',
		icon: Star,
		earned: true,
	},
	{
		title: 'Diagnostika ustasi',
		description: '10 ta diagnostika keysini 80%+ ball bilan yakunlang',
		icon: Target,
		earned: true,
	},
	{
		title: "Hafta bo'yi",
		description: "7 kun ketma-ket mashq qiling",
		icon: TrendingUp,
		earned: false,
		progress: 5,
		total: 7,
	},
	{
		title: "Mukammal natija",
		description: "Bitta keysda 100% ball oling",
		icon: Award,
		earned: false,
		progress: 91,
		total: 100,
	},
	{
		title: 'Barcha yo\'nalishlar',
		description: "Har bir kategoriyadan kamida 1 ta keys yeching",
		icon: GraduationCap,
		earned: false,
		progress: 4,
		total: 6,
	},
]

const milestones = [
	{ cases: 10, label: 'Boshlang\'ich', reached: true },
	{ cases: 25, label: 'Faol', reached: true },
	{ cases: 50, label: 'Tajribali', reached: false },
	{ cases: 100, label: 'Mutaxassis', reached: false },
	{ cases: 250, label: 'Ekspert', reached: false },
]

export default function CareerPage() {
	const [stats, setStats] = useState<UserStats | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		api.stats.getMyStats()
			.then(res => setStats(res.stats))
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [])

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
							Karyera Tahlili 🎯
						</h1>
						<p className='text-text-secondary'>
							Sizning kuchli tomonlaringiz va tavsiya etiladigan yo&apos;nalishlar
						</p>
					</motion.div>

					{/* Career Path Recommendations */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={stagger}
						className='mb-8'
					>
						<h2 className='text-lg font-semibold text-text-primary mb-4'>
							Tavsiya etiladigan yo&apos;nalishlar
						</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							{careerPaths.map(path => (
								<motion.div key={path.title} variants={fadeIn}>
									<Card hover={false}>
										<div className='flex items-start gap-4'>
											<div
												className={`p-3 rounded-xl shrink-0 ${
													path.match >= 80
														? 'bg-success/10'
														: path.match >= 60
															? 'bg-primary/10'
															: 'bg-warning/10'
												}`}
											>
												<path.icon
													className={`w-6 h-6 ${
														path.match >= 80
															? 'text-success'
															: path.match >= 60
																? 'text-primary'
																: 'text-warning'
													}`}
												/>
											</div>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center justify-between mb-1'>
													<h3 className='text-base font-semibold text-text-primary'>
														{path.title}
													</h3>
													<span
														className={`text-sm font-bold ${
															path.match >= 80
																? 'text-success'
																: path.match >= 60
																	? 'text-primary'
																	: 'text-warning'
														}`}
													>
														{path.match}%
													</span>
												</div>
												<p className='text-xs text-text-secondary mb-3'>
													{path.description}
												</p>
												<ProgressBar
													value={path.match}
													color={
														path.match >= 80
															? 'success'
															: path.match >= 60
																? 'primary'
																: 'warning'
													}
													size='sm'
												/>
												<div className='mt-3 flex flex-wrap gap-1.5'>
													{path.requirements.map((req, i) => (
														<span
															key={req}
															className={`text-xs px-2 py-0.5 rounded-full ${
																i < path.completedReqs
																	? 'bg-success/10 text-success'
																	: 'bg-surface-light text-text-secondary'
															}`}
														>
															{i < path.completedReqs && '✓ '}
															{req}
														</span>
													))}
												</div>
											</div>
										</div>
									</Card>
								</motion.div>
							))}
						</div>
					</motion.div>

					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
						{/* Skills Radar */}
						<motion.div
							initial='hidden'
							animate='visible'
							variants={fadeIn}
						>
							<Card hover={false}>
								<h3 className='text-lg font-semibold text-text-primary mb-6'>
									Ko&apos;nikmalar
								</h3>
								<div className='space-y-5'>
									{skills.map(skill => (
										<div key={skill.name}>
											<div className='flex items-center justify-between mb-2'>
												<div className='flex items-center gap-2'>
													<skill.icon className='w-4 h-4 text-primary' />
													<span className='text-sm text-text-secondary'>
														{skill.name}
													</span>
												</div>
												<span className='text-sm font-semibold text-text-primary'>
													{skill.level}%
												</span>
											</div>
											<ProgressBar
												value={skill.level}
												color={
													skill.level >= 80
														? 'success'
														: skill.level >= 60
															? 'primary'
															: 'warning'
												}
												size='sm'
											/>
										</div>
									))}
								</div>
							</Card>
						</motion.div>

						{/* Category Scores */}
						<motion.div
							initial='hidden'
							animate='visible'
							variants={fadeIn}
						>
							<Card hover={false}>
								<h3 className='text-lg font-semibold text-text-primary mb-6'>
									Kategoriyalar bo&apos;yicha kuch
								</h3>
								<div className='space-y-5'>
									{(stats?.categoryPerformance ?? []).map(
										(cat) => (
											<div key={cat.category}>
												<div className='flex justify-between items-center mb-2'>
													<span className='text-sm text-text-secondary'>
														{cat.category}
													</span>
													<div className='flex items-center gap-2'>
														<span className='text-sm font-semibold text-text-primary'>
															{Math.round(cat.avgScore)}%
														</span>
														{cat.avgScore >= 90 && (
															<span className='text-xs bg-success/10 text-success px-1.5 py-0.5 rounded-full'>
																Kuchli
															</span>
														)}
														{cat.avgScore < 60 && (
															<span className='text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded-full'>
																Yaxshilash kerak
															</span>
														)}
													</div>
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

					{/* Achievements */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='mb-8'
					>
						<h2 className='text-lg font-semibold text-text-primary mb-4'>
							Yutuqlar
						</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
							{achievements.map(a => (
								<Card key={a.title} hover={false}>
									<div className='flex items-start gap-3'>
										<div
											className={`p-2.5 rounded-xl ${
												a.earned
													? 'bg-success/10'
													: 'bg-surface-light'
											}`}
										>
											<a.icon
												className={`w-5 h-5 ${
													a.earned ? 'text-success' : 'text-text-secondary/40'
												}`}
											/>
										</div>
										<div className='flex-1'>
											<h4
												className={`text-sm font-semibold ${
													a.earned
														? 'text-text-primary'
														: 'text-text-secondary'
												}`}
											>
												{a.title}
												{a.earned && (
													<span className='ml-1.5 text-success'>✓</span>
												)}
											</h4>
											<p className='text-xs text-text-secondary mt-0.5'>
												{a.description}
											</p>
											{!a.earned && a.progress !== undefined && (
												<div className='mt-2'>
													<ProgressBar
														value={a.progress}
														max={a.total}
														size='sm'
													/>
													<p className='text-xs text-text-secondary mt-1'>
														{a.progress}/{a.total}
													</p>
												</div>
											)}
										</div>
									</div>
								</Card>
							))}
						</div>
					</motion.div>

					{/* Milestones */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
					>
						<Card hover={false}>
							<h3 className='text-lg font-semibold text-text-primary mb-6'>
								Bosqichlar
							</h3>
							<div className='flex items-center justify-between'>
								{milestones.map((m, i) => (
									<div key={m.label} className='flex items-center flex-1'>
										<div className='flex flex-col items-center text-center'>
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
													m.reached
														? 'bg-success/20 text-success border-2 border-success'
														: 'bg-surface-light text-text-secondary border-2 border-border'
												}`}
											>
												{m.cases}
											</div>
											<span
												className={`text-xs mt-1.5 ${
													m.reached ? 'text-success font-medium' : 'text-text-secondary'
												}`}
											>
												{m.label}
											</span>
										</div>
										{i < milestones.length - 1 && (
											<div
												className={`flex-1 h-0.5 mx-1 ${
													m.reached
														? 'bg-success'
														: 'bg-border'
												}`}
											/>
										)}
									</div>
								))}
							</div>
							<p className='text-sm text-text-secondary mt-4 text-center'>
								Keyingi bosqichga {50 - (stats?.totalAttempts ?? 0)} ta keys qoldi
							</p>
						</Card>
					</motion.div>
				</div>
			</main>
		</div>
	)
}
