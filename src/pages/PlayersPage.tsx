import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { useAdmins } from '../hooks/useAdmins'
import { usePlayers } from '../hooks/usePlayers'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../hooks/useAuth'
import { buildRankingStats } from '../utils/ranking'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function PlayersPage() {
  const { user, myPlayer, hasPlayerProfile, canManageAdmins, isAdmin } = useAuth()
  const {
    admins,
    loading: adminsLoading,
    error: adminsError,
    addAdmin,
    removeAdmin,
  } = useAdmins(canManageAdmins)
  const { players, loading: playersLoading, banPlayer, unbanPlayer } = usePlayers()
  const { results, loading: resultsLoading } = useResults()

  const [adminForm, setAdminForm] = useState({ uid: '', note: '' })
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [removingAdminUid, setRemovingAdminUid] = useState('')

  const [playerBanSubmittingUid, setPlayerBanSubmittingUid] = useState('')
  const [playerBanError, setPlayerBanError] = useState('')
  const [banConfirm, setBanConfirm] = useState<{
    uid: string
    name: string
    /** true = BAN解除、false = BAN */
    unbanning: boolean
  } | null>(null)

  const openBanConfirm = (uid: string, name: string, unbanning: boolean) => {
    setBanConfirm({ uid, name, unbanning })
  }

  const closeBanConfirm = () => {
    if (playerBanSubmittingUid) return
    setBanConfirm(null)
  }

  const executeBanConfirm = async () => {
    if (!user || !banConfirm) return

    const { uid, unbanning } = banConfirm
    setPlayerBanError('')
    setPlayerBanSubmittingUid(uid)
    try {
      if (unbanning) await unbanPlayer(uid)
      else await banPlayer(uid)
      setBanConfirm(null)
    } catch (e) {
      console.error(e)
      setPlayerBanError(
        getFirebaseErrorMessage(e, 'BAN の操作に失敗しました。再試行してください。'),
      )
    } finally {
      setPlayerBanSubmittingUid('')
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

  const playCountMap = new Map<string, number>()
  for (const r of results) {
    playCountMap.set(r.playerId, (playCountMap.get(r.playerId) ?? 0) + 1)
  }

  return (
    <Layout>
      <PageHeader
        title="プレイヤー"
        subtitle={`${activePlayers.length}名`}
        action={
          user && hasPlayerProfile ? (
            <Link to="/profile" className="btn-secondary text-sm">
              マイプロフィール
            </Link>
          ) : user ? (
            <Link to="/register" className="btn-primary text-sm">
              登録する
            </Link>
          ) : (
            <Link to="/register" className="btn-primary text-sm">
              新規登録
            </Link>
          )
        }
      />

      {user && !hasPlayerProfile && (
        <div className="card px-4 py-4 mb-6 border-gold-500/30">
          <p className="text-white/70 text-sm">
            プレイヤー登録がまだ完了していません。プロフィールを登録すると試合結果に参加できます。
          </p>
          <Link to="/register" className="btn-primary w-full mt-3 text-sm text-center block">
            プロフィールを登録する
          </Link>
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

      {isAdmin && (
        <div className="card px-4 py-4 mb-6 border-gold-500/20">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            プレイヤー BAN（無効化）
          </h2>

          <p className="text-white/40 text-sm mb-4">
            管理者だけがプレイヤーを無効化できます。無効化されたプレイヤーは新規参加・ランキングから外れます。
          </p>

          {playerBanError && (
            <p className="text-red-400 text-sm mb-3">{playerBanError}</p>
          )}

          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white/5 rounded-lg px-3 py-3 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {player.icon || player.name.slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {player.name}{' '}
                    <span className="text-white/30 text-xs font-mono">
                      ({player.id})
                    </span>
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    状態: {player.isActive ? 'ACTIVE' : 'BAN'}
                  </p>
                </div>

                {player.isActive ? (
                  <button
                    type="button"
                    className="btn-secondary text-sm px-3 py-2"
                    onClick={() =>
                      openBanConfirm(player.id, player.name, false)
                    }
                    disabled={playerBanSubmittingUid === player.id}
                  >
                    {playerBanSubmittingUid === player.id ? 'BAN中...' : 'BAN'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary text-sm px-3 py-2"
                    onClick={() =>
                      openBanConfirm(player.id, player.name, true)
                    }
                    disabled={playerBanSubmittingUid === player.id}
                  >
                    {playerBanSubmittingUid === player.id ? '解除中...' : '解除'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
            const isMe = myPlayer?.id === player.id

            return (
              <div
                key={player.id}
                className={`card px-4 py-3 flex items-center gap-3 ${
                  isMe ? 'border-gold-500/30' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {player.icon || player.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {player.name}
                    {isMe && (
                      <span className="text-gold-400/80 text-xs ml-2">（あなた）</span>
                    )}
                  </p>
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

      {banConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65"
          aria-hidden={false}
          onClick={() => closeBanConfirm()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ban-dialog-title"
            className="card max-w-md w-full p-6 border border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="ban-dialog-title"
              className="font-display font-bold text-lg text-white"
            >
              {banConfirm.unbanning ? 'BANを解除しますか？' : 'プレイヤーをBANしますか？'}
            </h3>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              {banConfirm.unbanning ? (
                <>
                  「<span className="text-white">{banConfirm.name}</span>
                  」を再び一覧・試合参加・ランキングに含めます。
                </>
              ) : (
                <>
                  「<span className="text-white">{banConfirm.name}</span>
                  」を無効化します。新規の試合参加やランキング表示から外れます（過去の結果ドキュメントは残ります）。
                </>
              )}
            </p>
            <p className="text-white/35 text-xs font-mono mt-2 break-all">
              UID: {banConfirm.uid}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button
                type="button"
                className="btn-secondary flex-1 text-sm"
                onClick={() => closeBanConfirm()}
                disabled={!!playerBanSubmittingUid}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={
                  banConfirm.unbanning
                    ? 'btn-primary flex-1 text-sm'
                    : 'flex-1 text-sm py-2.5 rounded-lg font-medium border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50'
                }
                onClick={() => void executeBanConfirm()}
                disabled={!!playerBanSubmittingUid}
              >
                {playerBanSubmittingUid
                  ? '処理中...'
                  : banConfirm.unbanning
                    ? '解除する'
                    : 'BANする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
