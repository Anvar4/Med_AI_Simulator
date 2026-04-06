'use client'

import Sidebar from '@/components/layout/Sidebar';
import { ExternalLink, PlayCircle, User } from 'lucide-react';

const COURSE_AUTHOR = 'Mashrabbek Ibodov'

const LESSONS = [
	{
		title: 'Kirish: Kurs haqida umumiy tushuncha',
		description: 'Ushbu darsda kursning maqsadi, o`qish tartibi va amaliy natijalar haqida qisqacha tushuntirish beriladi.',
		url: 'https://www.youtube.com/watch?v=EkyLRc8mtII',
	},
	{
		title: 'Asosiy tamoyillar va boshlang`ich qadamlar',
		description: 'Mavzuga kirish uchun kerak bo`ladigan asosiy tushunchalar va darsni to`g`ri boshlash bo`yicha tavsiyalar.',
		url: 'https://www.youtube.com/watch?v=GCur4Ly4uJs',
	},
	{
		title: 'Amaliy ko`nikmalar: 1-qism',
		description: 'Mavzuni real misollar bilan mustahkamlash va bosqichma-bosqich bajarish usullari ko`rsatiladi.',
		url: 'https://www.youtube.com/watch?v=el-9ihtgFiY',
	},
	{
		title: 'Amaliy ko`nikmalar: 2-qism',
		description: 'Oldingi darsdagi bilimlarni davom ettirib, murakkabroq holatlar bilan ishlash ko`rsatib beriladi.',
		url: 'https://www.youtube.com/watch?v=9M7OU8g3dXU',
	},
	{
		title: 'Muhim xatolar va ularni oldini olish',
		description: 'Ko`p uchraydigan xatolar, ularning sabablari va to`g`ri yechimlari bo`yicha izohlar beriladi.',
		url: 'https://www.youtube.com/watch?v=yRkb6uy0o-U',
	},
	{
		title: 'Tahlil va fikrlash strategiyasi',
		description: 'Mavzu bo`yicha tez va aniq tahlil qilish, qaror qabul qilishga yordam beradigan yondashuvlar yoritiladi.',
		url: 'https://www.youtube.com/watch?v=o2x9TLGP5P4',
	},
	{
		title: 'Murakkab holatlar bilan ishlash',
		description: 'Qiyin vaziyatlarni bosqichma-bosqich hal qilish va natijani yaxshilash bo`yicha amaliy yo`riqnoma.',
		url: 'https://www.youtube.com/watch?v=o3xWZgvKWmY',
	},
	{
		title: 'Nazariyani amaliyotga bog`lash',
		description: 'Nazariy bilimlarni amaliy vazifalarda qanday ishlatish va darslararo bog`liqlikni to`g`ri qurish tushuntiriladi.',
		url: 'https://www.youtube.com/watch?v=ICwWG5HBa5s',
	},
	{
		title: 'Mustahkamlash va qayta ko`rib chiqish',
		description: 'Asosiy nuqtalarni qayta takrorlash, mustahkamlash va keyingi bosqichga tayyorlanish bo`yicha qisqa yo`l xaritasi.',
		url: 'https://www.youtube.com/watch?v=_jtF4hNG0O8',
	},
	{
		title: 'Yakuniy dars: umumlashtirish',
		description: 'Kurs davomida o`rganilgan mavzular yakunlanadi, keyingi rivojlanish uchun tavsiyalar beriladi.',
		url: 'https://www.youtube.com/watch?v=dKiTklAK9Mc',
	},
]

function getEmbedUrl(url: string): string {
	const idMatch = url.match(/[?&]v=([^&]+)/)
	const videoId = idMatch?.[1] ?? ''
	return `https://www.youtube.com/embed/${videoId}`
}

export default function KurslarPage() {
	return (
		<div className='min-h-screen bg-secondary'>
			<Sidebar />

			<main className='lg:pl-64 pt-16 lg:pt-0 pb-10'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='mb-8 bg-surface border border-border rounded-2xl p-5 sm:p-6'>
						<div className='flex flex-wrap items-start justify-between gap-4'>
							<div>
								<div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3'>
									<PlayCircle className='w-3.5 h-3.5' />
									Yangi kurslar
								</div>
								<h1 className='text-2xl sm:text-3xl font-bold text-text-primary'>Video kurslar</h1>
								<p className='text-sm text-text-secondary mt-2'>
									Quyidagi videolar ketma-ketlikda joylashtirilgan. Har bir dars uchun mavzu sarlavhasi va qisqa izoh berilgan.
								</p>
							</div>

							<div className='flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface-light'>
								<User className='w-4 h-4 text-primary' />
								<div>
									<p className='text-[11px] text-text-secondary uppercase tracking-wider'>Kurs authori</p>
									<p className='text-sm font-semibold text-text-primary'>{COURSE_AUTHOR}</p>
								</div>
							</div>
						</div>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
						{LESSONS.map((lesson, index) => (
							<article key={lesson.url} className='bg-surface border border-border rounded-2xl overflow-hidden'>
								<div className='aspect-video bg-black'>
									<iframe
										src={getEmbedUrl(lesson.url)}
										title={`Dars ${index + 1}: ${lesson.title}`}
										className='w-full h-full border-0'
										loading='lazy'
										allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
										referrerPolicy='strict-origin-when-cross-origin'
										allowFullScreen
									/>
								</div>

								<div className='p-4 sm:p-5'>
									<p className='text-xs font-semibold text-primary mb-2'>Dars {index + 1}</p>
									<h2 className='text-base font-bold text-text-primary leading-snug'>{lesson.title}</h2>
									<p className='text-sm text-text-secondary mt-2 leading-relaxed'>{lesson.description}</p>

									<div className='flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border'>
										<div className='text-xs text-text-secondary'>
											<span className='font-semibold text-text-primary'>Author:</span> {COURSE_AUTHOR}
										</div>
										<a
											href={lesson.url}
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'
										>
											YouTube&apos;da ochish <ExternalLink className='w-3.5 h-3.5' />
										</a>
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			</main>
		</div>
	)
}
