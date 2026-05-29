import { Link, useParams } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import {
  computePodiumStreaks,
  formatWinRate,
  getPlayerRankingStat,
  getPlayerRecentGames,
} from '../utils/playerStats'
import { formatGameDateTime } from '../utils/formatDateTime'

export function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const { myPlayer } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useResults()

  const loading = playersLoading || gamesLoading || resultsLoading
  const player = players.find((p) => p.id === playerId)

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    )
  }

  if (!player) {
    return (
      <Layout>
        <div className="card py-12 text-center">
          <p className="text-white/30 mb-4">プレイヤーが見つかりません</p>
          <Link to="/players" className="btn-secondary text-sm">
            プレイヤー一覧へ
          </Link>
        </div>
      </Layout>
    )
  }

  const stat = getPlayerRankingStat(player.id, players, results)
  const recent = getPlayerRecentGames(player.id, games, results, 5)
  const streaks = computePodiumStreaks(player.id, games, results)
  const isMe = myPlayer?.id === player.id

  return (
    <Layout>
      <Link
        to="/players"
        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"
      >
        ← プレイヤー一覧
      </Link>

      <div className="card px-4 py-4 mb-4 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold shrink-0">
          {player.icon || player.name.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-xl text-white truncate">
            {player.name}
            {isMe && (
              <span className="text-gold-400/80 text-sm font-normal ml-2">（あなた）</span>
            )}
          </h1>
          {!player.isActive && (
            <p className="text-amber-400/85 text-xs mt-1">
              このプレイヤーは現在リーグ参加を停止されています
            </p>
          )}
          {player.memo && (
            <p className="text-white/50 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
              {player.memo}
            </p>
          )}
        </div>
      </div>

      {stat ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <StatCard label="合計ポイント" value={`${stat.totalPoint >= 0 ? '+' : ''}${stat.totalPoint}`} />
            <StatCard label="参加" value={`${stat.playCount}試合`} />
            <StatCard label="優勝率" value={formatWinRate(stat.winCount, stat.playCount)} />
            <StatCard label="入賞率" value={`${stat.podiumRate}%`} />
            <StatCard label="平均順位" value={stat.playCount > 0 ? `${stat.avgRank}位` : '—'} />
            <StatCard label="最下位" value={`${stat.lastPlaceCount}回`} />
          </div>

          <div className="card px-4 py-4 mb-4">
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
              連続入賞
            </h2>
            <p className="text-white text-sm">
              最長 <span className="text-gold-400 font-semibold">{streaks.longest}</span> 試合
              <span className="text-white/30 mx-2">·</span>
              現在 <span className="text-gold-400 font-semibold">{streaks.current}</span> 試合
            </p>
          </div>
        </>
      ) : (
        <div className="card py-8 text-center mb-4">
          <p className="text-white/30 text-sm">まだ試合に参加していません</p>
        </div>
      )}

      <section>
        <PageHeader title="直近5試合" />
        {recent.length === 0 ? (
          <div className="card py-8 text-center">
            <p className="text-white/30 text-sm">データがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(({ game, result }) => {
              const pointStr = result.point >= 0 ? `+${result.point}` : `${result.point}`
              return (
                <Link
                  key={result.id}
                  to={`/games/${game.id}`}
                  className="card px-4 py-3 flex items-center gap-3 hover:border-white/15 transition-colors block"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-xs font-mono">第{game.gameNo}戦</p>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {formatGameDateTime(game.date, game.time)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold">{result.rank}位</p>
                    <p
                      className={`font-mono text-xs ${
                        result.point >= 0 ? 'text-gold-400/70' : 'text-red-400/70'
                      }`}
                    >
                      {pointStr}pt
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <div className="mt-6 text-center">
        <Link to="/games" className="text-gold-400/70 hover:text-gold-400 text-sm font-medium">
          試合一覧を見る →
        </Link>
      </div>
    </Layout>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white font-semibold text-sm mt-1 font-mono">{value}</p>
    </div>
  )
}
