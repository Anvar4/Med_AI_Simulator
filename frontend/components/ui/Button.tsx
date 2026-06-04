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
		'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]'

	const variants = {
		primary:
			'btn-liquid text-white hover:shadow-[0_8px_28px_rgba(47,128,237,0.45)] hover:-translate-y-0.5',
		secondary:
			'glass-soft text-text-primary hover:border-primary/50 hover:-translate-y-0.5',
		ghost:
			'bg-transparent hover:bg-surface-light text-text-secondary hover:text-text-primary',
		danger:
			'bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30',
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
