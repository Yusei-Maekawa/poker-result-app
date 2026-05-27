import type { Game, ResultWithPlayer } from '../types'

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
    `📅 ${formatDate(game.date)}  ·  🎮 ${game.appName}  ·  👥 ${sorted.length}人`,
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

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}
