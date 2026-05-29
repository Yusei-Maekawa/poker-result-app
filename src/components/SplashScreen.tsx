import { useMemo } from 'react'
import { APP_NAME } from '../constants/app'
import {
  SPLASH_BRAND,
  SPLASH_CURSOR_ANIM_MS,
  SPLASH_GOLD_LETTER_COUNT,
  SPLASH_LETTER_ANIM_MS,
  SPLASH_LETTER_START_MS,
  SPLASH_LETTER_STAGGER_MS,
  SPLASH_TAGLINE_ANIM_MS,
  SPLASH_UNDERLINE_ANIM_MS,
  splashCursorDelayMs,
  splashTaglineDelayMs,
  splashUnderlineDelayMs,
} from '../constants/splash'

/**
 * SplashScreen … 見た目と各要素の animation-delay
 * useSplash … phase の切り替えは splashRevealCompleteMs + HOLD 後（splash.ts 参照）
 *
 * phase ごとの見え方:
 *   in  … isWriting=true  → 文字・カーソル・下線・Season 1 が順にアニメ
 *   out … isWriting=false → アニメは止め、完成形のまま親 div が opacity 0 へ
 */

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
        {/* 各文字: delay = START + index×STAGGER、長さ = LETTER_ANIM */}
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
        {/* カーソル: 最後の文字のあと（out では非表示） */}
        {isWriting && (
          <span
            className="splash-cursor inline-block w-[2px] h-[0.85em] ml-0.5 mb-[0.08em] bg-gold-400/90"
            style={{
              animationDelay: `${splashCursorDelayMs()}ms`,
              animationDuration: `${SPLASH_CURSOR_ANIM_MS}ms`,
            }}
            aria-hidden
          />
        )}
      </h1>
      {/* 下線: 書き込み完了の少し手前から伸びる */}
      <div
        className={isWriting ? `splash-underline ${UNDERLINE_CLASS}` : UNDERLINE_CLASS}
        style={
          isWriting
            ? {
                animationDelay: `${splashUnderlineDelayMs()}ms`,
                animationDuration: `${SPLASH_UNDERLINE_ANIM_MS}ms`,
              }
            : undefined
        }
        aria-hidden
      />
      {/* Season 1: 書き込み完了直後 */}
      <p
        className={
          isWriting
            ? 'splash-tagline text-gold-400/60 text-xs mt-4 font-medium tracking-[0.2em] uppercase'
            : 'text-gold-400/60 text-xs mt-4 font-medium tracking-[0.2em] uppercase'
        }
        style={
          isWriting
            ? {
                animationDelay: `${splashTaglineDelayMs()}ms`,
                animationDuration: `${SPLASH_TAGLINE_ANIM_MS}ms`,
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
  // out のときは false にして、文字・下線を完成形のままフェードさせる（レイアウト切替しない）
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
