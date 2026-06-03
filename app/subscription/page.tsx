'use client'

import Sidebar from '@/components/layout/Sidebar';
import Card from '@/components/ui/Card';
import { api, SubscriptionPlan } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/language-context';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Building2, CheckCircle, Copy, CreditCard, GraduationCap, Loader2, Lock, Percent, Share2, Tag, Users, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

const planIcons: Record<string, React.ElementType> = {
	pro: Award,
	clinic: Building2,
	university: GraduationCap,
}

function PlanBadge({ plan }: { plan: string }) {
	if (plan === 'free') return null
	return <span className='text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize'>{plan} faol</span>
}

export default function SubscriptionPage() {
	const { user, updateUser } = useAuth()
	const { t } = useT()
	const [plans, setPlans] = useState<SubscriptionPlan[]>([])
	const [loading, setLoading] = useState(true)
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

	// Referral info
	const [referralInfo, setReferralInfo] = useState<{
		referralCode: string
		referredTotal: number
		referredPremium: number
		discount: { percent: number; expiresAt: string } | null
	} | null>(null)
	const [copied, setCopied] = useState(false)

	// Discount in modal
	const [discountApplied, setDiscountApplied] = useState(false)

	// Subscribe modal
	const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
	const [subscribing, setSubscribing] = useState(false)
	const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)

	// Promo code section
	const [promoCode, setPromoCode] = useState('')
	const [promoLoading, setPromoLoading] = useState(false)
	const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const promoInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		api.subscriptions.getPlans()
			.then(data => setPlans(data.plans))
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [])

	useEffect(() => {
		if (!user) return
		api.subscriptions.getReferralInfo()
			.then(data => setReferralInfo(data))
			.catch(() => {})
	}, [user])

	const handleSubscribe = async () => {
		if (!user || !selectedPlan) return
		setSubMsg(null)
		setSubscribing(true)
		try {
			const res = await api.subscriptions.subscribe(selectedPlan.id, billingPeriod)
			// Subscribing creates a pending payment request; premium is granted only
			// after the gateway confirms payment. Surface the checkout step.
			setPendingPaymentId(res.paymentRequestId)
			setSubMsg({ type: 'success', text: res.message })
		} catch (err) {
			setSubMsg({ type: 'error', text: err instanceof Error ? err.message : 'Xatolik yuz berdi' })
		} finally {
			setSubscribing(false)
		}
	}

	const handleCheckout = async (provider: 'click' | 'payme') => {
		if (!pendingPaymentId) return
		try {
			const { url } = await api.payments.checkout(pendingPaymentId, provider)
			window.location.href = url
		} catch (err) {
			setSubMsg({ type: 'error', text: err instanceof Error ? err.message : 'To\'lov sahifasini ochib bo\'lmadi' })
		}
	}

	const handlePromo = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		setPromoMsg(null); setPromoLoading(true)
		try {
			const res = await api.subscriptions.applyPromoCode(promoCode.trim().toUpperCase())
			updateUser({ isPremium: true, subscription: res.subscription })
			setPromoMsg({ type: 'success', text: res.message || 'Promokod qabul qilindi! Obunangiz faollashdi.' })
			setPromoCode('')
		} catch (err) {
			setPromoMsg({ type: 'error', text: err instanceof Error ? err.message : 'Promokod xato yoki muddati tugagan' })
		} finally { setPromoLoading(false) }
	}

	const currentPlan = user?.subscription?.plan ?? 'free'

	const formatPrice = (price: number) => price.toLocaleString('uz-UZ')

	const getReferralLink = () => {
		if (typeof window === 'undefined') return ''
		return `${window.location.origin}/register?ref=${referralInfo?.referralCode ?? ''}`
	}

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(getReferralLink())
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch { /* silent */ }
	}

	const activeDiscount = referralInfo?.discount && new Date(referralInfo.discount.expiresAt) > new Date()
		? referralInfo.discount
		: null

	return (
		<div className='min-h-screen bg-secondary'>
			{user && <Sidebar />}
			<main className={user ? 'lg:pl-64 pt-16 lg:pt-0 pb-6' : ''}>
				<div className='p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8'>
					{/* Header */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='text-center'>
						<div className='inline-flex p-3 bg-primary/10 rounded-2xl mb-4'>
							<CreditCard className='w-8 h-8 text-primary' />
						</div>
						<h1 className='text-3xl sm:text-4xl font-bold text-text-primary mb-3'>{t('sub.title')}</h1>
						<p className='text-text-secondary max-w-xl mx-auto'>Med AI Simulator&apos;ning barcha imkoniyatlaridan foydalaning. To&apos;liq klinik holatlar, AI tahlil va professional rivojlanish.</p>
						{user && currentPlan !== 'free' && (
							<div className='mt-3 inline-flex items-center gap-2'>
								<CheckCircle className='w-4 h-4 text-primary' />
								<PlanBadge plan={currentPlan} />
								{user.subscription?.expiresAt && (
									<span className='text-xs text-text-secondary'>— {new Date(user.subscription.expiresAt).toLocaleDateString('uz-UZ')} gacha</span>
								)}
							</div>
						)}
					</motion.div>

					{/* Billing toggle */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='flex items-center justify-center'>
						<div className='flex bg-surface rounded-xl p-1 border border-border gap-1'>
							<button onClick={() => setBillingPeriod('monthly')}
								className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-primary text-secondary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
								Oylik
							</button>
							<button onClick={() => setBillingPeriod('yearly')}
								className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingPeriod === 'yearly' ? 'bg-primary text-secondary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
								Yillik <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${billingPeriod === 'yearly' ? 'bg-white/25 text-white' : 'bg-primary/20 text-primary'}`}>Tejamkor</span>
							</button>
						</div>
					</motion.div>

					{/* Plans */}
					{loading ? (
						<div className='flex justify-center py-10'>
							<div className='w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
						</div>
					) : (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
						{/* Free plan comparison card */}
						{(() => {
							const isCurrentPlan = currentPlan === 'free'
							return (
								<div key='free' className={`relative bg-surface rounded-3xl border-2 p-6 flex flex-col ${
									isCurrentPlan ? 'border-primary ring-2 ring-primary/30' : 'border-border'
								}`}>
									{isCurrentPlan && (
										<div className='absolute right-4 top-4 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1'>
											<CheckCircle className='w-3 h-3' /> Joriy
										</div>
									)}
									<div className='flex items-center gap-3 mb-4'>
										<div className='p-2.5 rounded-xl bg-surface-light'>
											<Users className='w-6 h-6 text-text-secondary' />
										</div>
										<h3 className='font-bold text-text-primary text-lg'>Bepul</h3>
									</div>
									<div className='mb-5'>
										<p className='text-3xl font-bold text-text-primary'>0 <span className='text-base font-normal text-text-secondary'>so&apos;m</span></p>
										<p className='text-xs text-text-secondary mt-0.5'>Abadiy bepul</p>
									</div>
									<ul className='space-y-2 mb-6 flex-1'>
										{([
											{ text: 'Asosiy klinik holatlar', ok: true },
											{ text: 'AI chatbot yordamchisi', ok: true },
											{ text: 'Asosiy statistika va tahlil', ok: true },
											{ text: 'Liderlar taxtasi', ok: true },
											{ text: 'Premium klinik holatlar', ok: false },
											{ text: 'Shoshilinch diagnostika rejimi', ok: false },
											{ text: 'Batafsil AI hisobotlar', ok: false },
											{ text: 'Cheksiz premium holatlar', ok: false },
										] as { text: string; ok: boolean }[]).map((f, i) => (
											<li key={i} className='flex items-start gap-2 text-sm'>
												{f.ok
													? <CheckCircle className='w-4 h-4 text-primary shrink-0 mt-0.5' />
													: <Lock className='w-4 h-4 text-text-secondary/30 shrink-0 mt-0.5' />
												}
												<span className={f.ok ? 'text-text-secondary' : 'text-text-secondary/35 line-through'}>{f.text}</span>
											</li>
										))}
									</ul>
									{isCurrentPlan ? (
										<button disabled className='w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center gap-2'>
											<CheckCircle className='w-4 h-4' /> Faol
										</button>
									) : (
										<button disabled className='w-full py-2.5 rounded-xl border border-border text-text-secondary/40 text-sm font-medium cursor-default'>
											Mavjud emas
										</button>
									)}
								</div>
							)
						})()}
							{plans.map(plan => {
								const Icon = planIcons[plan.id] || Award
								const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
								const isCurrentPlan = currentPlan === plan.id
								const isPopular = plan.id === 'pro'

								return (
									<div key={plan.id} className={`relative bg-surface rounded-3xl border-2 p-6 flex flex-col ${isPopular ? 'border-primary' : 'border-border'} ${isCurrentPlan ? 'ring-2 ring-primary/30' : ''}`}>
										{isPopular && (
											<div className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-secondary text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap'>
												Mashhur
											</div>
										)}
										{isCurrentPlan && (
											<div className='absolute  right-4 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1'>
												<CheckCircle className='w-3 h-3' /> Joriy
											</div>
										)}

										<div className='flex items-center gap-3 mb-4'>
											<div className={`p-2.5 rounded-xl ${isPopular ? 'bg-primary/10' : 'bg-surface-light'}`}>
												<Icon className={`w-6 h-6 ${isPopular ? 'text-primary' : 'text-text-secondary'}`} />
											</div>
											<div>
												<h3 className='font-bold text-text-primary text-lg'>{plan.name}</h3>
												{plan.maxUsers && <p className='text-xs text-text-secondary flex items-center gap-1'><Users className='w-3 h-3' /> max {plan.maxUsers} foydalanuvchi</p>}
											</div>
										</div>

										{plan.contactAdmin ? (
											<div className='mb-5'>
												<p className='text-2xl font-bold text-text-primary'>Kelishuv</p>
												<p className='text-xs text-text-secondary mt-0.5'>Admin bilan bog&apos;laning</p>
											</div>
										) : (
											<div className='mb-5'>
												<p className='text-3xl font-bold text-text-primary'>
													{formatPrice(price || 0)} <span className='text-base font-normal text-text-secondary'>so&apos;m</span>
												</p>
												<p className='text-xs text-text-secondary mt-0.5'>
													{billingPeriod === 'yearly'
														? `Yillik to'lov (oyiga ${formatPrice(Math.round((price || 0) / 12))} so'm)`
														: 'Oylik to\'lov'
													}
												</p>
											</div>
										)}

										<ul className='space-y-2 mb-6 flex-1'>
											{plan.features.map((f, i) => (
												<li key={i} className='flex items-start gap-2 text-sm'>
													<CheckCircle className='w-4 h-4 text-primary shrink-0 mt-0.5' />
													<span className='text-text-secondary'>{f}</span>
												</li>
											))}
										</ul>

										{plan.contactAdmin ? (
											<a href='https://t.me/anvar_kocharov' target='_blank' rel='noopener noreferrer'
												className='w-full py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-light transition-all text-sm font-medium text-center block'>
												Bog&apos;lanish
											</a>
										) : isCurrentPlan ? (
											<button disabled className='w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center gap-2'>
												<CheckCircle className='w-4 h-4' /> Faol
											</button>
										) : (
											<button
												onClick={() => { if (user) { setSelectedPlan(plan); setDiscountApplied(false) } else window.location.href = '/login' }}
												className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isPopular ? 'bg-primary hover:bg-primary/90 text-secondary' : 'bg-surface-light hover:bg-surface text-text-primary border border-border'}`}>
												<Zap className='w-4 h-4' /> Obuna bo&apos;lish
											</button>
										)}
									</div>
								)
							})}
						</motion.div>
					)}

					{/* Promo code */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-5'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><Tag className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='font-semibold text-text-primary'>Promokod</h3>
									<p className='text-xs text-text-secondary'>Agar promokodingiz bo&apos;lsa, shu yerda kiriting</p>
								</div>
							</div>
							{!user ? (
								<p className='text-sm text-text-secondary'>Promokod ishlatish uchun <a href='/login' className='text-primary hover:underline'>tizimga kiring</a></p>
							) : (
								<form onSubmit={handlePromo} className='space-y-3 max-w-sm'>
									<div className='flex gap-3'>
										<input ref={promoInputRef} type='text' value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder='PROMOKOD'
											required minLength={4}
											className='flex-1 bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all uppercase' />
										<button type='submit' disabled={promoLoading || promoCode.trim().length < 4}
											className='bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm whitespace-nowrap'>
											{promoLoading ? 'Tekshirilmoqda...' : "Qo'llash"}
										</button>
									</div>
									{promoMsg && <p className={`text-sm rounded-lg px-3 py-2 ${promoMsg.type === 'success' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'}`}>{promoMsg.text}</p>}
								</form>
							)}
						</Card>
					</motion.div>

					{/* Referral */}
					{user && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='flex items-center gap-3 mb-5'>
									<div className='p-2.5 bg-primary/10 rounded-xl'><Share2 className='w-5 h-5 text-primary' /></div>
									<div>
										<h3 className='font-semibold text-text-primary'>Do&apos;stingizni taklif qiling</h3>
										<p className='text-xs text-text-secondary'>Referal orqali chegirma oling</p>
									</div>
								</div>

								{/* Discount badge */}
								{activeDiscount && (
									<div className='mb-4 flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20'>
										<Percent className='w-5 h-5 text-primary shrink-0' />
										<div>
											<p className='text-sm font-semibold text-primary'>{activeDiscount.percent}% chegirma faol!</p>
											<p className='text-xs text-text-secondary'>
												{new Date(activeDiscount.expiresAt).toLocaleDateString('uz-UZ')} gacha amal qiladi
											</p>
										</div>
									</div>
								)}

								{/* Stats */}
								{referralInfo && (
									<div className='grid grid-cols-2 gap-3 mb-4'>
										<div className='bg-surface-light rounded-xl p-3 text-center'>
											<p className='text-2xl font-bold text-text-primary'>{referralInfo.referredTotal}</p>
											<p className='text-xs text-text-secondary mt-0.5'>Taklif qilinganlar</p>
										</div>
										<div className='bg-surface-light rounded-xl p-3 text-center'>
											<p className='text-2xl font-bold text-primary'>{referralInfo.referredPremium}</p>
											<p className='text-xs text-text-secondary mt-0.5'>Premium sotib oldi</p>
										</div>
									</div>
								)}

								{/* Referral link */}
								{referralInfo?.referralCode && (
									<div className='space-y-2'>
										<p className='text-xs font-medium text-text-secondary'>Referal havolangiz</p>
										<div className='flex gap-2'>
											<div className='flex-1 bg-surface-light border border-border rounded-xl px-3 py-2 text-xs text-text-secondary truncate font-mono'>
												{getReferralLink()}
											</div>
											<button onClick={handleCopy}
												className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${copied ? 'bg-primary/10 text-primary' : 'bg-surface-light hover:bg-surface border border-border text-text-secondary hover:text-text-primary'}`}>
												{copied ? <CheckCircle className='w-3.5 h-3.5' /> : <Copy className='w-3.5 h-3.5' />}
												{copied ? 'Nusxalandi' : 'Nusxalash'}
											</button>
										</div>
									</div>
								)}

								{/* How it works */}
								<div className='mt-4 pt-4 border-t border-border space-y-2'>
									<p className='text-xs font-semibold text-text-secondary uppercase tracking-wide'>Qanday ishlaydi</p>
									<div className='space-y-1.5'>
										{[
											'Do\'stingiz havolani bosib ro\'yxatdan o\'tadi → Sizga 2% chegirma (30 kun)',
											'Do\'stingiz Premium sotib oladi → Sizga 10% chegirma (30 kun)',
											'Chegirma obuna sotib olayotganda avtomatik hisoblanadi',
										].map((text, i) => (
											<div key={i} className='flex items-start gap-2 text-xs text-text-secondary'>
												<span className='shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5'>{i + 1}</span>
												<span>{text}</span>
											</div>
										))}
									</div>
								</div>
							</Card>
						</motion.div>
					)}
				</div>
			</main>

			{/* Subscribe confirmation modal */}
			<AnimatePresence>
				{selectedPlan && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
						onClick={() => { if (!subscribing) { setSelectedPlan(null); setSubMsg(null); setDiscountApplied(false) } }}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2 }}
							className='bg-surface rounded-3xl border border-border p-6 sm:p-8 max-w-md w-full shadow-2xl'
							onClick={e => e.stopPropagation()}
						>
							<div className='flex items-center justify-between mb-6'>
								<h2 className='text-xl font-bold text-text-primary'>Obunani tasdiqlash</h2>
								<button onClick={() => { setSelectedPlan(null); setSubMsg(null); setDiscountApplied(false) }}
									className='p-1.5 rounded-lg hover:bg-surface-light transition-colors text-text-secondary'>
									<X className='w-5 h-5' />
								</button>
							</div>

							<div className='space-y-4'>
								<div className='bg-surface-light rounded-2xl p-4'>
									<div className='flex items-center gap-3 mb-3'>
										{(() => { const Icon = planIcons[selectedPlan.id] || Award; return <div className='p-2 bg-primary/10 rounded-xl'><Icon className='w-5 h-5 text-primary' /></div> })()}
										<div>
											<p className='font-bold text-text-primary'>{selectedPlan.name}</p>
											<p className='text-xs text-text-secondary'>{selectedPlan.description}</p>
										</div>
									</div>
									<div className='pt-3 border-t border-border space-y-1.5'>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-text-secondary'>{billingPeriod === 'yearly' ? 'Yillik to\'lov' : 'Oylik to\'lov'}</span>
											<span className={`font-bold text-text-primary text-lg ${discountApplied && activeDiscount ? 'line-through text-text-secondary text-base' : ''}`}>
												{formatPrice(billingPeriod === 'yearly' ? (selectedPlan.yearlyPrice || 0) : (selectedPlan.monthlyPrice || 0))} so&apos;m
											</span>
										</div>
										{discountApplied && activeDiscount && (
											<>
												<div className='flex items-center justify-between text-primary'>
													<span className='text-sm flex items-center gap-1'><Percent className='w-3.5 h-3.5' /> {activeDiscount.percent}% chegirma</span>
													<span className='text-sm font-semibold'>
														-{formatPrice(Math.round((billingPeriod === 'yearly' ? (selectedPlan.yearlyPrice || 0) : (selectedPlan.monthlyPrice || 0)) * activeDiscount.percent / 100))} so&apos;m
													</span>
												</div>
												<div className='flex items-center justify-between border-t border-border pt-1.5'>
													<span className='text-sm font-bold text-text-primary'>Jami</span>
													<span className='text-xl font-bold text-primary'>
														{formatPrice(Math.round((billingPeriod === 'yearly' ? (selectedPlan.yearlyPrice || 0) : (selectedPlan.monthlyPrice || 0)) * (1 - activeDiscount.percent / 100)))} so&apos;m
													</span>
												</div>
											</>
										)}
									</div>
								</div>

								{/* Apply discount button */}
								{activeDiscount && !discountApplied && (
									<button
										onClick={() => setDiscountApplied(true)}
										className='w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-all border border-primary/20'>
										<Percent className='w-4 h-4' /> {activeDiscount.percent}% chegirmani hisoblash
									</button>
								)}
								{discountApplied && activeDiscount && (
									<div className='flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-xl px-3 py-2'>
										<CheckCircle className='w-3.5 h-3.5 shrink-0' />
										{activeDiscount.percent}% chegirma qo&apos;llanildi — chegirma chegirmasi keyingi {Math.ceil((new Date(activeDiscount.expiresAt).getTime() - Date.now()) / 86400000)} kun davomida amal qiladi
									</div>
								)}

								<div className='bg-primary/5 border border-primary/20 rounded-xl p-3'>
									<p className='text-xs text-text-secondary'>
										<strong className='text-text-primary'>To&apos;lov usuli:</strong> &quot;Obuna bo&apos;lish&quot;ni bosgach Click yoki Payme orqali onlayn to&apos;lov sahifasiga o&apos;tasiz. To&apos;lov tasdiqlangach obuna avtomatik faollashadi.
									</p>
								</div>

								{subMsg && (
									<div className={`rounded-xl px-4 py-3 text-sm ${subMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
										{subMsg.text}
									</div>
								)}

								{pendingPaymentId ? (
									<div className='space-y-2 pt-2'>
										<p className='text-xs text-text-secondary text-center'>To&apos;lov tizimini tanlang:</p>
										<div className='flex gap-3'>
											<button
												onClick={() => handleCheckout('click')}
												className='flex-1 py-2.5 rounded-xl bg-[#00aaff] hover:opacity-90 text-white text-sm font-semibold transition-all'>
												Click orqali to&apos;lash
											</button>
											<button
												onClick={() => handleCheckout('payme')}
												className='flex-1 py-2.5 rounded-xl bg-[#33b3d6] hover:opacity-90 text-white text-sm font-semibold transition-all'>
												Payme orqali to&apos;lash
											</button>
										</div>
										<button
											onClick={() => { setSelectedPlan(null); setSubMsg(null); setDiscountApplied(false); setPendingPaymentId(null) }}
											className='w-full py-2 rounded-xl border border-border text-text-secondary hover:bg-surface-light transition-all text-xs font-medium'>
											Yopish
										</button>
									</div>
								) : (
									<div className='flex gap-3 pt-2'>
										<button
											onClick={() => { setSelectedPlan(null); setSubMsg(null); setDiscountApplied(false) }}
											disabled={subscribing}
											className='flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-light transition-all text-sm font-medium disabled:opacity-50'>
											Bekor qilish
										</button>
										<button
											onClick={handleSubscribe}
											disabled={subscribing}
											className='flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-secondary text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2'>
											{subscribing ? (
												<><Loader2 className='w-4 h-4 animate-spin' /> Tayyorlanmoqda...</>
											) : (
												<><Zap className='w-4 h-4' /> Obuna bo&apos;lish</>
											)}
										</button>
									</div>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
