import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useGameResults } from '../hooks/useResults'
import { buildDiscordMessage } from '../utils/discord'
import type { ResultWithPlayer } from '../types'

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useGameResults(gameId ?? '')
  const [copied, setCopied] = useState(false)

  const loading = playersLoading || gamesLoading || resultsLoading

  const game = games.find((g) => g.id === gameId)
  const playerMap = new Map(players.map((p) => [p.id, p]))

  const resultsWithPlayer: ResultWithPlayer[] = results
    .map((r) => {
      const player = playerMap.get(r.playerId)
      if (!player) return null
      return { ...r, player }
    })
    .filter((r): r is ResultWithPlayer => r !== null)
    .sort((a, b) => a.rank - b.rank)

  const handleCopy = async () => {
    if (!game) return
    const text = buildDiscordMessage(game, resultsWithPlayer)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <Layout><Loading /></Layout>

  if (!game) {
    return (
      <Layout>
        <div className="card py-12 text-center">
          <p className="text-white/30 mb-4">試合が見つかりません</p>
          <Link to="/games" className="btn-secondary text-sm">試合一覧へ</Link>
        </div>
      </Layout>
    )
  }

  const discordText = buildDiscordMessage(game, resultsWithPlayer)
  const formattedDate = formatDate(game.date)

  return (
    <Layout>
      {/* 戻るリンク */}
      <Link to="/games" className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block">
        ← 試合一覧
      </Link>

      {/* ゲーム情報 */}
      <div className="card-gold px-4 py-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gold-400/60 text-xs font-mono">第{game.gameNo}戦</p>
            <h1 className="font-display font-bold text-xl text-white mt-1">{formattedDate}</h1>
            <p className="text-white/50 text-sm mt-0.5">🎮 {game.appName}</p>
          </div>
          <span className="text-white/30 text-sm bg-white/5 px-3 py-1 rounded-full">
            {results.length}人参加
          </span>
        </div>
        {game.memo && (
          <p className="text-white/50 text-sm mt-3 pt-3 border-t border-white/[0.08]">
            📝 {game.memo}
          </p>
        )}
      </div>

      {/* 結果一覧 */}
      <div className="card px-4 py-4 mb-4">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          結果
        </h2>
        <div className="space-y-2">
          {resultsWithPlayer.map((r) => {
            const emoji = RANK_EMOJI[r.rank]
            const pointStr = r.point >= 0 ? `+${r.point}` : `${r.point}`
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg ${
                  r.rank === 1 ? 'bg-gold-500/[0.08]' : 'bg-white/[0.03]'
                }`}
              >
                <span className="w-7 text-center text-lg">
                  {emoji ?? <span className="text-white/40 font-mono text-sm">{r.rank}位</span>}
                </span>
                {!emoji && (
                  <span className="w-7 text-center text-white/40 font-mono text-sm -ml-7">
                    {r.rank}位
                  </span>
                )}
                <div
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center
                             text-sm font-bold flex-shrink-0"
                >
                  {r.player.icon}
                </div>
                <span className="flex-1 text-white font-medium">{r.player.name}</span>
                <span
                  className={`font-mono font-bold text-base ${
                    r.point >= 0 ? 'text-gold-400' : 'text-red-400'
                  }`}
                >
                  {pointStr}pt
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Discord共有文 */}
      <div className="card px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Discord 共有文
          </h2>
          <button
            onClick={handleCopy}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gold-500/15 text-gold-400 border border-gold-500/30 hover:bg-gold-500/25'
            }`}
          >
            {copied ? '✓ コピー済み' : 'コピー'}
          </button>
        </div>
        <pre className="text-white/70 text-xs font-mono whitespace-pre-wrap bg-black/30 rounded-lg p-3 leading-relaxed overflow-x-auto">
          {discordText}
        </pre>
      </div>
    </Layout>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}
