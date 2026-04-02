'use client'

import { ReactNode } from 'react'

interface StatCardProps {
	icon: ReactNode
	value: string | number
	label: string
	trend?: string
	className?: string
}

export default function StatCard({
	icon,
	value,
	label,
	trend,
	className = '',
}: StatCardProps) {
	return (
		<div
			className={`bg-surface rounded-2xl border border-border p-5 hover:border-primary/30 transition-all duration-300 ${className}`}
		>
			<div className='flex items-start justify-between mb-3'>
				<div className='p-2.5 bg-primary/10 rounded-xl text-primary'>
					{icon}
				</div>
				{trend && (
					<span className='text-xs text-success font-medium bg-success/10 px-2 py-1 rounded-full'>
						{trend}
					</span>
				)}
			</div>
			<p className='text-2xl font-bold text-text-primary'>{value}</p>
			<p className='text-sm text-text-secondary mt-1'>{label}</p>
		</div>
	)
}
