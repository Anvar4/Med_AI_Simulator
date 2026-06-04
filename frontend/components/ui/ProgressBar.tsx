'use client'

interface ProgressBarProps {
	value: number
	max?: number
	color?: 'primary' | 'success' | 'warning' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	showLabel?: boolean
	className?: string
}

export default function ProgressBar({
	value,
	max = 100,
	color = 'primary',
	size = 'md',
	showLabel = false,
	className = '',
}: ProgressBarProps) {
	const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

	const colors = {
		primary: 'bg-primary',
		success: 'bg-success',
		warning: 'bg-warning',
		danger: 'bg-accent',
	}

	const sizes = {
		sm: 'h-1.5',
		md: 'h-2.5',
		lg: 'h-4',
	}

	return (
		<div className={`w-full ${className}`}>
			{showLabel && (
				<div className='flex justify-between mb-1'>
					<span className='text-xs text-text-secondary'>Progress</span>
					<span className='text-xs text-text-primary font-medium'>
						{Math.round(percentage)}%
					</span>
				</div>
			)}
			<div
				className={`w-full bg-surface-light rounded-full overflow-hidden ${sizes[size]}`}
			>
				<div
					className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
					style={{ width: `${percentage}%` }}
					role='progressbar'
					aria-valuenow={value}
					aria-valuemin={0}
					aria-valuemax={max}
				/>
			</div>
		</div>
	)
}
