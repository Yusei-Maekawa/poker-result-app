import { Layout, PageHeader } from '../components/Layout'
import { RankingCard } from '../components/RankingCard'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { buildRankingStats } from '../utils/ranking'

export function RankingPage() {
  const { players, loading: playersLoading } = usePlayers()
  const { results, loading: resultsLoading } = useResults()

  const loading = playersLoading || resultsLoading
  const stats = buildRankingStats(players, results)

  return (
    <Layout>
      <PageHeader
        title="ランキング"
        subtitle={`Season 1 · ${stats.length}名参加`}
      />

      {loading ? (
        <Loading />
      ) : stats.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30">まだデータがありません</p>
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up">
          {stats.map((stat, i) => (
            <RankingCard key={stat.player.id} stat={stat} rank={i + 1} />
          ))}
        </div>
      )}

      {/* ポイントルール説明 */}
      <div className="mt-8 card px-4 py-4">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          ポイントルール
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: '🥇 1位', pt: '+7' },
            { label: '🥈 2位', pt: '+5' },
            { label: '🥉 3位', pt: '+3' },
            { label: '4位', pt: '+1' },
            { label: '5位以下', pt: '0' },
            { label: '最下位', pt: '-2' },
          ].map(({ label, pt }) => (
            <div key={label} className="bg-white/5 rounded-lg py-2">
              <p className="text-white/70 text-xs">{label}</p>
              <p className={`font-mono font-bold text-sm mt-0.5 ${pt.startsWith('-') ? 'text-red-400' : 'text-gold-400'}`}>
                {pt}
              </p>
            </div>
          ))}
        </div>
        <p className="text-white/25 text-xs mt-3 text-center">
          ※ 最下位は順位ポイントより最下位ペナルティ（-2）が優先されます
        </p>
      </div>
    </Layout>
  )
}
