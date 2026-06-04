'use client'

import Sidebar from '@/components/layout/Sidebar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AdminCategory, AdminStats, api, BackendCase, BackendUser, CaseStats, PaymentRequestRow, PromoCode, RevenueAnalytics, ServerHealth } from '@/lib/api';
import { canAccessAdmin, useAuth } from '@/lib/auth-context';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Activity,
	BookOpen,
	Check,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Copy,
	Crown,
	Download,
	Edit2,
	Gift,
	Plus,
	Search,
	Server,
	Shield,
	Star,
	Tag,
	Trash2,
	UserPlus,
	Users,
	X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function formatUptime(seconds: number): string {
	const d = Math.floor(seconds / 86400)
	const h = Math.floor((seconds % 86400) / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	if (d > 0) return `${d}k ${h}s`
	if (h > 0) return `${h}s ${m}d`
	return `${m}d`
}

type Tab = 'dashboard' | 'users' | 'promo' | 'categories' | 'payments' | 'review'

/* ─── Create/Edit User Modal ─── */
interface UserModalProps {
	user?: BackendUser | null
	onClose: () => void
	onSave: () => void
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
	const isEdit = !!user
	const [form, setForm] = useState({
		firstName: user?.firstName ?? '',
		lastName: user?.lastName ?? '',
		email: user?.email ?? '',
		username: user?.username ?? '',
		password: '',
		role: user?.role ?? 'student',
		isPremium: user?.isPremium ?? false,
		specialty: user?.specialty ?? '',
		university: user?.university ?? '',
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError('')
		try {
			if (isEdit) {
				await api.admin.updateUser(user!.id, { role: form.role as BackendUser['role'], isPremium: form.isPremium })
			} else {
				await api.admin.createUser({
					firstName: form.firstName,
					lastName: form.lastName,
					email: form.email,
					username: form.username,
					password: form.password,
					role: form.role,
					specialty: form.specialty || undefined,
					university: form.university || undefined,
				})
			}
			onSave()
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm' onClick={onClose}>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className='bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-lg font-bold text-text-primary'>
						{isEdit ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
					</h3>
					<button onClick={onClose} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary'>
						<X className='w-5 h-5' />
					</button>
				</div>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{!isEdit && (
						<>
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='text-xs text-text-secondary mb-1 block'>Ism</label>
									<input value={form.firstName} onChange={e => set('firstName', e.target.value)} required
										className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
								</div>
								<div>
									<label className='text-xs text-text-secondary mb-1 block'>Familiya</label>
									<input value={form.lastName} onChange={e => set('lastName', e.target.value)} required
										className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
								</div>
							</div>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Email</label>
								<input type='email' value={form.email} onChange={e => set('email', e.target.value)} required
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
							</div>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Username</label>
								<input value={form.username} onChange={e => set('username', e.target.value)} required
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
							</div>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Parol</label>
								<input type='password' value={form.password} onChange={e => set('password', e.target.value)} required minLength={8}
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
							</div>
						</>
					)}
					<div>
						<label className='text-xs text-text-secondary mb-1 block'>Rol</label>
						<select value={form.role} onChange={e => set('role', e.target.value)}
							className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
							<option value='student'>Student</option>
							<option value='instructor'>Content Manager</option>
							<option value='admin'>Admin</option>
						</select>
					</div>
					{isEdit && (
						<label className='flex items-center gap-3 cursor-pointer'>
							<div className='relative'>
								<input type='checkbox' className='sr-only' checked={form.isPremium} onChange={e => set('isPremium', e.target.checked)} />
								<div className={`w-10 h-6 rounded-full transition-colors ${form.isPremium ? 'bg-primary' : 'bg-surface-light border border-border'}`} />
								<div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isPremium ? 'translate-x-4' : ''}`} />
							</div>
							<span className='text-sm text-text-primary'>Premium</span>
						</label>
					)}
					{error && <p className='text-sm text-accent'>{error}</p>}
					<div className='flex gap-3 pt-2'>
						<Button type='button' variant='secondary' className='flex-1' onClick={onClose}>Bekor</Button>
						<Button type='submit' className='flex-1' disabled={loading}>
							{loading ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : "Qo'shish"}
						</Button>
					</div>
				</form>
			</motion.div>
		</div>
	)
}

/* ─── Generate Promo Codes Modal ─── */
interface PromoModalProps {
	onClose: () => void
	onGenerated: (codes: PromoCode[]) => void
}

function PromoModal({ onClose, onGenerated }: PromoModalProps) {
	const [form, setForm] = useState({
		type: 'pro',
		count: 5,
		duration: 30,
		maxUses: 1,
		organizationName: '',
		expiresInDays: 90,
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError('')
		try {
			const res = await api.admin.generatePromoCodes({
				type: form.type,
				count: form.count,
				duration: form.duration,
				maxUses: form.maxUses,
				organizationName: form.organizationName || undefined,
				expiresInDays: form.expiresInDays,
			})
			onGenerated(res.codes)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm' onClick={onClose}>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className='bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-lg font-bold text-text-primary'>Promo kodlar yaratish</h3>
					<button onClick={onClose} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary'><X className='w-5 h-5' /></button>
				</div>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='text-xs text-text-secondary mb-1 block'>Turi</label>
						<select value={form.type} onChange={e => set('type', e.target.value)}
							className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
							<option value='pro'>Pro</option>
							<option value='clinic'>Klinika</option>
							<option value='university'>Universitet</option>
						</select>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Soni</label>
							<input type='number' min={1} max={100} value={form.count} onChange={e => set('count', +e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
						</div>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Davr (kun)</label>
							<input type='number' min={1} value={form.duration} onChange={e => set('duration', +e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
						</div>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Max foydalanish</label>
							<input type='number' min={1} value={form.maxUses} onChange={e => set('maxUses', +e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
						</div>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Muddati (kun)</label>
							<input type='number' min={1} value={form.expiresInDays} onChange={e => set('expiresInDays', +e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
						</div>
					</div>
					<div>
						<label className='text-xs text-text-secondary mb-1 block'>Tashkilot nomi (ixtiyoriy)</label>
						<input value={form.organizationName} onChange={e => set('organizationName', e.target.value)} placeholder='Masalan: Toshkent tibbiyot universiteti'
							className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50' />
					</div>
					{error && <p className='text-sm text-accent'>{error}</p>}
					<div className='flex gap-3 pt-2'>
						<Button type='button' variant='secondary' className='flex-1' onClick={onClose}>Bekor</Button>
						<Button type='submit' className='flex-1' disabled={loading}>
							{loading ? 'Yaratilmoqda...' : 'Yaratish'}
						</Button>
					</div>
				</form>
			</motion.div>
		</div>
	)
}

export default function AdminPage() {
	const { user, isLoading } = useAuth()
	const router = useRouter()
	const [tab, setTab] = useState<Tab>('dashboard')

	// Dashboard state
	const [stats, setStats] = useState<AdminStats | null>(null)
	const [recentUsers, setRecentUsers] = useState<BackendUser[]>([])
	const [statsLoading, setStatsLoading] = useState(false)
	const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null)
	const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null)
	const [caseStats, setCaseStats] = useState<CaseStats | null>(null)

	// Payments state
	const [payments, setPayments] = useState<PaymentRequestRow[]>([])
	const [paymentsLoading, setPaymentsLoading] = useState(false)
	const [paymentStatusFilter, setPaymentStatusFilter] = useState('pending')

	// Review queue state (cases submitted for review)
	const [reviewCases, setReviewCases] = useState<BackendCase[]>([])
	const [reviewLoading, setReviewLoading] = useState(false)

	// Users state
	const [users, setUsers] = useState<BackendUser[]>([])
	const [userTotal, setUserTotal] = useState(0)
	const [userPage, setUserPage] = useState(1)
	const [userTotalPages, setUserTotalPages] = useState(1)
	const [userSearch, setUserSearch] = useState('')
	const [userRole, setUserRole] = useState('')
	const [userProvider, setUserProvider] = useState('')
	const [usersLoading, setUsersLoading] = useState(false)
	const [userModal, setUserModal] = useState<BackendUser | null | 'new'>(null)
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Category state
	const [categories, setCategories] = useState<AdminCategory[]>([])
	const [categoriesLoading, setCategoriesLoading] = useState(false)
	const [newCategoryName, setNewCategoryName] = useState('')
	const [categoryError, setCategoryError] = useState('')
	const [categoryAdding, setCategoryAdding] = useState(false)
	const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
	const [editingCategoryName, setEditingCategoryName] = useState('')
	const [categoryEditing, setCategoryEditing] = useState(false)

	// Promo state
	const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
	const [promoTotal, setPromoTotal] = useState(0)
	const [promoPage, setPromoPage] = useState(1)
	const [promoTypeFilter, setPromoTypeFilter] = useState('')
	const [promoStatusFilter, setPromoStatusFilter] = useState('') // '' | 'used' | 'unused' | 'active'
	const [promoLoading, setPromoLoading] = useState(false)
	const [showPromoModal, setShowPromoModal] = useState(false)
	const [generatedCodes, setGeneratedCodes] = useState<PromoCode[]>([])
	const [copiedCode, setCopiedCode] = useState('')

	useEffect(() => {
		if (!isLoading && (!user || !canAccessAdmin(user.role))) {
			router.push('/login')
		}
	}, [user, isLoading, router])

	// Load dashboard data
	const loadDashboard = useCallback(async () => {
		setStatsLoading(true)
		try {
			const [statsRes, actRes, revRes, healthRes, csRes] = await Promise.all([
				api.admin.getSystemStats(),
				api.admin.getRecentActivity(),
				api.admin.getRevenue().catch(() => null),
				api.admin.getServerHealth().catch(() => null),
				api.admin.getCaseStats().catch(() => null),
			])
			setStats(statsRes.stats)
			setRecentUsers(actRes.recentUsers ?? [])
			if (revRes) setRevenue(revRes.revenue)
			if (healthRes) setServerHealth(healthRes.server)
			if (csRes) setCaseStats(csRes.caseStats)
		} catch {
			// silent
		} finally {
			setStatsLoading(false)
		}
	}, [])

	// Load users
	const loadUsers = useCallback(async (page: number, search: string, role: string, provider: string) => {
		setUsersLoading(true)
		try {
			const res = await api.admin.getUsers({ search: search || undefined, role: role || undefined, provider: provider || undefined, page, limit: 15 })
			setUsers(res.users)
			setUserTotal(res.total)
			setUserTotalPages(res.totalPages)
		} catch {
			// silent
		} finally {
			setUsersLoading(false)
		}
	}, [])

	// Load promo codes
	const loadPromoCodes = useCallback(async (page: number, type: string) => {
		setPromoLoading(true)
		try {
			const res = await api.admin.getPromoCodes({ type: type || undefined, page })
			setPromoCodes(res.codes)
			setPromoTotal(res.total)
		} catch {
			// silent
		} finally {
			setPromoLoading(false)
		}
	}, [])

	// Load categories
	const loadCategories = useCallback(async () => {
		setCategoriesLoading(true)
		try {
			const res = await api.admin.getCategories()
			setCategories(res.categories)
		} catch {
			// silent
		} finally {
			setCategoriesLoading(false)
		}
	}, [])

	const loadPayments = useCallback(async (status: string) => {
		setPaymentsLoading(true)
		try {
			const res = await api.admin.getPayments({ status: status || undefined })
			setPayments(res.requests)
		} catch {
			// silent
		} finally {
			setPaymentsLoading(false)
		}
	}, [])

	useEffect(() => { if (tab === 'dashboard') loadDashboard() }, [tab, loadDashboard])

	// Live server-health refresh while the dashboard tab is open.
	useEffect(() => {
		if (tab !== 'dashboard') return
		const id = setInterval(() => {
			api.admin.getServerHealth().then(r => setServerHealth(r.server)).catch(() => {})
		}, 10000)
		return () => clearInterval(id)
	}, [tab])
	useEffect(() => { if (tab === 'users') loadUsers(userPage, userSearch, userRole, userProvider) }, [tab, userPage, userRole, userProvider, loadUsers, userSearch])
	useEffect(() => { if (tab === 'promo') loadPromoCodes(promoPage, promoTypeFilter) }, [tab, promoPage, promoTypeFilter, loadPromoCodes])
	useEffect(() => { if (tab === 'categories') loadCategories() }, [tab, loadCategories])
	useEffect(() => { if (tab === 'payments') loadPayments(paymentStatusFilter) }, [tab, paymentStatusFilter, loadPayments])

	const loadReview = useCallback(async () => {
		setReviewLoading(true)
		try {
			const res = await api.cases.getAll({ status: 'review', limit: 50 })
			setReviewCases(res.cases)
		} catch {
			// silent
		} finally {
			setReviewLoading(false)
		}
	}, [])

	useEffect(() => { if (tab === 'review') loadReview() }, [tab, loadReview])

	async function handleConfirmPayment(id: string) {
		try { await api.admin.confirmPayment(id); loadPayments(paymentStatusFilter) } catch { /* silent */ }
	}
	async function handleRejectPayment(id: string) {
		try { await api.admin.rejectPayment(id); loadPayments(paymentStatusFilter) } catch { /* silent */ }
	}
	async function handleReviewDecision(id: string, decision: 'published' | 'rejected') {
		try { await api.cases.update(id, { status: decision }); loadReview() } catch { /* silent */ }
	}

	function handleSearchChange(v: string) {
		setUserSearch(v)
		setUserPage(1)
		if (searchTimeout.current) clearTimeout(searchTimeout.current)
		searchTimeout.current = setTimeout(() => loadUsers(1, v, userRole, userProvider), 400)
	}

	async function handleDeleteUser(id: string) {
		try {
			await api.admin.deleteUser(id)
			setDeleteConfirm(null)
			loadUsers(userPage, userSearch, userRole, userProvider)
		} catch {
			// silent
		}
	}

	function handleCopy(code: string) {
		navigator.clipboard.writeText(code).then(() => {
			setCopiedCode(code)
			setTimeout(() => setCopiedCode(''), 2000)
		})
	}

	if (isLoading || !user || !canAccessAdmin(user.role)) {
		return (
			<div className='min-h-screen bg-secondary flex items-center justify-center'>
				<div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
			</div>
		)
	}

	const tabs = [
		{ id: 'dashboard' as Tab, label: 'Boshqaruv' },
		{ id: 'users' as Tab, label: 'Foydalanuvchilar' },
		{ id: 'review' as Tab, label: 'Tekshiruv' },
		{ id: 'payments' as Tab, label: 'To\'lovlar' },
		{ id: 'categories' as Tab, label: 'Turkumlar' },
		{ id: 'promo' as Tab, label: 'Promo kodlar' },
	]

	const roleLabel = (role: string) => role === 'admin' ? 'Admin' : role === 'instructor' ? 'Menejer' : 'User'
	const roleVariant = (role: string): 'danger' | 'warning' | 'default' =>
		role === 'admin' ? 'danger' : role === 'instructor' ? 'warning' : 'default'

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'>
					{/* Header */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6'>
						<div className='flex items-center gap-3 mb-2'>
							<Shield className='w-6 h-6 text-accent' />
							<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>Admin Panel</h1>
							<Badge variant='danger'>Admin</Badge>
						</div>
						<p className='text-text-secondary'>Tizim boshqaruvi — foydalanuvchilar va promo kodlar</p>
					</motion.div>

					{/* Tabs */}
					<div className='flex gap-1 bg-surface-light rounded-xl p-1 mb-6 w-fit'>
						{tabs.map(t => (
							<button key={t.id} onClick={() => setTab(t.id)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
								{t.label}
							</button>
						))}
					</div>

					{/* ── Dashboard Tab ── */}
					{tab === 'dashboard' && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-6'>
							{statsLoading ? (
								<div className='flex items-center justify-center h-40'>
									<div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
								</div>
							) : (
								<>
									{/* Stat cards */}
									<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
										{[
											{ icon: Users, label: 'Jami foydalanuvchilar', value: stats?.totalUsers ?? 0, color: 'text-primary', bg: 'bg-primary/10' },
											{ icon: BookOpen, label: 'Jami klinik holatlar', value: stats?.totalCases ?? 0, color: 'text-warning', bg: 'bg-warning/10' },
											{ icon: Activity, label: 'Jami urinishlar', value: stats?.totalAttempts ?? 0, color: 'text-success', bg: 'bg-success/10' },
											{ icon: Server, label: 'Faol foydalanuvchilar', value: stats?.activeUsers ?? 0, color: 'text-accent', bg: 'bg-accent/10' },
										].map(s => (
											<Card key={s.label} hover={false}>
												<div className='flex items-start justify-between'>
													<div>
														<p className='text-xs text-text-secondary mb-1'>{s.label}</p>
														<p className='text-2xl font-bold text-text-primary'>{s.value.toLocaleString()}</p>
													</div>
													<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
														<s.icon className={`w-5 h-5 ${s.color}`} />
													</div>
												</div>
											</Card>
										))}
									</div>

									{/* ── Revenue (real, from confirmed payments) ── */}
									{revenue && (
										<div>
											<div className='flex items-center gap-2 mb-3'>
												<Crown className='w-5 h-5 text-success' />
												<h3 className='text-lg font-semibold text-text-primary'>Daromad (real to&apos;lovlar)</h3>
											</div>
											<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
												{[
													{ label: 'Bugun', value: revenue.today, count: revenue.todayCount },
													{ label: 'Oxirgi 7 kun', value: revenue.week, count: revenue.weekCount },
													{ label: 'Oxirgi 30 kun', value: revenue.month, count: revenue.monthCount },
													{ label: 'Jami', value: revenue.allTime, count: revenue.allTimeCount },
												].map(r => (
													<Card key={r.label} hover={false}>
														<p className='text-xs text-text-secondary mb-1'>{r.label}</p>
														<p className='text-2xl font-bold text-success'>{r.value.toLocaleString()} <span className='text-sm text-text-secondary'>{revenue.currency}</span></p>
														<p className='text-xs text-text-secondary mt-1'>{r.count} ta to&apos;lov</p>
													</Card>
												))}
											</div>
											<div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4'>
												<Card hover={false} className='lg:col-span-2'>
													<p className='text-sm font-semibold text-text-primary mb-3'>Kunlik daromad (30 kun)</p>
													{revenue.daily.length === 0 ? (
														<p className='text-sm text-text-secondary py-6 text-center'>Hali to&apos;lov yo&apos;q</p>
													) : (
														<div className='flex items-end gap-1 h-32'>
															{(() => {
																const max = Math.max(...revenue.daily.map(d => d.total), 1)
																return revenue.daily.map(d => (
																	<div key={d.date} className='flex-1 group relative flex flex-col justify-end'>
																		<div className='bg-primary/70 hover:bg-primary rounded-t transition-all' style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }} />
																		<span className='absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border opacity-0 group-hover:opacity-100 whitespace-nowrap z-10'>
																			{d.total.toLocaleString()} · {d.date.slice(5)}
																		</span>
																	</div>
																))
															})()}
														</div>
													)}
												</Card>
												<Card hover={false}>
													<p className='text-sm font-semibold text-text-primary mb-3'>Reja bo&apos;yicha</p>
													{revenue.byPlan.length === 0 ? (
														<p className='text-sm text-text-secondary'>Ma&apos;lumot yo&apos;q</p>
													) : (
														<div className='space-y-2'>
															{revenue.byPlan.map(p => (
																<div key={p.plan} className='flex items-center justify-between text-sm'>
																	<span className='font-medium text-text-primary uppercase'>{p.plan}</span>
																	<span className='text-text-secondary'>{p.total.toLocaleString()} ({p.count})</span>
																</div>
															))}
															{revenue.pendingCount > 0 && (
																<div className='flex items-center justify-between text-sm pt-2 mt-2 border-t border-border'>
																	<span className='text-warning'>Kutilmoqda</span>
																	<span className='text-warning'>{revenue.pending.toLocaleString()} ({revenue.pendingCount})</span>
																</div>
															)}
														</div>
													)}
												</Card>
											</div>
										</div>
									)}

									{/* ── Server health (live) ── */}
									{serverHealth && (
										<div>
											<div className='flex items-center gap-2 mb-3'>
												<Server className='w-5 h-5 text-primary' />
												<h3 className='text-lg font-semibold text-text-primary'>Server holati</h3>
												<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
													serverHealth.healthLevel === 'healthy' ? 'bg-success/15 text-success'
													: serverHealth.healthLevel === 'busy' ? 'bg-warning/15 text-warning'
													: 'bg-accent/15 text-accent'
												}`}>
													{serverHealth.healthLevel === 'healthy' ? 'Barqaror' : serverHealth.healthLevel === 'busy' ? 'Band' : 'Kritik'}
												</span>
												<span className='ml-auto inline-flex items-center gap-1.5 text-xs text-text-secondary'>
													<span className='w-2 h-2 rounded-full bg-success animate-pulse' /> Jonli
												</span>
											</div>
											<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
												{/* CPU */}
												<Card hover={false}>
													<p className='text-xs text-text-secondary mb-1'>CPU yuki</p>
													<p className='text-2xl font-bold text-text-primary'>{serverHealth.cpu.percent}%</p>
													<div className='mt-2 h-1.5 rounded-full bg-surface-light overflow-hidden'>
														<div className={`h-full ${serverHealth.cpu.percent > 90 ? 'bg-accent' : serverHealth.cpu.percent > 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${serverHealth.cpu.percent}%` }} />
													</div>
													<p className='text-[11px] text-text-secondary mt-1'>{serverHealth.cpu.cores} yadro</p>
												</Card>
												{/* RAM */}
												<Card hover={false}>
													<p className='text-xs text-text-secondary mb-1'>Operativ xotira (RAM)</p>
													<p className='text-2xl font-bold text-text-primary'>{serverHealth.memory.percent}%</p>
													<div className='mt-2 h-1.5 rounded-full bg-surface-light overflow-hidden'>
														<div className={`h-full ${serverHealth.memory.percent > 90 ? 'bg-accent' : serverHealth.memory.percent > 70 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${serverHealth.memory.percent}%` }} />
													</div>
													<p className='text-[11px] text-text-secondary mt-1'>{serverHealth.memory.usedMB.toLocaleString()} / {serverHealth.memory.totalMB.toLocaleString()} MB</p>
												</Card>
												{/* Uptime + DB */}
												<Card hover={false}>
													<p className='text-xs text-text-secondary mb-1'>Ishlash vaqti</p>
													<p className='text-2xl font-bold text-text-primary'>{formatUptime(serverHealth.uptimeSeconds)}</p>
													<p className={`text-[11px] mt-2 inline-flex items-center gap-1 ${serverHealth.database.connected ? 'text-success' : 'text-accent'}`}>
														<span className={`w-1.5 h-1.5 rounded-full ${serverHealth.database.connected ? 'bg-success' : 'bg-accent'}`} />
														MongoDB {serverHealth.database.connected ? 'ulangan' : 'uzilgan'}
													</p>
												</Card>
												{/* Live activity */}
												<Card hover={false}>
													<p className='text-xs text-text-secondary mb-1'>Jonli faollik (5 daq)</p>
													<p className='text-2xl font-bold text-text-primary'>{serverHealth.liveActivity.activeLast5min}</p>
													<p className='text-[11px] text-text-secondary mt-2'>{serverHealth.liveActivity.attemptsLast5min} urinish</p>
													<p className='text-[11px] text-text-secondary mt-1'>{serverHealth.platform.node} · {serverHealth.cpu.cores}×CPU</p>
												</Card>
											</div>
										</div>
									)}

									{/* ── Clinical-case breakdown (real, from DB) ── */}
									{caseStats && (
										<div>
											<div className='flex items-center gap-2 mb-3'>
												<BookOpen className='w-5 h-5 text-primary' />
												<h3 className='text-lg font-semibold text-text-primary'>Klinik holatlar statistikasi</h3>
											</div>
											<div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
												{[
													{ label: 'Jami klinik holatlar', value: caseStats.total, color: 'text-primary' },
													{ label: 'Shoshilinch holatlar', value: caseStats.emergency, color: 'text-accent' },
													{ label: 'Diagnostika', value: caseStats.diagnostika, color: 'text-success' },
													{ label: 'Premium holatlar', value: caseStats.premium, color: 'text-warning' },
												].map(s => (
													<Card key={s.label} hover={false}>
														<p className='text-xs text-text-secondary mb-1'>{s.label}</p>
														<p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
													</Card>
												))}
											</div>
											<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
												{/* By difficulty (stars) */}
												<Card hover={false}>
													<p className='text-sm font-semibold text-text-primary mb-3'>Qiyinlik darajalari bo&apos;yicha</p>
													<div className='space-y-2'>
														{caseStats.byDifficulty.map(d => {
															const max = Math.max(...caseStats.byDifficulty.map(x => x.count), 1)
															return (
																<div key={d.level} className='flex items-center gap-2'>
																	<span className='flex gap-0.5 w-24 shrink-0'>
																		{[1, 2, 3, 4, 5].map(i => (
																			<Star key={i} className={`w-3 h-3 ${i <= d.level ? 'fill-warning text-warning' : 'text-text-secondary/30'}`} />
																		))}
																	</span>
																	<div className='flex-1 h-2 rounded-full bg-surface-light overflow-hidden'>
																		<div className='h-full bg-primary' style={{ width: `${(d.count / max) * 100}%` }} />
																	</div>
																	<span className='text-xs text-text-secondary w-8 text-right'>{d.count}</span>
																</div>
															)
														})}
													</div>
												</Card>
												{/* By category (specialty/yo'nalish) */}
												<Card hover={false}>
													<p className='text-sm font-semibold text-text-primary mb-3'>Yo&apos;nalishlar bo&apos;yicha</p>
													{caseStats.byCategory.length === 0 ? (
														<p className='text-sm text-text-secondary'>Ma&apos;lumot yo&apos;q</p>
													) : (
														<div className='space-y-2 max-h-48 overflow-y-auto'>
															{caseStats.byCategory.map(c => (
																<div key={c.category} className='flex items-center justify-between text-sm'>
																	<span className='text-text-primary'>{c.category}</span>
																	<span className='text-text-secondary inline-flex items-center gap-2'>
																		<span className='inline-flex items-center gap-0.5 text-warning'>
																			<Star className='w-3 h-3 fill-warning' /> {c.avgDifficulty}
																		</span>
																		<span className='font-semibold text-text-primary'>{c.count}</span>
																	</span>
																</div>
															))}
														</div>
													)}
												</Card>
											</div>
										</div>
									)}

									{/* Extra stats */}
									{stats && (
										<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
											<Card hover={false}>
												<p className='text-xs text-text-secondary mb-1'>O&apos;rtacha ball</p>
												<p className='text-3xl font-bold text-text-primary'>{stats.avgScore?.toFixed(1) ?? '—'}</p>
												<p className='text-xs text-text-secondary mt-1'>Barcha urinishlar bo&apos;yicha</p>
											</Card>
											<Card hover={false}>
												<p className='text-xs text-text-secondary mb-1'>Premium foydalanuvchilar</p>
												<p className='text-3xl font-bold text-text-primary'>{stats.premiumUsers ?? 0}</p>
												<p className='text-xs text-text-secondary mt-1'>{stats.activeUsers ?? 0} ta faol</p>
											</Card>
											<Card hover={false}>
												<p className='text-xs text-text-secondary mb-1'>Bu oyda yangi foydalanuvchilar</p>
												<p className='text-3xl font-bold text-success'>+{stats.newUsersThisWeek ?? 0}</p>
											</Card>
										</div>
									)}

									{/* Recent Users */}
									{recentUsers.length > 0 && (
										<Card hover={false}>
											<h3 className='text-base font-bold text-text-primary mb-4 flex items-center gap-2'>
												<UserPlus className='w-5 h-5 text-primary' />
												So&apos;nggi ro&apos;yxatdan o&apos;tganlar
											</h3>
											<div className='space-y-3'>
												{recentUsers.map(u => (
													<div key={u.id} className='flex items-center gap-3'>
														<div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary'>
															{(u.firstName?.[0] ?? u.name[0] ?? '?').toUpperCase()}
														</div>
														<div className='flex-1 min-w-0'>
															<p className='text-sm text-text-primary font-medium truncate'>{u.name}</p>
															<p className='text-xs text-text-secondary truncate'>{u.email}</p>
														</div>
														<Badge variant={roleVariant(u.role)}>{roleLabel(u.role)}</Badge>
													</div>
												))}
											</div>
										</Card>
									)}

									{/* Activity stats */}
									{stats?.casesByCategory && stats.casesByCategory.length > 0 && (
										<Card hover={false}>
											<h3 className='text-base font-bold text-text-primary mb-4'>Kategoriyalar bo&apos;yicha holatlar</h3>
											<div className='space-y-2'>
												{stats.casesByCategory.slice(0, 6).map(c => (
													<div key={c._id} className='flex items-center gap-3'>
														<p className='text-sm text-text-secondary w-28 truncate'>{c._id}</p>
														<div className='flex-1 h-2 bg-surface-light rounded-full overflow-hidden'>
															<div className='h-full bg-primary rounded-full transition-all'
																style={{ width: `${Math.min(100, (c.count / (stats.totalCases || 1)) * 100)}%` }} />
														</div>
														<p className='text-xs text-text-secondary w-8 text-right'>{c.count}</p>
													</div>
												))}
											</div>
										</Card>
									)}
								</>
							)}
						</motion.div>
					)}

					{/* ── Users Tab ── */}
					{tab === 'users' && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
							<Card hover={false}>
								<div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4'>
									<div className='relative flex-1 w-full'>
										<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
										<input value={userSearch} onChange={e => handleSearchChange(e.target.value)} placeholder='Ism, email yoki username...'
											className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50' />
									</div>
									<select value={userRole} onChange={e => { setUserRole(e.target.value); setUserPage(1) }}
										className='bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
										<option value=''>Barcha rollar</option>
										<option value='student'>Student</option>
										<option value='instructor'>Content Manager</option>
										<option value='admin'>Admin</option>
									</select>
									<select value={userProvider} onChange={e => { setUserProvider(e.target.value); setUserPage(1) }}
										className='bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
										<option value=''>Barcha kirish usullari</option>
										<option value='google'>Google orqali</option>
										<option value='email'>Email orqali</option>
									</select>
									<Button size='sm' onClick={() => setUserModal('new')}>
										<Plus className='w-4 h-4' /> Qo‘shish
									</Button>
								</div>

								<p className='text-xs text-text-secondary mb-3'>Jami: {userTotal} foydalanuvchi</p>

								{usersLoading ? (
									<div className='flex items-center justify-center h-32'>
										<div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
									</div>
								) : (
									<div className='overflow-x-auto'>
										<table className='w-full text-sm'>
											<thead>
												<tr className='border-b border-border'>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Foydalanuvchi</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Rol</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Premium</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Urinishlar</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Sana</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Amallar</th>
												</tr>
											</thead>
											<tbody>
												{users.map(u => (
													<tr key={u.id} className='border-b border-border/50 hover:bg-surface-light transition-colors'>
														<td className='py-3 px-2'>
															<div className='flex items-center gap-2'>
																<div className='w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0'>
																	{(u.firstName?.[0] ?? u.name[0] ?? '?').toUpperCase()}
																</div>
																<div>
																	<div className='flex items-center gap-1.5'>
																		<p className='font-medium text-text-primary leading-tight'>{u.name}</p>
																		<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${u.authProvider === 'google' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
																			{u.authProvider === 'google' ? 'Google' : 'Email'}
																		</span>
																	</div>
																	<p className='text-xs text-text-secondary'>{u.email}</p>
																</div>
															</div>
														</td>
														<td className='py-3 px-2'>
															<Badge variant={roleVariant(u.role)}>{roleLabel(u.role)}</Badge>
														</td>
														<td className='py-3 px-2'>
															{u.isPremium
																? <Crown className='w-4 h-4 text-warning' />
																: <span className='text-text-secondary/30 text-xs'>—</span>}
														</td>
														<td className='py-3 px-2 text-text-secondary text-xs'>{u.stats?.totalCases ?? 0}</td>
														<td className='py-3 px-2 text-text-secondary text-xs'>
															{u.createdAt ? new Date(u.createdAt).toLocaleDateString('uz-UZ') : '—'}
														</td>
														<td className='py-3 px-2'>
															<div className='flex items-center gap-1'>
																<button onClick={() => setUserModal(u)} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary hover:text-primary transition-colors' title='Tahrirlash'>
																	<Edit2 className='w-4 h-4' />
																</button>
																<button onClick={() => setDeleteConfirm(u.id)} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary hover:text-accent transition-colors' title="O'chirish">
																	<Trash2 className='w-4 h-4' />
																</button>
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
										{users.length === 0 && (
											<p className='text-center py-8 text-text-secondary'>Foydalanuvchi topilmadi</p>
										)}
									</div>
								)}

								{/* Pagination */}
								{userTotalPages > 1 && (
									<div className='flex items-center justify-center gap-2 mt-4'>
										<button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
											className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary disabled:opacity-40 transition-colors'>
											<ChevronLeft className='w-4 h-4' />
										</button>
										<span className='text-sm text-text-secondary'>{userPage} / {userTotalPages}</span>
										<button onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))} disabled={userPage === userTotalPages}
											className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary disabled:opacity-40 transition-colors'>
											<ChevronRight className='w-4 h-4' />
										</button>
									</div>
								)}
							</Card>

							{/* Delete confirm */}
							<AnimatePresence>
								{deleteConfirm && (
									<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
										<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
											className='bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl'>
									<h3 className='text-base font-bold text-text-primary mb-2'>Foydalanuvchini o&apos;chirasizmi?</h3>
									<p className='text-sm text-text-secondary mb-6'>Bu amalni ortga qaytarib bo&apos;lmaydi.</p>
											<div className='flex gap-3'>
												<Button variant='secondary' className='flex-1' onClick={() => setDeleteConfirm(null)}>Bekor</Button>
												<Button className='flex-1 bg-accent! hover:bg-accent/90!' onClick={() => handleDeleteUser(deleteConfirm)}>O&apos;chirish</Button>
											</div>
										</motion.div>
									</div>
								)}
							</AnimatePresence>
						</motion.div>
					)}

					{/* ── Review Queue Tab ── */}
					{tab === 'review' && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
							<Card hover={false}>
								<div className='flex items-center gap-2 mb-4'>
									<BookOpen className='w-5 h-5 text-primary' />
									<h3 className='text-lg font-semibold text-text-primary'>Tekshiruvga yuborilgan klinik holatlar</h3>
									<span className='ml-auto text-sm text-text-secondary'>{reviewCases.length} ta</span>
								</div>

								{reviewLoading ? (
									<p className='text-sm text-text-secondary py-6 text-center'>Yuklanmoqda...</p>
								) : reviewCases.length === 0 ? (
									<p className='text-sm text-text-secondary py-6 text-center'>Tekshiruvga yuborilgan holatlar yo&apos;q.</p>
								) : (
									<div className='space-y-2'>
										{reviewCases.map(c => (
											<div key={c._id} className='flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-surface-light'>
												<div className='flex-1 min-w-45'>
													<p className='text-sm font-semibold text-text-primary'>{c.title}</p>
													<p className='text-xs text-text-secondary'>{c.category} · {c.authorName} · {'★'.repeat(Math.min(5, c.difficulty))}</p>
												</div>
												<div className='flex gap-2'>
													<Button size='sm' onClick={() => handleReviewDecision(c._id, 'published')}>
														<Check className='w-3.5 h-3.5' /> Chop etish
													</Button>
													<Button size='sm' variant='secondary' className='bg-accent! hover:bg-accent/90! text-white!' onClick={() => handleReviewDecision(c._id, 'rejected')}>
														<X className='w-3.5 h-3.5' /> Rad etish
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</Card>
						</motion.div>
					)}

					{/* ── Payments Tab ── */}
					{tab === 'payments' && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
							<Card hover={false}>
								<div className='flex flex-wrap items-center gap-3 mb-4'>
									<Crown className='w-5 h-5 text-primary' />
									<h3 className='text-lg font-semibold text-text-primary'>To&apos;lov so&apos;rovlari</h3>
									<select
										value={paymentStatusFilter}
										onChange={e => setPaymentStatusFilter(e.target.value)}
										className='ml-auto bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary'
									>
										<option value='pending'>Kutilmoqda</option>
										<option value='paid'>To&apos;langan</option>
										<option value='cancelled'>Bekor qilingan</option>
										<option value=''>Barchasi</option>
									</select>
								</div>

								{paymentsLoading ? (
									<p className='text-sm text-text-secondary py-6 text-center'>Yuklanmoqda...</p>
								) : payments.length === 0 ? (
									<p className='text-sm text-text-secondary py-6 text-center'>To&apos;lov so&apos;rovlari yo&apos;q.</p>
								) : (
									<div className='space-y-2'>
										{payments.map(p => {
											const u = typeof p.user === 'string' ? null : p.user
											return (
												<div key={p._id} className='flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-surface-light'>
													<div className='flex-1 min-w-40'>
														<p className='text-sm font-semibold text-text-primary'>{u?.name || 'Foydalanuvchi'}</p>
														<p className='text-xs text-text-secondary'>{u?.email}</p>
													</div>
													<div className='text-sm'>
														<span className='font-semibold text-text-primary uppercase'>{p.plan}</span>
														<span className='text-text-secondary'> · {p.period === 'yearly' ? '1 yil' : '1 oy'}</span>
													</div>
													<div className='text-sm font-bold text-primary'>{p.amount.toLocaleString()} {p.currency}</div>
													<Badge variant={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>
														{p.status === 'paid' ? 'To\'langan' : p.status === 'pending' ? 'Kutilmoqda' : p.status}
													</Badge>
													{p.status === 'pending' && (
														<div className='flex gap-2'>
															<Button size='sm' onClick={() => handleConfirmPayment(p._id)}>
																<Check className='w-3.5 h-3.5' /> Tasdiqlash
															</Button>
															<Button size='sm' variant='secondary' onClick={() => handleRejectPayment(p._id)}>
																<X className='w-3.5 h-3.5' /> Rad etish
															</Button>
														</div>
													)}
												</div>
											)
										})}
									</div>
								)}
							</Card>
						</motion.div>
					)}

					{/* ── Categories Tab ── */}
					{tab === 'categories' && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
							<Card hover={false}>
								<div className='flex items-center gap-2 mb-4'>
									<Tag className='w-5 h-5 text-primary' />
									<h3 className='text-lg font-semibold text-text-primary'>Turkumlar</h3>
									<span className='ml-auto text-sm text-text-secondary'>{categories.length} ta</span>
								</div>

								{/* Add new category */}
								<form
									onSubmit={async e => {
										e.preventDefault()
										const name = newCategoryName.trim()
										if (!name) return
										setCategoryAdding(true)
										setCategoryError('')
										try {
											await api.admin.createCategory(name)
											setNewCategoryName('')
											loadCategories()
										} catch (err: unknown) {
											setCategoryError(err instanceof Error ? err.message : 'Xatolik')
										} finally {
											setCategoryAdding(false)
										}
									}}
									className='flex gap-2 mb-6'
								>
									<input
										value={newCategoryName}
										onChange={e => setNewCategoryName(e.target.value)}
										placeholder='Yangi turkum nomi (masalan: Kardiologiya)'
										className='flex-1 bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50'
									/>
									<Button type='submit' size='sm' disabled={categoryAdding || !newCategoryName.trim()}>
										<Plus className='w-4 h-4' /> {categoryAdding ? 'Qo‘shilmoqda...' : 'Qo‘shish'}
									</Button>
								</form>
								{categoryError && <p className='text-sm text-accent mb-3'>{categoryError}</p>}

								{/* List */}
								{categoriesLoading ? (
									<div className='flex justify-center py-8'>
										<div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
									</div>
								) : categories.length === 0 ? (
									<p className='text-center py-8 text-text-secondary text-sm'>Hali turkum qo‘shilmagan</p>
								) : (
									<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
										{categories.map(cat => (
											<div key={cat._id} className='flex items-center justify-between px-4 py-2.5 bg-surface-light border border-border rounded-xl group'>
												{editingCategory?._id === cat._id ? (
													<form onSubmit={async e => {
														e.preventDefault()
														const name = editingCategoryName.trim()
														if (!name) return
														setCategoryEditing(true)
														try {
															await api.admin.updateCategory(cat._id, name)
															setEditingCategory(null)
															loadCategories()
														} catch (err: unknown) {
															setCategoryError(err instanceof Error ? err.message : 'Xatolik')
														} finally {
															setCategoryEditing(false)
														}
													}} className='flex items-center gap-2 flex-1'>
														<input
															value={editingCategoryName}
															onChange={e => setEditingCategoryName(e.target.value)}
															className='flex-1 bg-surface border border-primary/50 rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none'
															autoFocus
														/>
														<button type='submit' disabled={categoryEditing} className='p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors'>
															<Check className='w-3.5 h-3.5' />
														</button>
														<button type='button' onClick={() => setEditingCategory(null)} className='p-1 rounded-lg text-text-secondary hover:bg-surface-light transition-colors'>
															<X className='w-3.5 h-3.5' />
														</button>
													</form>
												) : (
													<>
														<span className='text-sm text-text-primary font-medium flex-1'>{cat.name}</span>
														<div className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100'>
															<button
																onClick={() => { setEditingCategory(cat); setEditingCategoryName(cat.name); setCategoryError('') }}
																className='p-1 rounded-lg text-text-secondary hover:text-primary transition-colors'
															>
																<Edit2 className='w-3.5 h-3.5' />
															</button>
															<button
																onClick={async () => {
																	try {
																		await api.admin.deleteCategory(cat._id)
																		loadCategories()
																	} catch { /* silent */ }
																}}
																className='p-1 rounded-lg text-text-secondary hover:text-accent transition-colors'
															>
																<Trash2 className='w-3.5 h-3.5' />
															</button>
														</div>
													</>
												)}
											</div>
										))}
									</div>
								)}
							</Card>
						</motion.div>
					)}

					{/* ── Promo Codes Tab ── */}
					{tab === 'promo' && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='space-y-4'>
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
								<select value={promoTypeFilter} onChange={e => { setPromoTypeFilter(e.target.value); setPromoPage(1) }}
									className='bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
									<option value=''>Barcha turlar</option>
									<option value='pro'>Pro</option>
									<option value='clinic'>Klinika</option>
									<option value='university'>Universitet</option>
								</select>
								<select value={promoStatusFilter} onChange={e => setPromoStatusFilter(e.target.value)}
									className='bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
									<option value=''>Barcha holatlar</option>
									<option value='unused'>Ishlatilmagan</option>
									<option value='used'>Ishlatilgan</option>
									<option value='active'>Faol</option>
								</select>
								<div className='flex gap-2 ml-auto'>
									<a href={api.admin.exportPromoCodesUrl(promoTypeFilter || undefined)} download
										className='flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-light border border-border text-sm text-text-secondary hover:text-text-primary transition-colors'>
										<Download className='w-4 h-4' /> CSV export
									</a>
									<Button size='sm' onClick={() => setShowPromoModal(true)}>
										<Gift className='w-4 h-4' /> Yaratish
									</Button>
								</div>
							</div>

							{/* Generated codes banner */}
							{generatedCodes.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center justify-between mb-3'>
										<h3 className='text-sm font-bold text-text-primary flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-success' />
											{generatedCodes.length} ta yangi kod yaratildi
										</h3>
										<button onClick={() => setGeneratedCodes([])} className='text-text-secondary hover:text-text-primary'>
											<X className='w-4 h-4' />
										</button>
									</div>
									<div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
										{generatedCodes.map(c => (
											<button key={c._id} onClick={() => handleCopy(c.code)}
												className='flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-xs font-mono text-success hover:bg-success/20 transition-colors'>
												<Copy className='w-3 h-3 shrink-0' />
												<span className='truncate'>{c.code}</span>
												{copiedCode === c.code && <span className='text-[10px] text-success/70 shrink-0'>✓</span>}
											</button>
										))}
									</div>
								</Card>
							)}

							<Card hover={false}>
								<p className='text-xs text-text-secondary mb-3'>Jami: {promoTotal} kod</p>
								{promoLoading ? (
									<div className='flex items-center justify-center h-32'>
										<div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
									</div>
								) : (
									<div className='overflow-x-auto'>
										<table className='w-full text-sm'>
											<thead>
												<tr className='border-b border-border'>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Kod</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Turi</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Holat</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Foydalanish</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Muddati</th>
													<th className='text-left py-3 px-2 text-text-secondary font-medium'>Tashkilot</th>
												</tr>
											</thead>
											<tbody>
												{promoCodes.filter(c => {
													const used = (c.usedCount ?? 0) > 0
													if (promoStatusFilter === 'used') return used
													if (promoStatusFilter === 'unused') return !used
													if (promoStatusFilter === 'active') return c.isActive
													return true
												}).map(c => (
													<tr key={c._id} className='border-b border-border/50 hover:bg-surface-light transition-colors'>
														<td className='py-3 px-2'>
															<button onClick={() => handleCopy(c.code)}
																className='flex items-center gap-2 font-mono text-xs text-primary hover:text-primary/80 transition-colors'>
																<Copy className='w-3 h-3' /> {c.code}
																{copiedCode === c.code && <span className='text-[10px] text-success'>✓</span>}
															</button>
														</td>
														<td className='py-3 px-2'>
															<Badge variant={c.type === 'pro' ? 'default' : c.type === 'clinic' ? 'warning' : 'success'}>
																{c.type === 'pro' ? 'Pro' : c.type === 'clinic' ? 'Klinika' : 'Universitet'}
															</Badge>
														</td>
														<td className='py-3 px-2'>
															<span className={`text-xs ${c.isActive ? 'text-success' : 'text-text-secondary/50'}`}>
																{c.isActive ? '● Faol' : '○ Nofaol'}
															</span>
														</td>
														<td className='py-3 px-2 text-text-secondary text-xs'>{c.usedCount ?? 0} / {c.maxUses ?? '∞'}</td>
														<td className='py-3 px-2 text-text-secondary text-xs'>
															{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('uz-UZ') : '—'}
														</td>
														<td className='py-3 px-2 text-text-secondary text-xs truncate max-w-30'>
															{c.organizationName ?? '—'}
														</td>
													</tr>
												))}
											</tbody>
										</table>
										{promoCodes.length === 0 && (
											<p className='text-center py-8 text-text-secondary'>Promo kodlar topilmadi</p>
										)}
									</div>
								)}
								{Math.ceil(promoTotal / 20) > 1 && (
									<div className='flex items-center justify-center gap-2 mt-4'>
										<button onClick={() => setPromoPage(p => Math.max(1, p - 1))} disabled={promoPage === 1}
											className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary disabled:opacity-40'>
											<ChevronLeft className='w-4 h-4' />
										</button>
										<span className='text-sm text-text-secondary'>{promoPage}</span>
										<button onClick={() => setPromoPage(p => p + 1)} disabled={promoPage >= Math.ceil(promoTotal / 20)}
											className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary disabled:opacity-40'>
											<ChevronRight className='w-4 h-4' />
										</button>
									</div>
								)}
							</Card>
						</motion.div>
					)}
				</div>
			</main>

			{/* Modals */}
			<AnimatePresence>
				{(userModal === 'new' || (userModal && typeof userModal === 'object')) && (
					<UserModal
						user={userModal === 'new' ? null : userModal}
						onClose={() => setUserModal(null)}
						onSave={() => { setUserModal(null); loadUsers(userPage, userSearch, userRole, userProvider) }}
					/>
				)}
				{showPromoModal && (
					<PromoModal
						onClose={() => setShowPromoModal(false)}
						onGenerated={(codes) => {
							setShowPromoModal(false)
							setGeneratedCodes(codes)
							loadPromoCodes(promoPage, promoTypeFilter)
						}}
					/>
				)}
			</AnimatePresence>
		</div>
	)
}
