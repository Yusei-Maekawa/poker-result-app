import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { usePlayers, useActivePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { calculatePoint } from '../utils/point'

export function NewGamePage() {
  const navigate = useNavigate()
  const { isAdmin, loading: authLoading } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { addGame } = useGames()
  const { addResults } = useResults()

  const activePlayers = useActivePlayers(players)

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [appName, setAppName] = useState('PokerStars')
  const [memo, setMemo] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [rankMap, setRankMap] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (authLoading || playersLoading) return <Layout><Loading /></Layout>

  if (!isAdmin) {
    return (
      <Layout>
        <div className="card py-12 text-center">
          <p className="text-white/50 mb-4">管理者ログインが必要です</p>
          <Link to="/" className="btn-secondary text-sm">ホームへ</Link>
        </div>
      </Layout>
    )
  }

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    )
    // 選択解除時にrankMapからも消す
    setRankMap((prev) => {
      const next = { ...prev }
      if (next[playerId]) delete next[playerId]
      return next
    })
  }

  const setRank = (playerId: string, rank: number) => {
    setRankMap((prev) => ({ ...prev, [playerId]: rank }))
  }

  const validate = (): string | null => {
    if (!date) return '日付を入力してください'
    if (!appName.trim()) return 'アプリ名を入力してください'
    if (selectedPlayerIds.length < 2) return '参加者を2名以上選択してください'
    const n = selectedPlayerIds.length
    const usedRanks = new Set<number>()
    for (const pid of selectedPlayerIds) {
      const rank = rankMap[pid]
      if (!rank) return `すべての参加者に順位を入力してください`
      if (rank < 1 || rank > n) return `順位は1〜${n}の範囲で入力してください`
      if (usedRanks.has(rank)) return `同じ順位が重複しています（${rank}位）`
      usedRanks.add(rank)
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const { id: gameId } = await addGame({ date, appName, memo })

      const n = selectedPlayerIds.length
      const entries = selectedPlayerIds.map((playerId) => {
        const rank = rankMap[playerId]
        const point = calculatePoint(rank, n)
        return { gameId, playerId, rank, point }
      })

      await addResults(entries)

      navigate(`/games/${gameId}`)
    } catch (e) {
      console.error(e)
      setError('保存に失敗しました。再試行してください。')
      setSubmitting(false)
    }
  }

  const n = selectedPlayerIds.length

  return (
    <Layout>
      <Link to="/games" className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block">
        ← 試合一覧
      </Link>

      <PageHeader title="試合結果を追加" />

      <div className="space-y-5">
        {/* 基本情報 */}
        <div className="card px-4 py-4 space-y-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            基本情報
          </h2>

          <div>
            <label className="label">試合日 *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label">使用アプリ名 *</label>
            <input
              className="input"
              placeholder="例: PokerStars, GGPoker"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              メモ
              <span className="text-white/30 ml-1 font-normal">省略可</span>
            </label>
            <input
              className="input"
              placeholder="例: 友達宅で4人戦"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        {/* 参加者選択 */}
        <div className="card px-4 py-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            参加者を選択
            <span className="text-white/30 normal-case ml-2 font-normal">（{selectedPlayerIds.length}名）</span>
          </h2>

          {activePlayers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-white/30 text-sm mb-3">プレイヤーがいません</p>
              <Link to="/players" className="text-gold-400 text-sm hover:text-gold-300">
                プレイヤーを追加する →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activePlayers.map((player) => {
                const selected = selectedPlayerIds.includes(player.id)
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 ${
                      selected
                        ? 'bg-gold-500/15 border-gold-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="text-base">{player.icon || player.name.slice(0, 2)}</span>
                    <span className="text-sm font-medium truncate">{player.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 順位入力 */}
        {selectedPlayerIds.length >= 2 && (
          <div className="card px-4 py-4">
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
              順位を入力
              <span className="text-white/30 normal-case ml-2 font-normal">（1〜{n}位）</span>
            </h2>

            <div className="space-y-2">
              {selectedPlayerIds.map((pid) => {
                const player = activePlayers.find((p) => p.id === pid)
                if (!player) return null
                const rank = rankMap[pid] ?? ''
                const point = rank ? calculatePoint(Number(rank), n) : null

                return (
                  <div key={pid} className="flex items-center gap-3 bg-white/4 rounded-lg px-3 py-2.5">
                    <span className="text-base flex-shrink-0">
                      {player.icon || player.name.slice(0, 2)}
                    </span>
                    <span className="flex-1 text-white text-sm font-medium truncate">
                      {player.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {point !== null && (
                        <span className={`font-mono text-xs w-12 text-right ${point >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                          {point >= 0 ? `+${point}` : point}pt
                        </span>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={n}
                        className="input w-16 text-center text-base font-mono py-1.5"
                        placeholder="—"
                        value={rank}
                        onChange={(e) => setRank(pid, Number(e.target.value))}
                      />
                      <span className="text-white/40 text-sm">位</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* プレビュー */}
            {selectedPlayerIds.every((pid) => rankMap[pid]) && (
              <div className="mt-4 pt-4 border-t border-white/[0.08]">
                <p className="text-white/40 text-xs mb-2">プレビュー（順位順）</p>
                <div className="space-y-1">
                  {[...selectedPlayerIds]
                    .sort((a, b) => (rankMap[a] ?? 99) - (rankMap[b] ?? 99))
                    .map((pid) => {
                      const player = activePlayers.find((p) => p.id === pid)
                      const rank = rankMap[pid]
                      const point = calculatePoint(rank, n)
                      const emoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
                      return (
                        <div key={pid} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-center">{emoji[rank] ?? `${rank}位`}</span>
                          {!emoji[rank] && <span className="w-6 text-center text-white/50 text-xs">{rank}位</span>}
                          <span className="flex-1 text-white/80">{player?.name}</span>
                          <span className={`font-mono text-xs ${point >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                            {point >= 0 ? `+${point}` : point}pt
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-900/30 border border-red-800/40 rounded-lg px-4 py-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* 保存ボタン */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full text-base py-3"
        >
          {submitting ? '保存中...' : '試合結果を保存'}
        </button>
      </div>
    </Layout>
  )
}
