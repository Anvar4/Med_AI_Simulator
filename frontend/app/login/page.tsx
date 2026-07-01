/* eslint-disable @next/next/no-img-element */
'use client'

import Button from '@/components/ui/Button';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { api } from '@/lib/api';
import { backendUserToAuth, useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/language-context';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
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
const { login, loginWithData, user, isLoading } = useAuth()
const { t, locale } = useT()
const router = useRouter()
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)
const [error, setError] = useState('')
const [isSubmitting, setIsSubmitting] = useState(false)
const [isGoogleLoading, setIsGoogleLoading] = useState(false)
// admin./manager. subdomenlarida Google login KO'RSATILMAYDI — faqat login/parol
const [isPanelHost, setIsPanelHost] = useState(false)

useEffect(() => {
const h = window.location.hostname.toLowerCase()
setIsPanelHost(h.startsWith('admin.') || h.startsWith('manager.'))
}, [])

useEffect(() => {
if (!isLoading && user) {
const host = window.location.hostname.toLowerCase()
const onAdminHost = host.startsWith('admin.')
const onManagerHost = host.startsWith('manager.')
const isPanel = onAdminHost || onManagerHost
if (user.role === 'admin') {
  // Asosiy domendan kirgan admin → admin subdomain panelga (asosiy domenda /admin YO'Q → 404)
  if (isPanel) router.push('/admin')
  else window.location.href = 'https://admin.medaisimulator.uz/admin'
} else if (user.role === 'content-manager') {
  if (isPanel) router.push('/content-manager')
  else window.location.href = 'https://manager.medaisimulator.uz/content-manager'
} else {
  // Oddiy user — panelda bo'lsa asosiy domenga qaytariladi
  if (isPanel) window.location.href = 'https://medaisimulator.uz/dashboard'
  else router.push('/dashboard')
}
}
}, [user, isLoading, router])

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault()
setError('')
setIsSubmitting(true)
const result = await login(username, password)
if (!result.success && result.error) setError(result.error)
setIsSubmitting(false)
}

const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
if (!credentialResponse.credential) {
  setError('Google credential olinmadi')
  return
}
setIsGoogleLoading(true)
setError('')
try {
  const res = await api.auth.google(credentialResponse.credential)
  loginWithData(backendUserToAuth(res.user, res.token), res.token)
} catch (err) {
  const msg = err instanceof Error ? err.message : 'Google orqali kirishda xatolik'
  setError(msg)
} finally {
  setIsGoogleLoading(false)
}
}

const googleLoginPopup = useGoogleLogin({
flow: 'implicit',
onSuccess: async tokenResponse => {
  setIsGoogleLoading(true)
  setError('')
  try {
    const res = await api.auth.googleAccessToken(tokenResponse.access_token)
    loginWithData(backendUserToAuth(res.user, res.token), res.token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Google orqali kirishda xatolik'
    setError(msg)
  } finally {
    setIsGoogleLoading(false)
  }
},
onError: errorResponse => {
  console.error('[GoogleLogin] onError:', errorResponse)
  setError(`Google xatosi: ${errorResponse?.error_description || errorResponse?.error || 'noma\'lum'}`)
  setIsGoogleLoading(false)
},
onNonOAuthError: nonOAuthErr => {
  // popup yopildi / blokeri / FedCM rad etdi
  console.error('[GoogleLogin] onNonOAuthError:', nonOAuthErr)
  setError(`Popup ochilmadi (${nonOAuthErr?.type || 'noma\'lum'}). Popup blokerini o'chiring yoki uchinchi tomon cookie\'larini yoqing.`)
  setIsGoogleLoading(false)
},
})

const handleGooglePopupClick = () => {
const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
console.log('[GoogleLogin] clientId mavjud:', !!cid, cid ? cid.slice(0, 20) + '…' : '(BO\'SH!)')
if (!cid) {
  setError('Google clientId topilmadi (build env muammosi)')
  return
}
try {
  googleLoginPopup()
} catch (e) {
  console.error('[GoogleLogin] popup chaqirishda exception:', e)
  setError('Google popup chaqirilmadi: ' + (e instanceof Error ? e.message : String(e)))
}
}

if (isLoading || user) {
return <div className='min-h-screen bg-secondary flex items-center justify-center'><div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' /></div>
}

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
{!isPanelHost && (
<p className='text-sm text-text-secondary'>
{t('auth.signInSubtitle')}{' '}
<Link href='/register' className='text-primary hover:underline'>
{t('auth.registerLink')}
</Link>
</p>
)}
</div>

{/* Google login — faqat asosiy domenda; admin./manager. subdomenlarida YO'Q */}
{!isPanelHost && (
<>
<div className='w-full mb-4'>
<div className={`[&>div]:w-full [&>div>div]:w-full [&_iframe]:w-full ${isGoogleLoading ? 'opacity-60 pointer-events-none' : ''}`}>
  {/* key={locale} — til o'zgarganda widget qayta mount bo'lib, locale bilan render bo'ladi */}
  <GoogleLogin
    key={locale}
    onSuccess={handleGoogleSuccess}
    onError={() => handleGooglePopupClick()}
    width='400'
    size='large'
    shape='rectangular'
    logo_alignment='left'
    text='signin_with'
    useOneTap={false}
    {...({ locale } as { locale: string })}
  />
</div>
</div>

<div className='flex items-center gap-3 mb-4'>
<div className='h-px flex-1 bg-border' />
<span className='text-xs text-text-secondary'>{t('auth.or')}</span>
<div className='h-px flex-1 bg-border' />
</div>
</>
)}

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
{!isPanelHost && (
<Link href='/forgot-password' className='text-xs text-primary hover:underline'>
{t('auth.forgotPassword')}
</Link>
)}
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

{!isPanelHost && (
<p className='text-center text-sm text-text-secondary mt-4'>
{t('auth.noAccount')}{' '}
<Link href='/register' className='text-primary hover:underline font-medium'>
{t('auth.register')}
</Link>
</p>
)}
</div>
</motion.div>
</div>
</div>
)
}
