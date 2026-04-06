'use client'

import Sidebar from '@/components/layout/Sidebar';
import BioDigitalViewer from '@/components/simulator/BioDigitalViewer';
import ControlsPanel, { BIODIGITAL_MODELS } from '@/components/simulator/ControlsPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ChevronLeft, ChevronRight, Info, Maximize2 } from 'lucide-react';
import { useCallback, useState } from 'react';

const DEFAULT_SRC = BIODIGITAL_MODELS.find(m => m.key === 'male_full')!.src

export default function SimulatorPage() {
	const [selectedSrc, setSelectedSrc] = useState(DEFAULT_SRC)
	const [panelOpen, setPanelOpen] = useState(true)
	const [infoOpen, setInfoOpen] = useState(false)

	const currentModel = BIODIGITAL_MODELS.find(m => m.src === selectedSrc)

	const handleSrcChange = useCallback((src: string) => {
		setSelectedSrc(src)
		setInfoOpen(false)
	}, [])

	const handleFullscreen = useCallback(() => {
		const el = document.getElementById('viewer-container')
		if (!el) return
		if (!document.fullscreenElement) {
			el.requestFullscreen().catch(() => {})
		} else {
			document.exitFullscreen().catch(() => {})
		}
	}, [])

	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 flex flex-col h-dvh'>

				{/* Top bar */}
				<div className='shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 lg:h-16 border-b border-border bg-surface/50 backdrop-blur-sm'>
					<div className='flex items-center gap-3'>
						<div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
							<Activity className='w-4 h-4 text-primary' />
						</div>
						<div>
							<h1 className='text-sm font-bold text-text-primary leading-tight'>3D Simulator</h1>
							<p className='text-xs text-text-secondary hidden sm:block'>BioDigital Human Viewer</p>
						</div>
					</div>

					<div className='flex items-center gap-1'>
						<button onClick={() => setInfoOpen(!infoOpen)}
							className={`p-2 rounded-xl transition-all duration-200 ${infoOpen ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'}`}
							title="Ma'lumot">
							<Info className='w-4 h-4' />
						</button>
						<button onClick={handleFullscreen}
							className='p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all'
							title="To'liq ekran">
							<Maximize2 className='w-4 h-4' />
						</button>
						<button onClick={() => setPanelOpen(!panelOpen)}
							className='hidden lg:flex p-2 rounded-xl text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all'
							title={panelOpen ? 'Panelni yopish' : 'Panelni ochish'}>
							{panelOpen ? <ChevronLeft className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
						</button>
					</div>
				</div>

				{/* Info bar */}
				<AnimatePresence>
					{infoOpen && currentModel && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className='overflow-hidden border-b border-border bg-primary/5'
						>
							<div className='px-4 sm:px-6 py-3 flex items-center gap-3'>
								<div className='w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0'>
									{currentModel.icon}
								</div>
								<div>
									<p className='text-xs font-bold text-primary uppercase tracking-wider'>{currentModel.label}</p>
									<p className='text-xs text-text-secondary capitalize'>{currentModel.category}</p>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Main content */}
				<div className='flex flex-1 overflow-hidden'>

					{/* Controls Panel */}
					<AnimatePresence initial={false}>
						{panelOpen && (
							<motion.div
								key='panel'
								initial={{ width: 0, opacity: 0 }}
								animate={{ width: 296, opacity: 1 }}
								exit={{ width: 0, opacity: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
								className='hidden lg:flex shrink-0 flex-col border-r border-border bg-surface overflow-hidden'
							>
								<div className='p-4 overflow-y-auto h-full'>
									<ControlsPanel
										selectedSrc={selectedSrc}
										onSrcChange={handleSrcChange}
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* 3D Viewer */}
					<div id='viewer-container' className='flex-1 relative bg-secondary overflow-hidden'>
						<BioDigitalViewer
							src={selectedSrc}
							className='w-full h-full'
						/>

						{/* Active model badge */}
						{currentModel && (
							<div className='absolute top-4 left-4 z-20 pointer-events-none'>
								<div className='px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-border text-xs font-medium text-text-primary'>
									{currentModel.label}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Mobile bottom panel */}
				<div className='lg:hidden shrink-0 border-t border-border bg-surface'>
					<div className='p-3 max-h-60 overflow-y-auto'>
						<ControlsPanel
							selectedSrc={selectedSrc}
							onSrcChange={handleSrcChange}
						/>
					</div>
				</div>
			</main>
		</div>
	)
}
