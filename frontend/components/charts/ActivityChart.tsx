'use client'

interface ActivityChartProps {
	data: { day: string; count: number }[]
}

const BAR_MAX_HEIGHT = 140

export default function ActivityChart({ data }: ActivityChartProps) {
	const maxCount = Math.max(...data.map(d => d.count))

	return (
		<div className='flex items-end gap-3 w-full'>
			{data.map(item => {
				const barHeight =
					maxCount > 0
						? Math.max((item.count / maxCount) * BAR_MAX_HEIGHT, 12)
						: 12
				return (
					<div
						key={item.day}
						className='flex-1 flex flex-col items-center gap-2'
					>
						<span className='text-xs text-text-secondary font-medium'>
							{item.count}
						</span>
						<div
							className='w-8 sm:w-10 rounded-t-lg bg-linear-to-t from-primary to-primary/60 transition-all duration-500 hover:from-primary hover:to-primary/80 cursor-pointer'
							style={{ height: `${barHeight}px` }}
						/>
						<span className='text-xs text-text-secondary'>{item.day}</span>
					</div>
				)
			})}
		</div>
	)
}
