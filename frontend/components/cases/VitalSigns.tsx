'use client'

interface VitalSignsProps {
	bp: string
	hr: string
	temp: string
	spo2: string
}

function getStatus(
	type: string,
	value: string,
): 'normal' | 'warning' | 'danger' {
	if (type === 'bp') {
		const sys = parseInt(value.split('/')[0])
		if (sys > 140 || sys < 90) return 'danger'
		if (sys > 130 || sys < 100) return 'warning'
		return 'normal'
	}
	if (type === 'hr') {
		const hr = parseInt(value)
		if (hr > 120 || hr < 50) return 'danger'
		if (hr > 100 || hr < 60) return 'warning'
		return 'normal'
	}
	if (type === 'temp') {
		const temp = parseFloat(value)
		if (temp > 39 || temp < 35) return 'danger'
		if (temp > 37.5 || temp < 36) return 'warning'
		return 'normal'
	}
	if (type === 'spo2') {
		const spo2 = parseInt(value)
		if (spo2 < 90) return 'danger'
		if (spo2 < 95) return 'warning'
		return 'normal'
	}
	return 'normal'
}

const statusColors = {
	normal: 'text-success border-success/30 bg-success/10',
	warning: 'text-warning border-warning/30 bg-warning/10',
	danger: 'text-accent border-accent/30 bg-accent/10',
}

const statusDot = {
	normal: 'bg-success',
	warning: 'bg-warning',
	danger: 'bg-accent',
}

export default function VitalSigns({ bp, hr, temp, spo2 }: VitalSignsProps) {
	const vitals = [
		{ label: 'BP', value: `${bp} mmHg`, type: 'bp', rawValue: bp },
		{ label: 'HR', value: `${hr} bpm`, type: 'hr', rawValue: hr },
		{ label: 'Temp', value: `${temp}°C`, type: 'temp', rawValue: temp },
		{ label: 'SpO₂', value: `${spo2}%`, type: 'spo2', rawValue: spo2 },
	]

	return (
		<div className='grid grid-cols-2 gap-3'>
			{vitals.map(vital => {
				const status = getStatus(vital.type, vital.rawValue)
				return (
					<div
						key={vital.label}
						className={`rounded-xl border p-3 ${statusColors[status]}`}
					>
						<div className='flex items-center gap-2 mb-1'>
							<div
								className={`w-2 h-2 rounded-full ${statusDot[status]} animate-pulse`}
							/>
							<span className='text-xs font-medium opacity-80'>
								{vital.label}
							</span>
						</div>
						<p className='text-lg font-bold'>{vital.value}</p>
					</div>
				)
			})}
		</div>
	)
}
