import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Loading } from '../components/Loading'
import { useAuth } from '../hooks/useAuth'
import { getFirebaseErrorMessage } from '../utils/firebaseError'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, hasPlayerProfile, loading, login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading || !user) return
    if (hasPlayerProfile) {
      navigate('/', { replace: true })
    } else {
      navigate('/register', { replace: true })
    }
  }, [user, hasPlayerProfile, loading, navigate])

  const handleLogin = async () => {
    setError('')
    setSubmitting(true)
    try {
      await login()
    } catch (e) {
      console.error(e)
      setError(getFirebaseErrorMessage(e, 'ログインに失敗しました。'))
      setSubmitting(false)
    }
  }

  if (loading || user) {
    return (
      <AuthLayout>
        <Loading />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="card px-6 py-8 space-y-6">
        <div className="text-center">
          <h2 className="font-display font-bold text-xl text-white">ログイン</h2>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            登録済みの Google アカウントでログインしてください。
          </p>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="button"
          onClick={handleLogin}
          disabled={submitting}
          className="btn-primary w-full text-base"
        >
          {submitting ? 'ログイン中...' : 'Google でログイン'}
        </button>

        <div className="text-center space-y-3 pt-2 border-t border-white/10">
          <p className="text-white/40 text-sm">はじめての方</p>
          <Link to="/register" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
            新規アカウント登録 →
          </Link>
        </div>

        <div className="text-center">
          <Link to="/ranking" className="text-white/40 hover:text-white/60 text-xs">
            ログインせずにランキングを見る
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
