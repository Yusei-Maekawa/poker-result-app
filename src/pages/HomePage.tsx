import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RankingCard } from '../components/RankingCard'
import { GameCard } from '../components/GameCard'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { buildRankingStats } from '../utils/ranking'

export function HomePage() {
  const { isAdmin } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { results, loading: resultsLoading } = useResults()

  const loading = playersLoading || gamesLoading || resultsLoading

  const stats = buildRankingStats(players, results)
  const top3Stats = stats.slice(0, 3)

  // 直近3試合（gameNo降順）
  const recentGames = [...games]
    .sort((a, b) => b.gameNo - a.gameNo)
    .slice(0, 3)

  return (
    <Layout>
      {/* ヒーロー */}
      <div className="text-center mb-8 mt-2">
        <div className="text-4xl mb-2">🃏</div>
        <h1 className="font-display font-black text-3xl text-white tracking-tight">
          Poker League Board
        </h1>
        <p className="text-gold-400/80 text-sm mt-1 font-medium tracking-wider uppercase">
          Season 1
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* ランキング上位 */}
          <section className="mb-8">
            <SectionHeader title="🏆 ランキング" link="/ranking" linkLabel="全て見る" />
            {top3Stats.length === 0 ? (
              <EmptyState text="まだデータがありません" />
            ) : (
              <div className="space-y-2">
                {top3Stats.map((stat, i) => (
                  <RankingCard key={stat.player.id} stat={stat} rank={i + 1} compact />
                ))}
              </div>
            )}
          </section>

          {/* 直近の試合 */}
          <section className="mb-8">
            <SectionHeader title="🎮 直近の試合" link="/games" linkLabel="全て見る" />
            {recentGames.length === 0 ? (
              <EmptyState text="まだ試合がありません" />
            ) : (
              <div className="space-y-2">
                {recentGames.map((game) => {
                  const gameResults = results.filter((r) => r.gameId === game.id)
                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      results={gameResults}
                      players={players}
                      compact
                    />
                  )
                })}
              </div>
            )}
          </section>

          {/* 管理者向けアクション */}
          {isAdmin && (
            <div className="mt-6">
              <Link to="/games/new" className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                <span>＋</span>
                <span>試合結果を追加</span>
              </Link>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}

function SectionHeader({
  title,
  link,
  linkLabel,
}: {
  title: string
  link: string
  linkLabel: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display font-bold text-lg text-white">{title}</h2>
      <Link
        to={link}
        className="text-gold-400/70 hover:text-gold-400 text-xs font-medium transition-colors"
      >
        {linkLabel} →
      </Link>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card py-8 text-center">
      <p className="text-white/30 text-sm">{text}</p>
    </div>
  )
}
