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
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <img
                src={user?.photoURL ?? ''}
                alt={user?.displayName ?? ''}
                className="w-7 h-7 rounded-full ring-1 ring-gold-500/50"
              />
              <button
                onClick={logout}
                className="text-white/50 hover:text-white/80 text-xs transition-colors"
              >
                ログアウト
              </button>
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
