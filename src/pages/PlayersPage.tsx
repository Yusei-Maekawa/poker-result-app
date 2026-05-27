import { useState } from 'react'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { useAdmins } from '../hooks/useAdmins'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { buildRankingStats } from '../utils/ranking'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function PlayersPage() {
  const { user, isAdmin, canManageAdmins } = useAuth()
  const {
    admins,
    loading: adminsLoading,
    error: adminsError,
    addAdmin,
    removeAdmin,
  } = useAdmins(canManageAdmins)
  const { players, loading: playersLoading, addPlayer } = usePlayers()
  const { results, loading: resultsLoading } = useResults()

  const [form, setForm] = useState({ name: '', icon: '', memo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [adminForm, setAdminForm] = useState({ uid: '', note: '' })
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [removingAdminUid, setRemovingAdminUid] = useState('')

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
      setError(
        getFirebaseErrorMessage(e, 'プレイヤーの追加に失敗しました。'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddAdmin = async () => {
    const uid = adminForm.uid.trim()

    if (!uid) {
      setAdminError('UID を入力してください')
      return
    }

    if (!user) {
      setAdminError('ログイン状態を確認してください')
      return
    }

    setAdminError('')
    setAdminSubmitting(true)

    try {
      await addAdmin(uid, user.uid, adminForm.note)
      setAdminForm({ uid: '', note: '' })
    } catch (e) {
      console.error(e)
      setAdminError(
        getFirebaseErrorMessage(e, '管理者の追加に失敗しました。'),
      )
    } finally {
      setAdminSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (uid: string) => {
    setAdminError('')
    setRemovingAdminUid(uid)

    try {
      await removeAdmin(uid)
    } catch (e) {
      console.error(e)
      setAdminError(
        getFirebaseErrorMessage(e, '管理者の削除に失敗しました。'),
      )
    } finally {
      setRemovingAdminUid('')
    }
  }

  const activePlayers = players.filter((p) => p.isActive)
  const rankingStats = buildRankingStats(players, results)
  const totalPointMap = new Map(
    rankingStats.map((stat) => [stat.player.id, stat.totalPoint]),
  )
  const loading = playersLoading || resultsLoading

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

      {user && !canManageAdmins && (
        <div className="card px-4 py-4 mb-6">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            ログイン情報
          </h2>
          <p className="text-white/40 text-xs mb-1">管理者追加に使うあなたの UID</p>
          <p className="text-white/80 text-sm font-mono break-all">{user.uid}</p>
          <p className="text-white/30 text-xs mt-2">
            管理者にこの UID を共有すると、GUI から管理者追加できます。
          </p>
        </div>
      )}

      {canManageAdmins && (
        <div className="card px-4 py-4 mb-6">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            管理者設定
          </h2>

          <div className="space-y-3">

            <div>
              <label className="label">追加する管理者 UID *</label>
              <input
                className="input font-mono"
                placeholder="例: abc123..."
                value={adminForm.uid}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, uid: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">
                メモ
                <span className="text-white/30 ml-1 font-normal">省略可</span>
              </label>
              <input
                className="input"
                placeholder="例: サブ管理者"
                value={adminForm.note}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, note: e.target.value })
                }
              />
            </div>

            {adminError && (
              <p className="text-red-400 text-sm">{adminError}</p>
            )}
            {adminsError && (
              <p className="text-red-400 text-sm">{adminsError}</p>
            )}

            <button
              onClick={handleAddAdmin}
              disabled={adminSubmitting}
              className="btn-primary w-full"
            >
              {adminSubmitting ? '追加中...' : '管理者を追加'}
            </button>

            <div className="pt-2 border-t border-white/10">
              <p className="text-white/40 text-xs mb-3">追加済みの管理者</p>

              {adminsLoading ? (
                <Loading />
              ) : admins.length === 0 ? (
                <p className="text-white/30 text-sm">
                  まだ追加された管理者はいません
                </p>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="bg-white/5 rounded-lg px-3 py-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-mono break-all">
                          {admin.uid}
                        </p>
                        {admin.note && (
                          <p className="text-white/40 text-xs mt-1">
                            {admin.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAdmin(admin.uid)}
                        disabled={removingAdminUid === admin.uid}
                        className="text-red-300 hover:text-red-200 text-xs transition-colors"
                      >
                        {removingAdminUid === admin.uid ? '削除中...' : '削除'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            const totalPoint = totalPointMap.get(player.id) ?? 0
            const pointLabel = totalPoint >= 0 ? `+${totalPoint}` : `${totalPoint}`
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
                  <p className={`font-mono text-sm font-bold ${totalPoint >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                    {pointLabel}pt
                  </p>
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
