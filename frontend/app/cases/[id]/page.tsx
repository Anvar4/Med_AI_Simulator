'use client'

import AIResultModal from '@/components/cases/AIResultModal';
import { LabResults, MediaViewer } from '@/components/cases/MedicalMedia';
import PatientSimulator from '@/components/cases/PatientSimulator';
import VitalSigns from '@/components/cases/VitalSigns';
import Sidebar from '@/components/layout/Sidebar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api, BackendCase } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle,
    Circle,
    Clock,
    TestTube,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const INSTRUMENTAL_TEST_OPTIONS = [
	{ id: 'ekg', label: 'EKG' },
	{ id: 'uzi', label: 'UZI (Ultratovush tekshiruvi)' },
	{ id: 'rentgen', label: 'Rentgen' },
	{ id: 'kt', label: 'KT' },
	{ id: 'mrt', label: 'MRT' },
	{ id: 'endoskopiya', label: 'Endoskopiya' },
] as const

const LABORATORY_TEST_OPTIONS = [
	{ id: 'qon_analiz', label: 'Qon analiz' },
	{ id: 'siydik_analiz', label: 'Siydik analiz' },
	{ id: 'bioximik', label: 'Bioximik analiz' },
] as const

const XRAY_GROUP_IDS = new Set(['rentgen', 'kt', 'mrt'])

export default function CaseDetailPage() {
	const params = useParams()
	const caseId = params.id as string

	const [caseData, setCaseData] = useState<BackendCase | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const [attemptId, setAttemptId] = useState<string | null>(null)
	const [started, setStarted] = useState(false)
	const [startingAttempt, setStartingAttempt] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const [selectedTests, setSelectedTests] = useState<string[]>([])
	const [diagnosis, setDiagnosis] = useState('')
	const [treatment, setTreatment] = useState('')

	const [showResult, setShowResult] = useState(false)
	const [resultScore, setResultScore] = useState(0)
	const [resultFeedback, setResultFeedback] = useState('')
	const [resultStatus, setResultStatus] = useState('')
	const [resultStrengths, setResultStrengths] = useState<string[]>([])
	const [resultWeaknesses, setResultWeaknesses] = useState<string[]>([])
	const [resultDetailedAnalysis, setResultDetailedAnalysis] = useState('')

	// Timer
	const [elapsed, setElapsed] = useState(0)
	const [timerRunning, setTimerRunning] = useState(false)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const autoStartDoneRef = useRef(false)

	useEffect(() => {
		api.cases.getById(caseId)
			.then(res => setCaseData(res.case))
			.catch(() => setError("Keis topilmadi yoki serverda xatolik"))
			.finally(() => setLoading(false))
	}, [caseId])

	useEffect(() => {
		if (!timerRunning) return
		timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [timerRunning])

	const displayMinutes = Math.floor(elapsed / 60)
	const displaySeconds = elapsed % 60

	const handleStart = useCallback(async () => {
		if (!caseData || started || attemptId || startingAttempt) return
		setStartingAttempt(true)
		try {
			const res = await api.attempts.start(caseData._id)
			setAttemptId(res.attempt._id)
			setStarted(true)
			setTimerRunning(true)
		} catch {
			setError("Boshlashda xatolik yuz berdi")
		} finally {
			setStartingAttempt(false)
		}
	}, [attemptId, caseData, started, startingAttempt])

	useEffect(() => {
		if (!caseData || started || attemptId || autoStartDoneRef.current) return
		autoStartDoneRef.current = true
		void handleStart()
	}, [caseData, started, attemptId, handleStart])

	const handleSubmit = async () => {
		if (!attemptId) return
		setTimerRunning(false)
		setSubmitting(true)
		try {
			const res = await api.attempts.submit(attemptId, {
				diagnosis,
				treatment,
				selectedTests,
				timeSpent: elapsed,
			})
			const score = res.result?.score ?? 0
			setResultScore(score)
			setResultFeedback(res.result?.feedback ?? '')
			setResultStatus(
				score >= 80 ? "A'lo natija ✓" : score >= 50 ? "Qisman To'g'ri ✓" : "Yaxshilash kerak"
			)
			setResultStrengths(res.result?.strengths ?? [])
			setResultWeaknesses(res.result?.weaknesses ?? [])
			setResultDetailedAnalysis(res.result?.detailedAnalysis ?? '')
			setShowResult(true)
		} catch {
			setError("Yuborishda xatolik yuz berdi")
			setTimerRunning(true)
		} finally {
			setSubmitting(false)
		}
	}

	const toggleTest = (testId: string) => {
		setSelectedTests(prev =>
			prev.includes(testId)
				? prev.filter(t => t !== testId)
				: [...prev, testId],
		)
	}

	const steps = [
		{ id: 1, label: "Ko'rik", done: started },
		{ id: 2, label: 'Tahlil', done: selectedTests.length > 0 },
		{ id: 3, label: 'Tashxis', done: diagnosis.trim().length > 0 },
		{ id: 4, label: 'Davolash', done: treatment.trim().length > 0 },
	]

	const mediaItems = caseData?.mediaItems ?? []
	const labResults = caseData?.labResults ?? []

	// Group media by type for conditional reveal
	const xrayMedia = mediaItems.filter(m => m.type === 'xray')
	const ekgMedia = mediaItems.filter(m => m.type === 'ekg')
	const echoMedia = mediaItems.filter(m => m.type === 'echo')
	const otherMedia = mediaItems.filter(m => m.type === 'image' || m.type === 'video')

	// Lab sections
	const bloodTestData = caseData?.bloodTest ?? []
	const biochemTestData = caseData?.biochemTest ?? []
	const urineTestData = caseData?.urineTest ?? []

	const fallbackInstrumentalTests = [
		...(ekgMedia.length > 0 ? ['ekg'] : []),
		...(echoMedia.length > 0 ? ['uzi'] : []),
		...(xrayMedia.length > 0 ? ['rentgen'] : []),
		...(otherMedia.length > 0 ? ['endoskopiya'] : []),
	]

	const availableInstrumentalTests = (caseData?.instrumentalTests && caseData.instrumentalTests.length > 0
		? caseData.instrumentalTests
		: fallbackInstrumentalTests
	).filter((v, i, arr) => arr.indexOf(v) === i)

	const fallbackLaboratoryTests = [
		...(bloodTestData.length > 0 ? ['qon_analiz'] : []),
		...(urineTestData.length > 0 ? ['siydik_analiz'] : []),
		...(biochemTestData.length > 0 ? ['bioximik'] : []),
		...(labResults.length > 0 ? ['qon_analiz'] : []),
	]

	const availableLaboratoryTests = (caseData?.laboratoryTests && caseData.laboratoryTests.length > 0
		? caseData.laboratoryTests
		: fallbackLaboratoryTests
	).filter((v, i, arr) => arr.indexOf(v) === i)

	const showXrayResults = selectedTests.some(testId => XRAY_GROUP_IDS.has(testId))
	const showUziResults = selectedTests.includes('uzi')
	const showQonAnaliz = selectedTests.includes('qon_analiz')
	const showSiydikAnaliz = selectedTests.includes('siydik_analiz')
	const showBioximik = selectedTests.includes('bioximik')
	const showEndoscopy = selectedTests.includes('endoskopiya')

	if (loading) {
		return (
			<div className='min-h-screen bg-secondary flex items-center justify-center'>
				<Sidebar />
				<p className='text-text-secondary'>Yuklanmoqda...</p>
			</div>
		)
	}

	if (error || !caseData) {
		return (
			<div className='min-h-screen bg-secondary'>
				<Sidebar />
				<main className='lg:pl-64 pt-16 lg:pt-0 flex items-center justify-center min-h-screen'>
					<div className='text-center'>
						<p className='text-accent mb-4'>{error || "Keis topilmadi"}</p>
						<Link href='/cases'><Button variant='ghost'>Orqaga</Button></Link>
					</div>
				</main>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 pb-6'>
				<div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'>
					{/* Header */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='flex items-center gap-4 mb-6'
					>
						<Link href='/cases'>
							<Button variant='ghost' size='sm'>
								<ArrowLeft className='w-4 h-4' /> Orqaga
							</Button>
						</Link>
						<div>
							<div className='flex items-center gap-2 mb-1'>
								<Badge>{caseData.category}</Badge>
								<Badge
									variant={
										caseData.type === 'shoshilinch'
											? 'danger'
											: caseData.type === 'jarrohlik'
												? 'warning'
												: 'default'
									}
								>
									{caseData.type === 'diagnostika'
										? 'Diagnostika'
										: caseData.type === 'jarrohlik'
											? 'Jarrohlik'
											: 'Shoshilinch'}
								</Badge>
								{caseData.isPremium && <Badge variant='warning'>PRO</Badge>}
							</div>
							<h1 className='text-xl sm:text-2xl font-bold text-text-primary'>
								{caseData.title}
							</h1>
							<p className='text-xs text-text-secondary mt-1'>
								Muallif: <span className='text-text-primary font-medium'>{caseData.authorName || 'Noma\'lum'}</span>
							</p>
						</div>
					</motion.div>

					{/* Patient Simulator */}
					<motion.div
						initial='hidden'
						animate='visible'
						variants={fadeIn}
						className='mb-6'
					>
						<PatientSimulator
							patientName={caseData.patient.name}
							age={caseData.patient.age}
							gender={caseData.patient.gender}
							complaints={caseData.patient.complaints}
							history={caseData.patient.history}
						/>
					</motion.div>

					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
						{/* Left Column - Patient Profile */}
						<motion.div
							initial='hidden'
							animate='visible'
							variants={fadeIn}
							className='space-y-6'
						>
							{/* Patient Info */}
							<Card hover={false}>
								<div className='flex items-center gap-4 mb-6'>
									{/* <div className='w-16 h-16 rounded-2xl overflow-hidden shrink-0'>
										<video
											src='/patientgif.mp4'
											autoPlay
											loop
											muted
											playsInline
											className='w-full h-full object-cover'
										/>
									</div> */}
									<div>
										<h2 className='text-lg font-bold text-text-primary'>
											{caseData.patient.name}, {caseData.patient.age} yosh
										</h2>
										<p className='text-sm text-text-secondary'>
											{caseData.patient.gender} •{' '}
											{caseData.patient.ageGroup}
										</p>
									</div>
								</div>

								<VitalSigns {...caseData.patient.vitals} />
							</Card>

							{/* Complaints & History */}
							<Card hover={false}>
								<div className='space-y-4'>
									<div>
										<h3 className='text-sm font-semibold text-text-primary mb-2'>
											Shikoyatlar
										</h3>
										<p className='text-sm text-text-secondary bg-surface-light rounded-xl p-3'>
											{caseData.patient.complaints}
										</p>
									</div>
									<div>
										<h3 className='text-sm font-semibold text-text-primary mb-2'>
											Anamnez
										</h3>
										<p className='text-sm text-text-secondary bg-surface-light rounded-xl p-3'>
											{caseData.patient.history}
										</p>
									</div>
								</div>
							</Card>

							{/* Endoskopiya media */}
							{showEndoscopy && otherMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>Endoskopiya natijalari</h3>
									<MediaViewer mediaItems={otherMedia} />
								</Card>
							)}

							{/* KT / Rentgen */}
							{showXrayResults && xrayMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>Rentgen / KT / MRT natijalari</h3>
									<MediaViewer mediaItems={xrayMedia} />
								</Card>
							)}

							{/* EKG */}
							{selectedTests.includes('ekg') && ekgMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>EKG natijalari</h3>
									<MediaViewer mediaItems={ekgMedia} />
								</Card>
							)}

							{/* EXO */}
							{showUziResults && echoMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>UZI natijalari</h3>
									<MediaViewer mediaItems={echoMedia} />
								</Card>
							)}

							{/* Qon tahlili */}
							{showQonAnaliz && bloodTestData.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Qon analiz</h3>
									</div>
									<LabResults results={bloodTestData} />
								</Card>
							)}

							{/* Bioximik tahlil */}
							{showBioximik && biochemTestData.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Bioximik analiz</h3>
									</div>
									<LabResults results={biochemTestData} />
								</Card>
							)}

							{/* Siydik tahlili */}
							{showSiydikAnaliz && urineTestData.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Siydik analiz</h3>
									</div>
									<LabResults results={urineTestData} />
								</Card>
							)}

							{/* Legacy flat labResults (backward compat - only if no new sections exist) */}
							{labResults.length > 0 && bloodTestData.length === 0 && biochemTestData.length === 0 && urineTestData.length === 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Laboratoriya tahlillari</h3>
									</div>
									<LabResults results={labResults} />
								</Card>
							)}
						</motion.div>

						{/* Right Column - Doctor Panel */}
						<motion.div
							initial='hidden'
							animate='visible'
							variants={fadeIn}
							className='space-y-6'
						>
							{/* Timer & Progress */}
							<Card hover={false}>
								<div className='flex items-center justify-between mb-6'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center'>
											<Clock className='w-5 h-5 text-accent' />
										</div>
										<div>
											<p className='text-2xl font-bold text-text-primary font-mono'>
												{String(displayMinutes).padStart(2, '0')}:
												{String(displaySeconds).padStart(2, '0')}
											</p>
											<p className='text-xs text-text-secondary'>{started ? 'O\'tgan vaqt' : 'Taymer'}</p>
										</div>
									</div>
								</div>

								{/* Steps Progress */}
								<div className='grid grid-cols-2 gap-2 sm:hidden'>
									{steps.map(step => (
										<div
											key={step.id}
											className={`flex items-center gap-2 rounded-xl px-2.5 py-2 border ${
												step.done
													? 'border-success/30 bg-success/10'
													: 'border-border bg-surface-light'
											}`}
										>
											{step.done ? (
												<CheckCircle className='w-4 h-4 text-success shrink-0' />
											) : (
												<Circle className='w-4 h-4 text-text-secondary/30 shrink-0' />
											)}
											<span className={`text-xs font-medium truncate ${step.done ? 'text-success' : 'text-text-secondary'}`}>
												{step.label}
											</span>
										</div>
									))}
								</div>

								<div className='hidden sm:flex items-center gap-2'>
									{steps.map((step, i) => (
										<div
											key={step.id}
											className='flex items-center gap-2 flex-1'
										>
											<div className='flex items-center gap-1.5'>
												{step.done ? (
													<CheckCircle className='w-5 h-5 text-success shrink-0' />
												) : (
													<Circle className='w-5 h-5 text-text-secondary/30 shrink-0' />
												)}
												<span
													className={`text-xs font-medium whitespace-nowrap ${
														step.done ? 'text-success' : 'text-text-secondary'
													}`}
												>
													{step.label}
												</span>
											</div>
											{i < steps.length - 1 && (
												<div
													className={`h-px flex-1 ${
														step.done ? 'bg-success' : 'bg-border'
													}`}
												/>
											)}
										</div>
									))}
								</div>
							</Card>

							{/* Instrumental & Laboratory Menus */}
							<Card hover={false}>
								<h3 className='text-sm font-semibold text-text-primary mb-4'>Tekshiruv menyulari</h3>
								<div className='space-y-3'>
									<details className='bg-surface-light border border-border rounded-xl p-3'>
										<summary className='cursor-pointer text-sm font-semibold text-text-primary'>Instrumental tekshiruvlar</summary>
										<div className='mt-2 space-y-2'>
											{INSTRUMENTAL_TEST_OPTIONS.filter(test => availableInstrumentalTests.includes(test.id)).map(test => (
												<label key={test.id} className='flex items-center gap-3 p-2 rounded-lg hover:bg-surface cursor-pointer transition-colors'>
													<input
														type='checkbox'
														checked={selectedTests.includes(test.id)}
														onChange={() => toggleTest(test.id)}
														className='w-4 h-4 rounded border-border bg-surface accent-primary'
													/>
													<span className='text-sm text-text-secondary'>{test.label}</span>
												</label>
											))}
											{availableInstrumentalTests.length === 0 && (
												<p className='text-xs text-text-secondary/60'>Bu klinik holat uchun instrumental ma&apos;lumot biriktirilmagan.</p>
											)}
										</div>
									</details>

									<details className='bg-surface-light border border-border rounded-xl p-3'>
										<summary className='cursor-pointer text-sm font-semibold text-text-primary'>Laborator tekshiruvlar</summary>
										<div className='mt-2 space-y-2'>
											{LABORATORY_TEST_OPTIONS.filter(test => availableLaboratoryTests.includes(test.id)).map(test => (
												<label key={test.id} className='flex items-center gap-3 p-2 rounded-lg hover:bg-surface cursor-pointer transition-colors'>
													<input
														type='checkbox'
														checked={selectedTests.includes(test.id)}
														onChange={() => toggleTest(test.id)}
														className='w-4 h-4 rounded border-border bg-surface accent-primary'
													/>
													<span className='text-sm text-text-secondary'>{test.label}</span>
												</label>
											))}
											{availableLaboratoryTests.length === 0 && (
												<p className='text-xs text-text-secondary/60'>Bu klinik holat uchun laborator ma&apos;lumot biriktirilmagan.</p>
											)}
										</div>
									</details>
								</div>
							</Card>

							{/* Diagnosis */}
							<Card hover={false}>
								<h3 className='text-sm font-semibold text-text-primary mb-3'>
									Tashxis
								</h3>
								<textarea
									value={diagnosis}
									onChange={e => setDiagnosis(e.target.value)}
									placeholder='Tashxisingizni yozing...'
									rows={3}
									className='w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all'
								/>
							</Card>

							{/* Treatment Plan */}
							<Card hover={false}>
								<h3 className='text-sm font-semibold text-text-primary mb-3'>
									Davolash rejasi
								</h3>
								<textarea
									value={treatment}
									onChange={e => setTreatment(e.target.value)}
									placeholder='Davolash rejangizni yozing...'
									rows={3}
									className='w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all'
								/>
							</Card>

							{/* Start / Submit Button */}
							{!started ? (
								<Button size='lg' className='w-full' onClick={handleStart}>
									Boshlash →
								</Button>
							) : (
								<Button
									size='lg'
									className='w-full'
									onClick={handleSubmit}
									disabled={submitting || startingAttempt || !attemptId || !diagnosis.trim() || !treatment.trim()}
								>
									{submitting ? 'Baholanmoqda...' : 'AI Baholash →'}
								</Button>
							)}
						</motion.div>
					</div>
				</div>
			</main>

			<AIResultModal
				isOpen={showResult}
				onClose={() => setShowResult(false)}
				score={resultScore}
				status={resultStatus}
				feedback={resultFeedback}
				correctDiagnosis={caseData?.correctDiagnosis}
				correctTreatment={caseData?.correctTreatment}
				userDiagnosis={diagnosis}
				userTreatment={treatment}
				strengths={resultStrengths}
				weaknesses={resultWeaknesses}
				detailedAnalysis={resultDetailedAnalysis}
			/>
		</div>
	)
}
