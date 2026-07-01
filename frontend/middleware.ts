import { NextRequest, NextResponse } from 'next/server'

// ── Subdomain-based routing & access control ──────────────────────────────────
//
// admin.medaisimulator.uz    → /admin page, requires role=admin
// manager.medaisimulator.uz → /content-manager page, requires role=instructor|admin
// medaisimulator.uz          → main app; /admin and /content-manager are inaccessible
//
// Auth is verified server-side by reading the JWT from the Authorization header
// stored in sessionStorage (client sets x-user-role cookie on login for Edge use).

const MAIN_HOST_RE = /^(www\.)?medaisimulator\.uz$/i
const ADMIN_HOST_RE = /^admin\.medaisimulator\.uz$/i
const MANAGER_HOST_RE = /^manager\.medaisimulator\.uz$/i

const IS_DEV = process.env.NODE_ENV === 'development'

// Pages that are only reachable from admin/manager subdomains
const PANEL_PATHS = ['/admin', '/content-manager']

// Pages that do not require authentication at all
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/privacy-policy',
  '/payment-terms',
  '/verify',
  '/career',
  '/contact',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isPanelPath(pathname: string): boolean {
  return PANEL_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function getEffectiveHost(req: NextRequest): string {
  // In local dev, use x-forwarded-host or fallback to localhost
  return (
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'localhost'
  ).split(':')[0].toLowerCase()
}

function getUserRole(req: NextRequest): string | null {
  // Role is stored in a signed cookie set at login (HttpOnly from API, or
  // a non-HttpOnly "role hint" cookie set by the frontend after login).
  // We use a plain cookie for Edge-readable role hint; the real check is
  // on the backend with the JWT.
  return req.cookies.get('user-role')?.value ?? null
}

function isAuthenticated(req: NextRequest): boolean {
  // Check the auth hint cookie (set by frontend) — full JWT validation
  // happens on every API call at the backend.
  return !!req.cookies.get('auth-token')?.value
}

export function middleware(req: NextRequest): NextResponse {
  const host = getEffectiveHost(req)
  const { pathname } = req.nextUrl
  const isDevMode = IS_DEV || host === 'localhost' || host === '127.0.0.1'

  // ── Static / Next internals — always pass through ─────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?|ttf|map)$/)
  ) {
    return NextResponse.next()
  }

  const role = getUserRole(req)
  const authed = isAuthenticated(req)

  // ── ADMIN subdomain ────────────────────────────────────────────────────────
  if (ADMIN_HOST_RE.test(host)) {
    // Panelda ro'yxatdan o'tish / parol tiklash YO'Q — faqat login/parol.
    // /register va /forgot-password → /login ga yo'naltiriladi.
    if (pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
      return NextResponse.redirect(new URL('/login', `https://${host}`))
    }
    // /login — har doim o'tkazib yuborish (redirect loop oldini olish)
    if (pathname.startsWith('/login')) {
      const res = NextResponse.next()
      setSecurityHeaders(res)
      return res
    }
    if (!isDevMode) {
      if (!authed) {
        return NextResponse.redirect(new URL('/login', `https://${host}`))
      }
      if (role !== 'admin') {
        return new NextResponse('Bu panel faqat adminlar uchun', { status: 403 })
      }
    }
    // Rewrite root → /admin
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url))
    }
    // Block non-admin pages on admin subdomain
    if (!pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/admin', req.url))
    }
    const res = NextResponse.next()
    setSecurityHeaders(res)
    return res
  }

  // ── MANAGER subdomain ──────────────────────────────────────────────────────
  if (MANAGER_HOST_RE.test(host)) {
    // Panelda ro'yxatdan o'tish / parol tiklash YO'Q — faqat login/parol.
    if (pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
      return NextResponse.redirect(new URL('/login', `https://${host}`))
    }
    // /login — har doim o'tkazib yuborish (redirect loop oldini olish)
    if (pathname.startsWith('/login')) {
      const res = NextResponse.next()
      setSecurityHeaders(res)
      return res
    }
    if (!isDevMode) {
      if (!authed) {
        return NextResponse.redirect(new URL('/login', `https://${host}`))
      }
      if (role !== 'admin' && role !== 'content-manager') {
        return new NextResponse('Bu panel faqat content managerlar uchun', { status: 403 })
      }
    }
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/content-manager', req.url))
    }
    if (!pathname.startsWith('/content-manager')) {
      return NextResponse.rewrite(new URL('/content-manager', req.url))
    }
    const res = NextResponse.next()
    setSecurityHeaders(res)
    return res
  }

  // ── MAIN domain ───────────────────────────────────────────────────────────
  if (MAIN_HOST_RE.test(host) || isDevMode) {
    // Block direct access to panel pages from main domain (even in dev)
    if (isPanelPath(pathname) && !isDevMode) {
      return new NextResponse(null, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Protected pages: redirect to login if not authenticated
    if (!isPublicPath(pathname) && !authed && !isDevMode) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const res = NextResponse.next()
    setSecurityHeaders(res)
    return res
  }

  // Unknown host — pass through with security headers
  const res = NextResponse.next()
  setSecurityHeaders(res)
  return res
}

function setSecurityHeaders(res: NextResponse): void {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
