'use client'

import { useT } from '@/lib/language-context';
import { useTTS } from '@/lib/use-tts';
import { motion } from 'framer-motion';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface PatientSimulatorProps {
	patientName: string
	age: number
	gender: string
	complaints: string
	history: string
	imageUrl?: string
}

export default function PatientSimulator({
	patientName,
	age,
	gender,
	complaints,
	history,
	imageUrl,
}: PatientSimulatorProps) {
	const fullText = `Assalomu alaykum, doktor. Mening ismim ${patientName}, yoshim ${age}da${gender === 'Ayol' ? 'man' : 'man'}. ${complaints}. ${history}.`

	const { locale } = useT()
	const patientTts = useTTS(locale as 'uz' | 'ru' | 'en')
	const patientGender = gender === 'Ayol' ? 'female' : 'male'

	const [displayedText, setDisplayedText] = useState('')
	const [isTypingDone, setIsTypingDone] = useState(false)
	const charIndexRef = useRef(0)
	const spokenRef = useRef(false)

	// Typing effect
	useEffect(() => {
		charIndexRef.current = 0

		const interval = setInterval(() => {
			if (charIndexRef.current < fullText.length) {
				charIndexRef.current++
				setDisplayedText(fullText.slice(0, charIndexRef.current))
			} else {
				setIsTypingDone(true)
				clearInterval(interval)
			}
		}, 35)

		return () => clearInterval(interval)
	}, [fullText])

	// Auto-read the patient's words as soon as the card mounts (gender-matched
	// voice), in parallel with the typing animation — no waiting for typing to
	// finish, so the voice starts right away.
	useEffect(() => {
		spokenRef.current = false
		if (!spokenRef.current) {
			spokenRef.current = true
			patientTts.speak(fullText, patientGender)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fullText, patientGender])

	const toggleSpeak = () => {
		if (patientTts.speaking || patientTts.loading) patientTts.stop()
		else patientTts.speak(fullText, patientGender)
	}

	const defaultAvatar = gender === 'Ayol' ? '/female.png' : '/male.png'

	// Chest clutching animation - subtle squeezing motion
	const chestPressAnim = {
		scale: [1, 1.015, 1, 1.01, 1],
		transition: {
			duration: 2.5,
			repeat: Infinity,
			ease: 'easeInOut' as const,
		},
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5 }}
			className='relative rounded-2xl overflow-hidden bg-linear-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-6'
		>
			<div className='flex flex-col sm:flex-row items-center gap-6'>
				{/* Patient Avatar with chest-clutching animation */}
				<div className='relative shrink-0'>
					<motion.div
						animate={chestPressAnim}
						className='w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-4 border-white/15 shadow-2xl relative'
					>
						<Image
							src={imageUrl || defaultAvatar}
							alt={patientName}
							width={220}
							height={280}
							className='w-full h-full object-cover object-center'
							unoptimized
						/>
						{/* Pain pulse overlay on chest area */}
						<motion.div
							animate={{
								opacity: [0, 0.25, 0],
								scale: [0.8, 1.3, 0.8],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: 'easeInOut',
							}}
							className='absolute bottom-[28%] left-[40%] w-14 h-14 rounded-full bg-red-500/30 blur-md'
						/>
						<motion.div
							animate={{
								opacity: [0, 0.4, 0],
								scale: [0.9, 1.1, 0.9],
							}}
							transition={{
								duration: 1.5,
								repeat: Infinity,
								ease: 'easeInOut',
								delay: 0.3,
							}}
							className='absolute bottom-[30%] left-[42%] w-8 h-8 rounded-full bg-red-400/40 blur-sm'
						/>
						{/* Gradient overlay for drama */}
						<div className='absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent' />
					</motion.div>
					{/* Pulse animation while typing */}
					{!isTypingDone && (
						<span className='absolute bottom-2 right-2 flex h-4 w-4'>
							<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
							<span className='relative inline-flex rounded-full h-4 w-4 bg-emerald-500' />
						</span>
					)}
					{/* Pain indicator badge */}
					<motion.div
						animate={{ scale: [1, 1.15, 1] }}
						transition={{ duration: 1.2, repeat: Infinity }}
						className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1'
					>
						<span className='w-1.5 h-1.5 bg-white rounded-full animate-pulse' />
						Og&apos;riq
					</motion.div>
				</div>

				{/* Speech Bubble */}
				<div className='flex-1 min-w-0'>
					<div className='relative bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10'>
						{/* Triangle pointer */}
						<div className='hidden sm:block absolute left-0 top-8 -translate-x-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white/10' />

						<div className='flex items-center justify-between mb-1'>
							<p className='text-sm text-white/60 font-medium'>
								{patientName}, {age} yosh
							</p>
							<button onClick={toggleSpeak} title='Ovozli o&apos;qish'
								className='shrink-0 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors'>
								{patientTts.loading ? <Loader2 className='w-4 h-4 animate-spin' /> : patientTts.speaking ? <VolumeX className='w-4 h-4' /> : <Volume2 className='w-4 h-4' />}
							</button>
						</div>

						<p className='text-white text-sm sm:text-base leading-relaxed min-h-15'>
							{displayedText}
							{!isTypingDone && (
								<span className='inline-block w-0.5 h-4 bg-white/70 ml-0.5 animate-pulse align-middle' />
							)}
						</p>

					</div>

				</div>
			</div>
		</motion.div>
	)
}
