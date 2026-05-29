import { useMemo } from 'react'
import { APP_NAME } from '../constants/app'
import {
  SPLASH_BRAND,
  SPLASH_GOLD_LETTER_COUNT,
  SPLASH_LETTER_ANIM_MS,
  SPLASH_LETTER_START_MS,
  SPLASH_LETTER_STAGGER_MS,
  splashWriteDurationMs,
} from '../constants/splash'

type SplashPhase = 'in' | 'out'

type Props = {
  phase: SplashPhase
}

const UNDERLINE_CLASS =
  'mt-2 h-px w-24 bg-gradient-to-r from-gold-500/70 via-gold-400/40 to-transparent'

function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
}

function letterColorClass(index: number): string {
  return index < SPLASH_GOLD_LETTER_COUNT ? 'text-gold-400' : 'text-white/80'
}

function SplashBrandTitle({
  isWriting,
  reducedMotion,
}: {
  isWriting: boolean
  reducedMotion: boolean
}) {
  const letters = SPLASH_BRAND.split('')
  const underlineDelayMs = splashWriteDurationMs() - 80
  const taglineDelayMs = splashWriteDurationMs() + 60
  const cursorDelayMs =
    SPLASH_LETTER_START_MS + (letters.length - 1) * SPLASH_LETTER_STAGGER_MS + 120

  if (reducedMotion) {
    return (
      <div className="flex flex-col items-center">
        <h1 className="font-display font-black text-3xl lg:text-4xl tracking-tight">
          <span className="text-gold-400">Rival</span>
          <span className="text-white/80">t</span>
        </h1>
        <p className="text-gold-400/60 text-xs mt-4 font-medium tracking-[0.2em] uppercase">
          Season 1
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <h1
        className="font-display font-black text-3xl lg:text-4xl tracking-tight flex items-end justify-center"
        aria-hidden
      >
        {letters.map((char, index) => (
          <span
            key={`${char}-${index}`}
            className={
              isWriting
                ? `splash-letter ${letterColorClass(index)}`
                : `inline-block ${letterColorClass(index)}`
            }
            style={
              isWriting
                ? {
                    animationDelay: `${SPLASH_LETTER_START_MS + index * SPLASH_LETTER_STAGGER_MS}ms`,
                    animationDuration: `${SPLASH_LETTER_ANIM_MS}ms`,
                  }
                : undefined
            }
          >
            {char}
          </span>
        ))}
        {isWriting && (
          <span
            className="splash-cursor inline-block w-[2px] h-[0.85em] ml-0.5 mb-[0.08em] bg-gold-400/90"
            style={{
              animationDelay: `${cursorDelayMs}ms`,
              animationDuration: '550ms',
            }}
            aria-hidden
          />
        )}
      </h1>
      <div
        className={isWriting ? `splash-underline ${UNDERLINE_CLASS}` : UNDERLINE_CLASS}
        style={
          isWriting
            ? {
                animationDelay: `${underlineDelayMs}ms`,
                animationDuration: '450ms',
              }
            : undefined
        }
        aria-hidden
      />
      <p
        className={
          isWriting
            ? 'splash-tagline text-gold-400/60 text-xs mt-4 font-medium tracking-[0.2em] uppercase'
            : 'text-gold-400/60 text-xs mt-4 font-medium tracking-[0.2em] uppercase'
        }
        style={
          isWriting
            ? {
                animationDelay: `${taglineDelayMs}ms`,
                animationDuration: '500ms',
              }
            : undefined
        }
      >
        Season 1
      </p>
    </div>
  )
}

export function SplashScreen({ phase }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const isWriting = phase === 'in' && !reducedMotion

  return (
    <div
      className={`splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-felt-texture transition-opacity duration-500 ease-out ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} を読み込み中`}
    >
      <span className="sr-only">{APP_NAME}</span>
      <SplashBrandTitle isWriting={isWriting} reducedMotion={reducedMotion} />
    </div>
  )
}
