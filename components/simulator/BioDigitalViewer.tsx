'use client'

import { AlertTriangle, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface BioDigitalViewerProps {
	src: string
	onLoad?: () => void
	onError?: () => void
	className?: string
}

function ViewerSkeleton() {
	return (
		<div className='absolute inset-0 flex flex-col items-center justify-center bg-surface z-10'>
			<div className='w-full h-full absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0 opacity-20'
					style={{
						background: 'linear-gradient(105deg, transparent 40%, rgba(0,201,167,0.2) 50%, transparent 60%)',
						backgroundSize: '200% 100%',
						animation: 'shimmer 2s linear infinite',
					}}
				/>
			</div>
			<div className='relative z-10 flex flex-col items-center gap-6'>
				<div className='relative'>
					<svg width='100' height='170' viewBox='0 0 120 200' className='opacity-15 fill-primary'>
						<ellipse cx='60' cy='25' rx='20' ry='22' />
						<rect x='35' y='50' width='50' height='70' rx='10' />
						<rect x='10' y='52' width='22' height='55' rx='8' />
						<rect x='88' y='52' width='22' height='55' rx='8' />
						<rect x='35' y='118' width='22' height='65' rx='8' />
						<rect x='63' y='118' width='22' height='65' rx='8' />
					</svg>
					<div className='absolute inset-0 flex items-center justify-center'>
						<div className='w-14 h-14 rounded-full border-2 border-primary/20 animate-ping' />
					</div>
				</div>
				<div className='flex items-center gap-2 text-primary'>
					<Loader2 className='w-4 h-4 animate-spin' />
					<span className='text-sm text-text-secondary'>3D model yuklanmoqda...</span>
				</div>
			</div>
		</div>
	)
}

function ViewerError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className='absolute inset-0 flex flex-col items-center justify-center bg-surface z-10 p-8'>
			<div className='max-w-sm w-full text-center'>
				<div className='w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4'>
					<AlertTriangle className='w-7 h-7 text-accent' />
				</div>
				<h3 className='text-base font-semibold text-text-primary mb-2'>Yuklab bo&apos;lmadi</h3>
				<p className='text-sm text-text-secondary mb-2'>
					BioDigital API faqat{' '}
					<code className='text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs'>127.0.0.1</code>{' '}
					domeni uchun ruxsat berilgan.
				</p>
				<p className='text-xs text-text-secondary mb-5'>
					Brauzerda{' '}
					<strong className='text-text-primary'>http://127.0.0.1:3000/simulator</strong>{' '}
					orqali oching.
				</p>
				<button onClick={onRetry}
					className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors'>
					<RefreshCw className='w-4 h-4' />
					Qayta urinish
				</button>
			</div>
		</div>
	)
}

export default function BioDigitalViewer({ src, onLoad, onError, className = '' }: BioDigitalViewerProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
	const [errorSrc, setErrorSrc] = useState<string | null>(null)
	const [retryKey, setRetryKey] = useState(0)

	const isError = errorSrc === src
	const isLoading = !isError && loadedSrc !== src

	const handleLoad = useCallback(() => {
		setLoadedSrc(src)
		setErrorSrc(null)
		onLoad?.()
	}, [onLoad, src])

	const handleError = useCallback(() => {
		setLoadedSrc(null)
		setErrorSrc(src)
		onError?.()
	}, [onError, src])

	const handleRetry = useCallback(() => {
		setLoadedSrc(null)
		setErrorSrc(null)
		setRetryKey(k => k + 1)
	}, [])

	return (
		<div className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`}>
			{isLoading && <ViewerSkeleton />}
			{isError && <ViewerError onRetry={handleRetry} />}

			<iframe
				key={`${src}-${retryKey}`}
				ref={iframeRef}
				src={src}
				onLoad={handleLoad}
				onError={handleError}
				className={`w-full h-full border-none transition-opacity duration-500 ${isLoading || isError ? 'opacity-0' : 'opacity-100'}`}
				title='BioDigital Human 3D Viewer'
				allow='fullscreen; camera; gyroscope; accelerometer'
				allowFullScreen
			/>

			{!isLoading && !isError && (
				<button
					onClick={() => {
						if (iframeRef.current?.contentWindow) {
							iframeRef.current.contentWindow.postMessage(
								JSON.stringify({ type: 'human.camera.reset' }),
								'https://human.biodigital.com'
							)
						}
					}}
					className='absolute bottom-4 right-4 p-2.5 rounded-xl bg-surface/80 backdrop-blur-sm border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all z-20'
					title='Kamerani qaytarish'
				>
					<RotateCcw className='w-4 h-4' />
				</button>
			)}

			<style>{`
				@keyframes shimmer {
					0%   { background-position: -200% center; }
					100% { background-position:  200% center; }
				}
			`}</style>
		</div>
	)
}
