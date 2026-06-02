/* eslint-disable @next/next/no-img-element */
'use client'

import { canAccessAdmin, canAccessContentManager, useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/language-context';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    BookOpen,
    Brain,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Home,
    LogOut,
    Menu,
    PlayCircle,
    Settings,
    Shield,
    Stethoscope,
    Trophy,
    UserCog,
    X,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState(false)
	const [mobileOpen, setMobileOpen] = useState(false)
	const pathname = usePathname()
	const { user, logout } = useAuth()
	const { t } = useT()
	const router = useRouter()

	const menuItems = useMemo(() => {
		const items = [
			{ href: '/dashboard', icon: Home, label: t('nav.dashboard') },
			{ href: '/cases', icon: Stethoscope, label: t('nav.cases') },
			{ href: '/statistics', icon: BarChart3, label: t('nav.statistics') },
			{ href: '/simulator', icon: Activity, label: t('nav.simulator') },
			{ href: '/kurslar', icon: PlayCircle, label: t('nav.courses') },
			{ href: '/library', icon: BookOpen, label: t('nav.library') },
		]
		if (!user || !canAccessContentManager(user.role)) {
			items.push(
				{ href: '/analysis', icon: Brain, label: t('nav.analysis') },
				{ href: '/leaderboard', icon: Trophy, label: t('nav.leaderboard') },
				{ href: '/emergency', icon: Zap, label: t('nav.emergency') },
			)
		}
		items.push({ href: '/subscription', icon: CreditCard, label: t('nav.subscription') })
		if (user && canAccessContentManager(user.role)) {
			items.push({ href: '/content-manager', icon: UserCog, label: t('nav.content') })
		}
		if (user && canAccessAdmin(user.role)) {
			items.push({ href: '/admin', icon: Shield, label: t('nav.admin') })
		}
		return items
	}, [user, t])

	const handleLogout = () => {
		logout()
		router.push('/login')
	}

	return (
		<>
			{/* Mobile top bar */}
			<div className='lg:hidden fixed top-0 left-0 z-40 h-16 w-full bg-secondary/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4'>
				<div className='flex items-center gap-3'>
					<button
						onClick={() => setMobileOpen(true)}
						className='p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-colors'
						aria-label='Menyuni ochish'
					>
						<Menu className='w-5 h-5' />
					</button>
					<img src='/logotip.png' alt='Med AI Simulator' className='h-10 sm:h-12 w-auto object-contain' />
				</div>
				{user && (
					<div className='flex items-center gap-2'>
						<div className='text-right'>
							<p className='text-xs font-semibold text-text-primary'>{user.name}</p>
						</div>
						<div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0'>
							{user.avatar
								? <img src={user.avatar} alt={user.name} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
								: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
							}
						</div>
					</div>
				)}
			</div>

			{/* Mobile sidebar drawer */}
			<AnimatePresence>
				{mobileOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							key='mobile-backdrop'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={() => setMobileOpen(false)}
							className='lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
						/>
						{/* Drawer */}
						<motion.aside
							key='mobile-drawer'
							initial={{ x: '-100%' }}
							animate={{ x: 0 }}
							exit={{ x: '-100%' }}
							transition={{ duration: 0.25, ease: 'easeInOut' }}
							className='lg:hidden fixed left-0 top-0 h-dvh w-[86vw] max-w-72 z-50 bg-surface border-r border-border flex flex-col'
						>
							{/* Drawer header */}
							<div className='flex items-center justify-between px-4 h-16 border-b border-border shrink-0'>
				<img src='/logotip.png' alt='Med AI Simulator' className='h-10 sm:h-12 w-auto object-contain' />
								<button
									onClick={() => setMobileOpen(false)}
									className='p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-colors'
									aria-label='Yopish'
								>
									<X className='w-5 h-5' />
								</button>
							</div>

							{/* Nav items */}
							<div className='flex-1 py-4 px-3 space-y-1 overflow-y-auto'>
								{menuItems.map(item => {
									const active = pathname === item.href
									return (
										<Link
											key={item.label}
											href={item.href}
											onClick={() => setMobileOpen(false)}
											className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
												active
													? 'bg-primary/10 text-primary'
													: 'text-text-secondary hover:bg-surface-light hover:text-text-primary'
											}`}
										>
											<item.icon className='w-5 h-5 shrink-0' />
											<span className='text-sm font-medium'>{item.label}</span>
										</Link>
									)
								})}
							</div>

							{/* Drawer footer */}
							<div className='py-4 px-3 border-t border-border space-y-1 shrink-0'>
								{user && (
									<div className='flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-surface-light/50'>
										<div className='w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm overflow-hidden'>
											{user.avatar
												? <img src={user.avatar} alt={user.name} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
												: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
											}
										</div>
										<div className='min-w-0 flex-1'>
											<p className='text-sm font-semibold text-text-primary truncate'>{user.name}</p>
											<p className='text-[10px] text-text-secondary truncate'>{user.email}</p>
										</div>
									</div>
								)}
								<Link
									href='/settings'
									onClick={() => setMobileOpen(false)}
									className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all duration-200'
								>
									<Settings className='w-5 h-5 shrink-0' />
									<span className='text-sm font-medium'>{t('nav.settings')}</span>
								</Link>
								<button
									onClick={handleLogout}
									className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-accent/10 hover:text-accent transition-all duration-200 w-full'
								>
									<LogOut className='w-5 h-5 shrink-0' />
									<span className='text-sm font-medium'>{t('auth.logout')}</span>
								</button>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* Desktop sidebar */}
			<motion.aside
				animate={{ width: collapsed ? 72 : 256 }}
				transition={{ duration: 0.3, ease: 'easeInOut' }}
				className='hidden lg:flex flex-col fixed left-0 top-0 h-dvh bg-surface border-r border-border z-40'
			>
				<div className='flex items-center justify-center px-4 h-16 border-b border-border overflow-hidden'>
					{collapsed ? (
						<img src='/logotip.png' alt='Med AI' className='w-12 h-12 object-contain' />
					) : (
						<img src='/logotip.png' alt='Med AI Simulator' className='h-14 w-auto object-contain' />
					)}
				</div>

				<div className='flex-1 py-4 px-3 space-y-1 overflow-y-auto'>
					{menuItems.map(item => {
					const active = pathname === item.href
					return (
						<Link
							key={item.label}
							href={item.href}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
								active
										? 'bg-primary/10 text-primary'
										: 'text-text-secondary hover:bg-surface-light hover:text-text-primary'
								}`}
							>
								<item.icon className='w-5 h-5 shrink-0' />
								<AnimatePresence>
									{!collapsed && (
										<motion.span
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className='text-sm font-medium whitespace-nowrap'
										>
											{item.label}
										</motion.span>
									)}
								</AnimatePresence>
							</Link>
						)
					})}
				</div>

				<div className='py-4 px-3 border-t border-border space-y-1'>
					{/* User Profile */}
					{user && (
						<div className={`flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-surface-light/50 ${collapsed ? 'justify-center' : ''}`}>
						<div className='w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm overflow-hidden'>
							{user.avatar
								? <img src={user.avatar} alt={user.name} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
								: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
							}
							</div>
							<AnimatePresence>
								{!collapsed && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className='min-w-0 flex-1'
									>
										<p className='text-sm font-semibold text-text-primary truncate'>{user.name}</p>
										<p className='text-[10px] text-text-secondary truncate'>{user.email}</p>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}

					<Link
						href='/settings'
						className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all duration-200'
					>
						<Settings className='w-5 h-5 shrink-0' />
						<AnimatePresence>
							{!collapsed && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className='text-sm font-medium whitespace-nowrap'
								>
									Sozlamalar
								</motion.span>
							)}
						</AnimatePresence>
					</Link>

					<button
						onClick={handleLogout}
						className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-accent/10 hover:text-accent transition-all duration-200 w-full'
					>
						<LogOut className='w-5 h-5 shrink-0' />
						<AnimatePresence>
							{!collapsed && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className='text-sm font-medium whitespace-nowrap'
								>
									{t('auth.logout')}
								</motion.span>
							)}
						</AnimatePresence>
					</button>

					<button
						onClick={() => setCollapsed(!collapsed)}
						className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all duration-200 w-full'
						aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					>
						{collapsed ? (
							<ChevronRight className='w-5 h-5 shrink-0' />
						) : (
							<ChevronLeft className='w-5 h-5 shrink-0' />
						)}
						<AnimatePresence>
							{!collapsed && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className='text-sm font-medium whitespace-nowrap'
								>
									Yig&apos;ish
								</motion.span>
							)}
						</AnimatePresence>
					</button>
				</div>
			</motion.aside>
		</>
	)
}
