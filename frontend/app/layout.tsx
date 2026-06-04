import Providers from '@/components/Providers'
import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({
	variable: '--font-sora',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
})

const SITE_URL = 'https://medaisimulator.uz'
const SITE_NAME = 'Med AI Simulator'
const SITE_DESCRIPTION =
	"Sun'iy intellekt asosidagi virtual klinik simulyator. 130+ klinik holatni xavfsiz muhitda yeching, AI tahlil oling, 3D anatomiya bilan ishlang va klinik ko'nikmalaringizni oshiring. Tibbiyot talabalari va shifokorlar uchun."

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: 'Med AI Simulator — AI asosidagi virtual klinik simulyator',
		template: '%s | Med AI Simulator',
	},
	description: SITE_DESCRIPTION,
	keywords: [
		'tibbiy simulyator', 'klinik holatlar', 'AI tibbiyot', 'virtual bemor',
		'tibbiyot talabalari', 'klinik ko\'nikmalar', '3D anatomiya', 'shifokor',
		'med ai simulator', 'medaisimulator', 'tibbiy ta\'lim', 'klinik masalalar',
		'sun\'iy intellekt tibbiyot', 'Oʻzbekiston tibbiyot',
	],
	authors: [{ name: 'Med AI Simulator' }],
	creator: 'Med AI Simulator',
	publisher: 'Med AI Simulator',
	applicationName: SITE_NAME,
	alternates: {
		canonical: SITE_URL,
	},
	openGraph: {
		type: 'website',
		locale: 'uz_UZ',
		url: SITE_URL,
		siteName: SITE_NAME,
		title: 'Med AI Simulator — AI asosidagi virtual klinik simulyator',
		description: SITE_DESCRIPTION,
		images: [
			{
				url: '/logotip.png',
				width: 512,
				height: 512,
				alt: 'Med AI Simulator logotipi',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Med AI Simulator — AI asosidagi virtual klinik simulyator',
		description: SITE_DESCRIPTION,
		images: ['/logotip.png'],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	icons: {
		icon: '/logotip.png',
		apple: '/logotip.png',
	},
	verification: {
		// Google Search Console va Yandex Webmaster tasdiqlash kodlarini shu yerga qo'ying.
		google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
		yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION || undefined,
	},
	category: 'education',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='uz' className={`${sora.variable} ${inter.variable}`} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: `
					(function() {
						try {
							var raw = localStorage.getItem('med-ai-auth');
							var theme = 'light';
							if (raw) {
								var parsed = JSON.parse(raw);
								if (parsed && parsed.preferences && parsed.preferences.darkMode === true) theme = 'dark';
							}
							document.documentElement.classList.add(theme);
						} catch(e) {
							document.documentElement.classList.add('light');
						}
					})();
				`}} />
			</head>
			<body className='min-h-screen bg-secondary text-text-primary antialiased'>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
