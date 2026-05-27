import type { ReactNode } from 'react'
import { Header } from './Header'
import { BannedParticipationBanner } from './BannedParticipationBanner'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-felt-texture">
      <BannedParticipationBanner />
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-fade-in">
        {children}
      </main>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">{title}</h1>
        {subtitle && (
          <p className="text-white/50 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}
