import { Activity } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
	return (
		<footer className='bg-surface border-t border-border'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
					<div className='col-span-1 md:col-span-2'>
						<Link href='/' className='flex items-center gap-2.5 mb-4'>
							<div className='w-9 h-9 bg-primary rounded-xl flex items-center justify-center'>
								<Activity className='w-5 h-5 text-secondary' />
							</div>
							<span className='text-lg font-bold text-text-primary'>
								Med AI Simulator
							</span>
						</Link>
						<p className='text-sm text-text-secondary max-w-sm'>
							Sun&apos;iy intellekt asosidagi virtual klinik muhit. Tibbiyot
							talabalarining klinik ko&apos;nikmalarini xavfsiz sharoitda
							oshirish platformasi.
						</p>
						<div className='flex gap-4 mt-5'>
							<a
								href='https://t.me/Med_AI_Simulator_Supportbot'
								target='_blank'
								rel='noopener noreferrer'
								className='w-10 h-10 bg-surface-light rounded-xl flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all'
								aria-label='Telegram'
							>
								<svg
									className='w-5 h-5'
									fill='currentColor'
									viewBox='0 0 24 24'
								>
									<path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z' />
								</svg>
							</a>
							<a
								href='#'
								className='w-10 h-10 bg-surface-light rounded-xl flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all'
								aria-label='Instagram'
							>
								<svg
									className='w-5 h-5'
									fill='currentColor'
									viewBox='0 0 24 24'
								>
									<path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' />
								</svg>
							</a>
							<a
								href='#'
								className='w-10 h-10 bg-surface-light rounded-xl flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all'
								aria-label='YouTube'
							>
								<svg
									className='w-5 h-5'
									fill='currentColor'
									viewBox='0 0 24 24'
								>
									<path d='M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
								</svg>
							</a>
						</div>
					</div>

					<div>
						<h4 className='text-sm font-semibold text-text-primary mb-4'>
							Platforma
						</h4>
						<ul className='space-y-3'>
							<li>
								<a
									href='#features'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Xususiyatlar
								</a>
							</li>
							<li>
								<a
									href='#pricing'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Narxlar
								</a>
							</li>
							<li>
								<Link
									href='/cases'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Klinik holatlar
								</Link>
							</li>
							<li>
								<Link
									href='/dashboard'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Dashboard
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className='text-sm font-semibold text-text-primary mb-4'>
							Kompaniya
						</h4>
						<ul className='space-y-3'>
							<li>
								<Link
									href='/contact'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Bog&apos;lanish
								</Link>
							</li>
							<li>
								<a
									href='https://t.me/Med_AI_Simulator_Supportbot'
									target='_blank'
									rel='noopener noreferrer'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Qo&apos;llab-quvvatlash
								</a>
							</li>
							<li>
								<Link
									href='/privacy-policy'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									Maxfiylik siyosati
								</Link>
							</li>
							<li>
								<Link
									href='/payment-terms'
									className='text-sm text-text-secondary hover:text-primary transition-colors'
								>
									To&apos;lov shartlari
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className='mt-10 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4'>
					<p className='text-xs text-text-secondary'>
						© 2026 Med AI Simulator. Barcha huquqlar himoyalangan.
					</p>
					<p className='text-xs text-text-secondary'>
						&quot;Kimningdir yaqini tajribasiz qo&apos;llarda hayotini
						yo&apos;qotmasligi uchun&quot;
					</p>
				</div>
			</div>
		</footer>
	)
}
