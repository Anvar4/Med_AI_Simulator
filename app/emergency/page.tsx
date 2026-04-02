'use client'

import Sidebar from '@/components/layout/Sidebar'
import Card from '@/components/ui/Card'
import { api, BackendCase } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle, Clock, CreditCard, Lock, Stethoscope, XCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const EMERGENCY_TIME = 300 // 5 minutes per case

function formatTime(seconds: number) {
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m}:${s.toString().padStart(2, '0')}`
}

export default function EmergencyPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [cases, setCases] = useState<BackendCase[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	// Active case session
	const [activeCase, setActiveCase] = useState<BackendCase | null>(null)
	const [attemptId, setAttemptId] = useState<string | null>(null)
	const [timeLeft, setTimeLeft] = useState(EMERGENCY_TIME)
	const [timerRunning, setTimerRunning] = useState(false)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	// Answer form
	const [diagnosis, setDiagnosis] = useState('')
	const [treatment, setTreatment] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [result, setResult] = useState<{ score: number; feedback: string; correctDiagnosis: string; correctTreatment: string } | null>(null)
	const [timeExpired, setTimeExpired] = useState(false)

	useEffect(() => {
		if (!user) { router.push('/login'); return }
		api.cases.getAll({ type: 'shoshilinch' })
			.then(res => setCases(res.cases))
			.catch(e => setError(e.message || 'Xatolik'))
			.finally(() => setLoading(false))
	}, [user, router])

	useEffect(() => {
		if (timerRunning && timeLeft > 0) {
			timerRef.current = setInterval(() => {
				setTimeLeft(t => {
					if (t <= 1) {
						clearInterval(timerRef.current!)
						setTimerRunning(false)
						setTimeExpired(true)
						handleAutoSubmit()
						return 0
					}
					return t - 1
				})
			}, 1000)
		}
		return () => { if (timerRef.current) clearInterval(timerRef.current) }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [timerRunning])

	const handleAutoSubmit = async () => {
		if (!attemptId) return
		try {
			const res = await api.attempts.submit(attemptId, {
				diagnosis: diagnosis || 'Vaqt tugadi',
				treatment: treatment || 'Vaqt tugadi',
				selectedTests: [],
				timeSpent: EMERGENCY_TIME,
			})
			setResult(res.result)
		} catch { /* silent */ }
	}

	const startCase = async (c: BackendCase) => {
		try {
			const res = await api.attempts.start(c._id)
			setActiveCase(c)
			setAttemptId(res.attempt._id)
			setTimeLeft(EMERGENCY_TIME)
			setTimerRunning(true)
			setResult(null)
			setDiagnosis('')
			setTreatment('')
			setTimeExpired(false)
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Xatolik')
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!attemptId || submitting) return
		setSubmitting(true)
		clearInterval(timerRef.current!)
		setTimerRunning(false)
		const spent = EMERGENCY_TIME - timeLeft
		try {
			const res = await api.attempts.submit(attemptId, {
				diagnosis,
				treatment,
				selectedTests: [],
				timeSpent: spent,
			})
			setResult(res.result)
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Xatolik')
		} finally { setSubmitting(false) }
	}

	const resetSession = () => {
		clearInterval(timerRef.current!)
		setActiveCase(null)
		setAttemptId(null)
		setTimerRunning(false)
		setResult(null)
		setTimeExpired(false)
		setDiagnosis('')
		setTreatment('')
	}

	if (!user) return null

	// Pro gate
	if (!user.isPremium) return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6 flex items-center justify-center min-h-screen'>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='max-w-md w-full mx-4'>
					<Card hover={false}>
						<div className='text-center space-y-4 py-6'>
							<div className='w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto'>
								<Lock className='w-8 h-8 text-accent' />
							</div>
							<h2 className='text-xl font-bold text-text-primary'>Pro obuna kerak</h2>
							<p className='text-text-secondary text-sm'>Shoshilinch holatlar rejimi faqat Pro foydalanuvchilar uchun. Qat&apos;iy vaqt chegarasi bilan.</p>
							<Link href='/subscription' className='flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-semibold px-6 py-3 rounded-xl transition-all'>
								<CreditCard className='w-4 h-4' /> Obunani ko&apos;rish
							</Link>
						</div>
					</Card>
				</motion.div>
			</main>
		</div>
	)

	if (loading) return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6 flex items-center justify-center min-h-screen'>
				<div className='flex flex-col items-center gap-3'>
					<div className='w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin' />
					<p className='text-text-secondary text-sm'>Yuklanmoqda...</p>
				</div>
			</main>
		</div>
	)

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6'>
					{/* Header */}
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='flex items-center gap-3'>
						<div className='p-2.5 bg-accent/10 rounded-xl'><Zap className='w-6 h-6 text-accent' /></div>
						<div>
							<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>Shoshilinch rejim</h1>
							<p className='text-text-secondary text-sm'>Vaqt chegarasi: {formatTime(EMERGENCY_TIME)} · Har bir holat uchun</p>
						</div>
					</motion.div>

					<AnimatePresence mode='wait'>
						{/* Active case UI */}
						{activeCase && !result && (
							<motion.div key='case' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className='space-y-4'>
								{/* Timer */}
								<div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${timeLeft <= 60 ? 'bg-accent/10 border-accent/40' : 'bg-surface border-border'}`}>
									<div className='flex items-center gap-2'>
										<Clock className={`w-5 h-5 ${timeLeft <= 60 ? 'text-accent animate-pulse' : 'text-primary'}`} />
										<span className='text-sm text-text-secondary'>Qolgan vaqt</span>
									</div>
									<span className={`text-2xl font-bold tabular-nums ${timeLeft <= 60 ? 'text-accent' : 'text-text-primary'}`}>
										{formatTime(timeLeft)}
									</span>
								</div>

								{/* Case info */}
								<Card hover={false}>
									<div className='flex items-start gap-3 mb-4'>
										<div className='p-2 bg-accent/10 rounded-lg shrink-0'><Stethoscope className='w-5 h-5 text-accent' /></div>
										<div>
											<p className='text-xs text-accent font-medium uppercase tracking-wide mb-1'>Shoshilinch holat</p>
											<h2 className='text-lg font-bold text-text-primary'>{activeCase.title}</h2>
										</div>
									</div>
									<div className='grid grid-cols-2 gap-3 mb-4 text-sm'>
										{activeCase.patient && (
											<>
												<div className='bg-surface-light rounded-xl p-3'>
													<p className='text-xs text-text-secondary mb-0.5'>Bemor</p>
													<p className='font-medium text-text-primary'>{activeCase.patient.name}</p>
												</div>
												<div className='bg-surface-light rounded-xl p-3'>
													<p className='text-xs text-text-secondary mb-0.5'>Yosh / Jins</p>
													<p className='font-medium text-text-primary'>{activeCase.patient.age} yosh / {activeCase.patient.gender}</p>
												</div>
											</>
										)}
										{activeCase.patient?.complaints && (
											<div className='bg-surface-light rounded-xl p-3 col-span-2'>
												<p className='text-xs text-text-secondary mb-0.5'>Asosiy shikoyat</p>
												<p className='font-medium text-text-primary'>{activeCase.patient.complaints}</p>
											</div>
										)}
									</div>
{activeCase.patient?.history && (
									<div className='mb-4'>
										<p className='text-xs text-text-secondary mb-1'>Kasallik tarixi</p>
										<p className='text-sm text-text-primary bg-surface-light rounded-xl p-3'>{activeCase.patient.history}</p>
										</div>
									)}

									<form onSubmit={handleSubmit} className='space-y-3 mt-4 border-t border-border pt-4'>
										<div>
											<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Tashxis *</label>
											<input type='text' value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required
												placeholder='Asosiy tashxisni yozing...'
												className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all' />
										</div>
										<div>
											<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Davolash rejasi *</label>
											<textarea value={treatment} onChange={e => setTreatment(e.target.value)} required rows={3}
												placeholder='Shoshilinch yordam rejasini yozing...'
												className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all resize-none' />
										</div>
										<div className='flex gap-3'>
											<button type='submit' disabled={submitting || timeExpired}
												className='flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm'>
												<CheckCircle className='w-4 h-4' />
												{submitting ? 'Yuborilmoqda...' : 'Javobni yuborish'}
											</button>
											<button type='button' onClick={resetSession} className='px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all text-sm'>
												Bekor
											</button>
										</div>
									</form>
								</Card>
							</motion.div>
						)}

						{/* Result UI */}
						{result && (
							<motion.div key='result' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='space-y-4'>
								<Card hover={false}>
									<div className='text-center py-4'>
										{timeExpired ? (
											<XCircle className='w-14 h-14 text-accent mx-auto mb-3' />
										) : result.score >= 70 ? (
											<CheckCircle className='w-14 h-14 text-primary mx-auto mb-3' />
										) : (
											<AlertCircle className='w-14 h-14 text-yellow-500 mx-auto mb-3' />
										)}
										{timeExpired && <p className='text-accent font-semibold mb-2'>Vaqt tugadi!</p>}
										<p className='text-4xl font-bold text-text-primary mb-1'>{result.score}%</p>
										<p className='text-text-secondary text-sm'>{result.feedback}</p>
									</div>
									<div className='space-y-3 mt-4 border-t border-border pt-4'>
										<div className='bg-primary/5 border border-primary/20 rounded-xl p-3'>
											<p className='text-xs text-text-secondary mb-1'>To&apos;g&apos;ri tashxis</p>
											<p className='text-sm font-semibold text-text-primary'>{result.correctDiagnosis}</p>
										</div>
										<div className='bg-surface-light rounded-xl p-3'>
											<p className='text-xs text-text-secondary mb-1'>To&apos;g&apos;ri davolash</p>
											<p className='text-sm text-text-primary'>{result.correctTreatment}</p>
										</div>
									</div>
									<button onClick={resetSession} className='mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2.5 rounded-xl transition-all text-sm'>
										<ArrowRight className='w-4 h-4' /> Boshqa holatni boshlash
									</button>
								</Card>
							</motion.div>
						)}

						{/* Case list */}
						{!activeCase && !result && (
							<motion.div key='list' initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
								{error && <p className='text-accent text-sm mb-4'>{error}</p>}
								{cases.length === 0 && !loading ? (
									<Card hover={false}>
										<div className='text-center py-10 space-y-3'>
											<Zap className='w-12 h-12 text-text-secondary/30 mx-auto' />
											<p className='text-text-primary font-semibold'>Shoshilinch holatlar yo&apos;q</p>
											<p className='text-text-secondary text-sm'>Hozircha shoshilinch type ga tegishli klinik holatlar mavjud emas</p>
										</div>
									</Card>
								) : (
									<div className='space-y-3'>
										{cases.map(c => (
											<motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
												<Card>
													<div className='flex items-start justify-between gap-4'>
														<div className='min-w-0 flex-1'>
															<div className='flex items-center gap-2 mb-1'>
																<span className='text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium'>Shoshilinch</span>
																<span className='text-xs text-text-secondary capitalize'>{c.category}</span>
															</div>
															<h3 className='font-semibold text-text-primary mb-1 truncate'>{c.title}</h3>
															{c.patient?.complaints && <p className='text-xs text-text-secondary truncate'>{c.patient.complaints}</p>}
														</div>
														<button onClick={() => startCase(c)}
															className='flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm shrink-0'>
															<Zap className='w-4 h-4' /> Boshlash
														</button>
													</div>
													<div className='flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-text-secondary'>
														<div className='flex items-center gap-1'><Clock className='w-3 h-3' />{formatTime(EMERGENCY_TIME)}</div>
														{c.patient && <span>{c.patient.age} yosh</span>}
													</div>
												</Card>
											</motion.div>
										))}
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</main>
		</div>
	)
}
