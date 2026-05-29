import type { Game, ResultWithPlayer } from '../types'
import { formatGameDateTime } from './formatDateTime'

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * Discord 共有文を生成する
 */
export function buildDiscordMessage(
  game: Game,
  results: ResultWithPlayer[],
): string {
  const sorted = [...results].sort((a, b) => a.rank - b.rank)

  const lines: string[] = [
    `🃏 **ポーカーリーグ 第${game.gameNo}戦 結果** 🃏`,
    `📅 ${formatGameDateTime(game.date, game.time)}  ·  🎮 ${game.appName}  ·  👥 ${sorted.length}人`,
    '',
    '```',
    ...sorted.map((r) => {
      const emoji = RANK_EMOJI[r.rank] ?? `${r.rank}位`
      const pointStr = r.point >= 0 ? `+${r.point}pt` : `${r.point}pt`
      return `${emoji}  ${r.player.name}  ${pointStr}`
    }),
    '```',
  ]

  if (game.memo.trim()) {
    lines.push('', `📝 ${game.memo.trim()}`)
  }

  return lines.join('\n')
}
