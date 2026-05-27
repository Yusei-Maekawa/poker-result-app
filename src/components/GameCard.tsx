import { Link } from 'react-router-dom'
import type { Game, Result, Player } from '../types'

interface GameCardProps {
  game: Game
  results: Result[]
  players: Player[]
  compact?: boolean
}

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function GameCard({ game, results, players, compact = false }: GameCardProps) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank)
  const playerMap = new Map(players.map((p) => [p.id, p]))

  const winner = sorted.find((r) => r.rank === 1)
  const winnerPlayer = winner ? playerMap.get(winner.playerId) : undefined
  const winnerName = winnerPlayer && winnerPlayer.isActive ? winnerPlayer.name : '—'
  const top3 = sorted.slice(0, 3)

  const formattedDate = formatDate(game.date)

  if (compact) {
    return (
      <Link to={`/games/${game.id}`} className="card px-4 py-3 block hover:border-white/15 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white/40 text-xs font-mono">#{game.gameNo}</span>
            <p className="text-white font-medium text-sm mt-0.5">{formattedDate}</p>
            <p className="text-white/50 text-xs mt-0.5">🥇 {winnerName}</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-xs">{game.appName}</p>
            <p className="text-white/40 text-xs mt-1">{results.length}人参加</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="card px-4 py-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs font-mono">第{game.gameNo}戦</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/50 text-xs">{game.appName}</span>
          </div>
          <p className="text-white font-semibold mt-0.5">{formattedDate}</p>
        </div>
        <span className="text-white/30 text-xs bg-white/5 px-2 py-1 rounded-full">
          {results.length}人参加
        </span>
      </div>

      {/* 上位3名 */}
      <div className="space-y-1.5 mb-3">
        {top3.map((r) => {
          const player = playerMap.get(r.playerId)
          const pointStr = r.point >= 0 ? `+${r.point}pt` : `${r.point}pt`
          return (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-5 text-sm">{RANK_EMOJI[r.rank]}</span>
              <span className="text-white/80 text-sm flex-1">
                {player && player.isActive ? player.name : '—'}
              </span>
              <span className={`font-mono text-xs ${r.point >= 0 ? 'text-gold-400/70' : 'text-red-400/70'}`}>
                {pointStr}
              </span>
            </div>
          )
        })}
      </div>

      {game.memo && (
        <p className="text-white/35 text-xs border-t border-white/6 pt-2 mb-3 line-clamp-2">
          📝 {game.memo}
        </p>
      )}

      <Link
        to={`/games/${game.id}`}
        className="text-gold-400/70 hover:text-gold-400 text-xs font-medium transition-colors"
      >
        詳細を見る →
      </Link>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}
