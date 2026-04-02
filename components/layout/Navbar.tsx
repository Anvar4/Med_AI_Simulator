'use client'

import Button from '@/components/ui/Button'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
	{ href: '#features', label: 'Xususiyatlar' },
	{ href: '#pricing', label: 'Narxlar' },
	{ href: '#how-it-works', label: 'Qanday ishlaydi' },
	{ href: '#testimonials', label: 'Sharhlar' },
]

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<nav className='fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-secondary/80 border-b border-border'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<Link href='/' className='flex items-center gap-2.5'>
						<div className='w-9 h-9 bg-primary rounded-xl flex items-center justify-center'>
							<Activity className='w-5 h-5 text-secondary' />
						</div>
						<span className='text-lg font-bold text-text-primary font-[family-name:var(--font-sora)]'>
							Med AI
						</span>
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
						<Link href='/dashboard'>
							<Button variant='ghost' size='sm'>
								Kirish
							</Button>
						</Link>
						<Link href='/dashboard'>
							<Button size='sm'>Bepul Boshlash</Button>
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
								<Link href='/dashboard' className='block'>
									<Button variant='secondary' size='sm' className='w-full'>
										Kirish
									</Button>
								</Link>
								<Link href='/dashboard' className='block'>
									<Button size='sm' className='w-full'>
										Bepul Boshlash
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
