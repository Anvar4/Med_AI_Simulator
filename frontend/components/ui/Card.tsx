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
			className={`glass-soft rounded-3xl p-6 ${
				hover
					? 'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-300'
					: 'transition-all duration-300'
			} ${onClick ? 'cursor-pointer' : ''} ${className}`}
		>
			{children}
		</div>
	)
}
