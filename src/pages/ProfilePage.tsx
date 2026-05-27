import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout, PageHeader } from '../components/Layout'
import { Loading } from '../components/Loading'
import { useAuth } from '../hooks/useAuth'
import { usePlayers } from '../hooks/usePlayers'
import { LimitedTextField } from '../components/LimitedTextField'
import { PresetIconPicker } from '../components/PresetIconPicker'
import { validatePlayerForm } from '../utils/validatePlayer'
import { PLAYER_LIMITS } from '../utils/validationLimits'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, myPlayer, hasPlayerProfile, loading, isPlayerParticipationSuspended } =
    useAuth()
  const { updateOwnPlayer } = usePlayers()

  const [form, setForm] = useState({ name: '', icon: '', memo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!hasPlayerProfile) {
      navigate('/register', { replace: true })
    }
  }, [user, hasPlayerProfile, loading, navigate])

  useEffect(() => {
    if (!myPlayer) return
    setForm({
      name: myPlayer.name,
      icon: myPlayer.icon,
      memo: myPlayer.memo,
    })
  }, [myPlayer])

  const handleSubmit = async () => {
    if (!user || isPlayerParticipationSuspended) return

    const validationError = validatePlayerForm(form, {
      allowedNonPresetIcon: myPlayer?.icon,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await updateOwnPlayer(user.uid, form)
      navigate('/players')
    } catch (e) {
      console.error(e)
      setError(
        getFirebaseErrorMessage(e, 'プロフィールの更新に失敗しました。'),
      )
      setSubmitting(false)
    }
  }

  if (loading || !myPlayer) {
    return <Layout><Loading /></Layout>
  }

  return (
    <Layout>
      <Link
        to="/players"
        className="text-white/40 hover:text-white/70 text-sm transition-colors mb-4 inline-block"
      >
        ← プレイヤー一覧
      </Link>

      <PageHeader
        title="マイプロフィール"
        subtitle={
          isPlayerParticipationSuspended
            ? '参加資格停止中のためプロフィールの変更はできません'
            : '自分の表示名・アイコンを編集'
        }
      />

      {isPlayerParticipationSuspended && (
        <div className="card px-4 py-3 mb-4 border-amber-600/40 bg-amber-950/30">
          <p className="text-amber-200/90 text-sm font-medium">参加資格が停止されています</p>
          <p className="text-white/55 text-sm mt-2 leading-relaxed">
            プロフィールの編集・試合への参加はできません。詳細はリーグ運営にお問い合わせください。
          </p>
        </div>
      )}

      <div className="card px-4 py-4 space-y-4">
        <div className="space-y-4">
          <LimitedTextField
            label="名前"
            value={form.name}
            maxLength={PLAYER_LIMITS.name}
            hint="リーグ内の表示名（20文字まで）"
            disabled={isPlayerParticipationSuspended}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <PresetIconPicker
            label="アイコン"
            value={form.icon}
            disabled={isPlayerParticipationSuspended}
            onChange={(icon) => setForm({ ...form, icon })}
          />
          <LimitedTextField
            label="メモ"
            optional
            multiline
            value={form.memo}
            maxLength={PLAYER_LIMITS.memo}
            hint="自己紹介など（80文字まで）"
            disabled={isPlayerParticipationSuspended}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || isPlayerParticipationSuspended}
          className="btn-primary w-full"
        >
          {isPlayerParticipationSuspended
            ? '変更できません（参加停止中）'
            : submitting
              ? '保存中...'
              : '変更を保存'}
        </button>
      </div>
    </Layout>
  )
}
