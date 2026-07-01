'use client'

/**
 * Kichik inline SVG bayroqlar — tashqi rasmsiz, har platformada bir xil ko'rinadi.
 * Til almashtirgich, kutubxona til-belgilari va boshqa joylarda qayta ishlatiladi (DRY).
 */

export type FlagCode = 'uz' | 'ru' | 'en'

function FlagUZ({ className = '' }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 16' className={className} aria-hidden>
      <rect width='24' height='16' rx='2' fill='#fff' />
      <rect width='24' height='5' rx='2' fill='#0099B5' />
      <rect y='11' width='24' height='5' rx='2' fill='#1EB53A' />
      <rect y='5.4' width='24' height='5.2' fill='#CE1126' />
      <rect y='5.9' width='24' height='4.2' fill='#fff' />
      <circle cx='4.6' cy='2.5' r='1.6' fill='#fff' />
      <circle cx='5.3' cy='2.5' r='1.6' fill='#0099B5' />
      <g fill='#fff'>
        <circle cx='6.6' cy='1.3' r='0.3' />
        <circle cx='7.8' cy='1.3' r='0.3' />
        <circle cx='9' cy='1.3' r='0.3' />
        <circle cx='7.2' cy='2.5' r='0.3' />
        <circle cx='8.4' cy='2.5' r='0.3' />
        <circle cx='7.8' cy='3.7' r='0.3' />
        <circle cx='9' cy='3.7' r='0.3' />
      </g>
    </svg>
  )
}

function FlagRU({ className = '' }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 16' className={className} aria-hidden>
      <rect width='24' height='16' rx='2' fill='#fff' />
      <rect y='5.33' width='24' height='5.34' fill='#0039A6' />
      <rect y='10.67' width='24' height='5.33' rx='2' fill='#D52B1E' />
    </svg>
  )
}

function FlagEN({ className = '' }: { className?: string }) {
  // Buyuk Britaniya (Union Jack) — soddalashtirilgan
  return (
    <svg viewBox='0 0 24 16' className={className} aria-hidden>
      <clipPath id='gb-r'><rect width='24' height='16' rx='2' /></clipPath>
      <g clipPath='url(#gb-r)'>
        <rect width='24' height='16' fill='#012169' />
        <path d='M0 0l24 16M24 0L0 16' stroke='#fff' strokeWidth='3.2' />
        <path d='M0 0l24 16M24 0L0 16' stroke='#C8102E' strokeWidth='1.8' />
        <path d='M12 0v16M0 8h24' stroke='#fff' strokeWidth='5.3' />
        <path d='M12 0v16M0 8h24' stroke='#C8102E' strokeWidth='3.2' />
      </g>
    </svg>
  )
}

const FLAGS: Record<FlagCode, (props: { className?: string }) => React.JSX.Element> = {
  uz: FlagUZ,
  ru: FlagRU,
  en: FlagEN,
}

/** Til kodi bo'yicha bayroq. Noma'lum kod uchun UZ qaytadi. */
export default function Flag({ code, className = '' }: { code: FlagCode; className?: string }) {
  const Cmp = FLAGS[code] ?? FlagUZ
  return <Cmp className={className} />
}

export { FlagUZ, FlagRU, FlagEN }
