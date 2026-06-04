import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Maxfiylik siyosati — Med AI Simulator' }

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen bg-secondary'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 py-10'>
        <Link href='/subscription' className='inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6'>
          <ArrowLeft className='w-4 h-4' /> Orqaga
        </Link>

        <div className='flex items-center gap-3 mb-6'>
          <div className='w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center'>
            <ShieldCheck className='w-5 h-5 text-primary' />
          </div>
          <h1 className='text-2xl font-bold text-text-primary'>Maxfiylik siyosati</h1>
        </div>

        <div className='glass border border-border rounded-2xl p-6 space-y-5 text-sm text-text-secondary leading-relaxed'>
          <Section title='1. Qaysi ma’lumotlarni saqlaymiz'>
            Platforma foydalanuvchining ismi, elektron pochtasi, telefon raqami, to&apos;lov cheki (kvitansiya)
            va obuna tarixini saqlashi mumkin. Bu ma&apos;lumotlar xizmatni taqdim etish va to&apos;lovlarni
            tekshirish uchun ishlatiladi.
          </Section>
          <Section title='2. To’lov cheklari'>
            Yuklangan cheklar (skrinshot yoki PDF) faqat to&apos;lovni tekshirish maqsadida ishlatiladi va
            xavfsiz saqlanadi.
          </Section>
          <Section title='3. Karta ma’lumotlari'>
            Platforma <strong className='text-text-primary'>CVV, SMS kod, kartaning amal qilish muddati yoki bank parolini
            so&apos;ramaydi va saqlamaydi</strong>. Foydalanuvchi faqat admin ko&apos;rsatgan kartaga pul o&apos;tkazadi.
          </Section>
          <Section title='4. Ma’lumotlarni uchinchi shaxslarga bermaslik'>
            Foydalanuvchi ma&apos;lumotlari uchinchi shaxslarga sotilmaydi va berilmaydi.
          </Section>
          <Section title='5. Xavfsizlik'>
            To&apos;lov va obuna bilan bog&apos;liq barcha ma&apos;lumotlar xavfsiz tarzda saqlanadi va himoyalanadi.
          </Section>

          <div className='pt-4 border-t border-border text-xs'>
            Savollar bo&apos;lsa: Telefon <span className='text-text-primary'>+99896402004</span> · Telegram{' '}
            <a href='https://t.me/KUCHAROVaNVAR' target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>@KUCHAROVaNVAR</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className='text-sm font-bold text-text-primary mb-1.5'>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
