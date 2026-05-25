import type { Game, ResultWithPlayer } from '../types'

/**
 * Discord 共有文を生成する
 */
export function buildDiscordMessage(
  game: Game,
  results: ResultWithPlayer[],
): string {
  const sorted = [...results].sort((a, b) => a.rank - b.rank)
  const rankEmoji: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  }

  const lines: string[] = [
    `🃏 **ポーカーリーグ第${game.gameNo}戦 結果** 🃏`,
    `📅 ${formatDate(game.date)}`,
    `🎮 ${game.appName}`,
    '',
    '━━━━━━━━━━━━━━━━━',
    '',
  ]

  for (const r of sorted) {
    const emoji = rankEmoji[r.rank] ?? `${r.rank}位`
    const pointStr = r.point >= 0 ? `+${r.point}pt` : `${r.point}pt`
    lines.push(`${emoji} ${r.player.name} （${pointStr}）`)
  }

  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━')

  if (game.memo) {
    lines.push('')
    lines.push(`📝 ${game.memo}`)
  }

  return lines.join('\n')
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}
