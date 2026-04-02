/* eslint-disable @next/next/no-img-element */
'use client'

import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { backendUserToAuth, useAuth } from '@/lib/auth-context';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, Mail, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Step = 'email' | 'otp' | 'reset'

export default function ForgotPasswordPage() {
	const { loginWithData, user } = useAuth()
	const router = useRouter()

	const [step, setStep] = useState<Step>('email')
	const [email, setEmail] = useState('')
	const [otp, setOtp] = useState(['', '', '', '', '', ''])
	const [tempToken, setTempToken] = useState('')
	const [newUsername, setNewUsername] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [resendCooldown, setResendCooldown] = useState(0)

	const otpRefs = useRef<(HTMLInputElement | null)[]>([])

	useEffect(() => {
		if (user) router.push('/dashboard')
	}, [user, router])

	useEffect(() => {
		if (resendCooldown > 0) {
			const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
			return () => clearTimeout(t)
		}
	}, [resendCooldown])

	const handleSendOTP = async (e?: React.FormEvent) => {
		e?.preventDefault()
		setError('')
		setIsLoading(true)
		try {
			await api.auth.forgotPassword(email)
			setStep('otp')
			setResendCooldown(60)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
		} finally {
			setIsLoading(false)
		}
	}

	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return
		const next = [...otp]
		next[index] = value.slice(-1)
		setOtp(next)
		if (value && index < 5) otpRefs.current[index + 1]?.focus()
	}

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			otpRefs.current[index - 1]?.focus()
		}
	}

	const handleOtpPaste = (e: React.ClipboardEvent) => {
		const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
		if (paste.length === 6) {
			setOtp(paste.split(''))
			otpRefs.current[5]?.focus()
		}
	}

	const handleVerifyOTP = async () => {
		const code = otp.join('')
		if (code.length < 6) return
		setError('')
		setIsLoading(true)
		try {
			const res = await api.auth.verifyOTP(email, code, 'password-reset')
			setTempToken(res.tempToken)
			setStep('reset')
		} catch (err) {
			setError(err instanceof Error ? err.message : "Kod noto'g'ri")
		} finally {
			setIsLoading(false)
		}
	}

	const handleReset = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)
		try {
			const res = await api.auth.resetPassword(tempToken, newUsername, newPassword)
			loginWithData(backendUserToAuth(res.user, res.token))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Xatolikni yangilashda xatolik')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-secondary flex items-center justify-center p-6'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className='w-full max-w-md'
			>
				<div className='flex items-center gap-3 mb-8 justify-center'>
					<img src='/logotip.png' alt='Med AI Simulator' className='h-14 w-auto object-contain' />
				</div>

				<div className='bg-surface rounded-2xl border border-border p-6 sm:p-8'>
					<AnimatePresence mode='wait'>
						{/* Step: Email */}
						{step === 'email' && (
							<motion.div
								key='email'
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.25 }}
							>
								<div className='mb-6'>
									<h2 className='text-xl font-bold text-text-primary mb-1'>Parolni tiklash</h2>
									<p className='text-sm text-text-secondary'>
										Emailingizni kiriting, tasdiqlash kodi yuboriladi
									</p>
								</div>
								<form onSubmit={handleSendOTP} className='space-y-4'>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Email</label>
										<div className='relative'>
											<Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
											<input
												type='email'
												value={email}
												onChange={e => setEmail(e.target.value)}
												placeholder='email@example.com'
												required
												autoFocus
												className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
											/>
										</div>
									</div>
									{error && (
										<motion.p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>
											{error}
										</motion.p>
									)}
									<Button size='lg' className='w-full' disabled={isLoading}>
										{isLoading ? 'Yuborilmoqda...' : 'Kodni yuborish'}
									</Button>
								</form>
							</motion.div>
						)}

						{/* Step: OTP */}
						{step === 'otp' && (
							<motion.div
								key='otp'
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.25 }}
							>
								<button
									type='button'
									onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']) }}
									className='flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors'
								>
									<ArrowLeft className='w-4 h-4' /> Orqaga
								</button>
								<div className='mb-6'>
									<h2 className='text-xl font-bold text-text-primary mb-1'>Kodni kiriting</h2>
									<p className='text-sm text-text-secondary'>
										<span className='text-text-primary font-medium'>{email}</span> ga 6 xonali kod yuborildi
									</p>
								</div>

								<div className='flex gap-2 justify-center mb-5' onPaste={handleOtpPaste}>
									{otp.map((digit, i) => (
										<input
											key={i}
											ref={el => { otpRefs.current[i] = el }}
											type='text'
											inputMode='numeric'
											maxLength={1}
											value={digit}
											onChange={e => handleOtpChange(i, e.target.value)}
											onKeyDown={e => handleOtpKeyDown(i, e)}
											className='w-11 h-12 text-center text-lg font-bold bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
										/>
									))}
								</div>

								{error && (
									<motion.p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2 mb-3'>
										{error}
									</motion.p>
								)}

								<Button
									size='lg'
									className='w-full mb-3'
									onClick={handleVerifyOTP}
									disabled={isLoading || otp.join('').length < 6}
								>
									{isLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
								</Button>

								<p className='text-center text-sm text-text-secondary'>
									Kod kelmadimi?{' '}
									{resendCooldown > 0 ? (
										<span className='text-text-secondary'>{resendCooldown}s kutish</span>
									) : (
										<button
											type='button'
											onClick={() => handleSendOTP()}
											className='text-primary hover:underline'
										>
											Qayta yuborish
										</button>
									)}
								</p>
							</motion.div>
						)}

						{/* Step: Reset password */}
						{step === 'reset' && (
							<motion.div
								key='reset'
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.25 }}
							>
								<div className='mb-6'>
									<div className='flex items-center gap-2 mb-2'>
										<CheckCircle className='w-5 h-5 text-primary' />
										<h2 className='text-xl font-bold text-text-primary'>Yangi login va parol</h2>
									</div>
									<p className='text-sm text-text-secondary'>Email tasdiqlandi. Yangi login va parolni kiriting.</p>
								</div>

								<form onSubmit={handleReset} className='space-y-4'>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Yangi login</label>
										<div className='relative'>
											<UserCheck className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
											<input
												type='text'
												value={newUsername}
												onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
												placeholder='kamida 6 ta belgi'
												required
												autoFocus
												className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
											/>
										</div>
									</div>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Yangi parol</label>
										<div className='relative'>
											<Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
											<input
												type={showPassword ? 'text' : 'password'}
												value={newPassword}
												onChange={e => setNewPassword(e.target.value)}
												placeholder='kamida 6 ta belgi'
												required
												minLength={6}
												className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
											/>
											<button
												type='button'
												onClick={() => setShowPassword(!showPassword)}
												className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-primary transition-colors'
											>
												{showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
											</button>
										</div>
									</div>

									{error && (
										<motion.p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>
											{error}
										</motion.p>
									)}

									<Button size='lg' className='w-full' disabled={isLoading}>
										{isLoading ? 'Saqlanmoqda...' : 'Yangilash'}
									</Button>
								</form>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<p className='text-center text-sm text-text-secondary mt-4'>
					<Link href='/login' className='text-primary hover:underline font-medium flex items-center justify-center gap-1'>
						<ArrowLeft className='w-3 h-3' /> Kirish sahifasiga qaytish
					</Link>
				</p>
			</motion.div>
		</div>
	)
}
