'use client'

import Badge from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import { Lock, Star } from 'lucide-react'
import Link from 'next/link'

interface CaseCardProps {
	id: string
	title: string
	category: string
	difficulty: number
	type: 'diagnostika' | 'jarrohlik' | 'shoshilinch'
	isPremium: boolean
	completionRate: number
}

const typeLabels = {
	diagnostika: 'Diagnostika',
	jarrohlik: 'Jarrohlik',
	shoshilinch: 'Shoshilinch',
}

const typeVariants = {
	diagnostika: 'default' as const,
	jarrohlik: 'warning' as const,
	shoshilinch: 'danger' as const,
}

export default function CaseCard({
	id,
	title,
	category,
	difficulty,
	type,
	isPremium,
}: CaseCardProps) {
	return (
		<motion.div
			whileHover={{ scale: 1.02, y: -2 }}
			transition={{ duration: 0.2 }}
		>
			<Link href={`/cases/${id}`}>
				<div className='bg-surface rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full'>
					<div className='flex items-start justify-between mb-3'>
						<Badge>{category}</Badge>
						<div className='flex items-center gap-1.5'>
							<Badge variant={typeVariants[type]}>{typeLabels[type]}</Badge>
							{isPremium && (
								<Badge variant='premium'>
									<Lock className='w-3 h-3 mr-1' />
									PRO
								</Badge>
							)}
						</div>
					</div>

					<h3 className='text-base font-semibold text-text-primary mb-3 leading-snug'>
						{title}
					</h3>

					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-0.5'>
							{Array.from({ length: 5 }).map((_, i) => (
								<Star
									key={i}
									className={`w-4 h-4 ${
										i < difficulty
											? 'text-warning fill-warning'
											: 'text-surface-light'
									}`}
								/>
							))}
							<span className='text-xs text-text-secondary ml-2'>
								Level {difficulty}
							</span>
						</div>
						<span className='text-sm text-primary font-medium'>Boshlash →</span>
					</div>
				</div>
			</Link>
		</motion.div>
	)
}
