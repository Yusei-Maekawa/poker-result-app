import { useAuth } from '../hooks/useAuth'

/**
 * プレイヤーが BAN（isActive: false）のとき、サイレントに除外せず
 * 「今シーズンは参加できない」旨を画面で認知させる。
 * 管理者は自分のプレイヤー行が BAN でも運用のためバナーを出さない。
 */
export function BannedParticipationBanner() {
  const { user, myPlayer, isAdmin, loading } = useAuth()

  if (loading || !user || !myPlayer || myPlayer.isActive || isAdmin) {
    return null
  }

  return (
    <div
      role="status"
      className="bg-amber-950/50 border-b border-amber-600/35 px-4 py-3"
    >
      <div className="max-w-2xl mx-auto">
        <p className="text-amber-200/95 text-sm font-semibold">
          参加資格が停止されています
        </p>
        <p className="text-white/70 text-sm mt-1.5 leading-relaxed">
          このアカウントは現在、<strong className="text-white/90">試合結果への参加およびランキングの集計対象外</strong>
          です。試合一覧・試合詳細・ランキングの閲覧は引き続き可能です。
        </p>
        <p className="text-white/45 text-xs mt-2 leading-relaxed">
          理由の詳細・解除の可否については<strong className="text-white/60">リーグ運営までお問い合わせください</strong>
          （不正行為や規約違反などが判明した場合など、運営判断により参加者登録が無効化されることがあります）。
        </p>
      </div>
    </div>
  )
}
