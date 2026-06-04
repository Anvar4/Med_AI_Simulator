import type { MetadataRoute } from 'next'

const SITE_URL = 'https://medaisimulator.uz'

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date()

	// Public, indexable pages. App pages behind auth are intentionally excluded.
	const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
		{ path: '/', priority: 1.0, changeFrequency: 'weekly' },
		{ path: '/login', priority: 0.5, changeFrequency: 'monthly' },
		{ path: '/register', priority: 0.7, changeFrequency: 'monthly' },
		{ path: '/cases', priority: 0.9, changeFrequency: 'weekly' },
		{ path: '/kurslar', priority: 0.8, changeFrequency: 'weekly' },
		{ path: '/library', priority: 0.7, changeFrequency: 'weekly' },
		{ path: '/leaderboard', priority: 0.6, changeFrequency: 'daily' },
		{ path: '/emergency', priority: 0.7, changeFrequency: 'weekly' },
		{ path: '/simulator', priority: 0.7, changeFrequency: 'monthly' },
		{ path: '/career', priority: 0.5, changeFrequency: 'monthly' },
		{ path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
		{ path: '/payment-terms', priority: 0.3, changeFrequency: 'yearly' },
	]

	return routes.map(r => ({
		url: `${SITE_URL}${r.path}`,
		lastModified: now,
		changeFrequency: r.changeFrequency,
		priority: r.priority,
	}))
}
