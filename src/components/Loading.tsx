export function Loading({ text = '読み込み中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-gold-500/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-gold-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-t-2 border-gold-400/60 animate-spin [animation-direction:reverse] [animation-duration:0.6s]" />
      </div>
      <p className="text-white/40 text-sm font-body">{text}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
      <div className="h-3 bg-white/6 rounded w-1/2" />
    </div>
  )
}
