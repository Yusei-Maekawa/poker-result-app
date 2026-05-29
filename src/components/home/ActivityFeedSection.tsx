import { Link } from 'react-router-dom'
import type { Activity } from '../../types'
import { formatGameDateTime, formatTimestamp } from '../../utils/formatDateTime'

interface ActivityFeedSectionProps {
  activities: Activity[]
  gamesExist: (gameId: string) => boolean
  loading?: boolean
}

function activityMessage(activity: Activity): string {
  if (activity.type === 'member_joined') {
    return `${activity.playerName ?? 'メンバー'} さんがリーグに参加しました`
  }
  if (activity.type === 'game_added') {
    const no = activity.gameNo != null ? `第${activity.gameNo}戦` : '試合'
    return `${no}の結果が追加されました`
  }
  return ''
}

function activitySubline(activity: Activity): string | null {
  if (activity.type === 'game_added' && activity.gameDate) {
    return formatGameDateTime(activity.gameDate, activity.gameTime)
  }
  return null
}

export function ActivityFeedSection({
  activities,
  gamesExist,
  loading = false,
}: ActivityFeedSectionProps) {
  const visible = activities.slice(0, 15)

  return (
    <section className="mb-8">
      <h2 className="font-display font-bold text-lg lg:text-xl text-white mb-3">
        🕐 アクティビティ
      </h2>

      {loading ? (
        <div className="card py-6 text-center">
          <p className="text-white/35 text-sm">読み込み中...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="card py-6 text-center px-4">
          <p className="text-white/40 text-sm">アクティビティはまだありません</p>
          <p className="text-white/35 text-xs mt-2 leading-relaxed">
            メンバー参加や試合結果の追加がここに表示されます
          </p>
        </div>
      ) : (
      <ul className="card divide-y divide-white/[0.06] px-4 py-1">
        {visible.map((activity) => {
          const sub = activitySubline(activity)
          const gameLink =
            activity.type === 'game_added' &&
            activity.gameId &&
            gamesExist(activity.gameId)
              ? `/games/${activity.gameId}`
              : null
          const playerLink =
            activity.type === 'member_joined' && activity.playerId
              ? `/players/${activity.playerId}`
              : null
          const linkTo = gameLink ?? playerLink

          return (
            <li key={activity.id} className="py-3">
              {linkTo ? (
                <Link to={linkTo} className="block group">
                  <ActivityRow activity={activity} sub={sub} linked />
                </Link>
              ) : (
                <ActivityRow
                  activity={activity}
                  sub={sub}
                  muted={
                    activity.type === 'game_added' &&
                    !!activity.gameId &&
                    !gamesExist(activity.gameId)
                  }
                />
              )}
            </li>
          )
        })}
      </ul>
      )}
    </section>
  )
}

function ActivityRow({
  activity,
  sub,
  linked,
  muted,
}: {
  activity: Activity
  sub: string | null
  linked?: boolean
  muted?: boolean
}) {
  const timeLabel = formatTimestamp(activity.createdAt)

  return (
    <div>
      <p
        className={`text-sm ${
          linked
            ? 'text-white/85 group-hover:text-gold-300 transition-colors'
            : muted
              ? 'text-white/50'
              : 'text-white/80'
        }`}
      >
        {activityMessage(activity)}
        {muted && (
          <span className="text-white/35 text-xs ml-1">（削除された試合）</span>
        )}
      </p>
      <p className="text-white/35 text-xs mt-1">
        {sub && <span className="mr-2">{sub}</span>}
        {timeLabel && <span>{timeLabel}</span>}
      </p>
    </div>
  )
}
