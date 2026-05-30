import { LEAGUE_ID } from '../firebase'

/** 本番リーグ（友達リーグの本番データ） */
export const PRODUCTION_LEAGUE_ID = 'main'

/** テスト用リーグなど、本番以外のデータを参照している */
export function isDevelopmentLeague(): boolean {
  return LEAGUE_ID !== PRODUCTION_LEAGUE_ID
}
