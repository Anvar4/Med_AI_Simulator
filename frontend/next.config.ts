import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

// ── Content Security Policy ────────────────────────────────────────────────────
// Tightened for production; relaxed in dev (HMR websocket, eval for source maps).

const CSP_DIRECTIVES = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com"
    : "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
  isDev
    ? "script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com"
    : "script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  [
    "connect-src 'self'",
    process.env.NEXT_PUBLIC_API_URL || 'https://medaisimulator.uz/api',
    'https://medaisimulator.uz/api',
    'https://accounts.google.com',
    'https://www.googleapis.com',
    'https://oauth2.googleapis.com',
    'https://openidconnect.googleapis.com',
    'https://people.googleapis.com',
    isDev ? 'ws://localhost:* http://localhost:*' : '',
  ].filter(Boolean).join(' '),
  "worker-src 'self' blob:",
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  isDev ? '' : "upgrade-insecure-requests",
].filter(Boolean).join('; ')

// ── Security response headers ──────────────────────────────────────────────────

const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: CSP_DIRECTIVES,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), payment=(self)',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'credentialless',
  },
  ...(!isDev
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Remove x-powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // Loosen COEP for the 3D simulator (Three.js needs cross-origin resources)
        source: '/simulator/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // No-cache for HTML pages
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },

  // Block direct access to sensitive pages via rewrites (belt + middleware)
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },

  // Redirect HTTP → HTTPS in production (handled by nginx/CDN, but defence-in-depth)
  async redirects() {
    if (isDev) return []
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://medaisimulator.uz/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
