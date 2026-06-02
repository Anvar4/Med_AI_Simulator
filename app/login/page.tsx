/* eslint-disable @next/next/no-img-element */
'use client'

import Button from '@/components/ui/Button';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { api } from '@/lib/api';
import { backendUserToAuth, useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/language-context';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import {
    Eye,
    EyeOff,
    Lock,
    UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
const { login, loginWithData, user } = useAuth()
const { t } = useT()
const router = useRouter()
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)
const [error, setError] = useState('')
const [isSubmitting, setIsSubmitting] = useState(false)
const [isGoogleLoading, setIsGoogleLoading] = useState(false)

useEffect(() => {
if (user) {
if (user.role === 'admin') router.push('/admin')
else if (user.role === 'content-manager') router.push('/content-manager')
else router.push('/dashboard')
}
}, [user, router])

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault()
setError('')
setIsSubmitting(true)
const result = await login(username, password)
if (!result.success && result.error) setError(result.error)
setIsSubmitting(false)
}

const googleLogin = useGoogleLogin({
onSuccess: async tokenResponse => {
setIsGoogleLoading(true)
setError('')
try {
const res = await api.auth.googleAccessToken(tokenResponse.access_token)
loginWithData(backendUserToAuth(res.user, res.token))
} catch (err) {
const msg = err instanceof Error ? err.message : 'Google orqali kirishda xatolik'
setError(msg)
} finally {
setIsGoogleLoading(false)
}
},
onError: () => {
setError('Google orqali kirishda xatolik yuz berdi')
setIsGoogleLoading(false)
},
})

return (
<div className='min-h-screen bg-secondary flex relative'>
<div className='absolute top-4 right-4 z-20'>
<LanguageSwitcher />
</div>
{/* Left branding */}
<div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
<div className='absolute inset-0 bg-linear-to-br from-primary/20 via-secondary to-secondary' />
<div className='absolute inset-0 opacity-10'>
<div className='absolute top-20 left-20 w-64 h-64 rounded-full bg-primary blur-[120px]' />
<div className='absolute bottom-20 right-20 w-48 h-48 rounded-full bg-accent blur-[100px]' />
</div>
<div className='relative z-10 flex flex-col justify-center px-12 xl:px-20'>
<div className='flex items-center gap-3 mb-8'>
<img src='/logotip.png' alt='Med AI Simulator' className='h-16 w-auto object-contain' />
</div>
<h1 className='text-4xl xl:text-5xl font-bold text-text-primary mb-4 leading-tight'>
Virtual Klinik<br />
<span className='text-primary'>Muhit</span>
</h1>
<p className='text-text-secondary text-lg max-w-md'>
Sun&apos;iy intellekt asosidagi virtual klinik muhit. 500+ tibbiy holatni xavfsiz sharoitda yechib, klinik ko&apos;nikmalaringizni oshiring.
</p>
<div className='mt-10 grid grid-cols-3 gap-4'>
{[
{ val: '500+', label: 'Klinik holatlar' },
{ val: '98%', label: 'Aniqlik' },
{ val: '24/7', label: 'Ishlaydi' },
].map(s => (
<div key={s.label} className='bg-surface/60 rounded-xl p-4 border border-border'>
<p className='text-2xl font-bold text-primary'>{s.val}</p>
<p className='text-xs text-text-secondary'>{s.label}</p>
</div>
))}
</div>
</div>
</div>

{/* Right form */}
<div className='flex-1 flex items-center justify-center p-6'>
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
className='w-full max-w-md'
>
<div className='lg:hidden flex items-center gap-3 mb-8 justify-center'>
<img src='/logotip.png' alt='Med AI Simulator' className='h-14 w-auto object-contain' />
</div>

<div className='bg-surface rounded-2xl border border-border p-6 sm:p-8'>
<div className='mb-6'>
<h2 className='text-xl font-bold text-text-primary mb-1'>{t('auth.signInTitle')}</h2>
<p className='text-sm text-text-secondary'>
{t('auth.signInSubtitle')}{' '}
<Link href='/register' className='text-primary hover:underline'>
{t('auth.registerLink')}
</Link>
</p>
</div>

{/* Google */}
<button
type='button'
onClick={() => googleLogin()}
disabled={isGoogleLoading || isSubmitting}
className='w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-xl border border-gray-200 transition-all mb-4 disabled:opacity-60'
>
<svg width='18' height='18' viewBox='0 0 18 18'>
<path fill='#4285F4' d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z' />
<path fill='#34A853' d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z' />
<path fill='#FBBC05' d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z' />
<path fill='#EA4335' d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z' />
</svg>
{isGoogleLoading ? t('auth.loggingIn') : t('auth.googleLogin')}
</button>

<div className='flex items-center gap-3 mb-4'>
<div className='h-px flex-1 bg-border' />
<span className='text-xs text-text-secondary'>{t('auth.or')}</span>
<div className='h-px flex-1 bg-border' />
</div>

<form onSubmit={handleSubmit} className='space-y-4'>
<div>
<label className='text-xs font-medium text-text-secondary mb-1.5 block'>{t('auth.username')}</label>
<div className='relative'>
<UserCheck className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
<input
type='text'
value={username}
onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
placeholder='login'
required
className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
/>
</div>
</div>
<div>
<div className='flex items-center justify-between mb-1.5'>
<label className='text-xs font-medium text-text-secondary'>{t('auth.password')}</label>
<Link href='/forgot-password' className='text-xs text-primary hover:underline'>
{t('auth.forgotPassword')}
</Link>
</div>
<div className='relative'>
<Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
<input
type={showPassword ? 'text' : 'password'}
value={password}
onChange={e => setPassword(e.target.value)}
placeholder='••••••••'
required
className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
/>
<button
type='button'
onClick={() => setShowPassword(p => !p)}
className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-primary transition-colors'
>
{showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
</button>
</div>
</div>

{error && (
<motion.p
initial={{ opacity: 0, y: -4 }}
animate={{ opacity: 1, y: 0 }}
className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'
>
{error}
</motion.p>
)}

<Button size='lg' className='w-full' disabled={isSubmitting || isGoogleLoading}>
{isSubmitting ? t('auth.loggingIn') : t('auth.login')}
</Button>
</form>

<p className='text-center text-sm text-text-secondary mt-4'>
{t('auth.noAccount')}{' '}
<Link href='/register' className='text-primary hover:underline font-medium'>
{t('auth.register')}
</Link>
</p>
</div>
</motion.div>
</div>
</div>
)
}
