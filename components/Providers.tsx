'use client'

import ChatWidget from '@/components/ChatWidget'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function Providers({ children }: { children: ReactNode }) {
	return (
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<AuthProvider>
				<ThemeProvider>
					{children}
					<ChatWidget />
				</ThemeProvider>
			</AuthProvider>
		</GoogleOAuthProvider>
	)
}
