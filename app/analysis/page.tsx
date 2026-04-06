'use client'

import Sidebar from '@/components/layout/Sidebar';
import Card from '@/components/ui/Card';
import { api, UserAnalysis } from '@/lib/api';
import { canAccessContentManager, useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Brain, CheckCircle, Lightbulb, Send, TrendingUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

const DEMO_ANALYSIS: UserAnalysis = {
	overallAvg: 78,
	totalCompleted: 34,
	strengths: [
		{ category: 'kardiologiya', avgScore: 85, count: 9 },
		{ category: 'pediatriya', avgScore: 82, count: 7 },
		{ category: 'ginekologiya', avgScore: 80, count: 6 },
	],
	weaknesses: [
		{ category: 'travmatologiya', avgScore: 61, count: 5 },
		{ category: 'jarrohlik', avgScore: 66, count: 8 },
		{ category: 'endokrinologiya', avgScore: 64, count: 4 },
	],
	improving: [
		{ category: 'nevrologiya', avgScore: 72, recentScore: 81 },
		{ category: 'pulmonologiya', avgScore: 69, recentScore: 76 },
		{ category: 'nefrologiya', avgScore: 67, recentScore: 73 },
	],
	recommendations: [
		{
			category: 'jarrohlik',
			avgScore: 66,
			suggestions: ['Differensial tashxis matritsasini ishlating', 'ABCDE bo\'yicha tekshiruv ketma-ketligini yozib boring'],
		},
		{
			category: 'travmatologiya',
			avgScore: 61,
			suggestions: ['FAST/UZI indikatsiyalarini qayta ko\'rib chiqing', 'Qon ketish protokolini tez-tez takrorlang'],
		},
		{
			category: 'endokrinologiya',
			avgScore: 64,
			suggestions: ['DKA va HHS farqlarini jadvalda yodlang', 'Insulin va suyuqlik rejasini bosqichma-bosqich tuzing'],
		},
	],
	positiveAspects: [
		'Bemor bilan muloqot uslubi aniq va ketma-ket',
		'Asosiy hayotiy ko\'rsatkichlarni tez ajrata olasiz',
		'Tezkor qaror kerak bo\'lgan holatlarda vaqtni yaxshi boshqarasiz',
	],
	negativeAspects: [
		'Ba\'zi murakkab holatlarda tekshiruvlar keragidan ortiqcha buyuriladi',
		'Davolash rejasida ustuvorlik tartibi doim ham aniq emas',
		'Tuzilgan tashxisni differensial ro\'yxat bilan mustahkamlash kerak',
	],
}

export default function AnalysisPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [analysis, setAnalysis] = useState<UserAnalysis | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	// AI Chat state
	const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
		{ role: 'assistant', content: 'Salom! Men sizning tahlil natijalaringizni ko\'rib chiqdim. Qaysi sohadagi savollaringizni javoblashim mumkin?' },
	])
	const [chatInput, setChatInput] = useState('')
	const [chatLoading, setChatLoading] = useState(false)
	const chatBottomRef = useRef<HTMLDivElement>(null)
	const chatInputRef = useRef<HTMLInputElement>(null)

	// AI chat is available to all registered users
	const canUseAIChat = !!user

	async function sendChatMessage() {
		const text = chatInput.trim()
		if (!text || chatLoading) return
		const updated = [...chatMessages, { role: 'user' as const, content: text }]
		setChatMessages(updated)
		setChatInput('')
		setChatLoading(true)
		try {
			const res = await api.chat.sendAnalysis(updated)
			setChatMessages([...updated, { role: 'assistant', content: res.reply }])
		} catch {
			setChatMessages([...updated, { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' }])
		} finally {
			setChatLoading(false)
		}
	}

	useEffect(() => {
		chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [chatMessages, chatLoading])

	useEffect(() => {
		if (!user) { router.push('/login'); return }
		if (canAccessContentManager(user.role)) { router.replace('/content-manager'); return }
		api.stats.getMyAnalysis()
			.then(data => setAnalysis(data.analysis))
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
					<p className='text-text-secondary text-sm'>Tahlil yuklanmoqda...</p>
				</div>
			</main>
		</div>
	)

	const hasRealAnalysis = !!analysis && (
		analysis.totalCompleted > 0 ||
		analysis.overallAvg > 0 ||
		analysis.strengths.length > 0 ||
		analysis.weaknesses.length > 0 ||
		analysis.improving.length > 0 ||
		analysis.recommendations.length > 0 ||
		analysis.positiveAspects.length > 0 ||
		analysis.negativeAspects.length > 0
	)

	const effectiveAnalysis = hasRealAnalysis ? analysis! : DEMO_ANALYSIS
	const isDemoMode = !hasRealAnalysis || !!error

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6'>
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<h1 className='text-2xl sm:text-3xl font-bold text-text-primary mb-1'>Profil tahlili</h1>
						<p className='text-text-secondary text-sm'>Kuchli va zaif tomonlaringiz, tavsiyalar</p>
						{isDemoMode && <p className='text-xs text-primary mt-2'>Demo tahlil ko&apos;rsatilmoqda</p>}
						{error && <p className='text-xs text-accent mt-1'>{error}</p>}
					</motion.div>

					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
						<Card hover={false} className='p-4'>
							<p className='text-xs text-text-secondary mb-1'>Yakunlangan urinish</p>
							<p className='text-lg font-bold text-text-primary'>{effectiveAnalysis.totalCompleted}</p>
						</Card>
						<Card hover={false} className='p-4'>
							<p className='text-xs text-text-secondary mb-1'>Umumiy o&apos;rtacha</p>
							<p className='text-lg font-bold text-primary'>{effectiveAnalysis.overallAvg}%</p>
						</Card>
						<Card hover={false} className='p-4'>
							<p className='text-xs text-text-secondary mb-1'>Kuchli yo&apos;nalishlar</p>
							<p className='text-lg font-bold text-text-primary'>{effectiveAnalysis.strengths.length}</p>
						</Card>
						<Card hover={false} className='p-4'>
							<p className='text-xs text-text-secondary mb-1'>Yaxshilash yo&apos;nalishlari</p>
							<p className='text-lg font-bold text-accent'>{effectiveAnalysis.weaknesses.length}</p>
						</Card>
					</motion.div>

					{/* Positive & Negative Aspects */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-4'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><CheckCircle className='w-5 h-5 text-primary' /></div>
								<h3 className='font-semibold text-text-primary'>Ijobiy tomonlar</h3>
							</div>
							{effectiveAnalysis.positiveAspects.length === 0 ? (
								<p className='text-sm text-text-secondary'>Hali baholash uchun yetarli ma&apos;lumot yo&apos;q</p>
							) : (
								<ul className='space-y-2'>
									{effectiveAnalysis.positiveAspects.map((a, i) => (
										<li key={i} className='flex items-start gap-2'>
											<CheckCircle className='w-4 h-4 text-primary shrink-0 mt-0.5' />
											<span className='text-sm text-text-primary'>{a}</span>
										</li>
									))}
								</ul>
							)}
						</Card>

						<Card hover={false}>
							<div className='flex items-center gap-3 mb-4'>
								<div className='p-2.5 bg-accent/10 rounded-xl'><AlertTriangle className='w-5 h-5 text-accent' /></div>
								<h3 className='font-semibold text-text-primary'>Salbiy tomonlar</h3>
							</div>
							{effectiveAnalysis.negativeAspects.length === 0 ? (
								<p className='text-sm text-text-secondary'>Hali baholash uchun yetarli ma&apos;lumot yo&apos;q</p>
							) : (
								<ul className='space-y-2'>
									{effectiveAnalysis.negativeAspects.map((a, i) => (
										<li key={i} className='flex items-start gap-2'>
											<AlertTriangle className='w-4 h-4 text-accent shrink-0 mt-0.5' />
											<span className='text-sm text-text-primary'>{a}</span>
										</li>
									))}
								</ul>
							)}
						</Card>
					</motion.div>

					{/* Strengths */}
					{effectiveAnalysis.strengths.length > 0 && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-2.5 bg-primary/10 rounded-xl'><TrendingUp className='w-5 h-5 text-primary' /></div>
									<h3 className='font-semibold text-text-primary'>Kuchli tomonlar</h3>
								</div>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
									{effectiveAnalysis.strengths.map((s, i) => (
										<div key={i} className='bg-primary/5 border border-primary/20 rounded-xl p-3'>
											<div className='flex items-center justify-between mb-1'>
												<p className='text-sm font-semibold text-text-primary capitalize'>{s.category}</p>
												<span className='text-sm font-bold text-primary'>{s.avgScore}%</span>
											</div>
											<p className='text-xs text-text-secondary'>{s.count} ta urinish</p>
											<div className='mt-2 w-full bg-surface-light rounded-full h-1.5'>
												<div className='bg-primary h-1.5 rounded-full' style={{ width: `${s.avgScore}%` }} />
											</div>
										</div>
									))}
								</div>
							</Card>
						</motion.div>
					)}

					{/* Weaknesses */}
					{effectiveAnalysis.weaknesses.length > 0 && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-2.5 bg-accent/10 rounded-xl'><AlertTriangle className='w-5 h-5 text-accent' /></div>
									<h3 className='font-semibold text-text-primary'>Zaif tomonlar (o&apos;rganish kerak)</h3>
								</div>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
									{effectiveAnalysis.weaknesses.map((w, i) => (
										<div key={i} className='bg-accent/5 border border-accent/20 rounded-xl p-3'>
											<div className='flex items-center justify-between mb-1'>
												<p className='text-sm font-semibold text-text-primary capitalize'>{w.category}</p>
												<span className='text-sm font-bold text-accent'>{w.avgScore}%</span>
											</div>
											<p className='text-xs text-text-secondary'>{w.count} ta urinish</p>
											<div className='mt-2 w-full bg-surface-light rounded-full h-1.5'>
												<div className='bg-accent h-1.5 rounded-full' style={{ width: `${w.avgScore}%` }} />
											</div>
										</div>
									))}
								</div>
							</Card>
						</motion.div>
					)}

					{/* Improving Areas */}
					{effectiveAnalysis.improving.length > 0 && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-2.5 bg-yellow-500/10 rounded-xl'><Zap className='w-5 h-5 text-yellow-500' /></div>
									<h3 className='font-semibold text-text-primary'>Rivojlanayotgan sohalar</h3>
								</div>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
									{effectiveAnalysis.improving.map((a, i) => (
										<div key={i} className='bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3'>
											<div className='flex items-center justify-between mb-1'>
												<p className='text-sm font-semibold text-text-primary capitalize'>{a.category}</p>
												<span className='text-sm font-bold text-yellow-500'>{a.avgScore}%</span>
											</div>
											<p className='text-xs text-text-secondary'>So&apos;nggi ball: {a.recentScore}%</p>
										</div>
									))}
								</div>
							</Card>
						</motion.div>
					)}

					{/* Recommendations */}
					{effectiveAnalysis.recommendations.length > 0 && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-2.5 bg-primary/10 rounded-xl'><Lightbulb className='w-5 h-5 text-primary' /></div>
									<h3 className='font-semibold text-text-primary'>Tavsiyalar</h3>
								</div>
								<div className='space-y-3'>
									{effectiveAnalysis.recommendations.map((rec, i) => (
										<div key={i} className='p-4 bg-surface-light rounded-xl'>
											<div className='flex items-center gap-2 mb-2'>
												<BookOpen className='w-4 h-4 text-primary shrink-0' />
												<p className='text-sm font-semibold text-text-primary capitalize'>{rec.category}</p>
											</div>
											<p className='text-sm text-text-secondary mb-3'>{rec.category} bo&apos;yicha o&apos;rtacha ball: {rec.avgScore}%</p>
											{rec.suggestions?.length > 0 && (
												<div className='flex flex-wrap gap-2'>
													{rec.suggestions.map((t, j) => (
														<span key={j} className='text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full'>{t}</span>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							</Card>
						</motion.div>
					)}
				</div>

				{/* AI Chat for PRO users */}
				{canUseAIChat && (
					<div className='p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto'>
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false} className='overflow-hidden'>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-2.5 bg-primary/10 rounded-xl'>
										<Brain className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-text-primary'>AI Tahlil Yordamchisi</h3>
										<p className='text-xs text-text-secondary'>Natijalaringiz asosida savol bering</p>
									</div>
								</div>

								{/* Messages */}
								<div className='h-72 overflow-y-auto space-y-3 mb-4 pr-1'>
									{chatMessages.map((msg, i) => (
										<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
											<div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
												msg.role === 'user'
													? 'bg-primary text-secondary rounded-br-sm'
													: 'bg-surface-light text-text-primary rounded-bl-sm border border-border'
											}`}>
												{msg.role === 'user' ? msg.content : (
											<ReactMarkdown
												remarkPlugins={[remarkGfm]}
												components={{
													p: ({ children }) => <p className='mb-1 last:mb-0'>{children}</p>,
													ul: ({ children }) => <ul className='list-disc pl-4 space-y-0.5 my-1'>{children}</ul>,
													ol: ({ children }) => <ol className='list-decimal pl-4 space-y-0.5 my-1'>{children}</ol>,
													li: ({ children }) => <li className='text-sm'>{children}</li>,
													strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
													em: ({ children }) => <em className='italic'>{children}</em>,
													h1: ({ children }) => <h1 className='text-base font-bold mt-2 mb-1'>{children}</h1>,
													h2: ({ children }) => <h2 className='text-sm font-bold mt-2 mb-1'>{children}</h2>,
													h3: ({ children }) => <h3 className='text-sm font-semibold mt-1.5 mb-0.5'>{children}</h3>,
													code: ({ children }) => <code className='bg-black/10 rounded px-1 text-xs font-mono'>{children}</code>,
													blockquote: ({ children }) => <blockquote className='border-l-2 border-primary/40 pl-2 italic opacity-80 my-1'>{children}</blockquote>,
												}}
											>
												{msg.content}
											</ReactMarkdown>
										)}
											</div>
										</div>
									))}
									{chatLoading && (
										<div className='flex justify-start'>
											<div className='bg-surface-light border border-border rounded-2xl rounded-bl-sm px-4 py-3'>
												<div className='flex gap-1'>
													<span className='w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0ms]' />
													<span className='w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:150ms]' />
													<span className='w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:300ms]' />
												</div>
											</div>
										</div>
									)}
									<div ref={chatBottomRef} />
								</div>

								{/* Input */}
								<form onSubmit={e => { e.preventDefault(); sendChatMessage() }} className='flex gap-2'>
									<input
										ref={chatInputRef}
										value={chatInput}
										onChange={e => setChatInput(e.target.value)}
										placeholder='Savol yozing...'
										disabled={chatLoading}
										className='flex-1 bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50'
									/>
									<button
										type='submit'
										disabled={chatLoading || !chatInput.trim()}
										className='px-4 py-2.5 rounded-xl bg-primary text-secondary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-2'
									>
										<Send className='w-4 h-4' />
										Yuborish
									</button>
								</form>
							</Card>
						</motion.div>
					</div>
				)}
			</main>
		</div>
	)
}
