import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Med AI Simulator — Virtual Klinik Simulyator',
		short_name: 'Med AI Simulator',
		description:
			"Sun'iy intellekt asosidagi virtual klinik simulyator. Klinik holatlarni yeching, AI tahlil oling, ko'nikmalaringizni oshiring.",
		start_url: '/',
		display: 'standalone',
		background_color: '#0b1220',
		theme_color: '#0b1220',
		lang: 'uz',
		categories: ['education', 'medical', 'health'],
		icons: [
			{ src: '/logotip.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: '/logotip.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
		],
	}
}
