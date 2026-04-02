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

export const metadata: Metadata = {
	title: 'Med AI Simulator — Virtual Klinik Muhit',
	description:
		"Sun'iy intellekt asosidagi virtual klinik muhit. 500+ tibbiy holatni xavfsiz sharoitda yechib, klinik ko'nikmalaringizni oshiring.",
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
