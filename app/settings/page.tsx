/* eslint-disable @next/next/no-img-element */
'use client'

import Sidebar from '@/components/layout/Sidebar';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    Camera,
    CheckCircle,
    CreditCard,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Moon,
    Palette,
    Save,
    Shield,
    Tag,
    User,
    UserCheck,
    Volume2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
	return (
		<button
			onClick={() => onChange(!enabled)}
			className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-surface-light'}`}
		>
			<span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
		</button>
	)
}

function OtpRow({
	otp, refs, onChange, onKeyDown, onPaste,
}: {
	otp: string[]
	refs: React.MutableRefObject<(HTMLInputElement | null)[]>
	onChange: (i: number, v: string) => void
	onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void
	onPaste: (e: React.ClipboardEvent) => void
}) {
	return (
		<div className='flex gap-2' onPaste={onPaste}>
			{otp.map((digit, i) => (
				<input key={i} ref={el => { refs.current[i] = el }} type='text' inputMode='numeric'
					maxLength={1} value={digit}
					onChange={e => onChange(i, e.target.value)}
					onKeyDown={e => onKeyDown(i, e)}
					className='w-10 h-11 text-center text-lg font-bold bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
			))}
		</div>
	)
}

export default function SettingsPage() {
	const { user, updateUser } = useAuth()
	const { theme, setTheme } = useTheme()
	const router = useRouter()

	// Profile
	const [profileFirstName, setProfileFirstName] = useState('')
	const [profileLastName, setProfileLastName] = useState('')
	const [profileAvatar, setProfileAvatar] = useState('')
	const [profileSpecialty, setProfileSpecialty] = useState('')
	const [profileUniversity, setProfileUniversity] = useState('')
	const [profileSaving, setProfileSaving] = useState(false)
	const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	// Preferences (synced to backend)
	const [notifications, setNotifications] = useState({ email: true, push: true, weekly: false, achievements: true })
	const [preferences, setPreferences] = useState({ darkMode: true, sound: true, animations: true, language: 'uz', autoSave: true })
	const [settingsSaving, setSettingsSaving] = useState(false)

	// Promo code
	const [promoCode, setPromoCode] = useState('')
	const [promoLoading, setPromoLoading] = useState(false)
	const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	// Password change
	const [pwStep, setPwStep] = useState<'form' | 'otp' | 'done'>('form')
	const [newPassword, setNewPassword] = useState('')
	const [showNewPw, setShowNewPw] = useState(false)
	const [pwOtp, setPwOtp] = useState(['', '', '', '', '', ''])
	const [pwError, setPwError] = useState('')
	const [pwLoading, setPwLoading] = useState(false)
	const [pwCooldown, setPwCooldown] = useState(0)
	const pwRefs = useRef<(HTMLInputElement | null)[]>([])

	// Username change
	const [unStep, setUnStep] = useState<'form' | 'otp' | 'done'>('form')
	const [newUsername, setNewUsername] = useState('')
	const [unOtp, setUnOtp] = useState(['', '', '', '', '', ''])
	const [unError, setUnError] = useState('')
	const [unLoading, setUnLoading] = useState(false)
	const [unCooldown, setUnCooldown] = useState(0)
	const unRefs = useRef<(HTMLInputElement | null)[]>([])

	// Email change
	const [emailStep, setEmailStep] = useState<'form' | 'otp' | 'done'>('form')
	const [newEmail, setNewEmail] = useState('')
	const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', ''])
	const [emailError, setEmailError] = useState('')
	const [emailLoading, setEmailLoading] = useState(false)
	const [emailCooldown, setEmailCooldown] = useState(0)
	const emailRefs = useRef<(HTMLInputElement | null)[]>([])

	useEffect(() => {
		if (!user) { router.push('/login'); return }
		setProfileFirstName(user.firstName || '')
		setProfileLastName(user.lastName || '')
		setProfileAvatar(user.avatar || '')
		setProfileSpecialty(user.specialty || '')
		setProfileUniversity(user.university || '')
		if (user.notifications) setNotifications({ email: user.notifications.email ?? true, push: user.notifications.push ?? true, weekly: user.notifications.weekly ?? false, achievements: user.notifications.achievements ?? true })
		if (user.preferences) setPreferences({ darkMode: theme === 'dark', sound: user.preferences.sound ?? true, animations: user.preferences.animations ?? true, language: user.preferences.language ?? 'uz', autoSave: user.preferences.autoSave ?? true })
	}, [user, router, theme])

	useEffect(() => {
		if (pwCooldown > 0) { const t = setTimeout(() => setPwCooldown(c => c - 1), 1000); return () => clearTimeout(t) }
	}, [pwCooldown])

	useEffect(() => {
		if (unCooldown > 0) { const t = setTimeout(() => setUnCooldown(c => c - 1), 1000); return () => clearTimeout(t) }
	}, [unCooldown])

	useEffect(() => {
		if (emailCooldown > 0) { const t = setTimeout(() => setEmailCooldown(c => c - 1), 1000); return () => clearTimeout(t) }
	}, [emailCooldown])

	const makeOtp = (
		otp: string[],
		setOtp: (v: string[]) => void,
		refs: React.MutableRefObject<(HTMLInputElement | null)[]>
	) => ({
		onChange: (i: number, value: string) => {
			if (!/^\d*$/.test(value)) return
			const n = [...otp]; n[i] = value.slice(-1); setOtp(n)
			if (value && i < 5) refs.current[i + 1]?.focus()
		},
		onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
		},
		onPaste: (e: React.ClipboardEvent) => {
			const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
			if (p.length === 6) { setOtp(p.split('')); refs.current[5]?.focus() }
		},
	})

	const pwHandlers = makeOtp(pwOtp, setPwOtp, pwRefs)
	const emailHandlers = makeOtp(emailOtp, setEmailOtp, emailRefs)
	const unHandlers = makeOtp(unOtp, setUnOtp, unRefs)

	const handleProfileSave = async (e: React.FormEvent) => {
		e.preventDefault(); setProfileSaving(true); setProfileMsg(null)
		try {
			const payload: Record<string, string> = { firstName: profileFirstName.trim(), lastName: profileLastName.trim(), specialty: profileSpecialty, university: profileUniversity }
			if (profileAvatar) payload.avatar = profileAvatar
			const res = await api.auth.updateProfile(payload)
			updateUser({ name: res.user.name, firstName: res.user.firstName, lastName: res.user.lastName, avatar: res.user.avatar, specialty: res.user.specialty, university: res.user.university })
			setProfileMsg({ type: 'success', text: 'Profil saqlandi' })
		} catch (err) {
			setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Xatolik' })
		} finally { setProfileSaving(false) }
	}

	const handleUnRequest = async (e: React.FormEvent) => {
		e.preventDefault(); setUnError(''); setUnLoading(true)
		try { await api.auth.requestUsernameChange(newUsername); setUnStep('otp'); setUnCooldown(60) }
		catch (err) { setUnError(err instanceof Error ? err.message : 'Xatolik') }
		finally { setUnLoading(false) }
	}

	const handleUnConfirm = async () => {
		const code = unOtp.join(''); if (code.length < 6) return
		setUnError(''); setUnLoading(true)
		try {
			const res = await api.auth.confirmUsernameChange(code)
			updateUser({ username: res.user.username }); setUnStep('done')
		} catch (err) { setUnError(err instanceof Error ? err.message : "Kod noto'g'ri") }
		finally { setUnLoading(false) }
	}

	const handlePwRequest = async (e: React.FormEvent) => {
		e.preventDefault(); setPwError(''); setPwLoading(true)
		try { await api.auth.requestPasswordChange(newPassword); setPwStep('otp'); setPwCooldown(60) }
		catch (err) { setPwError(err instanceof Error ? err.message : 'Xatolik') }
		finally { setPwLoading(false) }
	}

	const handlePwConfirm = async () => {
		const code = pwOtp.join(''); if (code.length < 6) return
		setPwError(''); setPwLoading(true)
		try { await api.auth.confirmPasswordChange(code); setPwStep('done') }
		catch (err) { setPwError(err instanceof Error ? err.message : "Kod noto'g'ri") }
		finally { setPwLoading(false) }
	}

	const handleEmailRequest = async (e: React.FormEvent) => {
		e.preventDefault(); setEmailError(''); setEmailLoading(true)
		try { await api.auth.requestEmailChange(newEmail); setEmailStep('otp'); setEmailCooldown(60) }
		catch (err) { setEmailError(err instanceof Error ? err.message : 'Xatolik') }
		finally { setEmailLoading(false) }
	}

	const handleEmailConfirm = async () => {
		const code = emailOtp.join(''); if (code.length < 6) return
		setEmailError(''); setEmailLoading(true)
		try {
			const res = await api.auth.confirmEmailChange(code)
			updateUser({ email: res.newEmail }); setEmailStep('done')
		} catch (err) { setEmailError(err instanceof Error ? err.message : "Kod noto'g'ri") }
		finally { setEmailLoading(false) }
	}

	const handleNotificationChange = async (key: keyof typeof notifications, val: boolean) => {
		const updated = { ...notifications, [key]: val }
		setNotifications(updated)
		setSettingsSaving(true)
		try { await api.auth.updateProfile({ [`notifications.${key}`]: val }) } catch { /* silent */ } finally { setSettingsSaving(false) }
	}

	const handlePreferenceChange = async (key: keyof typeof preferences, val: boolean | string) => {
		const updated = { ...preferences, [key]: val }
		setPreferences(updated)
		if (key === 'darkMode') setTheme(val ? 'dark' : 'light')
		updateUser({ preferences: updated })
		setSettingsSaving(true)
		try { await api.auth.updateProfile({ [`preferences.${key}`]: val }) } catch { /* silent */ } finally { setSettingsSaving(false) }
	}

	const handlePromoCode = async (e: React.FormEvent) => {
		e.preventDefault(); setPromoMsg(null); setPromoLoading(true)
		try {
			const res = await api.subscriptions.applyPromoCode(promoCode.trim().toUpperCase())
			updateUser({ isPremium: true, subscription: res.subscription })
			setPromoMsg({ type: 'success', text: res.message || 'Promokod qabul qilindi! Obunangiz faollashdi.' })
			setPromoCode('')
		} catch (err) {
			setPromoMsg({ type: 'error', text: err instanceof Error ? err.message : 'Promokod xato yoki muddati tugagan' })
		} finally { setPromoLoading(false) }
	}

	if (!user) return null

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6'>
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-2'>
						<h1 className='text-2xl sm:text-3xl font-bold text-text-primary mb-1'>Sozlamalar</h1>
						<p className='text-text-secondary'>Profil va hisobingizni boshqaring</p>
					</motion.div>

					{/* Profile */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-5'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><User className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='text-base font-semibold text-text-primary'>Profil ma&apos;lumotlari</h3>
									<p className='text-xs text-text-secondary'>Shaxsiy ma&apos;lumotlaringizni tahrirlang</p>
								</div>
							</div>
							<form onSubmit={handleProfileSave} className='space-y-4'>							<div className='flex items-center gap-4 mb-1'>
								<button type='button' onClick={() => document.getElementById('settings-avatar-input')?.click()}
									className='relative w-16 h-16 rounded-full bg-surface-light border-2 border-dashed border-border hover:border-primary/60 transition-colors overflow-hidden group shrink-0'>
									{(profileAvatar || user.avatar) ? (
										<img src={profileAvatar || user.avatar!} alt='avatar' className='w-full h-full object-cover' referrerPolicy='no-referrer' />
									) : (
										<div className='flex items-center justify-center h-full'>
											<Camera className='w-5 h-5 text-text-secondary/40 group-hover:text-primary transition-colors' />
										</div>
									)}
									<div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity'>
										<Camera className='w-4 h-4 text-white' />
									</div>
								</button>
								<input id='settings-avatar-input' type='file' accept='image/*' className='hidden' onChange={e => {
									const file = e.target.files?.[0]; if (!file) return
									if (file.size > 3 * 1024 * 1024) { alert('Max 3 MB'); return }
									const reader = new FileReader(); reader.onload = ev => setProfileAvatar(ev.target?.result as string); reader.readAsDataURL(file)
								}} />
								<div>
									<p className='text-sm font-medium text-text-primary'>{user.name || 'Foydalanuvchi'}</p>
									{user.username && <p className='text-xs text-text-secondary'>@{user.username}</p>}
									{profileAvatar && profileAvatar !== user.avatar && <button type='button' onClick={() => setProfileAvatar('')} className='text-xs text-accent hover:underline mt-0.5'>O&apos;chirish</button>}
								</div>
							</div>								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Ism</label>
										<input type='text' value={profileFirstName} onChange={e => setProfileFirstName(e.target.value)}
											className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
									</div>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Familiya</label>
										<input type='text' value={profileLastName} onChange={e => setProfileLastName(e.target.value)}
											className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
									</div>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Email</label>
										<input type='text' value={user.email} disabled
											className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-secondary opacity-60 cursor-not-allowed' />
									</div>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Mutaxassislik</label>
										<input type='text' value={profileSpecialty} onChange={e => setProfileSpecialty(e.target.value)} placeholder='Masalan: Kardiologiya'
											className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
									</div>
									<div>
										<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Universitet</label>
										<input type='text' value={profileUniversity} onChange={e => setProfileUniversity(e.target.value)} placeholder='Masalan: ToshMI'
											className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
									</div>
								</div>
								{profileMsg && (
									<p className={`text-sm rounded-lg px-3 py-2 ${profileMsg.type === 'success' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'}`}>{profileMsg.text}</p>
								)}
								<button type='submit' disabled={profileSaving}
									className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
									<Save className='w-4 h-4' />{profileSaving ? 'Saqlanmoqda...' : 'Saqlash'}
								</button>
							</form>
						</Card>
					</motion.div>

					{/* Password change — only for email/password users */}
					{user.hasPassword ? (
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-5'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><Shield className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='text-base font-semibold text-text-primary'>Parolni o&apos;zgartirish</h3>
									<p className='text-xs text-text-secondary'>Email orqali tasdiqlash kerak</p>
								</div>
							</div>
							<AnimatePresence mode='wait'>
								{pwStep === 'form' && (
									<motion.form key='pw-form' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handlePwRequest} className='space-y-4'>
										<p className='text-sm text-text-secondary'>Yangi parolni kiriting. <span className='font-medium text-text-primary'>{user.email}</span> ga tasdiqlash kodi yuboriladi.</p>
										<div className='max-w-xs'>
											<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Yangi parol</label>
											<div className='relative'>
												<input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
													placeholder='Kamida 8 ta belgi' required minLength={8}
													className='w-full bg-surface-light border border-border rounded-xl px-3 pr-10 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
												<button type='button' onClick={() => setShowNewPw(!showNewPw)} className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-primary transition-colors'>
													{showNewPw ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
												</button>
											</div>
										</div>
										{pwError && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{pwError}</p>}
										<button type='submit' disabled={pwLoading}
											className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
											<Lock className='w-4 h-4' />{pwLoading ? 'Yuborilmoqda...' : 'Kodni yuborish'}
										</button>
									</motion.form>
								)}
								{pwStep === 'otp' && (
									<motion.div key='pw-otp' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='space-y-4'>
										<p className='text-sm text-text-secondary'><span className='font-medium text-text-primary'>{user.email}</span> ga 6 xonali kod yuborildi</p>
										<OtpRow otp={pwOtp} refs={pwRefs} onChange={pwHandlers.onChange} onKeyDown={pwHandlers.onKeyDown} onPaste={pwHandlers.onPaste} />
										{pwError && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{pwError}</p>}
										<div className='flex items-center gap-3 flex-wrap'>
											<button type='button' onClick={handlePwConfirm} disabled={pwLoading || pwOtp.join('').length < 6}
												className='bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
												{pwLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
											</button>
											<button type='button' onClick={() => { setPwStep('form'); setPwError(''); setPwOtp(['','','','','','']) }} className='text-sm text-text-secondary hover:text-text-primary'>Bekor qilish</button>
											{pwCooldown > 0 ? <span className='text-xs text-text-secondary'>{pwCooldown}s</span> : (
												<button type='button' onClick={() => api.auth.requestPasswordChange(newPassword).then(() => setPwCooldown(60)).catch(() => {})} className='text-xs text-primary hover:underline'>Qayta yuborish</button>
											)}
										</div>
									</motion.div>
								)}
								{pwStep === 'done' && (
									<motion.div key='pw-done' initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex items-center gap-2 text-primary'>
										<CheckCircle className='w-5 h-5' /><span className='font-medium'>Parol muvaffaqiyatli o&apos;zgartirildi</span>
									</motion.div>
								)}
							</AnimatePresence>
						</Card>
					</motion.div>
					) : (
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><Shield className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='text-base font-semibold text-text-primary'>Parol</h3>
									<p className='text-xs text-text-secondary'>Siz Google orqali kirgansiz — parol o&apos;rnatilmagan</p>
								</div>
							</div>
							<p className='text-sm text-text-secondary mt-4 flex items-center gap-2'>
								<svg width='16' height='16' viewBox='0 0 18 18' className='shrink-0'><path fill='#4285F4' d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z'/><path fill='#34A853' d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z'/><path fill='#FBBC05' d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z'/><path fill='#EA4335' d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z'/></svg>
								Google hisobingiz orqali tizimga kirasiz. Parol boshqaruvchi Google tizimida.
							</p>
						</Card>
					</motion.div>
					)}

					{/* Username change — only for manual login users */}
					{user.hasPassword && (
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-5'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><UserCheck className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='text-base font-semibold text-text-primary'>Loginni o&apos;zgartirish</h3>
									<p className='text-xs text-text-secondary'>Joriy login: <span className='text-text-primary'>@{user.username || '—'}</span></p>
								</div>
							</div>
							<AnimatePresence mode='wait'>
								{unStep === 'form' && (
									<motion.form key='un-form' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleUnRequest} className='space-y-4'>
										<p className='text-sm text-text-secondary'>Yangi loginni kiriting. <span className='font-medium text-text-primary'>{user.email}</span> ga tasdiqlash kodi yuboriladi.</p>
										<div className='max-w-xs'>
											<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Yangi login</label>
											<div className='relative'>
												<UserCheck className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
												<input type='text' value={newUsername} onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
													placeholder='kamida 6 ta belgi' required
													className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
											</div>
										</div>
										{unError && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{unError}</p>}
										<button type='submit' disabled={unLoading || newUsername.length < 6}
											className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
											<UserCheck className='w-4 h-4' />{unLoading ? 'Yuborilmoqda...' : 'Kodni yuborish'}
										</button>
									</motion.form>
								)}
								{unStep === 'otp' && (
									<motion.div key='un-otp' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='space-y-4'>
										<p className='text-sm text-text-secondary'><span className='font-medium text-text-primary'>{user.email}</span> ga 6 xonali kod yuborildi</p>
										<OtpRow otp={unOtp} refs={unRefs} onChange={unHandlers.onChange} onKeyDown={unHandlers.onKeyDown} onPaste={unHandlers.onPaste} />
										{unError && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{unError}</p>}
										<div className='flex items-center gap-3 flex-wrap'>
											<button type='button' onClick={handleUnConfirm} disabled={unLoading || unOtp.join('').length < 6}
												className='bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
												{unLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
											</button>
											<button type='button' onClick={() => { setUnStep('form'); setUnError(''); setUnOtp(['','','','','','']) }} className='text-sm text-text-secondary hover:text-text-primary'>Bekor qilish</button>
											{unCooldown > 0 ? <span className='text-xs text-text-secondary'>{unCooldown}s</span> : (
												<button type='button' onClick={() => api.auth.requestUsernameChange(newUsername).then(() => setUnCooldown(60)).catch(() => {})} className='text-xs text-primary hover:underline'>Qayta yuborish</button>
											)}
										</div>
									</motion.div>
								)}
								{unStep === 'done' && (
									<motion.div key='un-done' initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex items-center gap-2 text-primary'>
										<CheckCircle className='w-5 h-5' /><span className='font-medium'>Login muvaffaqiyatli o&apos;zgartirildi</span>
									</motion.div>
								)}
							</AnimatePresence>
						</Card>
					</motion.div>
					)}

					{/* Email change */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-5'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><Mail className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='text-base font-semibold text-text-primary'>Emailni o&apos;zgartirish</h3>
									<p className='text-xs text-text-secondary'>Joriy email: <span className='text-text-primary'>{user.email}</span></p>
								</div>
							</div>
							<AnimatePresence mode='wait'>
								{emailStep === 'form' && (
									<motion.form key='email-form' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleEmailRequest} className='space-y-4'>
										<p className='text-sm text-text-secondary'>Yangi emailni kiriting. Joriy emailingizga tasdiqlash kodi yuboriladi.</p>
										<div className='max-w-xs'>
											<label className='text-xs font-medium text-text-secondary mb-1.5 block'>Yangi email</label>
											<div className='relative'>
												<Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
												<input type='email' value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder='yangi@email.com' required
													className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
											</div>
										</div>
										{emailError && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{emailError}</p>}
										<button type='submit' disabled={emailLoading}
											className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
											<Mail className='w-4 h-4' />{emailLoading ? 'Yuborilmoqda...' : 'Kodni yuborish'}
										</button>
									</motion.form>
								)}
								{emailStep === 'otp' && (
									<motion.div key='email-otp' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='space-y-4'>
										<p className='text-sm text-text-secondary'><span className='font-medium text-text-primary'>{user.email}</span> ga 6 xonali kod yuborildi</p>
										<OtpRow otp={emailOtp} refs={emailRefs} onChange={emailHandlers.onChange} onKeyDown={emailHandlers.onKeyDown} onPaste={emailHandlers.onPaste} />
										{emailError && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{emailError}</p>}
										<div className='flex items-center gap-3 flex-wrap'>
											<button type='button' onClick={handleEmailConfirm} disabled={emailLoading || emailOtp.join('').length < 6}
												className='bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 text-sm'>
												{emailLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
											</button>
											<button type='button' onClick={() => { setEmailStep('form'); setEmailError(''); setEmailOtp(['','','','','','']) }} className='text-sm text-text-secondary hover:text-text-primary'>Bekor qilish</button>
											{emailCooldown > 0 ? <span className='text-xs text-text-secondary'>{emailCooldown}s</span> : (
												<button type='button' onClick={() => api.auth.requestEmailChange(newEmail).then(() => setEmailCooldown(60)).catch(() => {})} className='text-xs text-primary hover:underline'>Qayta yuborish</button>
											)}
										</div>
									</motion.div>
								)}
								{emailStep === 'done' && (
									<motion.div key='email-done' initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex items-center gap-2 text-primary'>
										<CheckCircle className='w-5 h-5' /><span className='font-medium'>Email muvaffaqiyatli o&apos;zgartirildi</span>
									</motion.div>
								)}
							</AnimatePresence>
						</Card>
					</motion.div>

					{/* Notifications */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center justify-between mb-5'>
								<div className='flex items-center gap-3'>
									<div className='p-2.5 bg-primary/10 rounded-xl'><Bell className='w-5 h-5 text-primary' /></div>
									<h3 className='text-base font-semibold text-text-primary'>Bildirishnomalar</h3>
								</div>
								{settingsSaving && <span className='text-xs text-text-secondary animate-pulse'>Saqlanmoqda...</span>}
							</div>
							<div className='space-y-3'>
								{[
									{ key: 'email' as const, label: 'Email bildirishnomalar', desc: 'Yangi keyslar haqida email' },
									{ key: 'push' as const, label: 'Push bildirishnomalar', desc: 'Brauzer orqali bildirishnomalar' },
									{ key: 'weekly' as const, label: 'Haftalik hisobot', desc: 'Statistika va taraqqiyot' },
									{ key: 'achievements' as const, label: 'Yutuqlar', desc: 'Yangi yutuqlarga erishganda' },
								].map(item => (
									<div key={item.key} className='flex items-center justify-between p-3 bg-surface-light rounded-xl'>
										<div>
											<p className='text-sm font-medium text-text-primary'>{item.label}</p>
											<p className='text-xs text-text-secondary'>{item.desc}</p>
										</div>
										<Toggle enabled={notifications[item.key]} onChange={val => handleNotificationChange(item.key, val)} />
									</div>
								))}
							</div>
						</Card>
					</motion.div>

					{/* Preferences */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center justify-between mb-5'>
								<div className='flex items-center gap-3'>
									<div className='p-2.5 bg-primary/10 rounded-xl'><Palette className='w-5 h-5 text-primary' /></div>
									<h3 className='text-base font-semibold text-text-primary'>Dastur sozlamalari</h3>
								</div>
								{settingsSaving && <span className='text-xs text-text-secondary animate-pulse'>Saqlanmoqda...</span>}
							</div>
							<div className='space-y-3'>
								{[
									{ key: 'darkMode' as const, label: "Qorong'u rejim", icon: Moon },
									{ key: 'sound' as const, label: 'Ovoz effektlari', icon: Volume2 },
									{ key: 'animations' as const, label: 'Animatsiyalar', icon: Eye },
									{ key: 'autoSave' as const, label: 'Avtomatik saqlash', icon: Save },
								].map(({ key, label, icon: Icon }) => (
									<div key={key} className='flex items-center justify-between p-3 bg-surface-light rounded-xl'>
										<div className='flex items-center gap-3'>
											<Icon className='w-4 h-4 text-text-secondary' />
											<p className='text-sm font-medium text-text-primary'>{label}</p>
										</div>
										<Toggle enabled={preferences[key] as boolean} onChange={val => handlePreferenceChange(key, val)} />
									</div>
								))}
								{/* <div className='flex items-center justify-between p-3 bg-surface-light rounded-xl'>
									<div className='flex items-center gap-3'>
										<Globe className='w-4 h-4 text-text-secondary' />
										<p className='text-sm font-medium text-text-primary'>Til</p>
									</div>
									<select value={preferences.language} onChange={e => handlePreferenceChange('language', e.target.value)}
										className='bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50'>
										<option value='uz'>O&apos;zbekcha</option>
										<option value='ru'>Русский</option>
										<option value='en'>English</option>
									</select>
								</div> */}
							</div>
						</Card>
					</motion.div>

					{/* Promo code */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							<div className='flex items-center gap-3 mb-5'>
								<div className='p-2.5 bg-primary/10 rounded-xl'><Tag className='w-5 h-5 text-primary' /></div>
								<div>
									<h3 className='text-base font-semibold text-text-primary'>Promokod</h3>
									<p className='text-xs text-text-secondary'>Obuna faollashtirish uchun promokod kiriting</p>
								</div>
							</div>
							{user?.isPremium && user?.subscription?.plan !== 'free' && (
								<div className='mb-4 p-3 bg-primary/10 rounded-xl flex items-center gap-3'>
									<CreditCard className='w-5 h-5 text-primary shrink-0' />
									<div>
										<p className='text-sm font-semibold text-primary capitalize'>{user?.subscription?.plan} obuna faol</p>
										{user?.subscription?.expiresAt && <p className='text-xs text-text-secondary'>Muddati: {new Date(user.subscription!.expiresAt!).toLocaleDateString('uz-UZ')}</p>}
									</div>
								</div>
							)}
							<form onSubmit={handlePromoCode} className='space-y-3'>
								<div className='flex gap-3'>
									<input type='text' value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder='PROMOKOD' required
										className='flex-1 bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all uppercase' />
									<button type='submit' disabled={promoLoading || promoCode.trim().length < 4}
										className='bg-primary hover:bg-primary/90 text-secondary font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm whitespace-nowrap'>
										{promoLoading ? 'Tekshirilmoqda...' : 'Qo\'llash'}
									</button>
								</div>
								{promoMsg && <p className={`text-sm rounded-lg px-3 py-2 ${promoMsg.type === 'success' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'}`}>{promoMsg.text}</p>}
							</form>
							<div className='mt-4 pt-4 border-t border-border'>
								<Link href='/subscription' className='flex items-center gap-2 text-sm text-primary hover:underline'>
									<CreditCard className='w-4 h-4' /> Obuna rejalarini ko&apos;rish
								</Link>
							</div>
						</Card>
					</motion.div>

					{/* Admin / Content Manager quick access */}
					{(user?.role === 'admin' || user?.role === 'content-manager') && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn}>
							<Card hover={false}>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-2.5 bg-primary/10 rounded-xl'><Shield className='w-5 h-5 text-primary' /></div>
									<div>
										<h3 className='text-base font-semibold text-text-primary'>Boshqaruv paneli</h3>
										<p className='text-xs text-text-secondary'>Tizim boshqaruviga o&apos;tish</p>
									</div>
								</div>
								<div className='flex flex-wrap gap-3'>
									{user?.role === 'admin' && (
										<Link href='/admin' className='flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-4 py-2.5 rounded-xl transition-all text-sm'>
											<Shield className='w-4 h-4' /> Admin panel
										</Link>
									)}
									{(user?.role === 'admin' || user?.role === 'content-manager') && (
										<Link href='/content-manager' className='flex items-center gap-2 bg-surface-light hover:bg-surface text-text-primary font-semibold px-4 py-2.5 rounded-xl transition-all text-sm border border-border'>
											<UserCheck className='w-4 h-4' /> Kontent manager
										</Link>
									)}
								</div>
							</Card>
						</motion.div>
					)}
				</div>
			</main>
		</div>
	)
}
