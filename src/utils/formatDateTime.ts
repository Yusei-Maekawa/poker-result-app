import type { Timestamp } from 'firebase/firestore'

/** 開催日（YYYY-MM-DD）と任意の時刻（HH:mm）を表示用に整形 */
export function formatGameDateTime(date: string, time?: string): string {
  const [y, m, d] = date.split('-')
  const base = `${y}年${Number(m)}月${Number(d)}日`
  if (!time) return base
  return `${base} ${time}`
}

/** Firestore Timestamp を JST 風の絶対日時表示（秒なし） */
export function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return ''
  const date = ts.toDate()
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${d}日 ${h}:${min}`
}

export function getDefaultGameTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
