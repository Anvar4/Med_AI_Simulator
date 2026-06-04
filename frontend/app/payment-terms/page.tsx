import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata = { title: 'To’lov shartlari — Med AI Simulator' }

export default function PaymentTermsPage() {
  return (
    <div className='min-h-screen bg-secondary'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 py-10'>
        <Link href='/subscription' className='inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6'>
          <ArrowLeft className='w-4 h-4' /> Orqaga
        </Link>

        <div className='flex items-center gap-3 mb-6'>
          <div className='w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center'>
            <FileText className='w-5 h-5 text-primary' />
          </div>
          <h1 className='text-2xl font-bold text-text-primary'>To&apos;lov shartlari</h1>
        </div>

        <div className='glass border border-border rounded-2xl p-6 space-y-5 text-sm text-text-secondary leading-relaxed'>
          <Section title='1. Qo’lda tekshirish'>
            To&apos;lovlar admin tomonidan qo&apos;lda tekshiriladi.
          </Section>
          <Section title='2. Balans to’ldirish muddati'>
            Balans odatda <strong className='text-text-primary'>2–3 soat ichida</strong> to&apos;ldiriladi.
          </Section>
          <Section title='3. Chekni to’g’ri yuklash'>
            Foydalanuvchi to&apos;lov chekini to&apos;g&apos;ri va aniq yuklashi shart.
          </Section>
          <Section title='4. Rad etish'>
            Noto&apos;g&apos;ri, soxta yoki mos kelmaydigan cheklar rad etiladi va balans to&apos;ldirilmaydi.
          </Section>
          <Section title='5. Xizmat ko’rinishi'>
            Obuna balans orqali sotib olingandan keyin xizmat raqamli (onlayn) ko&apos;rinishda taqdim etiladi.
          </Section>

          <div className='pt-4 border-t border-border text-xs'>
            Qo&apos;llab-quvvatlash: Telefon <span className='text-text-primary'>+99896402004</span> · Telegram{' '}
            <a href='https://t.me/KucharovAnvar' target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>@KucharovAnvar</a>
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
