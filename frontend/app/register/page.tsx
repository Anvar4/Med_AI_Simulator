/* eslint-disable @next/next/no-img-element */
'use client'

import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { backendUserToAuth, useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { useGoogleLogin } from '@react-oauth/google';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Camera,
    CheckCircle,
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
    UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

type Step = 'method' | 'personal' | 'credentials' | 'email' | 'otp'

function AvatarUpload({ value, onChange }: { value: string; onChange: (b64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Rasm hajmi 3 MB dan oshmasligi kerak'); return }
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div className='flex flex-col items-center gap-2'>
      <button type='button' onClick={() => inputRef.current?.click()}
        className='relative w-20 h-20 rounded-full bg-surface-light border-2 border-dashed border-border hover:border-primary/60 transition-colors overflow-hidden group'>
        {value ? (
          <img src={value} alt='avatar' className='w-full h-full object-cover' />
        ) : (
          <div className='flex flex-col items-center justify-center h-full'>
            <Camera className='w-6 h-6 text-text-secondary/50 group-hover:text-primary transition-colors' />
          </div>
        )}
        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
          <Camera className='w-5 h-5 text-white' />
        </div>
      </button>
      <p className='text-xs text-text-secondary'>Ixtiyoriy · max 3 MB</p>
      {value && <button type='button' onClick={() => onChange('')} className='text-xs text-accent hover:underline'>O&apos;chirish</button>}
      <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={handleFile} />
    </div>
  )
}

function OtpInput({ otp, refs, onChange, onKeyDown, onPaste }: {
  otp: string[]
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  onChange: (i: number, v: string) => void
  onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  onPaste: (e: React.ClipboardEvent) => void
}) {
  return (
    <div className='flex gap-2 justify-center' onPaste={onPaste}>
      {otp.map((digit, i) => (
        <input key={i} ref={el => { refs.current[i] = el }} type='text' inputMode='numeric'
          maxLength={1} value={digit}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          className='w-11 h-12 text-center text-xl font-bold bg-surface-light border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageInner() {
  const { loginWithData, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || undefined
  const [step, setStep] = useState<Step>('method')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { if (user) router.push('/dashboard') }, [user, router])
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  const googleLogin = useGoogleLogin({
    onSuccess: async tokenResponse => {
      setIsGoogleLoading(true); setError('')
      try {
        const res = await api.auth.googleAccessToken(tokenResponse.access_token)
        loginWithData(backendUserToAuth(res.user, res.token))
      } catch (err) { setError(err instanceof Error ? err.message : 'Google orqali kirishda xatolik') }
      finally { setIsGoogleLoading(false) }
    },
    onError: () => { setError('Google orqali kirishda xatolik yuz berdi'); setIsGoogleLoading(false) },
  })

  const usernameValid = /^[a-zA-Z0-9]{6,}$/.test(username)
  const passwordValid = /^[a-zA-Z0-9]{6,}$/.test(password)

  const handlePersonalNext = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!firstName.trim() || !lastName.trim()) { setError('Ism va familiya kiritilishi shart'); return }
    setStep('credentials')
  }

  const handleCredentialsNext = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!usernameValid) { setError("Login kamida 6 ta belgi, faqat harf va raqamlardan iborat bo'lishi kerak"); return }
    if (!passwordValid) { setError("Parol kamida 6 ta belgi, faqat harf va raqamlardan iborat bo'lishi kerak"); return }
    setStep('email')
  }

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError(''); setIsLoading(true)
    try {
      await api.auth.sendOTPWithUsername(email, username)
      setStep('otp'); setResendCooldown(60)
    } catch (err) { setError(err instanceof Error ? err.message : 'Xatolik yuz berdi') }
    finally { setIsLoading(false) }
  }

  const otpHandlers = {
    onChange: (i: number, value: string) => {
      if (!/^\d*$/.test(value)) return
      const n = [...otp]; n[i] = value.slice(-1); setOtp(n)
      if (value && i < 5) otpRefs.current[i + 1]?.focus()
    },
    onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    },
    onPaste: (e: React.ClipboardEvent) => {
      const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      if (p.length === 6) { setOtp(p.split('')); otpRefs.current[5]?.focus() }
    },
  }

  const handleVerifyOTP = async () => {
    const code = otp.join(''); if (code.length < 6) return
    setError(''); setIsLoading(true)
    try {
      const verified = await api.auth.verifyOTP(email, code, 'register')
      const res = await api.auth.completeRegister(verified.tempToken, firstName.trim(), lastName.trim(), username.toLowerCase().trim(), password, avatar || undefined, refCode)
      loginWithData(backendUserToAuth(res.user, res.token))
    } catch (err) { setError(err instanceof Error ? err.message : "Kod noto'g'ri") }
    finally { setIsLoading(false) }
  }

  const stepBack = () => {
    setError('')
    if (step === 'credentials') setStep('personal')
    else if (step === 'email') setStep('credentials')
    else if (step === 'otp') setStep('email')
    else if (step === 'personal') setStep('method')
  }

  const stepCount: Record<Step, number> = { method: 0, personal: 1, credentials: 2, email: 3, otp: 4 }

  return (
    <div className='min-h-screen bg-secondary flex items-center justify-center p-4'>
      <div className='fixed inset-0 pointer-events-none overflow-hidden'>
        <div className='absolute top-20 left-20 w-72 h-72 rounded-full bg-primary/5 blur-[100px]' />
        <div className='absolute bottom-20 right-20 w-64 h-64 rounded-full bg-accent/5 blur-[100px]' />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className='w-full max-w-md relative z-10'>
        <div className='flex items-center justify-center mb-6'>
          <img src='/logotip.png' alt='Med AI Simulator' className='h-14 w-auto object-contain' />
        </div>

        <div className='bg-surface rounded-2xl border border-border p-6 sm:p-8'>
          <div className='mb-5'>
            {step !== 'method' && (
              <button onClick={stepBack} className='flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors mb-3 text-sm'>
                <ArrowLeft className='w-4 h-4' />Orqaga
              </button>
            )}
            <h2 className='text-xl font-bold text-text-primary'>
              {step === 'method' ? "Ro'yxatdan o'tish" : step === 'personal' ? "Shaxsiy ma'lumotlar" : step === 'credentials' ? 'Login va parol' : step === 'email' ? 'Email manzil' : 'Kodni kiriting'}
            </h2>
            {step !== 'method' && (
              <div className='flex items-center gap-1.5 mt-3'>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= stepCount[step] ? 'bg-primary' : 'bg-surface-light'}`} />
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode='wait'>
            {step === 'method' && (
              <motion.div key='method' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className='space-y-4'>
                <p className='text-sm text-text-secondary'>Ro&apos;yxatdan o&apos;tish usulini tanlang</p>
                <button type='button' onClick={() => googleLogin()} disabled={isGoogleLoading}
                  className='w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-xl border border-gray-200 transition-all disabled:opacity-60'>
                  <svg width='18' height='18' viewBox='0 0 18 18'>
                    <path fill='#4285F4' d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z' />
                    <path fill='#34A853' d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z' />
                    <path fill='#FBBC05' d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z' />
                    <path fill='#EA4335' d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z' />
                  </svg>
                  {isGoogleLoading ? 'Kirish...' : 'Google orqali'}
                </button>
                <div className='flex items-center gap-3'>
                  <div className='h-px flex-1 bg-border' />
                  <span className='text-xs text-text-secondary'>yoki</span>
                  <div className='h-px flex-1 bg-border' />
                </div>
                <button type='button' onClick={() => { setError(''); setStep('personal') }}
                  className='w-full bg-primary hover:bg-primary/90 text-secondary font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2'>
                  <User className='w-4 h-4' />Qo&apos;lda ro&apos;yxatdan o&apos;tish
                </button>
                {error && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{error}</p>}
                <p className='text-center text-sm text-text-secondary'>
                  Akkauntingiz bormi?{' '}<Link href='/login' className='text-primary hover:underline font-medium'>Kirish</Link>
                </p>
              </motion.div>
            )}

            {step === 'personal' && (
              <motion.form key='personal' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handlePersonalNext} className='space-y-5'>
                <p className='text-sm text-text-secondary'>Profilingiz uchun ma&apos;lumotlarni kiriting</p>
                <AvatarUpload value={avatar} onChange={setAvatar} />
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Ism *</label>
                    <div className='relative'>
                      <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
                      <input type='text' value={firstName} onChange={e => setFirstName(e.target.value)} placeholder='Ism' required
                        className='w-full bg-surface-light border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
                    </div>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Familiya *</label>
                    <input type='text' value={lastName} onChange={e => setLastName(e.target.value)} placeholder='Familiya' required
                      className='w-full bg-surface-light border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
                  </div>
                </div>
                {error && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{error}</p>}
                <Button size='lg' className='w-full' type='submit'>Davom etish</Button>
              </motion.form>
            )}

            {step === 'credentials' && (
              <motion.form key='credentials' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleCredentialsNext} className='space-y-4'>
                <p className='text-sm text-text-secondary'>Tizimga kirish uchun login va parol yarating</p>
                <div>
                  <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Login</label>
                  <div className='relative'>
                    <UserCheck className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
                    <input type='text' value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      placeholder='kamida 6 ta belgi' required
                      className={`w-full bg-surface-light border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${username && !usernameValid ? 'border-accent/60' : username && usernameValid ? 'border-primary/60' : 'border-border'}`} />
                    {username && <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${usernameValid ? 'text-primary' : 'text-accent/70'}`}>{usernameValid ? '✓' : '✗'}</span>}
                  </div>
                  <p className='text-xs text-text-secondary/60 mt-1'>Faqat lotin harflari va raqamlardan foydalaning</p>
                </div>
                <div>
                  <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Parol</label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder='kamida 6 ta belgi' required
                      className={`w-full bg-surface-light border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${password && !passwordValid ? 'border-accent/60' : password && passwordValid ? 'border-primary/60' : 'border-border'}`} />
                    <button type='button' onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-primary transition-colors'>
                      {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                    </button>
                  </div>
                  <p className='text-xs text-text-secondary/60 mt-1'>Harflar (A–Z, a–z) va raqamlar (0–9)</p>
                </div>
                {error && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{error}</p>}
                <Button size='lg' className='w-full' type='submit' disabled={!usernameValid || !passwordValid}>Davom etish</Button>
              </motion.form>
            )}

            {step === 'email' && (
              <motion.form key='email' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOTP} className='space-y-4'>
                <p className='text-sm text-text-secondary'>Emailingizni kiriting. Tasdiqlash kodi yuboramiz.</p>
                <div>
                  <label className='text-xs font-medium text-text-secondary mb-1.5 block'>Email</label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
                    <input type='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='email@example.com' required
                      className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all' />
                  </div>
                </div>
                {error && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2'>{error}</p>}
                <Button size='lg' className='w-full' type='submit' disabled={isLoading}>{isLoading ? 'Yuborilmoqda...' : 'Kodni yuborish'}</Button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.div key='otp' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className='space-y-5'>
                <p className='text-sm text-text-secondary text-center'>
                  <span className='font-medium text-text-primary'>{email}</span><br />ga 6 raqamli kod yuborildi
                </p>
                <OtpInput otp={otp} refs={otpRefs} onChange={otpHandlers.onChange} onKeyDown={otpHandlers.onKeyDown} onPaste={otpHandlers.onPaste} />
                {error && <p className='text-sm text-accent bg-accent/10 rounded-lg px-3 py-2 text-center'>{error}</p>}
                <Button size='lg' className='w-full' onClick={handleVerifyOTP} disabled={isLoading || otp.join('').length < 6}>
                  {isLoading ? 'Tekshirilmoqda...' : <span className='flex items-center gap-2 justify-center'><CheckCircle className='w-4 h-4' />Tasdiqlash</span>}
                </Button>
                <div className='flex items-center justify-center text-sm'>
                  {resendCooldown > 0 ? (
                    <span className='text-text-secondary'>{resendCooldown}s da qayta yuborish mumkin</span>
                  ) : (
                    <button type='button' onClick={() => handleSendOTP()} className='text-primary hover:underline'>Qayta yuborish</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 'method' && (
          <p className='text-center text-sm text-text-secondary mt-4'>
            Akkauntingiz bormi?{' '}<Link href='/login' className='text-primary hover:underline font-medium'>Kirish</Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
