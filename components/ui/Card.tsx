'use client'

import { ReactNode } from 'react'

interface CardProps {
	children: ReactNode
	className?: string
	hover?: boolean
	onClick?: () => void
}

export default function Card({
	children,
	className = '',
	hover = true,
	onClick,
}: CardProps) {
	return (
		<div
			onClick={onClick}
			className={`bg-surface rounded-2xl border border-border p-6 ${
				hover
					? 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'
					: ''
			} ${onClick ? 'cursor-pointer' : ''} ${className}`}
		>
			{children}
		</div>
	)
}
