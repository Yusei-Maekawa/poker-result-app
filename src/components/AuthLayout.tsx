import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-felt-texture flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🃏</div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Poker League Board
          </h1>
          <p className="text-gold-400/80 text-sm mt-2 font-medium tracking-wider uppercase">
            Season 1
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
