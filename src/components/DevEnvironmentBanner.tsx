import { LEAGUE_ID } from '../firebase'
import { isDevelopmentLeague } from '../config/environment'

/**
 * VITE_LEAGUE_ID が main 以外のとき、本番データと混同しないよう表示する。
 */
export function DevEnvironmentBanner() {
  if (!isDevelopmentLeague()) {
    return null
  }

  return (
    <div
      role="status"
      className="bg-violet-950/85 border-b border-violet-400/45 px-4 py-2.5"
    >
      <div className="app-container flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <p className="text-violet-100 text-sm font-semibold tracking-wide">
          開発環境
        </p>
        <p className="text-violet-200/75 text-xs sm:text-sm leading-relaxed">
          リーグ ID:{' '}
          <strong className="text-violet-100 font-mono">{LEAGUE_ID}</strong>
          <span className="text-violet-300/60 mx-1.5 hidden sm:inline">·</span>
          <span className="block sm:inline mt-0.5 sm:mt-0">
            本番（main）とは別データです。ここでの操作は本番に反映されません。
          </span>
        </p>
      </div>
    </div>
  )
}
