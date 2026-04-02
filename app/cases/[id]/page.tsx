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
import { useEffect, useRef, useState } from 'react';

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const additionalTests = [
	{ id: 'ekg', label: 'EKG' },
	{ id: 'ct', label: 'KT / Kompyuter Tomografiya' },
	{ id: 'blood', label: 'Qon tahlili (umumiy)' },
	{ id: 'biochem', label: 'Bioximik tahlil' },
	{ id: 'urine', label: 'Siydik tahlili' },
	{ id: 'echo', label: 'EXO-KG' },
]

export default function CaseDetailPage() {
	const params = useParams()
	const caseId = params.id as string

	const [caseData, setCaseData] = useState<BackendCase | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const [attemptId, setAttemptId] = useState<string | null>(null)
	const [started, setStarted] = useState(false)
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
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		api.cases.getById(caseId)
			.then(res => setCaseData(res.case))
			.catch(() => setError("Keis topilmadi yoki serverda xatolik"))
			.finally(() => setLoading(false))
	}, [caseId])

	useEffect(() => {
		if (started) {
			timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
		}
		return () => { if (timerRef.current) clearInterval(timerRef.current) }
	}, [started])

	const displayMinutes = Math.floor(elapsed / 60)
	const displaySeconds = elapsed % 60

	const handleStart = async () => {
		if (!caseData) return
		try {
			const res = await api.attempts.start(caseData._id)
			setAttemptId(res.attempt._id)
			setStarted(true)
		} catch {
			setError("Boshlashda xatolik yuz berdi")
		}
	}

	const handleSubmit = async () => {
		if (!attemptId) return
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
			if (timerRef.current) clearInterval(timerRef.current)
		} catch {
			setError("Yuborishda xatolik yuz berdi")
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

							{/* Medical Media - always show non-diagnostic media */}
							{otherMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>Tibbiy rasmlar</h3>
									<MediaViewer mediaItems={otherMedia} />
								</Card>
							)}

							{/* KT / Rentgen */}
							{selectedTests.includes('ct') && xrayMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>KT / Rentgen natijalari</h3>
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
							{selectedTests.includes('echo') && echoMedia.length > 0 && (
								<Card hover={false}>
									<h3 className='text-sm font-semibold text-text-primary mb-4'>EXO natijalari</h3>
									<MediaViewer mediaItems={echoMedia} />
								</Card>
							)}

							{/* Qon tahlili */}
							{selectedTests.includes('blood') && bloodTestData.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Qon tahlili (umumiy)</h3>
									</div>
									<LabResults results={bloodTestData} />
								</Card>
							)}

							{/* Bioximik tahlil */}
							{selectedTests.includes('biochem') && biochemTestData.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Bioximik tahlil</h3>
									</div>
									<LabResults results={biochemTestData} />
								</Card>
							)}

							{/* Siydik tahlili */}
							{selectedTests.includes('urine') && urineTestData.length > 0 && (
								<Card hover={false}>
									<div className='flex items-center gap-2 mb-4'>
										<TestTube className='w-4 h-4 text-primary' />
										<h3 className='text-sm font-semibold text-text-primary'>Siydik tahlili</h3>
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
								<div className='flex items-center gap-2'>
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

							{/* Additional Tests */}
							<Card hover={false}>
								<h3 className='text-sm font-semibold text-text-primary mb-4'>
									Qo&apos;shimcha tekshiruvlar
								</h3>
								<div className='space-y-2'>
									{additionalTests.map(test => (
										<label
											key={test.id}
											className='flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light cursor-pointer transition-colors'
										>
											<input
												type='checkbox'
												checked={selectedTests.includes(test.id)}
												onChange={() => toggleTest(test.id)}
												className='w-4 h-4 rounded border-border bg-surface accent-primary'
											/>
											<span className='text-sm text-text-secondary'>
												{test.label}
											</span>
										</label>
									))}
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
									disabled={submitting || !diagnosis.trim() || !treatment.trim()}
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
