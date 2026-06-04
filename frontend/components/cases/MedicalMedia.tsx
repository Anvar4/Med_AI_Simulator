/* eslint-disable @next/next/no-img-element */
'use client'

import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import { useState } from 'react';

/* ─── Types ─── */
export interface LabResult {
	name: string
	value: string
	unit: string
	range: string
	status: 'normal' | 'high' | 'low' | 'critical'
}

export interface MediaItemData {
	type: 'xray' | 'ekg' | 'echo' | 'image' | 'video'
	fileData: string
	comment: string
	fileName?: string
}

const MEDIA_LABELS: Record<string, string> = { xray: 'RENTGEN', ekg: 'EKG', echo: 'EXO', image: 'RASM', video: 'VIDEO' }
const MEDIA_ALT: Record<string, string> = { xray: 'Rentgen rasmi', ekg: 'EKG rasmi', echo: 'EXO rasmi', image: 'Rasm', video: 'Video' }

const BACKEND_ORIGIN = (() => {
	const fallback = 'http://localhost:5000'
	const configured = process.env.NEXT_PUBLIC_API_URL
	if (!configured) return fallback

	try {
		return new URL(configured).origin
	} catch {
		return fallback
	}
})()

/** Resolve media src: if it's a relative path, prepend backend URL */
function resolveMediaSrc(fileData: string): string {
	if (!fileData) return ''
	if (fileData.startsWith('data:') || fileData.startsWith('http')) return fileData
	const normalizedPath = fileData.startsWith('/') ? fileData : `/${fileData}`
	return `${BACKEND_ORIGIN}${normalizedPath}`
}

/* ─── Media Viewer ─────────────────────────────────── */
interface MediaViewerProps {
	mediaItems: MediaItemData[]
}

export function MediaViewer({ mediaItems }: MediaViewerProps) {
	const [zoomed, setZoomed] = useState<MediaItemData | null>(null)

	if (!mediaItems || mediaItems.length === 0) return null

	return (
		<>
			<div className={`grid gap-4 ${mediaItems.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
				{mediaItems.map((item, i) => (
					<div key={i} className='rounded-xl overflow-hidden bg-black border border-border'>
						<div className='relative group cursor-zoom-in' onClick={() => setZoomed(item)}>
							<img
								src={resolveMediaSrc(item.fileData)}
								alt={MEDIA_ALT[item.type] ?? item.type}
								className='w-full object-contain max-h-64'
							/>
							<div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center'>
								<ZoomIn className='w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
							</div>
							<div className='absolute top-2 left-2'>
								<span className='text-xs font-mono font-medium px-2 py-0.5 rounded bg-black/70 text-white'>
									{MEDIA_LABELS[item.type] ?? item.type.toUpperCase()}
								</span>
							</div>
						</div>
						{item.comment && (
							<div className='px-3 py-2 bg-surface-light border-t border-border'>
								<p className='text-xs text-text-secondary leading-relaxed'>{item.comment}</p>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Fullscreen zoom overlay */}
			<AnimatePresence>
				{zoomed && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
						onClick={() => setZoomed(null)}
					>
						<button
							className='absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
							onClick={e => { e.stopPropagation(); setZoomed(null) }}
						>
							<X className='w-6 h-6' />
						</button>
						<motion.div
							initial={{ scale: 0.8 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.8 }}
							className='max-w-4xl w-full'
							onClick={e => e.stopPropagation()}
						>
							<img
							src={resolveMediaSrc(zoomed.fileData)}
								alt={MEDIA_ALT[zoomed.type] ?? zoomed.type}
								className='w-full h-auto max-h-[80vh] object-contain rounded-xl'
							/>
							{zoomed.comment && (
								<p className='text-sm text-gray-300 mt-3 text-center px-4'>{zoomed.comment}</p>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}

/* ─── Lab Results Table ────────────────────────────── */
interface LabResultsProps {
	results: LabResult[]
}

export function LabResults({ results }: LabResultsProps) {
	const statusColor = (s: LabResult['status']) => {
		switch (s) {
			case 'critical': return 'text-red-400 bg-red-500/10'
			case 'high': return 'text-amber-400 bg-amber-500/10'
			case 'low': return 'text-blue-400 bg-blue-500/10'
			default: return 'text-green-400 bg-green-500/10'
		}
	}

	const statusLabel = (s: LabResult['status']) => {
		switch (s) {
			case 'critical': return 'Kritik'
			case 'high': return 'Yuqori'
			case 'low': return 'Past'
			default: return 'Normal'
		}
	}

	if (!results || results.length === 0) return null

	return (
		<div className='overflow-x-auto'>
			<table className='w-full text-sm'>
				<thead>
					<tr className='border-b border-border'>
						<th className='text-left py-2 px-2 text-text-secondary font-medium text-xs'>Ko&apos;rsatkich</th>
						<th className='text-left py-2 px-2 text-text-secondary font-medium text-xs'>Qiymat</th>
						<th className='text-left py-2 px-2 text-text-secondary font-medium text-xs'>Norma</th>
						<th className='text-left py-2 px-2 text-text-secondary font-medium text-xs'>Holat</th>
					</tr>
				</thead>
				<tbody>
					{results.map((r, i) => (
						<motion.tr
							key={i}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: i * 0.04 }}
							className='border-b border-border/50'
						>
							<td className='py-2 px-2 font-medium text-text-primary text-xs'>{r.name}</td>
							<td className='py-2 px-2 text-xs'>
								{r.value}{' '}
								<span className='text-text-secondary'>{r.unit}</span>
							</td>
							<td className='py-2 px-2 text-text-secondary text-xs'>{r.range}</td>
							<td className='py-2 px-2'>
								<span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(r.status)}`}>
									{statusLabel(r.status)}
								</span>
							</td>
						</motion.tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
