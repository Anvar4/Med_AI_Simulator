/* eslint-disable @next/next/no-img-element */
'use client'

import Sidebar from '@/components/layout/Sidebar';
import CMCourses from '@/components/content-manager/CMCourses';
import CMDashboard from '@/components/content-manager/CMDashboard';
import CMLibrary from '@/components/content-manager/CMLibrary';
import CMPlaceholder from '@/components/content-manager/CMPlaceholder';
import CMTabBar, { CMTab } from '@/components/content-manager/CMTabBar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AdminCategory, api, BackendCase, CourseDetail, CourseInput, CourseSummary } from '@/lib/api';
import { canAccessContentManager, useAuth } from '@/lib/auth-context';
import { useDialog } from '@/lib/dialog-context';
import { useT } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Edit3,
    FilePlus,
    FileQuestion,
    FileText,
    ImagePlus,
    Loader2,
    Plus,
    Search,
    Star,
    Tag,
    Trash2,
    Upload,
    UserCog,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// Difficulty (1-5 stars) human labels
const DIFFICULTY_LABELS: Record<number, string> = {
	1: 'Juda oson',
	2: 'Oson',
	3: 'O\'rta',
	4: 'Qiyin',
	5: 'Juda qiyin',
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
	published: { label: 'Chop etilgan', variant: 'success' },
	review: { label: 'Tekshiruvda', variant: 'warning' },
	draft: { label: 'Qoralama', variant: 'default' },
	rejected: { label: 'Rad etilgan', variant: 'danger' },
}

type MediaItem = { type: 'xray' | 'ekg' | 'echo' | 'image' | 'video'; fileData: string; comment: string; fileName?: string }
type LabRow = { name: string; value: string; unit: string; range: string; status: 'normal' | 'high' | 'low' | 'critical' }
type InstrumentalTest = 'ekg' | 'uzi' | 'rentgen' | 'kt' | 'mrt' | 'endoskopiya'
type LaboratoryTest = 'qon_analiz' | 'siydik_analiz' | 'bioximik'

const INSTRUMENTAL_OPTIONS: Array<{ key: InstrumentalTest; label: string }> = [
	{ key: 'ekg', label: 'EKG' },
	{ key: 'uzi', label: 'UZI (Ultratovush tekshiruvi)' },
	{ key: 'rentgen', label: 'Rentgen' },
	{ key: 'kt', label: 'KT' },
	{ key: 'mrt', label: 'MRT' },
	{ key: 'endoskopiya', label: 'Endoskopiya' },
]

const LABORATORY_OPTIONS: Array<{ key: LaboratoryTest; label: string }> = [
	{ key: 'qon_analiz', label: 'Qon analiz' },
	{ key: 'siydik_analiz', label: 'Siydik analiz' },
	{ key: 'bioximik', label: 'Bioximik analiz' },
]

const LAB_TO_SECTION: Record<LaboratoryTest, 'bloodTest' | 'urineTest' | 'biochemTest'> = {
	qon_analiz: 'bloodTest',
	siydik_analiz: 'urineTest',
	bioximik: 'biochemTest',
}

const LAB_SECTIONS = [
	{ key: 'bloodTest' as const, label: 'Qon analiz' },
	{ key: 'biochemTest' as const, label: 'Bioximik analiz' },
	{ key: 'urineTest' as const, label: 'Siydik analiz' },
]

interface CaseFormData {
	title: string
	category: string
	difficulty: number
	type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
	isPremium: boolean
	status: 'draft' | 'review' | 'published'
	description: string
	patientName: string
	patientAge: number
	patientGender: string
	patientAgeGroup: string
	complaints: string
	history: string
	bp: string
	hr: string
	temp: string
	spo2: string
	correctDiagnosis: string
	correctTreatment: string
	timeLimit: number
	instrumentalTests: InstrumentalTest[]
	laboratoryTests: LaboratoryTest[]
	mediaItems: MediaItem[]
	labResults: LabRow[]
	bloodTest: LabRow[]
	biochemTest: LabRow[]
	urineTest: LabRow[]
}

const emptyForm = (): CaseFormData => ({
	title: '', category: '', difficulty: 2, type: 'diagnostika', isPremium: false, status: 'draft', description: '',
	patientName: '', patientAge: 30, patientGender: 'Erkak', patientAgeGroup: 'katta', complaints: '', history: '',
	bp: '120/80', hr: '72', temp: '36.6', spo2: '98',
	correctDiagnosis: '', correctTreatment: '',
	timeLimit: 600,
	instrumentalTests: [], laboratoryTests: [], mediaItems: [], labResults: [], bloodTest: [], biochemTest: [], urineTest: [],
})

/* ─── Case Form Modal ─── */
function CaseModal({ editCase, onClose, onSave, adminCategories }: { editCase?: BackendCase | null; onClose: () => void; onSave: () => void; adminCategories: AdminCategory[] }) {
	const { user } = useAuth()
	const isAdmin = user?.role === 'admin'
	const [form, setForm] = useState<CaseFormData>(() => {
		if (!editCase) return emptyForm()

		const mediaItems = (editCase.mediaItems ?? []).map(m => ({ type: m.type, fileData: m.fileData, comment: m.comment, fileName: m.fileName }))
		const bloodTest = ((editCase as BackendCase & { bloodTest?: LabRow[] }).bloodTest ?? []).map(l => ({ name: l.name, value: l.value, unit: l.unit, range: l.range, status: l.status }))
		const biochemTest = ((editCase as BackendCase & { biochemTest?: LabRow[] }).biochemTest ?? []).map(l => ({ name: l.name, value: l.value, unit: l.unit, range: l.range, status: l.status }))
		const urineTest = ((editCase as BackendCase & { urineTest?: LabRow[] }).urineTest ?? []).map(l => ({ name: l.name, value: l.value, unit: l.unit, range: l.range, status: l.status }))

		const fallbackInstrumental: InstrumentalTest[] = [
			...(mediaItems.some(m => m.type === 'ekg') ? ['ekg' as const] : []),
			...(mediaItems.some(m => m.type === 'echo') ? ['uzi' as const] : []),
			...(mediaItems.some(m => m.type === 'xray') ? ['rentgen' as const] : []),
			...(mediaItems.some(m => m.type === 'image' || m.type === 'video') ? ['endoskopiya' as const] : []),
		]

		const fallbackLaboratory: LaboratoryTest[] = [
			...(bloodTest.length > 0 ? ['qon_analiz' as const] : []),
			...(urineTest.length > 0 ? ['siydik_analiz' as const] : []),
			...(biochemTest.length > 0 ? ['bioximik' as const] : []),
		]

		const incomingInstrumental = Array.isArray(editCase.instrumentalTests)
			? editCase.instrumentalTests.filter((t): t is InstrumentalTest => INSTRUMENTAL_OPTIONS.some(o => o.key === t))
			: fallbackInstrumental

		const incomingLaboratory = Array.isArray(editCase.laboratoryTests)
			? editCase.laboratoryTests.filter((t): t is LaboratoryTest => LABORATORY_OPTIONS.some(o => o.key === t))
			: fallbackLaboratory

		return {
			title: editCase.title, category: editCase.category, difficulty: editCase.difficulty,
			type: editCase.type, isPremium: editCase.isPremium, status: (editCase.status === 'rejected' ? 'draft' : editCase.status) as CaseFormData['status'],
			description: editCase.description ?? '',
			patientName: editCase.patient?.name ?? '', patientAge: editCase.patient?.age ?? 30,
			patientGender: editCase.patient?.gender ?? 'Erkak', patientAgeGroup: editCase.patient?.ageGroup ?? 'katta',
			complaints: editCase.patient?.complaints ?? '', history: editCase.patient?.history ?? '',
			bp: editCase.patient?.vitals?.bp ?? '', hr: editCase.patient?.vitals?.hr ?? '',
			temp: editCase.patient?.vitals?.temp ?? '', spo2: editCase.patient?.vitals?.spo2 ?? '',
			correctDiagnosis: (editCase as BackendCase & { correctDiagnosis?: string }).correctDiagnosis ?? '',
			correctTreatment: (editCase as BackendCase & { correctTreatment?: string }).correctTreatment ?? '',
			timeLimit: (editCase as BackendCase & { timeLimit?: number }).timeLimit ?? 600,
			instrumentalTests: incomingInstrumental,
			laboratoryTests: incomingLaboratory,
			mediaItems,
			labResults: ((editCase as BackendCase & { labResults?: LabRow[] }).labResults ?? []).map(l => ({ name: l.name, value: l.value, unit: l.unit, range: l.range, status: l.status })),
			bloodTest,
			biochemTest,
			urineTest,
		}
	})
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [uploading, setUploading] = useState<string | null>(null)
	const xrayRef = useRef<HTMLInputElement>(null)
	const ekgRef = useRef<HTMLInputElement>(null)
	const echoRef = useRef<HTMLInputElement>(null)
	const imageRef = useRef<HTMLInputElement>(null)
	const videoRef = useRef<HTMLInputElement>(null)

	const set = (k: keyof CaseFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }))

	async function uploadFile(file: File): Promise<string> {
		const formData = new FormData()
		formData.append('file', file)
		const token = (() => { try { const d = JSON.parse(localStorage.getItem('med-ai-auth') || '{}'); return d.token } catch { return '' } })()
		const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
		const r = await fetch(`${apiUrl}/api/upload`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}` },
			body: formData,
		})
		const data = await r.json()
		if (!data.file?.url) throw new Error(data.message || 'Fayl yuklashda xatolik')
		return data.file.url
	}

	async function handleFilesChange(type: 'xray' | 'ekg' | 'echo' | 'image' | 'video', files: FileList | null) {
		if (!files || files.length === 0) return
		setUploading(type)
		setError('')
		try {
			const uploads = await Promise.all(Array.from(files).map(f => uploadFile(f).then(url => ({ type, fileData: url, comment: '', fileName: f.name }))))
			setForm(f => {
				// For image/video: replace (single). For xray/ekg/echo: append (multiple allowed)
				if (type === 'image' || type === 'video') {
					const existing = f.mediaItems.filter(m => m.type !== type)
					return { ...f, mediaItems: [...existing, ...uploads] }
				}
				return { ...f, mediaItems: [...f.mediaItems, ...uploads] }
			})
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Fayl yuklashda xatolik')
		} finally {
			setUploading(null)
		}
	}

	function updateMediaComment(type: 'xray' | 'ekg' | 'echo' | 'image' | 'video', index: number, comment: string) {
		setForm(f => {
			const items = f.mediaItems.filter(m => m.type === type)
			const others = f.mediaItems.filter(m => m.type !== type)
			items[index] = { ...items[index], comment }
			return { ...f, mediaItems: [...others, ...items] }
		})
	}

	function removeMedia(type: 'xray' | 'ekg' | 'echo' | 'image' | 'video', index?: number) {
		setForm(f => {
			let mediaItems: MediaItem[]
			if (index !== undefined) {
				const ofType = f.mediaItems.filter(m => m.type === type)
				const others = f.mediaItems.filter(m => m.type !== type)
				ofType.splice(index, 1)
				mediaItems = [...others, ...ofType]
			} else {
				mediaItems = f.mediaItems.filter(m => m.type !== type)
			}
			return { ...f, mediaItems }
		})
	}

	function toggleInstrumentalTest(test: InstrumentalTest) {
		setForm(f => {
			const exists = f.instrumentalTests.includes(test)
			return {
				...f,
				instrumentalTests: exists
					? f.instrumentalTests.filter(t => t !== test)
					: [...f.instrumentalTests, test],
			}
		})
	}

	function toggleLaboratoryTest(test: LaboratoryTest) {
		setForm(f => {
			const exists = f.laboratoryTests.includes(test)
			return {
				...f,
				laboratoryTests: exists
					? f.laboratoryTests.filter(t => t !== test)
					: [...f.laboratoryTests, test],
			}
		})
	}

	function addSectionRow(section: 'bloodTest' | 'biochemTest' | 'urineTest') {
		setForm(f => ({ ...f, [section]: [...f[section], { name: '', value: '', unit: '', range: '', status: 'normal' as const }] }))
	}

	function updateSectionRow(section: 'bloodTest' | 'biochemTest' | 'urineTest', i: number, k: keyof LabRow, v: string) {
		setForm(f => {
			const rows = [...f[section]]
			rows[i] = { ...rows[i], [k]: v }
			return { ...f, [section]: rows }
		})
	}

	function removeSectionRow(section: 'bloodTest' | 'biochemTest' | 'urineTest', i: number) {
		setForm(f => ({ ...f, [section]: f[section].filter((_, idx) => idx !== i) }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		setError('')
		try {
			if (form.instrumentalTests.length === 0) {
				setError('Instrumental tekshiruvlar menyusidan kamida bitta variant tanlang')
				setSaving(false)
				return
			}

			if (form.laboratoryTests.length === 0) {
				setError('Laborator tekshiruvlar menyusidan kamida bitta variant tanlang')
				setSaving(false)
				return
			}

			if (form.mediaItems.length === 0) {
				setError('Har bir klinik holat uchun kamida bitta rasm yoki grafik media yuklash majburiy')
				setSaving(false)
				return
			}

			// Validate media comments for named sections
			for (const m of form.mediaItems) {
				if ((m.type === 'xray' || m.type === 'ekg' || m.type === 'echo') && !m.comment.trim()) {
					const labels: Record<string, string> = { xray: 'Rentgen/KT/MRT', ekg: 'EKG', echo: 'UZI' }
					setError(`${labels[m.type]} rasmi uchun izoh kiritilishi shart`)
					setSaving(false)
					return
				}
			}

			const needsXray = form.instrumentalTests.some(t => t === 'rentgen' || t === 'kt' || t === 'mrt')
			if (needsXray && xrayItems.length === 0) {
				setError('Rentgen/KT/MRT tanlangan. Shu bo\'lim uchun kamida bitta rasm yuklang')
				setSaving(false)
				return
			}

			if (form.instrumentalTests.includes('ekg') && ekgItems.length === 0) {
				setError('EKG tanlangan. EKG rasmi yoki grafigini yuklang')
				setSaving(false)
				return
			}

			if (form.instrumentalTests.includes('uzi') && echoItems.length === 0) {
				setError('UZI tanlangan. UZI uchun rasm/grafik yuklang')
				setSaving(false)
				return
			}

			if (form.instrumentalTests.includes('endoskopiya') && !imageItem && !videoItem) {
				setError('Endoskopiya tanlangan. Qo\'shimcha rasm yoki video yuklash shart')
				setSaving(false)
				return
			}

			if (form.laboratoryTests.includes('qon_analiz') && form.bloodTest.length === 0) {
				setError('Qon analiz tanlangan. Kamida bitta qon analiz qatori kiriting')
				setSaving(false)
				return
			}

			if (form.laboratoryTests.includes('siydik_analiz') && form.urineTest.length === 0) {
				setError('Siydik analiz tanlangan. Kamida bitta siydik analiz qatori kiriting')
				setSaving(false)
				return
			}

			if (form.laboratoryTests.includes('bioximik') && form.biochemTest.length === 0) {
				setError('Bioximik analiz tanlangan. Kamida bitta bioximik qator kiriting')
				setSaving(false)
				return
			}

			const payload: Partial<BackendCase> = {
				title: form.title, category: form.category, difficulty: form.difficulty,
				type: form.type, isPremium: form.isPremium, status: form.status,
				description: form.description,
				patient: {
					name: form.patientName, age: form.patientAge, gender: form.patientGender,
					ageGroup: form.patientAgeGroup, complaints: form.complaints, history: form.history,
					vitals: { bp: form.bp, hr: form.hr, temp: form.temp, spo2: form.spo2 },
				},
				instrumentalTests: form.instrumentalTests,
				laboratoryTests: form.laboratoryTests,
				mediaItems: form.mediaItems,
				...({ correctDiagnosis: form.correctDiagnosis, correctTreatment: form.correctTreatment, labResults: form.labResults, bloodTest: form.bloodTest, biochemTest: form.biochemTest, urineTest: form.urineTest, timeLimit: form.timeLimit } as Partial<Record<string, unknown>>),
			}
			if (editCase) {
				await api.cases.update(editCase._id, payload)
			} else {
				await api.cases.create(payload)
			}
			onSave()
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
		} finally {
			setSaving(false)
		}
	}

	const xrayItems = form.mediaItems.filter(m => m.type === 'xray')
	const ekgItems = form.mediaItems.filter(m => m.type === 'ekg')
	const echoItems = form.mediaItems.filter(m => m.type === 'echo')
	const imageItem = form.mediaItems.find(m => m.type === 'image')
	const videoItem = form.mediaItems.find(m => m.type === 'video')
	const showXraySection = form.instrumentalTests.some(t => t === 'rentgen' || t === 'kt' || t === 'mrt')
	const showEkgSection = form.instrumentalTests.includes('ekg')
	const showUziSection = form.instrumentalTests.includes('uzi')
	const endoscopyRequired = form.instrumentalTests.includes('endoskopiya')
	const selectedLabSections = LAB_SECTIONS.filter(section =>
		form.laboratoryTests.some(test => LAB_TO_SECTION[test] === section.key)
	)

	return (
		<div className='fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto' onClick={onClose}>
			<motion.div
				initial={{ opacity: 0, scale: 0.97 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.97 }}
				className='bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-lg font-bold text-text-primary'>{editCase ? 'Caseni tahrirlash' : 'Yangi klinik holat'}</h3>
					<button onClick={onClose} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary'><X className='w-5 h-5' /></button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-5'>
					{/* Basic info */}
					<div>
						<label className='text-xs text-text-secondary mb-1 block'>Sarlavha *</label>
						<input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="55 yoshli erkak - ko'krak og'rig'i"
							className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Kategoriya *</label>
							<select value={form.category} onChange={e => set('category', e.target.value)} required
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
								<option value=''>Tanlang...</option>
								{adminCategories.map(cat => (
									<option key={cat._id} value={cat.name}>{cat.name}</option>
								))}
							</select>
						</div>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Turi</label>
							<select value={form.type} onChange={e => set('type', e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
								<option value='diagnostika'>Diagnostika</option>
								<option value='jarrohlik'>Jarrohlik</option>
								<option value='shoshilinch'>Shoshilinch</option>
							</select>
						</div>
					</div>

					<div className='grid grid-cols-3 gap-3'>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Qiyinlik darajasi</label>
							<div className='flex items-center gap-1 h-[38px]'>
								{[1, 2, 3, 4, 5].map(star => (
									<button
										key={star}
										type='button'
										onClick={() => set('difficulty', star)}
										title={DIFFICULTY_LABELS[star]}
										className='p-0.5 transition-transform hover:scale-110'
									>
										<Star className={`w-5 h-5 ${star <= form.difficulty ? 'fill-warning text-warning' : 'text-text-secondary/40'}`} />
									</button>
								))}
								<span className='ml-2 text-xs text-text-secondary'>{DIFFICULTY_LABELS[form.difficulty]}</span>
							</div>
						</div>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Holat</label>
							<select value={form.status} onChange={e => set('status', e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
								<option value='draft'>Qoralama</option>
								<option value='review'>{isAdmin ? 'Tekshiruvda' : 'Tekshiruvga yuborish'}</option>
								{/* Faqat admin to'g'ridan-to'g'ri chop eta oladi */}
								{isAdmin && <option value='published'>Chop etilgan</option>}
							</select>
							{!isAdmin && (
								<p className='text-[11px] text-text-secondary/70 mt-1'>Klinik holat admin tasdig&apos;idan keyin chop etiladi.</p>
							)}
						</div>
						<div className='flex items-end'>
							<label className='flex items-center gap-2 cursor-pointer pb-2'>
								<div className='relative'>
									<input type='checkbox' className='sr-only' checked={form.isPremium} onChange={e => set('isPremium', e.target.checked)} />
									<div className={`w-9 h-5 rounded-full transition-colors ${form.isPremium ? 'bg-warning' : 'bg-surface-light border border-border'}`} />
									<div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isPremium ? 'translate-x-4' : ''}`} />
								</div>
								<span className='text-xs text-text-secondary'>Premium</span>
							</label>
						</div>
					</div>

					{form.type === 'shoshilinch' && (
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>⏱ Vaqt chegarasi (soniyalarda)</label>
							<input type='number' min={30} max={3600} value={form.timeLimit} onChange={e => set('timeLimit', +e.target.value)}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
							<p className='text-xs text-text-secondary/60 mt-1'>{Math.floor(form.timeLimit / 60)} daqiqa {form.timeLimit % 60} soniya</p>
						</div>
					)}

					{/* Patient */}
					<div className='border-t border-border pt-4'>
						<p className='text-sm font-semibold text-text-primary mb-3'>Bemor ma&apos;lumotlari</p>
						<div className='grid grid-cols-2 gap-3 mb-3'>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Ism</label>
								<input value={form.patientName} onChange={e => set('patientName', e.target.value)} placeholder='Alisher Rahimov'
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
							</div>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Yosh</label>
								<input type='number' min={0} max={120} value={form.patientAge} onChange={e => set('patientAge', +e.target.value)}
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
							</div>
						</div>
						<div className='grid grid-cols-2 gap-3 mb-3'>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Jins</label>
								<select value={form.patientGender} onChange={e => set('patientGender', e.target.value)}
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
									<option>Erkak</option>
									<option>Ayol</option>
								</select>
							</div>
							<div>
								<label className='text-xs text-text-secondary mb-1 block'>Yosh guruhi</label>
								<select value={form.patientAgeGroup} onChange={e => set('patientAgeGroup', e.target.value)}
									className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50'>
									<option value='bola'>Bola</option>
									<option value={"o'smir"}>O&apos;smir</option>
									<option value='katta'>Katta yoshli</option>
									<option value='keksa'>Keksa</option>
								</select>
							</div>
						</div>
						<div className='mb-3'>
							<label className='text-xs text-text-secondary mb-1 block'>Shikoyatlar *</label>
							<textarea value={form.complaints} onChange={e => set('complaints', e.target.value)} required rows={2}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none' />
						</div>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>Anamnez</label>
							<textarea value={form.history} onChange={e => set('history', e.target.value)} rows={2}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none' />
						</div>
					</div>

					{/* Vitals */}
					<div>
						<p className='text-sm font-semibold text-text-primary mb-3'>Vital ko&apos;rsatkichlar</p>
						<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
							{[['bp', "Qon bosimi", "120/80"], ['hr', "Yurak urish", "72"], ['temp', "Harorat", "36.6"], ['spo2', "SpO2", "98"]].map(([k, label, ph]) => (
								<div key={k}>
									<label className='text-xs text-text-secondary mb-1 block'>{label}</label>
									<input value={form[k as 'bp' | 'hr' | 'temp' | 'spo2']} onChange={e => set(k as keyof CaseFormData, e.target.value)} placeholder={ph}
										className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50' />
								</div>
							))}
						</div>
					</div>

					{/* Media */}
					<div className='border-t border-border pt-4'>
						<p className='text-sm font-semibold text-text-primary mb-3'>Media fayllar</p>

						{/* New required dropdown menus */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4'>
							<details className='bg-surface-light border border-border rounded-xl p-3'>
								<summary className='cursor-pointer text-sm font-semibold text-text-primary'>
									Instrumental tekshiruvlar ({form.instrumentalTests.length})
								</summary>
								<div className='mt-3 space-y-2'>
									{INSTRUMENTAL_OPTIONS.map(opt => (
										<label key={opt.key} className='flex items-center gap-2 text-sm text-text-primary cursor-pointer'>
											<input
												type='checkbox'
												checked={form.instrumentalTests.includes(opt.key)}
												onChange={() => toggleInstrumentalTest(opt.key)}
												className='w-4 h-4 accent-primary'
											/>
											{opt.label}
										</label>
									))}
								</div>
							</details>

							<details className='bg-surface-light border border-border rounded-xl p-3'>
								<summary className='cursor-pointer text-sm font-semibold text-text-primary'>
									Laborator tekshiruvlar ({form.laboratoryTests.length})
								</summary>
								<div className='mt-3 space-y-2'>
									{LABORATORY_OPTIONS.map(opt => (
										<label key={opt.key} className='flex items-center gap-2 text-sm text-text-primary cursor-pointer'>
											<input
												type='checkbox'
												checked={form.laboratoryTests.includes(opt.key)}
												onChange={() => toggleLaboratoryTest(opt.key)}
												className='w-4 h-4 accent-primary'
											/>
											{opt.label}
										</label>
									))}
								</div>
							</details>
						</div>

					{/* Rentgen / KT / MRT */}
				{showXraySection && (
						<div className='mb-3 p-4 bg-surface-light rounded-xl border border-border space-y-3'>
							<div className='flex items-center justify-between'>
							<p className='text-sm font-medium text-text-primary'>Rentgen / KT / MRT rasmlari</p>
								<button type='button' onClick={() => xrayRef.current?.click()} disabled={uploading === 'xray'}
									className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50'>
									{uploading === 'xray' ? <Loader2 className='w-3 h-3 animate-spin' /> : <Plus className='w-3 h-3' />} Rasm/GIF qo&apos;shish
								</button>
							</div>
							<input ref={xrayRef} type='file' accept='image/*,.gif' multiple className='hidden' onChange={e => handleFilesChange('xray', e.target.files)} />
							{xrayItems.length === 0 && (
								<button type='button' onClick={() => xrayRef.current?.click()}
									className='w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-primary/50 hover:text-primary transition-colors'>
									<Upload className='w-5 h-5' /><span className='text-xs'>Rasm yoki GIF yuklang (bir nechta tanlab olish mumkin)</span>
								</button>
							)}
							{xrayItems.map((item, idx) => (
								<div key={idx} className='bg-surface rounded-xl border border-border p-3'>
									<div className='flex items-start gap-2 mb-2'>
										<img src={item.fileData.startsWith('/') ? `http://localhost:5000${item.fileData}` : item.fileData} alt='xray' className='w-24 h-16 object-contain rounded-lg bg-black shrink-0' />
										<div className='flex-1'>
											<p className='text-xs text-text-secondary mb-1 truncate'>{item.fileName}</p>
											<textarea value={item.comment} onChange={e => updateMediaComment('xray', idx, e.target.value)} rows={2} placeholder='Xulosa (majburiy)*'
												className='w-full bg-surface-light border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none' />
										</div>
										<button type='button' onClick={() => removeMedia('xray', idx)} className='text-accent hover:text-accent/80 shrink-0 mt-0.5'><X className='w-3.5 h-3.5' /></button>
									</div>
								</div>
							))}
						</div>
					)}

					{/* EKG */}
					{showEkgSection && (
						<div className='mb-3 p-4 bg-surface-light rounded-xl border border-border space-y-3'>
							<div className='flex items-center justify-between'>
								<p className='text-sm font-medium text-text-primary'>EKG rasmlari</p>
								<button type='button' onClick={() => ekgRef.current?.click()} disabled={uploading === 'ekg'}
									className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50'>
									{uploading === 'ekg' ? <Loader2 className='w-3 h-3 animate-spin' /> : <Plus className='w-3 h-3' />} Rasm/GIF qo&apos;shish
								</button>
							</div>
							<input ref={ekgRef} type='file' accept='image/*,.gif' multiple className='hidden' onChange={e => handleFilesChange('ekg', e.target.files)} />
							{ekgItems.length === 0 && (
								<button type='button' onClick={() => ekgRef.current?.click()}
									className='w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-primary/50 hover:text-primary transition-colors'>
									<ImagePlus className='w-5 h-5' /><span className='text-xs'>Rasm yoki GIF yuklang (bir nechta tanlab olish mumkin)</span>
								</button>
							)}
							{ekgItems.map((item, idx) => (
								<div key={idx} className='bg-surface rounded-xl border border-border p-3'>
									<div className='flex items-start gap-2 mb-2'>
										<img src={item.fileData.startsWith('/') ? `http://localhost:5000${item.fileData}` : item.fileData} alt='ekg' className='w-24 h-16 object-contain rounded-lg bg-black shrink-0' />
										<div className='flex-1'>
											<p className='text-xs text-text-secondary mb-1 truncate'>{item.fileName}</p>
											<textarea value={item.comment} onChange={e => updateMediaComment('ekg', idx, e.target.value)} rows={2} placeholder='Xulosa (majburiy)*'
												className='w-full bg-surface-light border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none' />
										</div>
										<button type='button' onClick={() => removeMedia('ekg', idx)} className='text-accent hover:text-accent/80 shrink-0 mt-0.5'><X className='w-3.5 h-3.5' /></button>
									</div>
								</div>
							))}
						</div>
					)}

					{/* UZI */}
					{showUziSection && (
						<div className='mb-3 p-4 bg-surface-light rounded-xl border border-border space-y-3'>
							<div className='flex items-center justify-between'>
								<p className='text-sm font-medium text-text-primary'>UZI rasmlari</p>
								<button type='button' onClick={() => echoRef.current?.click()} disabled={uploading === 'echo'}
									className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50'>
									{uploading === 'echo' ? <Loader2 className='w-3 h-3 animate-spin' /> : <Plus className='w-3 h-3' />} Rasm/GIF qo&apos;shish
								</button>
							</div>
							<input ref={echoRef} type='file' accept='image/*,.gif' multiple className='hidden' onChange={e => handleFilesChange('echo', e.target.files)} />
							{echoItems.length === 0 && (
								<button type='button' onClick={() => echoRef.current?.click()}
									className='w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-primary/50 hover:text-primary transition-colors'>
									<ImagePlus className='w-5 h-5' /><span className='text-xs'>Rasm yoki GIF yuklang (bir nechta tanlab olish mumkin)</span>
								</button>
							)}
							{echoItems.map((item, idx) => (
								<div key={idx} className='bg-surface rounded-xl border border-border p-3'>
									<div className='flex items-start gap-2 mb-2'>
										<img src={item.fileData.startsWith('/') ? `http://localhost:5000${item.fileData}` : item.fileData} alt='echo' className='w-24 h-16 object-contain rounded-lg bg-black shrink-0' />
										<div className='flex-1'>
											<p className='text-xs text-text-secondary mb-1 truncate'>{item.fileName}</p>
											<textarea value={item.comment} onChange={e => updateMediaComment('echo', idx, e.target.value)} rows={2} placeholder='Xulosa (majburiy)*'
												className='w-full bg-surface-light border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none' />
										</div>
										<button type='button' onClick={() => removeMedia('echo', idx)} className='text-accent hover:text-accent/80 shrink-0 mt-0.5'><X className='w-3.5 h-3.5' /></button>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Additional image */}
					<div className='pt-2'>
						<p className='text-xs font-semibold text-text-secondary mb-2'>
							Qo&apos;shimcha rasm / GIF {endoscopyRequired ? '(Endoskopiya uchun majburiy)' : '(ixtiyoriy)'}
						</p>
						{imageItem ? (
							<div className='p-3 bg-surface-light rounded-xl border border-border'>
								<div className='flex items-center justify-between mb-2'>
									<p className='text-xs font-medium text-text-primary'>Rasm / GIF</p>
									<button type='button' onClick={() => removeMedia('image')} className='text-accent hover:text-accent/80'><X className='w-4 h-4' /></button>
								</div>
								<img src={imageItem.fileData.startsWith('/') ? `http://localhost:5000${imageItem.fileData}` : imageItem.fileData} alt='img' className='w-full h-28 object-contain rounded-lg mb-2 bg-black/30' />
								<p className='text-xs text-text-secondary mb-1'>{imageItem.fileName}</p>
								<textarea value={imageItem.comment} onChange={e => updateMediaComment('image', 0, e.target.value)} rows={1} placeholder='Izoh...'
									className='w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none' />
							</div>
						) : (
							<button type='button' onClick={() => imageRef.current?.click()}
								className='w-full h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-text-secondary hover:border-primary/50 hover:text-primary transition-colors text-xs'>
								<ImagePlus className='w-4 h-4' /> Rasm yoki GIF yuklang
							</button>
						)}
						<input ref={imageRef} type='file' accept='image/*,.gif' className='hidden' onChange={e => handleFilesChange('image', e.target.files)} />
					</div>

					{/* Video */}
					<div>
						<p className='text-xs font-semibold text-text-secondary mb-2'>
							Video {endoscopyRequired ? '(Endoskopiya uchun mos)' : '(ixtiyoriy)'}
						</p>
						{videoItem ? (
							<div className='p-3 bg-surface-light rounded-xl border border-border'>
								<div className='flex items-center justify-between mb-2'>
									<p className='text-xs font-medium text-text-primary'>Video</p>
									<button type='button' onClick={() => removeMedia('video')} className='text-accent hover:text-accent/80'><X className='w-4 h-4' /></button>
								</div>
								<video src={videoItem.fileData.startsWith('/') ? `http://localhost:5000${videoItem.fileData}` : videoItem.fileData} controls className='w-full rounded-lg mb-2 max-h-32' />
								<p className='text-xs text-text-secondary mb-1'>{videoItem.fileName}</p>
								<textarea value={videoItem.comment} onChange={e => updateMediaComment('video', 0, e.target.value)} rows={1} placeholder='Izoh...'
									className='w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none' />
							</div>
						) : (
							<button type='button' onClick={() => videoRef.current?.click()}
								className='w-full h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-text-secondary hover:border-primary/50 hover:text-primary transition-colors text-xs'>
								<Upload className='w-4 h-4' /> Video yuklang (mp4, webm)
							</button>
						)}
						<input ref={videoRef} type='file' accept='video/*' className='hidden' onChange={e => handleFilesChange('video', e.target.files)} />
						</div>
					</div>

					{/* Lab Sections */}
					<div className='border-t border-border pt-4 space-y-4'>
						<p className='text-sm font-semibold text-text-primary'>Laboratoriya tahlillari</p>
						{selectedLabSections.length === 0 && (
							<p className='text-xs text-text-secondary/60'>Avval Laborator tekshiruvlar dropdown menyusidan bo&apos;lim tanlang.</p>
						)}
						{selectedLabSections.map(({ key, label }) => (
							<div key={key} className='bg-surface-light rounded-xl border border-border p-3'>
								<div className='flex items-center justify-between mb-2'>
									<p className='text-xs font-semibold text-text-primary'>{label}</p>
									<button type='button' onClick={() => addSectionRow(key)}
										className='flex items-center gap-1 text-xs text-primary hover:text-primary/80'>
										<Plus className='w-3 h-3' /> Qator qo&apos;shish
									</button>
								</div>
								{form[key].length === 0 ? (
									<p className='text-xs text-text-secondary/50 py-1'>Hali qator yo&apos;q.</p>
								) : (
									<div className='space-y-1.5'>
										{form[key].map((row, i) => (
											<div key={i} className='grid grid-cols-5 gap-1 items-center'>
												<input value={row.name} onChange={e => updateSectionRow(key, i, 'name', e.target.value)} placeholder='Nomi'
													className='col-span-2 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50' />
												<input value={row.value} onChange={e => updateSectionRow(key, i, 'value', e.target.value)} placeholder='Qiymat'
													className='bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50' />
												<input value={row.range} onChange={e => updateSectionRow(key, i, 'range', e.target.value)} placeholder='Norma'
													className='bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50' />
												<div className='flex items-center gap-1'>
													<select value={row.status} onChange={e => updateSectionRow(key, i, 'status', e.target.value)}
														className='flex-1 bg-surface border border-border rounded-lg px-1 py-1.5 text-xs text-text-primary focus:outline-none'>
														<option value='normal'>Normal</option>
														<option value='high'>Yuqori</option>
														<option value='low'>Past</option>
														<option value='critical'>Kritik</option>
													</select>
													<button type='button' onClick={() => removeSectionRow(key, i)} className='text-accent hover:text-accent/80 shrink-0'><X className='w-3.5 h-3.5' /></button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						))}
					</div>

					{/* Diagnosis & Treatment */}
					<div className='border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>To&apos;g&apos;ri tashxis *</label>
							<textarea value={form.correctDiagnosis} onChange={e => set('correctDiagnosis', e.target.value)} required rows={3}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none' />
						</div>
						<div>
							<label className='text-xs text-text-secondary mb-1 block'>To&apos;g&apos;ri davolash *</label>
							<textarea value={form.correctTreatment} onChange={e => set('correctTreatment', e.target.value)} required rows={3}
								className='w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none' />
						</div>
					</div>

					{error && <p className='text-sm text-accent'>{error}</p>}

					<div className='flex gap-3 pt-2'>
						<Button type='button' variant='secondary' className='flex-1' onClick={onClose}>Bekor</Button>
						<Button type='submit' className='flex-1' disabled={saving}>
							{saving ? <><Loader2 className='w-4 h-4 animate-spin' /> Saqlanmoqda...</> : editCase ? 'Saqlash' : 'Yaratish'}
						</Button>
					</div>
				</form>
			</motion.div>
		</div>
	)
}

export default function ContentManagerPage() {
	const { user, isLoading } = useAuth()
	const { t } = useT()
	const router = useRouter()
	const [cmTab, setCmTab] = useState<CMTab>('dashboard')
	const [cases, setCases] = useState<BackendCase[]>([])
	const [total, setTotal] = useState(0)
	const [casesLoading, setCasesLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeCategory, setActiveCategory] = useState('')
	const [categories, setCategories] = useState<string[]>([])
	const [adminCategories, setAdminCategories] = useState<AdminCategory[]>([])
	const [editCase, setEditCase] = useState<BackendCase | null | 'new'>(null)
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
	const [cmStats, setCMStats] = useState<{ total: number; categoryStats: { _id: string; count: number; avgDifficulty: number; published: number; draft: number; review: number }[]; statusStats: { _id: string; count: number }[] } | null>(null)
	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (!isLoading && (!user || !canAccessContentManager(user.role))) {
			router.push('/login')
		}
	}, [user, isLoading, router])

	const loadCases = useCallback(async (search: string, category: string) => {
		setCasesLoading(true)
		try {
			const res = await api.cases.getMine({ search: search || undefined, category: category || undefined })
			setCases(res.cases)
			setTotal(res.total)
		} catch {
			// silent
		} finally {
			setCasesLoading(false)
		}
	}, [])

	useEffect(() => {
		async function loadStats() {
			try {
				const res = await api.cases.getCMStats()
				setCMStats(res.stats)
			} catch {
				// silent
			}
		}
		loadStats()
	}, [])

	useEffect(() => {
		async function loadCategories() {
			try {
				const res = await api.cases.getCategories()
				setCategories(res.categories)
			} catch {
				// silent
			}
		}
		loadCategories()
	}, [])

	useEffect(() => {
		if (!user) return
		async function loadAdminCategories() {
			try {
				const res = await api.admin.getCategories()
				setAdminCategories(res.categories)
			} catch {
				// Fallback: use public cases categories endpoint
				try {
					const res2 = await api.cases.getCategories()
					setAdminCategories(res2.categories.map((name, i) => ({ _id: `cat-${i}`, name, createdAt: '' })))
				} catch {
					// silent
				}
			}
		}
		loadAdminCategories()
	}, [user])

	useEffect(() => { loadCases(searchQuery, activeCategory) }, [activeCategory, loadCases, searchQuery])

	function handleSearchChange(v: string) {
		setSearchQuery(v)
		if (searchTimeout.current) clearTimeout(searchTimeout.current)
		searchTimeout.current = setTimeout(() => loadCases(v, activeCategory), 400)
	}

	async function handleDelete(id: string) {
		try {
			await api.cases.delete(id)
			setDeleteConfirm(null)
			loadCases(searchQuery, activeCategory)
			api.cases.getCMStats().then(res => setCMStats(res.stats)).catch(() => null)
		} catch {
			// silent
		}
	}

	const stats = {
		total: cmStats?.total ?? total,
		published: cmStats?.statusStats.find(s => s._id === 'published')?.count ?? cases.filter(c => c.status === 'published').length,
		review: cmStats?.statusStats.find(s => s._id === 'review')?.count ?? cases.filter(c => c.status === 'review').length,
		draft: cmStats?.statusStats.find(s => s._id === 'draft')?.count ?? cases.filter(c => c.status === 'draft').length,
	}

	if (isLoading || !user || !canAccessContentManager(user.role)) {
		return (
			<div className='min-h-screen bg-secondary flex items-center justify-center'>
				<div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />
			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'>
					{/* Header */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-8'>
						<div className='flex items-center gap-3 mb-2'>
							<UserCog className='w-6 h-6 text-warning' />
							<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>{t('cm.title')}</h1>
							<Badge variant='warning'>{t('cm.manager')}</Badge>
						</div>
						<p className='text-text-secondary'>{t('cm.subtitle')}</p>
					</motion.div>

					{/* 7-tab navigation */}
						<CMTabBar active={cmTab} onChange={setCmTab} />

						{cmTab === 'dashboard' && <CMDashboard />}
						{cmTab === 'emergency' && <CMPlaceholder icon={AlertCircle} titleKey='cm.emergency' />}
						{cmTab === 'library' && <CMLibrary />}
						{cmTab === 'exams' && <CMPlaceholder icon={FileQuestion} titleKey='cm.exams' />}
						{cmTab === 'analytics' && <CMDashboard />}

					{cmTab === 'courses' && <CMCourses />}

					{cmTab === 'cases' && <>

					{/* Stats */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
						{[
							{ icon: FileText, label: 'Jami klinik holatlar', value: total, color: 'text-primary' },
							{ icon: CheckCircle, label: 'Chop etilgan', value: stats.published, color: 'text-success' },
							{ icon: Clock, label: 'Tekshiruvda', value: stats.review, color: 'text-warning' },
							{ icon: AlertCircle, label: 'Qoralama', value: stats.draft, color: 'text-accent' },
						].map(s => (
							<Card key={s.label} hover={false}>
								<div className='flex items-start justify-between'>
									<div>
										<p className='text-xs text-text-secondary mb-1'>{s.label}</p>
										<p className='text-2xl font-bold text-text-primary'>{s.value}</p>
									</div>
									<div className='w-10 h-10 rounded-xl flex items-center justify-center bg-surface-light'>
										<s.icon className={`w-5 h-5 ${s.color}`} />
									</div>
								</div>
							</Card>
						))}
					</motion.div>

					{/* Category Stats */}
					{cmStats && cmStats.categoryStats.length > 0 && (
						<motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6'>
							<Card hover={false}>
								<p className='text-sm font-semibold text-text-primary mb-3'>Kategoriya bo&apos;yicha statistika</p>
								<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
									{cmStats.categoryStats.map(cat => (
										<div key={cat._id} className='p-3 bg-surface-light rounded-xl border border-border'>
											<p className='text-xs font-medium text-text-primary truncate mb-1'>{cat._id}</p>
											<p className='text-xl font-bold text-primary'>{cat.count}</p>
											<p className='text-xs text-text-secondary'>∅ qiyinlik: {cat.avgDifficulty.toFixed(1)}</p>
											<div className='flex gap-1 mt-1'>
												{cat.published > 0 && <span className='text-xs bg-success/15 text-success px-1.5 py-0.5 rounded'>{cat.published} nashr</span>}
												{cat.review > 0 && <span className='text-xs bg-warning/15 text-warning px-1.5 py-0.5 rounded'>{cat.review} teksh.</span>}
											</div>
										</div>
									))}
								</div>
							</Card>
						</motion.div>
					)}

					{/* Toolbar */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn} className='mb-6'>
						<Card hover={false}>
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
								<div className='relative flex-1 w-full'>
									<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50' />
									<input type='text' value={searchQuery} onChange={e => handleSearchChange(e.target.value)} placeholder='Case qidirish...'
										className='w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all' />
								</div>
								<div className='flex gap-2 flex-wrap'>
									<button onClick={() => setActiveCategory('')}
										className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!activeCategory ? 'bg-primary text-secondary' : 'bg-surface-light text-text-secondary hover:text-text-primary'}`}>
										Barchasi
									</button>
									{categories.slice(0, 5).map(cat => (
										<button key={cat} onClick={() => setActiveCategory(cat)}
											className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat ? 'bg-primary text-secondary' : 'bg-surface-light text-text-secondary hover:text-text-primary'}`}>
											{cat}
										</button>
									))}
								</div>
								<Button size='sm' onClick={() => setEditCase('new')}>
									<FilePlus className='w-4 h-4' /> Yangi Case
								</Button>
							</div>
						</Card>
					</motion.div>

					{/* Cases List */}
					<motion.div initial='hidden' animate='visible' variants={fadeIn}>
						<Card hover={false}>
							{casesLoading ? (
								<div className='flex items-center justify-center h-32'>
									<div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='w-full text-sm'>
										<thead>
											<tr className='border-b border-border'>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Case</th>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Kategoriya</th>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Holat</th>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Qiyinlik</th>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Muallif</th>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Media</th>
												<th className='text-left py-3 px-2 text-text-secondary font-medium'>Amallar</th>
											</tr>
										</thead>
										<tbody>
											{cases.map(c => {
												const st = statusMap[c.status ?? 'draft']
												return (
													<tr key={c._id} className='border-b border-border/50 hover:bg-surface-light transition-colors'>
														<td className='py-3 px-2'>
															<p className='font-medium text-text-primary leading-tight'>{c.title}</p>
															<p className='text-xs text-text-secondary'>{c.caseId}</p>
														</td>
														<td className='py-3 px-2'>
															<span className='flex items-center gap-1.5 text-xs text-text-secondary'>
																<Tag className='w-3 h-3' /> {c.category}
															</span>
														</td>
														<td className='py-3 px-2'>
															<Badge variant={st?.variant ?? 'default'}>{st?.label ?? c.status}</Badge>
														</td>
														<td className='py-3 px-2'>
															<div className='flex gap-0.5'>
																{Array.from({ length: 5 }).map((_, i) => (
																	<div key={i} className={`w-1.5 h-4 rounded-sm ${i < c.difficulty ? 'bg-warning' : 'bg-surface-light'}`} />
																))}
															</div>
														</td>
														<td className='py-3 px-2 text-xs text-text-secondary'>
															{c.authorName || '—'}
														</td>
														<td className='py-3 px-2'>
															<div className='flex gap-1'>
																{(c.mediaItems ?? []).map(m => (
																	<span key={m.type} className='text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded'>
																		{m.type === 'xray' ? 'RTG/KT' : m.type === 'ekg' ? 'EKG' : m.type === 'echo' ? 'UZI' : m.type === 'video' ? 'Video' : 'Rasm'}
																	</span>
																))}
																{(c.mediaItems ?? []).length === 0 && <span className='text-xs text-text-secondary/40'>—</span>}
															</div>
														</td>
														<td className='py-3 px-2'>
															<div className='flex items-center gap-1'>
																<button onClick={() => setEditCase(c)} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary hover:text-primary transition-colors'>
																	<Edit3 className='w-4 h-4' />
																</button>
																<button onClick={() => setDeleteConfirm(c._id)} className='p-1.5 rounded-lg hover:bg-surface-light text-text-secondary hover:text-accent transition-colors'>
																	<Trash2 className='w-4 h-4' />
																</button>
															</div>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
									{cases.length === 0 && (
										<div className='text-center py-12'>
											<FileText className='w-10 h-10 text-text-secondary/30 mx-auto mb-3' />
											<p className='text-text-secondary'>Hech narsa topilmadi</p>
											<button onClick={() => setEditCase('new')} className='mt-3 text-sm text-primary hover:underline'>
												Birinchi caseni yarating
											</button>
										</div>
									)}
								</div>
							)}
						</Card>
					</motion.div>

					</>}
				</div>
			</main>

			{/* Modals */}
			<AnimatePresence>
				{(editCase === 'new' || (editCase && typeof editCase === 'object')) && (
					<CaseModal
						editCase={editCase === 'new' ? null : editCase}					adminCategories={adminCategories}						onClose={() => setEditCase(null)}
						onSave={() => {
							setEditCase(null)
							loadCases(searchQuery, activeCategory)
							api.cases.getCMStats().then(res => setCMStats(res.stats)).catch(() => null)
						}}
					/>
				)}
				{deleteConfirm && (
					<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
						<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
							className='bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl'>
							<h3 className='text-base font-bold text-text-primary mb-2'>Caseni o&apos;chirasizmi?</h3>
							<p className='text-sm text-text-secondary mb-6'>Bu amalni ortga qaytarib bo&apos;lmaydi.</p>
							<div className='flex gap-3'>
								<Button variant='secondary' className='flex-1' onClick={() => setDeleteConfirm(null)}>Bekor</Button>
								<Button className='flex-1 bg-accent! hover:bg-accent/90!' onClick={() => handleDelete(deleteConfirm)}>O&apos;chirish</Button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	)
}

