/**
 * スプラッシュ演出のタイミング定数（すべてミリ秒）
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 全体の流れ（useSplash.ts が phase を切り替える）                          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  0ms       phase: in  ─ 文字が素早く順に表示                              │
 * │  ~480ms    6文字の書き込み完了（splashWriteDurationMs）                   │
 * │  ~860ms    下線・Season 1 も含め演出完了（splashRevealCompleteMs）         │
 * │  ~1680ms   phase: out ─ 完成形を約820ms見せたあとフェードアウト開始         │
 * │  ~2180ms   phase: done → ホーム（合計は従来どおり約2秒前後）               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * 調整の考え方:
 *   - 文字は速く（合計時間を食わない）
 *   - ホームへ行くタイミングは「Season 1 まで出揃った後」の静止時間で決める
 *
 * データ読み込み:
 *   AppProvider がスプラッシュ表示中から Firestore を購読開始（App.tsx）。
 *   スプラッシュ時間は固定のまま、ホーム到着時に Loading が出にくくなる。
 */

/** 最初の1文字（R）が動き始めるまでの待ち時間 */
export const SPLASH_LETTER_START_MS = 25

/** 次の文字が始まるまでの間隔（短いほどテンポアップ） */
export const SPLASH_LETTER_STAGGER_MS = 42

/** 各文字が現れるアニメーションの長さ */
export const SPLASH_LETTER_ANIM_MS = 200

export const SPLASH_BRAND = 'Rivalt'
/** "Rival" までゴールド、"t" だけ白 */
export const SPLASH_GOLD_LETTER_COUNT = 5

/** カーソル点滅の長さ */
export const SPLASH_CURSOR_ANIM_MS = 350

/** 下線が伸びるアニメーションの長さ */
export const SPLASH_UNDERLINE_ANIM_MS = 350

/** Season 1 が現れるアニメーションの長さ */
export const SPLASH_TAGLINE_ANIM_MS = 380

/** 下線開始 = 書き込み完了の何 ms 前から */
export const SPLASH_UNDERLINE_LEAD_MS = 50

/** Season 1 開始 = 書き込み完了の何 ms 後から */
export const SPLASH_TAGLINE_LAG_MS = 30

/** 最後の文字の直後、カーソルが出るまでの余白 */
export const SPLASH_CURSOR_LAG_MS = 80

/**
 * 下線・Season 1 が出揃ったあと、ホームに行く前にロゴを見せる時間。
 * （以前は「文字だけ書き終わった時点」でカウントしていた）
 */
export const SPLASH_HOLD_AFTER_REVEAL_MS = 820

/** phase:out の画面全体フェード（SplashScreen の duration-500 と揃える） */
export const SPLASH_FADE_MS = 500

/**
 * 「Rivalt」6文字がすべて書き終わる目安時刻。
 * 現在: 25 + 6×42 + 200 ≒ 477ms
 */
export function splashWriteDurationMs(): number {
  return (
    SPLASH_LETTER_START_MS +
    SPLASH_BRAND.length * SPLASH_LETTER_STAGGER_MS +
    SPLASH_LETTER_ANIM_MS
  )
}

/** 下線アニメーションの animation-delay */
export function splashUnderlineDelayMs(): number {
  return splashWriteDurationMs() - SPLASH_UNDERLINE_LEAD_MS
}

/** Season 1 の animation-delay */
export function splashTaglineDelayMs(): number {
  return splashWriteDurationMs() + SPLASH_TAGLINE_LAG_MS
}

/** カーソルの animation-delay */
export function splashCursorDelayMs(): number {
  return (
    SPLASH_LETTER_START_MS +
    (SPLASH_BRAND.length - 1) * SPLASH_LETTER_STAGGER_MS +
    SPLASH_CURSOR_LAG_MS
  )
}

/** 下線・Season 1 など、画面上の演出がすべて終わる時刻 */
export function splashRevealCompleteMs(): number {
  return Math.max(
    splashWriteDurationMs(),
    splashUnderlineDelayMs() + SPLASH_UNDERLINE_ANIM_MS,
    splashTaglineDelayMs() + SPLASH_TAGLINE_ANIM_MS,
  )
}

/** phase:in が始まってから phase:done になるまでの目安（コメント用） */
export function splashTotalDurationMs(): number {
  return splashRevealCompleteMs() + SPLASH_HOLD_AFTER_REVEAL_MS + SPLASH_FADE_MS
}
