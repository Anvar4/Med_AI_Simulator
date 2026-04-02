'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	children: ReactNode
}

export default function Button({
	variant = 'primary',
	size = 'md',
	children,
	className = '',
	...props
}: ButtonProps) {
	const base =
		'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed'

	const variants = {
		primary:
			'bg-primary hover:bg-primary-dark text-secondary shadow-lg shadow-primary/20 hover:shadow-primary/40',
		secondary:
			'bg-surface-light hover:bg-surface text-text-primary border border-border hover:border-primary/50',
		ghost:
			'bg-transparent hover:bg-surface-light text-text-secondary hover:text-text-primary',
		danger:
			'bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30',
	}

	const sizes = {
		sm: 'px-3 py-1.5 text-sm gap-1.5',
		md: 'px-5 py-2.5 text-sm gap-2',
		lg: 'px-7 py-3.5 text-base gap-2.5',
	}

	return (
		<button
			className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
			{...props}
		>
			{children}
		</button>
	)
}
