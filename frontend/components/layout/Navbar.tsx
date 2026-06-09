/* eslint-disable @next/next/no-img-element */
'use client'

import Button from '@/components/ui/Button'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import ThemeSwitcher from '@/components/layout/ThemeSwitcher'
import { useT } from '@/lib/language-context'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false)
	const { t } = useT()

	const navLinks = [
		{ href: '#features', label: t('nav.features') },
		{ href: '#pricing', label: t('nav.pricing') },
		{ href: '#how-it-works', label: t('nav.howItWorks') },
		{ href: '#testimonials', label: t('nav.testimonials') },
	]

	return (
		<nav className='sticky top-0 left-0 right-0 z-50 glass'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<Link href='/' className='flex items-center gap-2.5'>
						{/* Desktop: to'liq logotip; Mobil (responsive): logopngremove */}
						<img src='/logotip.png' alt='Med AI Simulator' className='hidden md:block h-10 w-auto object-contain' />
						<img src='/logopngremove.png' alt='Med AI Simulator' className='block md:hidden h-10 w-auto object-contain' />
					</Link>

					<div className='hidden md:flex items-center gap-8'>
						{navLinks.map(link => (
							<a
								key={link.href}
								href={link.href}
								className='text-sm text-text-secondary hover:text-primary transition-colors duration-200'
							>
								{link.label}
							</a>
						))}
					</div>

					<div className='hidden md:flex items-center gap-3'>
						<ThemeSwitcher />
						<LanguageSwitcher />
						<Link href='/login'>
							<Button variant='ghost' size='sm'>
								{t('auth.login')}
							</Button>
						</Link>
						<Link href='/register'>
							<Button size='sm'>{t('nav.getStarted')}</Button>
						</Link>
					</div>

					<button
						className='md:hidden p-2 text-text-secondary hover:text-text-primary'
						onClick={() => setIsOpen(!isOpen)}
						aria-label='Toggle menu'
					>
						{isOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
					</button>
				</div>
			</div>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='md:hidden border-t border-border bg-secondary'
					>
						<div className='px-4 py-4 space-y-3'>
							{navLinks.map(link => (
								<a
									key={link.href}
									href={link.href}
									className='block text-sm text-text-secondary hover:text-primary py-2'
									onClick={() => setIsOpen(false)}
								>
									{link.label}
								</a>
							))}
							<div className='pt-3 border-t border-border space-y-2'>
								<div className='flex justify-center items-center gap-3 pb-1'>
									<ThemeSwitcher />
									<LanguageSwitcher />
								</div>
								<Link href='/login' className='block'>
									<Button variant='secondary' size='sm' className='w-full'>
										{t('auth.login')}
									</Button>
								</Link>
								<Link href='/register' className='block'>
									<Button size='sm' className='w-full'>
										{t('nav.getStarted')}
									</Button>
								</Link>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}
