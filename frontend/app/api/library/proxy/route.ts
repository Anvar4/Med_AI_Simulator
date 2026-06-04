import { NextRequest } from 'next/server';

const ALLOWED_PDF_HOSTS = new Set([
	'api.unilibrary.uz',
	'api.ziyonet.uz',
])

function parseAllowedPdfUrl(rawUrl: string): URL | null {
	try {
		const parsed = new URL(rawUrl)
		if (parsed.protocol !== 'https:') return null
		if (!ALLOWED_PDF_HOSTS.has(parsed.hostname.toLowerCase())) return null
		if (!parsed.pathname.toLowerCase().endsWith('.pdf')) return null
		return parsed
	} catch {
		return null
	}
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<Response> {
	const targetParam = request.nextUrl.searchParams.get('url')
	if (!targetParam) {
		return new Response('Missing url query parameter', { status: 400 })
	}

	const targetUrl = parseAllowedPdfUrl(targetParam)
	if (!targetUrl) {
		return new Response('Unsupported or invalid PDF source', { status: 400 })
	}

	const upstreamHeaders = new Headers({
		Accept: 'application/pdf,*/*;q=0.8',
	})
	const range = request.headers.get('range')
	if (range) {
		upstreamHeaders.set('Range', range)
	}

	let upstreamResponse: Response
	try {
		upstreamResponse = await fetch(targetUrl.toString(), {
			headers: upstreamHeaders,
			redirect: 'follow',
			cache: 'no-store',
		})
	} catch {
		return new Response('Failed to fetch upstream PDF', { status: 502 })
	}

	if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
		return new Response('Upstream PDF unavailable', { status: 502 })
	}

	const contentType = (upstreamResponse.headers.get('content-type') || '').toLowerCase()
	if (!contentType.includes('application/pdf')) {
		return new Response('Upstream content is not a PDF', { status: 415 })
	}

	const headers = new Headers()
	headers.set('Content-Type', 'application/pdf')
	headers.set('X-Content-Type-Options', 'nosniff')
	headers.set('Cache-Control', 'private, no-store, max-age=0')

	for (const key of ['content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
		const value = upstreamResponse.headers.get(key)
		if (value) {
			headers.set(key, value)
		}
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		headers,
	})
}