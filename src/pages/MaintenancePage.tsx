import { AuthLayout } from '../components/AuthLayout'

export default function MaintenancePage() {
  return (
    <AuthLayout>
      <div className="card px-6 py-8 text-center space-y-4">
        <p className="text-4xl" aria-hidden>
          🔧
        </p>
        <h2 className="font-display font-bold text-xl text-white">
          メンテナンス中
        </h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Poker League Board は現在、シーズン外のため準備中です。
          再開時は Discord でお知らせします。
        </p>
      </div>
    </AuthLayout>
  )
}
