'use client'

import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    Brain,
    ChevronRight,
    Dna,
    Droplets,
    Heart,
    Layers,
    Search,
    Thermometer,
    UserRound,
    Users,
    Wind,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const DK = process.env.NEXT_PUBLIC_BIODIGITAL_DK ?? ''
const dk = `dk=${DK}`

// ─── All models with verified full src URLs ───────────────────────────────────
export interface BioModel {
	key: string
	label: string
	category: 'anatomy' | 'organ' | 'system' | 'disease'
	icon: React.ReactNode
	src: string
	keywords: string[]
}

export const BIODIGITAL_MODELS: BioModel[] = [
	// ── Full anatomy ──────────────────────────────────────────────────────────
	{
		key: 'male_full',
		label: 'Erkak anatomiyasi',
		category: 'anatomy',
		icon: <UserRound className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=production%2FmaleAdult%2Fmale_complete_anatomy_16&${dk}`,
		keywords: ['erkak', 'male', 'toliq', 'complete', 'мужской'],
	},
	{
		key: 'female_full',
		label: 'Ayol anatomiyasi',
		category: 'anatomy',
		icon: <Users className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=production%2FfemaleAdult%2Ffemale_complete_anatomy_09&${dk}`,
		keywords: ['ayol', 'female', 'женский', 'xotin'],
	},

	// ── Heart ─────────────────────────────────────────────────────────────────
	{
		key: 'heart_blood_flow',
		label: 'Yurakda qon aylanishi',
		category: 'organ',
		icon: <Heart className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fheart_blood_flow&lang=en&${dk}`,
		keywords: ['yurak qon', 'heart blood', 'qon aylanish'],
	},
	{
		key: 'heart_conduction',
		label: "Yurak o'tkazuvchi tizimi",
		category: 'organ',
		icon: <Heart className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fnormal_heart_conduction_system&lang=en&${dk}`,
		keywords: ['yurak otkazuv', 'conduction'],
	},
	{
		key: 'cardiovascular',
		label: 'Yurak-qon tomir tizimi',
		category: 'system',
		icon: <Heart className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=6NdL&${dk}`,
		keywords: ['qon tomir', 'cardiovascular', 'tomir'],
	},

	// ── Brain / Nervous ───────────────────────────────────────────────────────
	{
		key: 'brain_main',
		label: 'Bosh miya',
		category: 'organ',
		icon: <Brain className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?be=45lL&${dk}&ui-info=true&ui-reset=true&ui-search=true`,
		keywords: ['miya', 'brain', 'мозг', 'bosh miya'],
	},
	{
		key: 'brain_sagittal',
		label: 'Bosh miya sagittal kesim',
		category: 'organ',
		icon: <Brain className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fsagittal_brain_cross_section&lang=en&${dk}`,
		keywords: ['miya kesim', 'sagittal', 'brain cross'],
	},
	{
		key: 'brain_blood',
		label: "Miyaning qon ta'minoti",
		category: 'organ',
		icon: <Brain className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fblood_supply_of_brain_guided&${dk}`,
		keywords: ['miya qon', 'brain blood'],
	},
	{
		key: 'nervous_system',
		label: 'Asab tizimi',
		category: 'system',
		icon: <Zap className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=4Oli&${dk}`,
		keywords: ['asab', 'nerve', 'nervous', 'нервная'],
	},
	{
		key: 'cranial_nerves',
		label: 'Kraniyal nervlar',
		category: 'system',
		icon: <Zap className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fgross_anatomy_of_the_brain_cranial_nerves_part_i_quiz&${dk}`,
		keywords: ['kranial', 'cranial nerves', 'nerv'],
	},
	{
		key: 'sympathetic',
		label: 'Simpatik tizim',
		category: 'system',
		icon: <Zap className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fsympathetic_system&lang=en&ref=share&${dk}`,
		keywords: ['simpatik', 'sympathetic'],
	},

	// ── Lungs / Respiratory ───────────────────────────────────────────────────
	{
		key: 'respiratory',
		label: 'Nafas olish tizimi',
		category: 'system',
		icon: <Wind className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=4wPX&${dk}`,
		keywords: ['nafas', 'opka', 'respiratory', 'lung', 'lungs', 'лёгкие'],
	},
	{
		key: 'lungs_coronal',
		label: "O'pka koronal kesim",
		category: 'organ',
		icon: <Wind className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Flungs_coronal_cross_section&lang=en&${dk}`,
		keywords: ['opka kesim', 'lungs cross', 'koronal'],
	},
	{
		key: 'lungs_pleura',
		label: "O'pka va plevra",
		category: 'organ',
		icon: <Wind className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=57On&${dk}`,
		keywords: ['plevra', 'pleura', 'opka plevra'],
	},

	// ── Skeleton ──────────────────────────────────────────────────────────────
	{
		key: 'skull_anterior',
		label: "Bosh suyagi (old ko'rinish)",
		category: 'system',
		icon: <Layers className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fskeletal_anatomy_anterior_view_of_the_skull_quiz&lang=en&${dk}`,
		keywords: ['bosh suyak', 'skull', 'skelet'],
	},
	{
		key: 'skull_lateral',
		label: "Bosh suyagi (yon ko'rinish)",
		category: 'system',
		icon: <Layers className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fface_lateral_view_of_the_skull_part_i_quiz&lang=en&${dk}`,
		keywords: ['bosh suyak yon', 'skull lateral'],
	},
	{
		key: 'vertebrae',
		label: "Bo'yin va bel umurtqalari",
		category: 'system',
		icon: <Layers className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fskeletal_anatomy_cervical_and_lumbar_vertebrae_quiz&lang=es&${dk}`,
		keywords: ['umurtqa', 'vertebra', 'bel', 'boyun'],
	},

	// ── Digestive / Other systems ─────────────────────────────────────────────
	{
		key: 'digestive',
		label: 'Hazm tizimi',
		category: 'system',
		icon: <Activity className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=4NMt&${dk}`,
		keywords: ['hazm', 'digestive', 'oshqozon', 'ichak'],
	},
	{
		key: 'endocrine',
		label: 'Endokrin tizim',
		category: 'system',
		icon: <Thermometer className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=4NLx&${dk}`,
		keywords: ['endokrin', 'endocrine', 'gormon'],
	},
	{
		key: 'urinary',
		label: 'Siydik ajratish tizimi',
		category: 'system',
		icon: <Droplets className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=48Nx&lang=en&${dk}`,
		keywords: ['buyrak', 'siydik', 'urinary', 'kidney'],
	},
	{
		key: 'abdominal_wall',
		label: 'Qorin devori',
		category: 'system',
		icon: <Activity className='w-4 h-4' />,
		src: `https://human.biodigital.com/viewer/?id=production%2FmaleAdult%2Fabdominal_wall_guided&lang=en&${dk}`,
		keywords: ['qorin', 'abdomen', 'abdominal'],
	},
	{
		key: 'female_reproductive',
		label: 'Ayol reproduktiv tizimi',
		category: 'system',
		icon: <Users className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FfemaleAdult%2Ffemale_reproductive_system_tour&lang=es&${dk}`,
		keywords: ['ayol reproduktiv', 'female reproductive'],
	},

	// ── Diseases ──────────────────────────────────────────────────────────────
	{
		key: 'alzheimers',
		label: "Alzheimer kasalligi",
		category: 'disease',
		icon: <Dna className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Falzheimers_disease_brain_cross_section&type=module&${dk}`,
		keywords: ['alzheimer', 'demensiya'],
	},
	{
		key: 'allergic',
		label: 'Sistemik allergik reaksiya',
		category: 'disease',
		icon: <Dna className='w-4 h-4' />,
		src: `https://human.biodigital.com/view?id=production%2FmaleAdult%2Fsystemic_allergic_reaction_02&lang=en&${dk}`,
		keywords: ['allergiya', 'allergic', 'reaksiya'],
	},
]

// ─── Quick buttons ────────────────────────────────────────────────────────────
const QUICK_KEYS = [
	{ key: 'heart_blood_flow', color: 'text-red-400    bg-red-400/10    border-red-400/20    hover:bg-red-400/20'    },
	{ key: 'brain_main',     color: 'text-purple-400 bg-purple-400/10 border-purple-400/20 hover:bg-purple-400/20' },
	{ key: 'respiratory',    color: 'text-blue-400   bg-blue-400/10   border-blue-400/20   hover:bg-blue-400/20'   },
	{ key: 'nervous_system', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20' },
	{ key: 'digestive',      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/20' },
	{ key: 'male_full',      color: 'text-primary    bg-primary/10    border-primary/20    hover:bg-primary/20'    },
	{ key: 'female_full',    color: 'text-pink-400   bg-pink-400/10   border-pink-400/20   hover:bg-pink-400/20'   },
	{ key: 'alzheimers',     color: 'text-accent     bg-accent/10     border-accent/20     hover:bg-accent/20'     },
]

const CATEGORIES = [
	{ value: 'all',     label: 'Barchasi' },
	{ value: 'anatomy', label: 'Anatomiya' },
	{ value: 'organ',   label: "A'zolar" },
	{ value: 'system',  label: 'Tizimlar' },
	{ value: 'disease', label: 'Kasalliklar' },
]

const modelMap = Object.fromEntries(BIODIGITAL_MODELS.map(m => [m.key, m]))

interface ControlsPanelProps {
	selectedSrc: string
	onSrcChange: (src: string) => void
}

export default function ControlsPanel({ selectedSrc, onSrcChange }: ControlsPanelProps) {
	const [search, setSearch] = useState('')
	const [category, setCategory] = useState('all')
	const [autoLabel, setAutoLabel] = useState<string | null>(null)

	const currentModel = BIODIGITAL_MODELS.find(m => m.src === selectedSrc)

	const filtered = BIODIGITAL_MODELS.filter(m => {
		const q = search.toLowerCase().trim()
		const matchSearch = !q || m.label.toLowerCase().includes(q) || m.keywords.some(k => k.includes(q))
		const matchCat = category === 'all' || m.category === category
		return matchSearch && matchCat
	})

	const resolveSearch = useCallback((q: string): BioModel | null => {
		const norm = q.toLowerCase().trim()
		if (!norm) return null
		return (
			BIODIGITAL_MODELS.find(m => m.keywords.some(k => k === norm)) ??
			BIODIGITAL_MODELS.find(m => m.keywords.some(k => k.includes(norm))) ??
			BIODIGITAL_MODELS.find(m => m.label.toLowerCase().includes(norm)) ??
			null
		)
	}, [])

	const handleSearchChange = useCallback((val: string) => {
		setSearch(val)
		setAutoLabel(null)
		const match = resolveSearch(val)
		if (match && match.src !== selectedSrc) {
			// Only auto-load on exact keyword match
			const exactMatch = match.keywords.some(k => k === val.toLowerCase().trim())
			if (exactMatch) {
				onSrcChange(match.src)
				setAutoLabel(match.label)
			}
		}
	}, [resolveSearch, selectedSrc, onSrcChange])

	const handleSubmit = useCallback((e: React.FormEvent) => {
		e.preventDefault()
		const match = resolveSearch(search) ?? filtered[0] ?? null
		if (match) {
			onSrcChange(match.src)
			setAutoLabel(match.label)
		}
	}, [search, filtered, resolveSearch, onSrcChange])

	const selectModel = useCallback((m: BioModel) => {
		onSrcChange(m.src)
		setSearch('')
		setAutoLabel(null)
	}, [onSrcChange])

	useEffect(() => {
		if (autoLabel) {
			const t = setTimeout(() => setAutoLabel(null), 3000)
			return () => clearTimeout(t)
		}
	}, [autoLabel])

	return (
		<div className='flex flex-col gap-4'>

			{/* Search */}
			<form onSubmit={handleSubmit} className='relative'>
				<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none' />
				<input
					type='text'
					placeholder='Yozing: yurak, miya, nafas...'
					value={search}
					onChange={e => handleSearchChange(e.target.value)}
					autoComplete='off'
					spellCheck={false}
					className='w-full pl-10 pr-10 py-2.5 text-sm bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all'
				/>
				{search && (
					<button type='button' onClick={() => { setSearch(''); setAutoLabel(null) }}
						className='absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors'>
						<X className='w-4 h-4' />
					</button>
				)}
			</form>

			{/* Auto-match badge */}
			<AnimatePresence>
				{autoLabel && (
					<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
						className='flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20'>
						<div className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
						<span className='text-xs text-primary font-medium'>Yuklandi: <strong>{autoLabel}</strong></span>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Active model */}
			<div className='px-3 py-2.5 rounded-xl bg-surface-light border border-border'>
				<p className='text-[10px] text-text-secondary uppercase tracking-wider mb-0.5'>Hozirgi model</p>
				<p className='text-sm font-semibold text-text-primary truncate'>
					{currentModel?.label ?? 'Noma\'lum'}
				</p>
			</div>

			{/* Quick buttons */}
			<div>
				<p className='text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2'>Tezkor yuklash</p>
				<div className='grid grid-cols-4 gap-1.5'>
					{QUICK_KEYS.map(({ key, color }) => {
						const m = modelMap[key]
						if (!m) return null
						const isActive = selectedSrc === m.src
						return (
							<button key={key} onClick={() => selectModel(m)}
								className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all duration-200 ${color} ${isActive ? 'ring-1 ring-current scale-95' : ''}`}>
								<span className='shrink-0'>{m.icon}</span>
								<span className='text-[9px] font-semibold leading-tight'>{m.label.split(' ')[0]}</span>
							</button>
						)
					})}
				</div>
			</div>

			{/* Category filter */}
			<div className='flex gap-1 flex-wrap'>
				{CATEGORIES.map(cat => (
					<button key={cat.value} onClick={() => setCategory(cat.value)}
						className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
							category === cat.value ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary hover:text-text-primary'
						}`}>
						{cat.label}
					</button>
				))}
			</div>

			{/* Divider */}
			<div className='border-t border-border' />

			{/* Model list */}
			<div className='flex flex-col gap-1.5 pb-4'>
				<p className='text-[10px] font-semibold text-text-secondary uppercase tracking-wider'>
					{search ? `Natijalar (${filtered.length})` : `Barcha modellar (${BIODIGITAL_MODELS.length})`}
				</p>

				{filtered.length === 0 ? (
					<div className='text-center py-6 text-text-secondary'>
						<Search className='w-7 h-7 mx-auto mb-2 opacity-30' />
						<p className='text-sm'>&quot;{search}&quot; topilmadi</p>
					</div>
				) : (
					filtered.map(model => {
						const isActive = selectedSrc === model.src
						return (
							<motion.button key={model.key} layout onClick={() => selectModel(model)}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
									isActive ? 'bg-primary/10 border-primary/30' : 'bg-surface-light border-transparent hover:border-border'
								}`}>
								<div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
									isActive ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary'
								}`}>
									{model.icon}
								</div>
								<div className='min-w-0 flex-1'>
									<p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>
										{model.label}
									</p>
									<p className='text-[10px] text-text-secondary capitalize'>{model.category}</p>
								</div>
								<ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
							</motion.button>
						)
					})
				)}
			</div>
		</div>
	)
}
