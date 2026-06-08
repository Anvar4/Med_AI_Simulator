'use client'

import ChatWidget from '@/components/ChatWidget'
import BetaBanner from '@/components/layout/BetaBanner'
import { AuthProvider } from '@/lib/auth-context'
import { DialogProvider } from '@/lib/dialog-context'
import { LanguageProvider } from '@/lib/language-context'
import { ThemeProvider } from '@/lib/theme-context'
import { ToastProvider } from '@/lib/toast-context'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function Providers({ children }: { children: ReactNode }) {
	return (
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<AuthProvider>
				<LanguageProvider>
					<ThemeProvider>
						<ToastProvider>
							<DialogProvider>
								<BetaBanner />
								{children}
								<ChatWidget />
							</DialogProvider>
						</ToastProvider>
					</ThemeProvider>
				</LanguageProvider>
			</AuthProvider>
		</GoogleOAuthProvider>
	)
}
