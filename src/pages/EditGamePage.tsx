import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useGameResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { calculatePoint } from '../utils/point'
import { LimitedTextField } from '../components/LimitedTextField'
import { validateGameForm, parseRankInput } from '../utils/validateGame'
import { GAME_LIMITS } from '../utils/validationLimits'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function EditGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { isAdmin, loading: authLoading } = useAuth()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading, updateGameWithResults } = useGames()
  const { results, loading: resultsLoading } = useGameResults(gameId ?? '')

  const game = games.find((g) => g.id === gameId)

  const [date, setDate] = useState('')
  const [appName, setAppName] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [rankMap, setRankMap] = useState<Record<string, number>>({})
  const [initialized, setInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!game || resultsLoading || initialized) return

    setDate(game.date)
    setAppName(game.appName)
    setMemo(game.memo)

    const ids = results.map((r) => r.playerId)
    setSelectedPlayerIds(ids)

    const ranks: Record<string, number> = {}
    for (const r of results) {
      ranks[r.playerId] = r.rank
    }
    setRankMap(ranks)
    setInitialized(true)
  }, [game, results, resultsLoading, initialized])

  const loading = authLoading || playersLoading || gamesLoading || resultsLoading

  if (loading) return <Layout><Loading /></Layout>

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

  const participantIds = new Set(results.map((r) => r.playerId))
  const selectablePlayers = players.filter(
    (p) => p.authUid && (p.isActive || participantIds.has(p.id)),
  )

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    )
    setRankMap((prev) => {
      const next = { ...prev }
      if (next[playerId]) delete next[playerId]
      return next
    })
  }

  const setRank = (playerId: string, rank: number | undefined) => {
    setRankMap((prev) => {
      if (rank === undefined) {
        const next = { ...prev }
        delete next[playerId]
        return next
      }
      return { ...prev, [playerId]: rank }
    })
  }

  const handleSubmit = async () => {
    if (!gameId) return

    const validationError = validateGameForm(
      date,
      appName,
      memo,
      selectedPlayerIds,
      rankMap,
    )
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const n = selectedPlayerIds.length
      const entries = selectedPlayerIds.map((playerId) => {
        const rank = rankMap[playerId]
        const point = calculatePoint(rank, n)
        return { playerId, rank, point }
      })

      await updateGameWithResults(gameId, { date, appName, memo, entries })
      navigate(`/games/${gameId}`)
    } catch (e) {
      console.error(e)
      setError(
        getFirebaseErrorMessage(
          e,
          '更新に失敗しました。再試行してください。',
        ),
      )
      setSubmitting(false)
    }
  }

  const n = selectedPlayerIds.length

  return (
    <Layout>
      <Link
        to={`/games/${gameId}`}
        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"
      >
        ← 試合詳細
      </Link>

      <PageHeader title={`第${game.gameNo}戦を編集`} />

      <div className="space-y-5">
        <div className="card px-4 py-4 space-y-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            基本情報
          </h2>

          <div>
            <label className="label">開催日 *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <LimitedTextField
            label="使用アプリ名"
            value={appName}
            maxLength={GAME_LIMITS.appName}
            hint="ポーカーアプリ名（40文字まで）"
            onChange={(e) => setAppName(e.target.value)}
          />

          <LimitedTextField
            label="メモ"
            optional
            multiline
            value={memo}
            maxLength={GAME_LIMITS.memo}
            hint="試合の補足（100文字まで）"
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="card px-4 py-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            参加者を選択
            <span className="text-white/30 normal-case ml-2 font-normal">
              （{selectedPlayerIds.length}名 · 2〜{GAME_LIMITS.maxParticipants}名）
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectablePlayers.map((player) => {
              const selected = selectedPlayerIds.includes(player.id)
              return (
                <button
                  key={player.id}
                  type="button"
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
        </div>

        {selectedPlayerIds.length >= 2 && (
          <div className="card px-4 py-4">
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
              順位を入力
              <span className="text-white/30 normal-case ml-2 font-normal">（1〜{n}位）</span>
            </h2>

            <div className="space-y-2">
              {selectedPlayerIds.map((pid) => {
                const player = selectablePlayers.find((p) => p.id === pid)
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
                        <span
                          className={`font-mono text-xs w-12 text-right ${
                            point >= 0 ? 'text-gold-400' : 'text-red-400'
                          }`}
                        >
                          {point >= 0 ? `+${point}` : point}pt
                        </span>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={n}
                        className="input w-16 text-center text-base font-mono py-1.5"
                        value={rank}
                        onChange={(e) => setRank(pid, parseRankInput(e.target.value))}
                      />
                      <span className="text-white/40 text-sm">位</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800/40 rounded-lg px-4 py-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full text-base py-3"
        >
          {submitting ? '更新中...' : '変更を保存'}
        </button>
      </div>
    </Layout>
  )
}
