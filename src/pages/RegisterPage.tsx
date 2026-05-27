import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Loading } from '../components/Loading'
import { useAuth } from '../hooks/useAuth'
import { usePlayers } from '../hooks/usePlayers'
import { LimitedTextField } from '../components/LimitedTextField'
import { PresetIconPicker } from '../components/PresetIconPicker'
import { validatePlayerForm } from '../utils/validatePlayer'
import { PLAYER_LIMITS } from '../utils/validationLimits'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function RegisterPage() {
  const navigate = useNavigate()
  const { user, hasPlayerProfile, loading, login, logout } = useAuth()
  const { registerPlayer } = usePlayers()

  const [form, setForm] = useState({ name: '', icon: '', memo: '' })
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (hasPlayerProfile) {
      navigate('/', { replace: true })
    }
  }, [hasPlayerProfile, loading, navigate])

  const handleGoogleSignIn = async () => {
    setError('')
    setAuthSubmitting(true)
    try {
      await login()
    } catch (e) {
      console.error(e)
      setError(getFirebaseErrorMessage(e, 'Google ログインに失敗しました。'))
      setAuthSubmitting(false)
    }
  }

  const handleRegister = async () => {
    if (!user) return

    const validationError = validatePlayerForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await registerPlayer(user.uid, form)
      navigate('/', { replace: true })
    } catch (e) {
      console.error(e)
      setError(
        getFirebaseErrorMessage(e, 'アカウント登録に失敗しました。'),
      )
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <Loading />
      </AuthLayout>
    )
  }

  if (!user) {
    return (
      <AuthLayout>
        <div className="card px-6 py-8 space-y-6">
          <div className="text-center">
            <h2 className="font-display font-bold text-xl text-white">新規登録</h2>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              まず Google アカウントで認証してください。
              1 アカウントにつき 1 プレイヤーとして登録されます。
            </p>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authSubmitting}
            className="btn-primary w-full text-base"
          >
            {authSubmitting ? '認証中...' : 'Google で続ける'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-white/50 hover:text-white/70 text-sm">
              すでにアカウントをお持ちの方はログイン
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="card px-6 py-8 space-y-5">
        <div className="text-center">
          <h2 className="font-display font-bold text-xl text-white">プロフィール登録</h2>
          <p className="text-white/50 text-sm mt-2">
            リーグで使う名前を設定してください。
          </p>
        </div>

        <div className="space-y-4">
          <LimitedTextField
            label="名前"
            placeholder="例: たろう"
            value={form.name}
            maxLength={PLAYER_LIMITS.name}
            hint="リーグ内の表示名（20文字まで）"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <PresetIconPicker
            label="アイコン"
            value={form.icon}
            onChange={(icon) => setForm({ ...form, icon })}
          />
          <LimitedTextField
            label="メモ"
            optional
            multiline
            placeholder="例: ブラフ好き"
            value={form.memo}
            maxLength={PLAYER_LIMITS.memo}
            hint="自己紹介など（80文字まで）"
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handleRegister}
          disabled={submitting}
          className="btn-primary w-full text-base"
        >
          {submitting ? '登録中...' : '登録してはじめる'}
        </button>

        <button
          type="button"
          onClick={logout}
          className="text-white/40 hover:text-white/60 text-xs w-full text-center"
        >
          別の Google アカウントで登録する
        </button>
      </div>
    </AuthLayout>
  )
}
