import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/games', label: 'Games' },
  { to: '/players', label: 'Players' },
]

export function Header() {
  const { user, isAdmin, login, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-felt-900/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-2xl mx-auto px-4">
        {/* トップバー */}
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <span className="font-display font-bold text-gold-400 text-lg leading-none">
              Poker<span className="text-white/80">League</span>
            </span>
          </Link>

          {/* 認証ボタン */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? ''}
                  className={`w-7 h-7 rounded-full ring-1 ${
                    isAdmin ? 'ring-gold-500/50' : 'ring-white/20'
                  }`}
                />
              ) : (
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isAdmin ? 'bg-gold-500/20 text-gold-400' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {(user.displayName ?? user.email ?? '?').slice(0, 1)}
                </div>
              )}
              <div className="text-right">
                <p
                  className={`text-[10px] ${
                    isAdmin ? 'text-gold-400/80' : 'text-white/35'
                  }`}
                >
                  {isAdmin ? '管理者ログイン中' : '閲覧用ログイン中'}
                </p>
                <button
                  onClick={logout}
                  className="text-white/50 hover:text-white/80 text-xs transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={login}
              className="text-white/50 hover:text-gold-400 text-xs transition-colors flex items-center gap-1"
            >
              <span>管理者ログイン</span>
            </button>
          )}
        </div>

        {/* ナビゲーション */}
        <nav className="flex gap-1 pb-2">
          {NAV.map((item) => {
            const active =
              item.to === '/'
                ? pathname === '/'
                : pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-gold-500/15 text-gold-400'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
