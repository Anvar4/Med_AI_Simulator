'use client'

import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pause, Play, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

	const [displayedText, setDisplayedText] = useState('')
	const [isTypingDone, setIsTypingDone] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const charIndexRef = useRef(0)

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

	const handleSpeak = useCallback(async () => {
		// If currently playing, stop
		if (isSpeaking && audioRef.current) {
			audioRef.current.pause()
			audioRef.current.currentTime = 0
			setIsSpeaking(false)
			return
		}

		setIsLoading(true)
		try {
			const model = gender === 'Ayol' ? 'gulnoza' : 'jaxongir'
			const res = await api.tts.speak(fullText, model)

			if (res.audioUrl) {
				const audio = new Audio(res.audioUrl)
				audioRef.current = audio

				audio.onended = () => {
					setIsSpeaking(false)
					audioRef.current = null
				}
				audio.onerror = () => {
					setIsSpeaking(false)
					audioRef.current = null
				}

				await audio.play()
				setIsSpeaking(true)
			}
		} catch (err) {
			console.error('TTS error:', err)
		} finally {
			setIsLoading(false)
		}
	}, [isSpeaking, fullText, gender])

	// Cleanup audio on unmount
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current = null
			}
		}
	}, [])

	const barHeights = useMemo(() => [12, 18, 10, 16, 14], [])

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

						<p className='text-sm text-white/60 mb-1 font-medium'>
							{patientName}, {age} yosh
						</p>

						<p className='text-white text-sm sm:text-base leading-relaxed min-h-15'>
							{displayedText}
							{!isTypingDone && (
								<span className='inline-block w-0.5 h-4 bg-white/70 ml-0.5 animate-pulse align-middle' />
							)}
						</p>

						{/* Audio Button */}
						<AnimatePresence>
							{isTypingDone && (
								<motion.button
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.3 }}
									onClick={handleSpeak}
									disabled={isLoading}
									className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
										isSpeaking
											? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30'
											: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
									}`}
								>
									{isLoading ? (
										<>
											<Loader2 className='w-4 h-4 animate-spin' />
											Tayyorlanmoqda...
										</>
									) : isSpeaking ? (
										<>
											<Pause className='w-4 h-4' />
											To&apos;xtatish
										</>
									) : (
										<>
											<Play className='w-4 h-4' />
											Ovozli tinglash
										</>
									)}
								</motion.button>
							)}
						</AnimatePresence>
					</div>

					{/* Speech indicator */}
					{isSpeaking && (
						<div className='flex items-center gap-2 mt-3 ml-2'>
							<Volume2 className='w-4 h-4 text-emerald-400 animate-pulse' />
							<div className='flex items-center gap-0.5'>
								{barHeights.map((h, i) => (
									<div
										key={i}
										className='w-1 bg-emerald-400/70 rounded-full animate-bounce'
										style={{
											height: `${h}px`,
											animationDelay: `${i * 0.1}s`,
											animationDuration: '0.6s',
										}}
									/>
								))}
							</div>
							<span className='text-xs text-emerald-400/70'>
								Gapirmoqda...
							</span>
						</div>
					)}

				</div>
			</div>
		</motion.div>
	)
}
