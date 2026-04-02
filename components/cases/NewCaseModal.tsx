'use client'

import Button from '@/components/ui/Button'
import { AnimatePresence, motion } from 'framer-motion'
import {
    ChevronDown,
    ChevronUp,
    Heart,
    Plus,
    Thermometer,
    User,
    X
} from 'lucide-react'
import { useState } from 'react'

interface NewCaseData {
	title: string
	category: string
	type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
	difficulty: number
	patient: {
		name: string
		age: string
		gender: string
		ageGroup: string
		complaints: string
		history: string
		vitals: { bp: string; hr: string; temp: string; spo2: string }
	}
	additionalTests: string[]
	correctDiagnosis: string
	correctTreatment: string
}

const CATEGORIES = [
	'Kardiologiya',
	'Nevrologiya',
	'Pediatriya',
	'Shoshilinch yordam',
	'Dermatologiya',
	'Pulmonologiya',
	'Gastroenterologiya',
	'Endokrinologiya',
	'Ortopediya',
	'Urologiya',
]

const CASE_TYPES: { value: NewCaseData['type']; label: string }[] = [
	{ value: 'diagnostika', label: 'Diagnostika' },
	{ value: 'jarrohlik', label: 'Jarrohlik' },
	{ value: 'shoshilinch', label: 'Shoshilinch' },
]

const AGE_GROUPS = ["chaqaloq", "bola", "o'smir", "yosh", "o'rta yosh", "keksa"]

const ADDITIONAL_TESTS = [
	'EKG',
	'KT / Kompyuter Tomografiya',
	'Qon tahlili (umumiy)',
	'Bioximik tahlil',
	'Siydik tahlili',
	'EXO-KG',
	'MRT',
	'Rentgen',
	'UZI',
	'Koagulogramma',
]

const inputClass =
	'w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'

const labelClass = 'text-xs font-medium text-text-secondary mb-1.5 block'

export interface CreatedCase {
	id: number
	title: string
	category: string
	status: string
	views: number
	rating: number
	date: string
}

interface NewCaseModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (c: CreatedCase) => void
}

export default function NewCaseModal({ isOpen, onClose, onSave }: NewCaseModalProps) {
	const [step, setStep] = useState(1)
	const [expandVitals, setExpandVitals] = useState(true)

	const [form, setForm] = useState<NewCaseData>({
		title: '',
		category: CATEGORIES[0],
		type: 'diagnostika',
		difficulty: 3,
		patient: {
			name: '',
			age: '',
			gender: 'Erkak',
			ageGroup: "o'rta yosh",
			complaints: '',
			history: '',
			vitals: { bp: '', hr: '', temp: '', spo2: '' },
		},
		additionalTests: [],
		correctDiagnosis: '',
		correctTreatment: '',
	})

	const updateField = <K extends keyof NewCaseData>(key: K, val: NewCaseData[K]) =>
		setForm(prev => ({ ...prev, [key]: val }))

	const updatePatient = <K extends keyof NewCaseData['patient']>(
		key: K,
		val: NewCaseData['patient'][K],
	) => setForm(prev => ({ ...prev, patient: { ...prev.patient, [key]: val } }))

	const updateVital = (key: keyof NewCaseData['patient']['vitals'], val: string) =>
		setForm(prev => ({
			...prev,
			patient: { ...prev.patient, vitals: { ...prev.patient.vitals, [key]: val } },
		}))

	const toggleTest = (t: string) =>
		setForm(prev => ({
			...prev,
			additionalTests: prev.additionalTests.includes(t)
				? prev.additionalTests.filter(x => x !== t)
				: [...prev.additionalTests, t],
		}))

	const canNext = () => {
		if (step === 1) return form.title.trim().length > 0
		if (step === 2)
			return (
				form.patient.name.trim().length > 0 &&
				form.patient.age.trim().length > 0 &&
				form.patient.complaints.trim().length > 0
			)
		return true
	}

	const handleSave = (asDraft: boolean) => {
		const newCase: CreatedCase = {
			id: Date.now(),
			title: form.title,
			category: form.category,
			status: asDraft ? 'draft' : 'review',
			views: 0,
			rating: 0,
			date: new Date().toISOString().slice(0, 10),
		}
		onSave(newCase)
		// reset
		setStep(1)
		setForm({
			title: '',
			category: CATEGORIES[0],
			type: 'diagnostika',
			difficulty: 3,
			patient: {
				name: '',
				age: '',
				gender: 'Erkak',
				ageGroup: "o'rta yosh",
				complaints: '',
				history: '',
				vitals: { bp: '', hr: '', temp: '', spo2: '' },
			},
			additionalTests: [],
			correctDiagnosis: '',
			correctTreatment: '',
		})
	}

	const totalSteps = 3
	const stepLabels = ['Case ma\'lumotlari', 'Bemor profili', 'Tashxis & Davolash']

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4'
				>
					{/* Backdrop */}
					<div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, y: 30, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.97 }}
						transition={{ duration: 0.3 }}
						className='relative w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl max-h-[85vh] flex flex-col'
					>
						{/* Header */}
						<div className='flex items-center justify-between px-6 py-4 border-b border-border shrink-0'>
							<div>
								<h2 className='text-lg font-bold text-text-primary flex items-center gap-2'>
									<Plus className='w-5 h-5 text-primary' />
									Yangi Case Yaratish
								</h2>
								<p className='text-xs text-text-secondary mt-0.5'>
									Qadam {step}/{totalSteps} — {stepLabels[step - 1]}
								</p>
							</div>
							<button
								onClick={onClose}
								className='p-2 rounded-xl hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors'
							>
								<X className='w-5 h-5' />
							</button>
						</div>

						{/* Progress bar */}
						<div className='px-6 pt-4 shrink-0'>
							<div className='flex gap-2'>
								{Array.from({ length: totalSteps }).map((_, i) => (
									<div
										key={i}
										className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
											i < step ? 'bg-primary' : 'bg-surface-light'
										}`}
									/>
								))}
							</div>
						</div>

						{/* Content */}
						<div className='flex-1 overflow-y-auto px-6 py-5'>
							<AnimatePresence mode='wait'>
								{/* ─── Step 1: Case info ─── */}
								{step === 1 && (
									<motion.div
										key='step1'
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										className='space-y-4'
									>
										<div>
											<label className={labelClass}>Case sarlavhasi *</label>
											<input
												type='text'
												value={form.title}
												onChange={e => updateField('title', e.target.value)}
												placeholder="Masalan: 55 yoshli erkak, ko'krak og'rig'i"
												className={inputClass}
											/>
										</div>

										<div className='grid grid-cols-2 gap-4'>
											<div>
												<label className={labelClass}>Kategoriya</label>
												<select
													value={form.category}
													onChange={e => updateField('category', e.target.value)}
													className={inputClass}
												>
													{CATEGORIES.map(c => (
														<option key={c} value={c}>{c}</option>
													))}
												</select>
											</div>
											<div>
												<label className={labelClass}>Turi</label>
												<select
													value={form.type}
													onChange={e =>
														updateField('type', e.target.value as NewCaseData['type'])
													}
													className={inputClass}
												>
													{CASE_TYPES.map(t => (
														<option key={t.value} value={t.value}>{t.label}</option>
													))}
												</select>
											</div>
										</div>

										<div>
											<label className={labelClass}>Qiyinlik darajasi: {form.difficulty}/5</label>
											<div className='flex items-center gap-3'>
												<input
													type='range'
													min={1}
													max={5}
													value={form.difficulty}
													onChange={e => updateField('difficulty', Number(e.target.value))}
													className='flex-1 accent-primary h-2'
												/>
												<div className='flex gap-1'>
													{[1, 2, 3, 4, 5].map(n => (
														<div
															key={n}
															className={`w-3 h-3 rounded-full transition-colors ${
																n <= form.difficulty ? 'bg-primary' : 'bg-surface-light'
															}`}
														/>
													))}
												</div>
											</div>
										</div>

										<div>
											<label className={labelClass}>Mavjud tekshiruvlar</label>
											<div className='flex flex-wrap gap-2'>
												{ADDITIONAL_TESTS.map(t => (
													<button
														key={t}
														type='button'
														onClick={() => toggleTest(t)}
														className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
															form.additionalTests.includes(t)
																? 'bg-primary/15 text-primary border-primary/30'
																: 'bg-surface-light text-text-secondary border-border hover:border-primary/20'
														}`}
													>
														{t}
													</button>
												))}
											</div>
										</div>
									</motion.div>
								)}

								{/* ─── Step 2: Patient profile ─── */}
								{step === 2 && (
									<motion.div
										key='step2'
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										className='space-y-4'
									>
										<div className='grid grid-cols-2 gap-4'>
											<div>
												<label className={labelClass}>
													<User className='w-3 h-3 inline mr-1' />
													Bemor ismi *
												</label>
												<input
													type='text'
													value={form.patient.name}
													onChange={e => updatePatient('name', e.target.value)}
													placeholder='Masalan: Alisher'
													className={inputClass}
												/>
											</div>
											<div className='grid grid-cols-2 gap-3'>
												<div>
													<label className={labelClass}>Yoshi *</label>
													<input
														type='number'
														value={form.patient.age}
														onChange={e => updatePatient('age', e.target.value)}
														placeholder='55'
														min={0}
														max={120}
														className={inputClass}
													/>
												</div>
												<div>
													<label className={labelClass}>Jinsi</label>
													<select
														value={form.patient.gender}
														onChange={e => updatePatient('gender', e.target.value)}
														className={inputClass}
													>
														<option value='Erkak'>Erkak</option>
														<option value='Ayol'>Ayol</option>
													</select>
												</div>
											</div>
										</div>

										<div>
											<label className={labelClass}>Yosh guruhi</label>
											<div className='flex flex-wrap gap-2'>
												{AGE_GROUPS.map(g => (
													<button
														key={g}
														type='button'
														onClick={() => updatePatient('ageGroup', g)}
														className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
															form.patient.ageGroup === g
																? 'bg-primary/15 text-primary border-primary/30'
																: 'bg-surface-light text-text-secondary border-border hover:border-primary/20'
														}`}
													>
														{g}
													</button>
												))}
											</div>
										</div>

										<div>
											<label className={labelClass}>Shikoyatlar *</label>
											<textarea
												value={form.patient.complaints}
												onChange={e => updatePatient('complaints', e.target.value)}
												placeholder="Ko'krak og'rig'i, nafas qiyinligi, terlash..."
												rows={2}
												className={inputClass + ' resize-none'}
											/>
										</div>

										<div>
											<label className={labelClass}>Anamnez (tarix)</label>
											<textarea
												value={form.patient.history}
												onChange={e => updatePatient('history', e.target.value)}
												placeholder='2 yildan beri gipertoniya. Dori: Enalapril 10mg...'
												rows={2}
												className={inputClass + ' resize-none'}
											/>
										</div>

										{/* Vitals */}
										<div className='bg-surface-light rounded-xl border border-border'>
											<button
												type='button'
												onClick={() => setExpandVitals(!expandVitals)}
												className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary'
											>
												<span className='flex items-center gap-2'>
													<Heart className='w-4 h-4 text-accent' />
													Vital belgilari
												</span>
												{expandVitals ? (
													<ChevronUp className='w-4 h-4 text-text-secondary' />
												) : (
													<ChevronDown className='w-4 h-4 text-text-secondary' />
												)}
											</button>
											{expandVitals && (
												<div className='px-4 pb-4 grid grid-cols-2 gap-3'>
													<div>
														<label className={labelClass}>Qon bosimi (BP)</label>
														<input
															type='text'
															value={form.patient.vitals.bp}
															onChange={e => updateVital('bp', e.target.value)}
															placeholder='140/90'
															className={inputClass}
														/>
													</div>
													<div>
														<label className={labelClass}>Yurak urishi (HR)</label>
														<input
															type='text'
															value={form.patient.vitals.hr}
															onChange={e => updateVital('hr', e.target.value)}
															placeholder='98'
															className={inputClass}
														/>
													</div>
													<div>
														<label className={labelClass}>
															<Thermometer className='w-3 h-3 inline mr-1' />
															Harorat
														</label>
														<input
															type='text'
															value={form.patient.vitals.temp}
															onChange={e => updateVital('temp', e.target.value)}
															placeholder='37.8'
															className={inputClass}
														/>
													</div>
													<div>
														<label className={labelClass}>SpO2 (%)</label>
														<input
															type='text'
															value={form.patient.vitals.spo2}
															onChange={e => updateVital('spo2', e.target.value)}
															placeholder='96'
															className={inputClass}
														/>
													</div>
												</div>
											)}
										</div>
									</motion.div>
								)}

								{/* ─── Step 3: Diagnosis & Treatment ─── */}
								{step === 3 && (
									<motion.div
										key='step3'
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										className='space-y-4'
									>
										<div>
											<label className={labelClass}>To&apos;g&apos;ri tashxis</label>
											<textarea
												value={form.correctDiagnosis}
												onChange={e => updateField('correctDiagnosis', e.target.value)}
												placeholder="O'tkir koronar sindrom (ACS) — STEMI tipi"
												rows={3}
												className={inputClass + ' resize-none'}
											/>
											<p className='text-[10px] text-text-secondary/50 mt-1'>
												AI baholash uchun to&apos;g&apos;ri tashxisni kiriting
											</p>
										</div>

										<div>
											<label className={labelClass}>To&apos;g&apos;ri davolash rejasi</label>
											<textarea
												value={form.correctTreatment}
												onChange={e => updateField('correctTreatment', e.target.value)}
												placeholder="1. Aspirin 300mg darhol&#10;2. Nitrogliserin 0.4mg sublingual&#10;3. Heparin IV&#10;4. PCI uchun yo'naltirish"
												rows={4}
												className={inputClass + ' resize-none'}
											/>
										</div>

										{/* Preview */}
										<div className='bg-surface-light rounded-xl border border-border p-4'>
											<h4 className='text-xs font-semibold text-text-secondary mb-3'>CASE XULOSA</h4>
											<div className='space-y-2 text-sm'>
												<div className='flex justify-between'>
													<span className='text-text-secondary'>Sarlavha</span>
													<span className='text-text-primary font-medium'>{form.title || '—'}</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-text-secondary'>Kategoriya</span>
													<span className='text-text-primary'>{form.category}</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-text-secondary'>Turi</span>
													<span className='text-text-primary'>{CASE_TYPES.find(t => t.value === form.type)?.label}</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-text-secondary'>Bemor</span>
													<span className='text-text-primary'>
														{form.patient.name || '—'}, {form.patient.age || '—'} yosh, {form.patient.gender}
													</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-text-secondary'>Qiyinlik</span>
													<span className='text-text-primary'>
														{'★'.repeat(form.difficulty)}{'☆'.repeat(5 - form.difficulty)}
													</span>
												</div>
												{form.additionalTests.length > 0 && (
													<div className='flex justify-between'>
														<span className='text-text-secondary'>Tekshiruvlar</span>
														<span className='text-text-primary text-right'>{form.additionalTests.join(', ')}</span>
													</div>
												)}
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Footer */}
						<div className='flex items-center justify-between px-6 py-4 border-t border-border shrink-0'>
							<div>
								{step > 1 && (
									<Button variant='ghost' size='sm' onClick={() => setStep(step - 1)}>
										← Orqaga
									</Button>
								)}
							</div>
							<div className='flex items-center gap-2'>
								{step === totalSteps ? (
									<>
										<Button variant='secondary' size='sm' onClick={() => handleSave(true)}>
											Qoralama saqlash
										</Button>
										<Button size='sm' onClick={() => handleSave(false)} disabled={!form.title.trim()}>
											Tekshiruvga yuborish →
										</Button>
									</>
								) : (
									<Button size='sm' onClick={() => setStep(step + 1)} disabled={!canNext()}>
										Keyingi →
									</Button>
								)}
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
