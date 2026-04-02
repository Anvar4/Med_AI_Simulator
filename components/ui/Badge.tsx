'use client'

import { ReactNode } from 'react'

interface BadgeProps {
	children: ReactNode
	variant?: 'default' | 'success' | 'warning' | 'danger' | 'premium'
	className?: string
}

export default function Badge({
	children,
	variant = 'default',
	className = '',
}: BadgeProps) {
	const variants = {
		default: 'bg-primary/15 text-primary border-primary/20',
		success: 'bg-success/15 text-success border-success/20',
		warning: 'bg-warning/15 text-warning border-warning/20',
		danger: 'bg-accent/15 text-accent border-accent/20',
		premium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
	}

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
		>
			{children}
		</span>
	)
}
