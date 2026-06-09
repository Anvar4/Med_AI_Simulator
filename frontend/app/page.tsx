'use client'

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion, useInView } from 'framer-motion';
import {
    ArrowRight,
    Award,
    Baby,
    Brain,
    Check,
    FileText,
    Hospital,
    Play,
    Search,
    Star,
    Stethoscope,
    TrendingUp,
    UserCheck,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const stagger = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.15 },
	},
}

const testimonials = [
	{ id: 1, name: 'Dr. Aziz Karimov', role: 'Rezident, Kardiologiya', avatar: 'AK', text: "Med AI Simulator mening klinik ko'nikmalarimni tubdan o'zgartirdi. Ayniqsa, shoshilinch holatlar simulyatsiyasi juda foydali.", rating: 5 },
	{ id: 2, name: 'Dilnoza Rahimova', role: '6-kurs talabasi, ToshTTI', avatar: 'DR', text: "Imtihonlarga tayyorlanishda eng yaxshi platforma. AI baholash tizimi juda aniq va tushuntirishi batafsil.", rating: 5 },
	{ id: 3, name: 'Dr. Sardor Toshmatov', role: 'Pediatr, Toshkent shahar bolalar shifoxonasi', avatar: 'ST', text: "Yosh shifokorlarimga tavsiya qilaman. Virtual muhitda xato qilish — haqiqiy bemorga zarar yetkazmasdan o'rganishning eng yaxshi usuli.", rating: 4 },
]

const fadeInUp = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: 'easeOut' as const },
	},
}

const features = [
	{
		icon: Brain,
		title: 'AI Evaluator',
		description:
			"Javobingizni 0-100 ball bilan baholaydi, xatoni vizual ko'rsatadi va batafsil tushuntirish beradi.",
	},
	{
		icon: Hospital,
		title: 'Operatsiya Zali',
		description:
			"Virtual OR'da real vaqt monitoringi bilan jarrohlik mashqi. Har bir qadam kuzatiladi.",
	},
	{
		icon: TrendingUp,
		title: 'Karyera Tahlil',
		description:
			'AI sizning kuchli tomonlaringizni aniqlaydi, ixtisoslik tavsiya beradi.',
	},
	{
		icon: Zap,
		title: 'Shoshilinch Yordam',
		description:
			'Bosim ostida qaror qabul qilish simulyatsiyasi. Vaqt chegarasi bilan ishlang.',
	},
	{
		icon: Baby,
		title: "Pediatriya + Tug'ruq",
		description:
			'Chaqaloqdan keksagacha barcha yosh guruhlari uchun maxsus stsenariylar.',
	},
	{
		icon: Search,
		title: 'AI Qidiruv',
		description:
			'Simptom kiriting, tegishli kasallik klinik holatlarini toping. AI tahlili bilan.',
	},
]

const plans = [
	{
		name: 'BEPUL',
		price: 'Bepul',
		period: '',
		description: 'Tanishish uchun',
		features: [
			'Kuniga 1 ta klinik holat',
			'AI chatga 5 ta savol/kun',
			'3 ta 3D anatomiya modeli',
			'Asosiy statistika',
		],
		cta: 'Bepul Boshlash',
		popular: false,
	},
	{
		name: 'PRO — 1 oy',
		price: '60,000',
		period: "so'm/oy",
		description: 'Barcha klinik holatlar va AI tahlil',
		features: [
			'Barcha klinik holatlar',
			'Cheksiz urinishlar',
			'Batafsil AI tahlil',
			'Shoshilinch rejim',
			'Barcha 3D modellar',
			'Sertifikat',
		],
		cta: "PRO ga O'tish",
		popular: true,
	},
	{
		name: 'PRO — 1 yil',
		price: '550,000',
		period: "so'm/yil",
		description: 'Eng katta chegirma · 365 kun',
		features: [
			'Oylikning barcha imkoniyatlari',
			'170,000 so\'m tejaysiz',
			'Yil davomida uzluksiz',
			'Eng yaxshi tanlov',
		],
		cta: "PRO ga O'tish",
		popular: false,
	},
	{
		name: 'Universitet / Klinika',
		price: 'Kelishiladi',
		period: '',
		description: 'Tashkilotlar uchun maxsus tarif',
		features: [
			'Ko\'p foydalanuvchi',
			'Boshqaruv paneli',
			'Analitika dashboard',
			'Maxsus klinik holatlar',
			'Admin bilan kelishiladi',
		],
		cta: "Bog'lanish",
		popular: false,
	},
]

const steps = [
	{
		icon: UserCheck,
		title: "Ro'yxatdan o'ting",
		description: "Email yoki telefon bilan 30 soniyada ro'yxatdan o'ting",
	},
	{
		icon: FileText,
		title: 'Case tanlang',
		description: "500+ tibbiy holatdan o'zingizga mosini tanlang",
	},
	{
		icon: Stethoscope,
		title: 'Tashxis yozing',
		description:
			"Bemor ma'lumotlarini ko'rib, tashxis va davolash rejasini yozing",
	},
	{
		icon: Award,
		title: 'AI baholaydi',
		description: 'AI javobingizni tahlil qilib, batafsil natija beradi',
	},
]

function SectionWrapper({
	children,
	className = '',
}: {
	children: React.ReactNode
	className?: string
}) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<motion.div
			ref={ref}
			initial='hidden'
			animate={isInView ? 'visible' : 'hidden'}
			variants={stagger}
			className={className}
		>
			{children}
		</motion.div>
	)
}

const JSON_LD = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'Organization',
			'@id': 'https://medaisimulator.uz/#organization',
			name: 'Med AI Simulator',
			url: 'https://medaisimulator.uz',
			logo: 'https://medaisimulator.uz/logotip.png',
			description: "Sun'iy intellekt asosidagi virtual klinik simulyator.",
		},
		{
			'@type': 'WebSite',
			'@id': 'https://medaisimulator.uz/#website',
			url: 'https://medaisimulator.uz',
			name: 'Med AI Simulator',
			inLanguage: 'uz',
			publisher: { '@id': 'https://medaisimulator.uz/#organization' },
		},
		{
			'@type': 'SoftwareApplication',
			name: 'Med AI Simulator',
			applicationCategory: 'EducationalApplication',
			operatingSystem: 'Web',
			url: 'https://medaisimulator.uz',
			description:
				"Tibbiyot talabalari va shifokorlar uchun AI asosidagi virtual klinik simulyator: 130+ klinik holat, AI tahlil, 3D anatomiya.",
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'UZS' },
		},
	],
}

export default function LandingPage() {
	return (
		<main className='min-h-screen bg-secondary'>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
			/>
			<Navbar />

			{/* Hero Section */}
			<section className='relative pt-20 pb-20 overflow-hidden'>
				<div className='absolute inset-0 animate-gradient-mesh opacity-30' />
				<div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/10 rounded-full blur-[120px]' />

				<div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<motion.div
						variants={stagger}
						initial='hidden'
						animate='visible'
						className='text-center max-w-4xl mx-auto'
					>
						<motion.div variants={fadeInUp}>
							<Badge className='mb-6'>🏥 AI-Powered Medical Simulation</Badge>
						</motion.div>

						<motion.h1
							variants={fadeInUp}
							className='text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6'
						>
							<span className='text-text-primary'>Xatosiz Tajriba.</span>
							<br />
						<span className='bg-linear-to-r from-[#00C9A7] to-emerald-400 bg-clip-text text-transparent'>
								Haqiqiy Mahorat.
							</span>
						</motion.h1>

						<motion.p
							variants={fadeInUp}
							className='text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed'
						>
							Virtual klinik muhitda AI yordamida 500+ tibbiy holat yechish.
							Bemorga zarar yetkazmay, hayotiy tajriba orttir.
						</motion.p>

						<motion.div
							variants={fadeInUp}
							className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-16'
						>
							<Link href='/register'>
								<Button size='lg'>
									Bepul Boshlash <ArrowRight className='w-5 h-5' />
								</Button>
							</Link>
							<Link href='/login'>
								<Button variant='secondary' size='lg'>
									<Play className='w-5 h-5' /> Tizimga kirish
								</Button>
							</Link>
						</motion.div>

						<motion.div
							variants={fadeInUp}
							className='flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6'
						>
							{[
								{ value: '25,000+', label: 'Talabalar' },
								{ value: '500+', label: 'Klinik Holat' },
								{ value: '98%', label: 'Mamnunlik' },
							].map((stat, i) => (
								<div
									key={stat.label}
									className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-8 py-4 ${
										i === 0
											? 'animate-float'
											: i === 1
												? 'animate-float-delayed'
												: 'animate-float-delayed-2'
									}`}
								>
									<p className='text-2xl font-bold text-primary'>
										{stat.value}
									</p>
									<p className='text-sm text-text-secondary'>{stat.label}</p>
								</div>
							))}
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<SectionWrapper className='text-center mb-16'>
						<motion.h2
							variants={fadeInUp}
							className='text-3xl sm:text-4xl font-bold text-text-primary mb-4'
						>
							Nima uchun{' '}
							<span className='bg-linear-to-r from-[#00C9A7] to-emerald-400 bg-clip-text text-transparent'>
								Med AI Simulator
							</span>
							?
						</motion.h2>
						<motion.p
							variants={fadeInUp}
							className='text-text-secondary text-lg max-w-2xl mx-auto'
						>
							Eng zamonaviy texnologiyalar bilan qurollangan platformada klinik
							ko&apos;nikmalaringizni oshiring
						</motion.p>
					</SectionWrapper>

					<SectionWrapper className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{features.map(feature => (
							<motion.div key={feature.title} variants={fadeInUp}>
								<Card className='h-full'>
									<div className='p-3 bg-primary/10 rounded-xl w-fit mb-4'>
										<feature.icon className='w-6 h-6 text-primary' />
									</div>
									<h3 className='text-lg font-semibold text-text-primary mb-2'>
										{feature.title}
									</h3>
									<p className='text-sm text-text-secondary leading-relaxed'>
										{feature.description}
									</p>
								</Card>
							</motion.div>
						))}
					</SectionWrapper>
				</div>
			</section>

			{/* How It Works */}
			<section id='how-it-works' className='py-20 bg-surface/50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<SectionWrapper className='text-center mb-16'>
						<motion.h2
							variants={fadeInUp}
							className='text-3xl sm:text-4xl font-bold text-text-primary mb-4'
						>
							Qanday ishlaydi?
						</motion.h2>
						<motion.p
							variants={fadeInUp}
							className='text-text-secondary text-lg max-w-xl mx-auto'
						>
							4 oddiy qadam bilan boshlang
						</motion.p>
					</SectionWrapper>

					<SectionWrapper className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
						{steps.map((step, i) => (
							<motion.div
								key={step.title}
								variants={fadeInUp}
								className='relative text-center'
							>
								{i < steps.length - 1 && (
									<div className='hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-linear-to-r from-primary/40 to-transparent' />
								)}
								<div className='w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20'>
									<step.icon className='w-8 h-8 text-primary' />
								</div>
								<div className='text-xs text-primary font-semibold mb-2'>
									Qadam {i + 1}
								</div>
								<h3 className='text-base font-semibold text-text-primary mb-2'>
									{step.title}
								</h3>
								<p className='text-sm text-text-secondary'>
									{step.description}
								</p>
							</motion.div>
						))}
					</SectionWrapper>
				</div>
			</section>

			{/* Pricing Section */}
			<section id='pricing' className='py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<SectionWrapper className='text-center mb-16'>
						<motion.h2
							variants={fadeInUp}
							className='text-3xl sm:text-4xl font-bold text-text-primary mb-4'
						>
							Sizga mos tarif tanlang
						</motion.h2>
						<motion.p
							variants={fadeInUp}
							className='text-text-secondary text-lg max-w-xl mx-auto'
						>
							Bepul boshlang, keyin o&apos;sib boring
						</motion.p>
					</SectionWrapper>

					<SectionWrapper className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto'>
						{plans.map(plan => (
							<motion.div key={plan.name} variants={fadeInUp}>
								<div
									className={`relative rounded-2xl border p-6 h-full flex flex-col ${
										plan.popular
											? 'border-primary bg-surface shadow-xl shadow-primary/10'
											: 'border-border bg-surface'
									}`}
								>
									{plan.popular && (
										<div className='absolute -top-3 left-1/2 -translate-x-1/2'>
											<Badge variant='success'>⭐ Eng mashhur</Badge>
										</div>
									)}

									<div className='mb-6'>
										<h3 className='text-sm font-semibold text-text-secondary mb-2'>
											{plan.name}
										</h3>
										<div className='flex items-end gap-1'>
											<span className={`font-bold text-text-primary ${plan.price.length > 7 ? 'text-2xl' : 'text-3xl'}`}>
												{plan.price}
											</span>
											{plan.period && (
												<span className='text-text-secondary text-sm mb-1'>
													{plan.period}
												</span>
											)}
										</div>
										<p className='text-sm text-text-secondary mt-2'>
											{plan.description}
										</p>
									</div>

									<ul className='space-y-3 mb-8 flex-1'>
										{plan.features.map(feature => (
											<li key={feature} className='flex items-start gap-2.5'>
												<Check className='w-4 h-4 text-primary mt-0.5 shrink-0' />
												<span className='text-sm text-text-secondary'>
													{feature}
												</span>
											</li>
										))}
									</ul>

									<Link href={plan.cta === "Bog'lanish" ? '/contact' : '/register'}>
										<Button
											variant={plan.popular ? 'primary' : 'secondary'}
											className='w-full'
										>
											{plan.cta}
										</Button>
									</Link>
								</div>
							</motion.div>
						))}
					</SectionWrapper>
				</div>
			</section>

			{/* Testimonials Section */}
			<section id='testimonials' className='py-20 bg-surface/50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<SectionWrapper className='text-center mb-16'>
						<motion.h2
							variants={fadeInUp}
							className='text-3xl sm:text-4xl font-bold text-text-primary mb-4'
						>
							Foydalanuvchilar fikri
						</motion.h2>
						<motion.p
							variants={fadeInUp}
							className='text-text-secondary text-lg max-w-xl mx-auto'
						>
							25,000+ tibbiyot mutaxassislari bizga ishonadi
						</motion.p>
					</SectionWrapper>

					<SectionWrapper className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{testimonials.map(testimonial => (
							<motion.div key={testimonial.id} variants={fadeInUp}>
								<Card className='h-full'>
									<div className='flex items-center gap-1 mb-4'>
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												className={`w-4 h-4 ${
													i < testimonial.rating
														? 'text-warning fill-warning'
														: 'text-surface-light'
												}`}
											/>
										))}
									</div>
									<p className='text-sm text-text-secondary leading-relaxed mb-6'>
										&quot;{testimonial.text}&quot;
									</p>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold'>
											{testimonial.avatar}
										</div>
										<div>
											<p className='text-sm font-semibold text-text-primary'>
												{testimonial.name}
											</p>
											<p className='text-xs text-text-secondary'>
												{testimonial.role}
											</p>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</SectionWrapper>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<SectionWrapper>
						<motion.div
							variants={fadeInUp}
							className='relative rounded-3xl overflow-hidden'
						>
							<div className='absolute inset-0 animate-gradient-mesh opacity-40' />
							<div className='relative text-center py-16 px-8'>
								<h2 className='text-3xl sm:text-4xl font-bold text-text-primary mb-4'>
									Bugun boshlang.
								</h2>
								<p className='text-xl text-text-secondary mb-8 max-w-lg mx-auto'>
									Kimningdir hayoti sening qo&apos;lingda.
								</p>
								<Link href='/dashboard'>
									<Button size='lg'>
										Bepul Ro&apos;yxatdan O&apos;tish{' '}
										<ArrowRight className='w-5 h-5' />
									</Button>
								</Link>
							</div>
						</motion.div>
					</SectionWrapper>
				</div>
			</section>

			<Footer />
		</main>
	)
}
