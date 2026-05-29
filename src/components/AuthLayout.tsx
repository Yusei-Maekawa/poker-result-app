import type { ReactNode } from 'react'
import { APP_NAME } from '../constants/app'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-felt-texture flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md lg:max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-2xl lg:text-3xl tracking-tight">
            <span className="text-gold-400">Rival</span>
            <span className="text-white/80">t</span>
            <span className="sr-only">{APP_NAME}</span>
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
