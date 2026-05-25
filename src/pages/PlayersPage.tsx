import { useState } from 'react'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'

export function PlayersPage() {
  const { isAdmin } = useAuth()
  const { players, loading, addPlayer } = usePlayers()
  const { results } = useResults()

  const [form, setForm] = useState({ name: '', icon: '', memo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('名前を入力してください')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addPlayer(form)
      setForm({ name: '', icon: '', memo: '' })
    } catch (e) {
      console.error(e)
      setError('追加に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const activePlayers = players.filter((p) => p.isActive)

  // プレイヤーごとの参加回数
  const playCountMap = new Map<string, number>()
  for (const r of results) {
    playCountMap.set(r.playerId, (playCountMap.get(r.playerId) ?? 0) + 1)
  }

  return (
    <Layout>
      <PageHeader
        title="プレイヤー"
        subtitle={`${activePlayers.length}名`}
      />

      {/* プレイヤー追加フォーム（管理者のみ） */}
      {isAdmin && (
        <div className="card px-4 py-4 mb-6">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            プレイヤーを追加
          </h2>
          <div className="space-y-3">
            <div>
              <label className="label">名前 *</label>
              <input
                className="input"
                placeholder="例: たろう"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                アイコン（絵文字 or 文字）
                <span className="text-white/30 ml-1 font-normal">省略可</span>
              </label>
              <input
                className="input"
                placeholder="例: 🃏 または「た」"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                メモ
                <span className="text-white/30 ml-1 font-normal">省略可</span>
              </label>
              <input
                className="input"
                placeholder="例: ブラフ好き"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? '追加中...' : '追加する'}
            </button>
          </div>
        </div>
      )}

      {/* プレイヤー一覧 */}
      {loading ? (
        <Loading />
      ) : activePlayers.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-white/30">まだプレイヤーがいません</p>
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up">
          {activePlayers.map((player) => {
            const count = playCountMap.get(player.id) ?? 0
            return (
              <div key={player.id} className="card px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {player.icon || player.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{player.name}</p>
                  {player.memo && (
                    <p className="text-white/40 text-xs truncate">{player.memo}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white/50 text-xs">{count}試合</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
