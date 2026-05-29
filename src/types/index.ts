import { Timestamp } from 'firebase/firestore'

export interface Player {
  id: string
  authUid?: string   // Firebase UID（1アカウント1プレイヤー。旧データは未設定の場合あり）
  name: string
  icon: string       // 絵文字 or 1〜2文字のイニシャル
  memo: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AdminUser {
  id: string
  uid: string
  note: string
  addedBy: string
  createdAt: Timestamp
}

export interface Game {
  id: string
  gameNo: number
  date: string       // YYYY-MM-DD
  time?: string      // HH:mm（開催時刻）
  appName: string
  memo: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ActivityType = 'member_joined' | 'game_added'

export interface Announcement {
  id: string
  title: string
  body: string
  isPinned: boolean
  authorUid: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Activity {
  id: string
  type: ActivityType
  createdAt: Timestamp
  playerId?: string
  playerName?: string
  gameId?: string
  gameNo?: number
  gameDate?: string
  gameTime?: string
  actorUid?: string
}

export interface Result {
  id: string
  gameId: string
  playerId: string
  rank: number
  point: number
  createdAt: Timestamp
}

// 集計用
export interface RankingStat {
  player: Player
  totalPoint: number
  playCount: number
  winCount: number       // 1位回数
  podiumCount: number    // 3位以内回数
  lastPlaceCount: number // 最下位回数
  avgRank: number
  podiumRate: number     // 入賞率 (3位以内 / 参加)
}

export interface GameWithResults {
  game: Game
  results: ResultWithPlayer[]
}

export interface ResultWithPlayer extends Result {
  player: Player
}
