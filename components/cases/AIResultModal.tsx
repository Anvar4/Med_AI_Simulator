'use client'

import Button from '@/components/ui/Button'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'

interface AIResultModalProps {
	isOpen: boolean
	onClose: () => void
	score: number
	status: string
	feedback: string
	correctDiagnosis?: string
	correctTreatment?: string
	userDiagnosis?: string
	userTreatment?: string
	strengths?: string[]
	weaknesses?: string[]
	detailedAnalysis?: string
}

export default function AIResultModal({
	isOpen,
	onClose,
	score,
	status,
	feedback,
	correctDiagnosis,
	correctTreatment,
	userDiagnosis,
	userTreatment,
	strengths = [],
	weaknesses = [],
	detailedAnalysis,
}: AIResultModalProps) {
	const [showDetails, setShowDetails] = useState(false)
	const circumference = 2 * Math.PI * 54
	const strokeDashoffset = circumference - (score / 100) * circumference

	const scoreColor =
		score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-accent'
	const strokeColor =
		score >= 80 ? '#4ECB71' : score >= 50 ? '#FFD93D' : '#FF6B6B'

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto'
				>
					<div
						className='absolute inset-0 bg-black/60 backdrop-blur-sm'
						onClick={onClose}
					/>
					<motion.div
						initial={{ scale: 0.85, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.85, opacity: 0 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className='relative bg-surface rounded-2xl border border-border p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto'
					>
						<button
							onClick={onClose}
							className='absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light transition-colors'
							aria-label='Close'
						>
							<X className='w-5 h-5' />
						</button>

						<div className='text-center'>
							<h3 className='text-xl font-bold text-text-primary mb-6'>
								AI Baholash Natijasi
							</h3>

							{/* Score Circle */}
							<div className='relative w-36 h-36 mx-auto mb-6'>
								<svg className='w-36 h-36 -rotate-90' viewBox='0 0 120 120'>
									<circle cx='60' cy='60' r='54' fill='none' stroke='currentColor' strokeWidth='8' className='text-surface-light' />
									<motion.circle cx='60' cy='60' r='54' fill='none' stroke={strokeColor} strokeWidth='8' strokeLinecap='round'
										strokeDasharray={circumference}
										initial={{ strokeDashoffset: circumference }}
										animate={{ strokeDashoffset }}
										transition={{ duration: 1.5, ease: 'easeOut' }}
									/>
								</svg>
								<div className='absolute inset-0 flex flex-col items-center justify-center'>
									<span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
									<span className='text-xs text-text-secondary'>/100</span>
								</div>
							</div>

							{/* Status */}
							<div className='flex items-center justify-center gap-2 mb-4'>
								{score >= 50 ? (
									<CheckCircle className='w-5 h-5 text-success' />
								) : (
									<AlertTriangle className='w-5 h-5 text-accent' />
								)}
								<span className='text-base font-semibold text-text-primary'>{status}</span>
							</div>

							{/* Feedback */}
							<div className='bg-surface-light rounded-xl p-4 mb-4 text-left'>
								<p className='text-sm text-text-secondary leading-relaxed'>{feedback}</p>
							</div>

							{/* Strengths & Weaknesses */}
							{(strengths.length > 0 || weaknesses.length > 0) && (
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left'>
									{strengths.length > 0 && (
										<div className='bg-success/10 border border-success/20 rounded-xl p-3'>
											<div className='flex items-center gap-2 mb-2'>
												<ThumbsUp className='w-4 h-4 text-success' />
												<span className='text-xs font-semibold text-success'>Kuchli tomonlar</span>
											</div>
											<ul className='space-y-1'>
												{strengths.map((s, i) => (
													<li key={i} className='text-xs text-text-secondary flex items-start gap-1.5'>
														<span className='text-success mt-0.5'>+</span>
														{s}
													</li>
												))}
											</ul>
										</div>
									)}
									{weaknesses.length > 0 && (
										<div className='bg-accent/10 border border-accent/20 rounded-xl p-3'>
											<div className='flex items-center gap-2 mb-2'>
												<ThumbsDown className='w-4 h-4 text-accent' />
												<span className='text-xs font-semibold text-accent'>Kamchiliklar</span>
											</div>
											<ul className='space-y-1'>
												{weaknesses.map((w, i) => (
													<li key={i} className='text-xs text-text-secondary flex items-start gap-1.5'>
														<span className='text-accent mt-0.5'>-</span>
														{w}
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							)}

							{/* Detailed analysis toggle */}
							{(correctDiagnosis || detailedAnalysis) && (
								<button
									onClick={() => setShowDetails(!showDetails)}
									className='flex items-center gap-2 text-sm text-primary hover:underline mx-auto mb-4'
								>
									{showDetails ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
									{showDetails ? 'Yopish' : 'Batafsil solishtirish'}
								</button>
							)}

							<AnimatePresence>
								{showDetails && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: 'auto', opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className='overflow-hidden text-left space-y-3 mb-4'
									>
										{/* Comparison */}
										{correctDiagnosis && (
											<div className='bg-surface-light rounded-xl p-3 space-y-3'>
												<div>
													<p className='text-xs font-semibold text-primary mb-1'>To&apos;g&apos;ri tashxis:</p>
													<p className='text-sm text-text-primary'>{correctDiagnosis}</p>
												</div>
												{userDiagnosis && (
													<div>
														<p className='text-xs font-semibold text-text-secondary mb-1'>Sizning tashxisingiz:</p>
														<p className='text-sm text-text-primary'>{userDiagnosis}</p>
													</div>
												)}
											</div>
										)}
										{correctTreatment && (
											<div className='bg-surface-light rounded-xl p-3 space-y-3'>
												<div>
													<p className='text-xs font-semibold text-primary mb-1'>To&apos;g&apos;ri davolash:</p>
													<p className='text-sm text-text-primary'>{correctTreatment}</p>
												</div>
												{userTreatment && (
													<div>
														<p className='text-xs font-semibold text-text-secondary mb-1'>Sizning davolash rejangiz:</p>
														<p className='text-sm text-text-primary'>{userTreatment}</p>
													</div>
												)}
											</div>
										)}
										{detailedAnalysis && (
											<div className='bg-primary/5 border border-primary/10 rounded-xl p-3'>
												<p className='text-xs font-semibold text-primary mb-1'>AI Batafsil Tahlil:</p>
												<p className='text-sm text-text-secondary leading-relaxed'>{detailedAnalysis}</p>
											</div>
										)}
									</motion.div>
								)}
							</AnimatePresence>

							<div className='flex gap-3'>
								<Button variant='secondary' className='flex-1' onClick={onClose}>
									Yopish
								</Button>
								<Button className='flex-1' onClick={onClose}>
									Keyingi Case →
								</Button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
