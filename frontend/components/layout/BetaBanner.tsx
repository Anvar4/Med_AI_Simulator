'use client'

import { useT } from '@/lib/language-context'

/**
 * Site-wide scrolling beta notice at the very top. Localized via useT() so it
 * switches with the language. The text scrolls continuously (marquee) and the
 * message is duplicated so the loop is seamless.
 */
export default function BetaBanner() {
  const { t } = useT()
  const message = t('beta.message')
  // Repeat the message a few times so the strip is always filled.
  const segment = `${message}   •   `

  return (
    <div className='relative z-70 bg-primary text-white text-xs sm:text-sm py-2 overflow-hidden'>
      <div className='whitespace-nowrap animate-marquee inline-block'>
        {/* two identical halves → -50% translate loops seamlessly */}
        <span className='inline-block'>{segment.repeat(4)}</span>
        <span className='inline-block'>{segment.repeat(4)}</span>
      </div>
    </div>
  )
}
