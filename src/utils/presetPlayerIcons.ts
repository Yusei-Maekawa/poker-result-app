/**
 * プロフィール用プリセットアイコン（各要素は Firestore の icon 長さ上限 4 以内）
 * 絵文字は環境によって表示が異なる場合あり
 */
export const PRESET_PLAYER_ICONS = [
  '🃏',
  '🎰',
  '♠️',
  '♥️',
  '♦️',
  '♣️',
  '🎲',
  '💰',
  '🦁',
  '🦊',
  '🐻',
  '🐯',
  '🦉',
  '🐸',
  '🔥',
  '⚡',
  '🌟',
  '💎',
  '🏆',
  '👑',
] as const

export type PresetPlayerIcon = (typeof PRESET_PLAYER_ICONS)[number]

const presetSet = new Set<string>(PRESET_PLAYER_ICONS)

export function isPresetPlayerIcon(icon: string): boolean {
  return presetSet.has(icon)
}

/** 現在値がプリセット外のとき、先頭に差し込んで選択肢に含める（既存データ用） */
export function buildPlayerIconOptions(currentIcon: string): string[] {
  const trimmed = currentIcon.trim()
  if (!trimmed || presetSet.has(trimmed)) return [...PRESET_PLAYER_ICONS]
  if (trimmed.length > 4) return [...PRESET_PLAYER_ICONS]
  return [trimmed, ...PRESET_PLAYER_ICONS]
}
