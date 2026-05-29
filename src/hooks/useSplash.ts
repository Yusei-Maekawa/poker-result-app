import { useEffect, useState } from 'react'
import {
  splashRevealCompleteMs,
  splashTotalDurationMs,
  SPLASH_HOLD_AFTER_REVEAL_MS,
} from '../constants/splash'

/**
 * スプラッシュの表示フェーズ
 *
 * - in   … 書き込みアニメーション中（SplashScreen が isWriting=true）
 * - out  … 書き終わった見た目のまま全体をフェードアウト（isWriting=false）
 * - done … スプラッシュ DOM を外し、BrowserRouter / ホームへ
 */
export type SplashPhase = 'in' | 'out' | 'done'

/** out 開始 = 演出が全部終わったあと + ユーザーに見せる静止時間 */
function splashOutAtMs(): number {
  return splashRevealCompleteMs() + SPLASH_HOLD_AFTER_REVEAL_MS
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 起動時スプラッシュの phase 管理。
 *
 * タイムライン（splash.ts の定数から自動計算）:
 *   t=0              in 開始
 *   t≈reveal完了      下線・Season 1 まで出揃う
 *   t≈reveal+820ms    out 開始（完成形をしばらく静止）
 *   t≈合計~2180ms     done → ホーム
 */
export function useSplash(): SplashPhase {
  const [phase, setPhase] = useState<SplashPhase>(() =>
    prefersReducedMotion() ? 'done' : 'in',
  )

  useEffect(() => {
    if (prefersReducedMotion()) return

    const outAtMs = splashOutAtMs()
    const doneAtMs = splashTotalDurationMs()

    const fadeTimer = window.setTimeout(() => setPhase('out'), outAtMs)
    const doneTimer = window.setTimeout(() => setPhase('done'), doneAtMs)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
    }
  }, [])

  return phase
}
