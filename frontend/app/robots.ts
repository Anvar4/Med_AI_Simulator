import type { MetadataRoute } from 'next'

const SITE_URL = 'https://medaisimulator.uz'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				// Auth-only / private app sections are not useful for search engines.
				disallow: [
					'/admin',
					'/content-manager',
					'/settings',
					'/api/',
					'/dashboard',
					'/history',
					'/cases/history',
					'/referrals',
					'/subscription',
					'/statistics',
					'/analysis',
				],
			},
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	}
}
