import { Navigate, useLocation } from 'react-router-dom'
import { Loading } from './Loading'
import { useAuth } from '../hooks/useAuth'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/ranking',
  '/games',
  '/players',
  '/admin',
]

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }
  if (pathname.startsWith('/games/')) return true
  return false
}

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, hasPlayerProfile, isAdmin, loading } = useAuth()
  const { pathname } = useLocation()

  // 起動後はホームを先に見せる（認証確認中も公開ページは表示）
  if (loading && !isPublicPath(pathname)) {
    return (
      <div className="min-h-dvh bg-felt-texture flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  // 登録済みなら /register からホームへ（RegisterPage の navigate だけに頼らない）
  if (user && hasPlayerProfile && pathname === '/register') {
    return <Navigate to="/" replace />
  }

  // 管理者はプレイヤー未登録でも試合入力など可能。一般ユーザーはプロフィール登録必須。
  if (user && !hasPlayerProfile && !isAdmin && pathname !== '/register') {
    return <Navigate to="/register" replace />
  }

  if (!user && !isPublicPath(pathname) && pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
