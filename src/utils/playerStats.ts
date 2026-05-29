import type { Game, Result, RankingStat } from '../types'
import { buildRankingStats } from './ranking'

export interface PlayerRecentGame {
  game: Game
  result: Result
}

export interface PodiumStreakInfo {
  longest: number
  current: number
}

export function getPlayerRankingStat(
  playerId: string,
  players: Parameters<typeof buildRankingStats>[0],
  results: Result[],
): RankingStat | null {
  const stats = buildRankingStats(players, results)
  return stats.find((s) => s.player.id === playerId) ?? null
}

export function getPlayerRecentGames(
  playerId: string,
  games: Game[],
  results: Result[],
  limit = 5,
): PlayerRecentGame[] {
  const gameMap = new Map(games.map((g) => [g.id, g]))
  const items: PlayerRecentGame[] = []

  for (const result of results) {
    if (result.playerId !== playerId) continue
    const game = gameMap.get(result.gameId)
    if (!game) continue
    items.push({ game, result })
  }

  return items
    .sort((a, b) => b.game.gameNo - a.game.gameNo)
    .slice(0, limit)
}

/** 参加試合を gameNo 昇順に並べ、3位以内の連続本数を算出 */
export function computePodiumStreaks(
  playerId: string,
  games: Game[],
  results: Result[],
): PodiumStreakInfo {
  const gameMap = new Map(games.map((g) => [g.id, g]))
  const playerResults = results
    .filter((r) => r.playerId === playerId)
    .map((r) => ({ result: r, game: gameMap.get(r.gameId) }))
    .filter((x): x is { result: Result; game: Game } => !!x.game)
    .sort((a, b) => a.game.gameNo - b.game.gameNo)

  let longest = 0
  let currentRun = 0

  for (const { result } of playerResults) {
    if (result.rank <= 3) {
      currentRun += 1
      if (currentRun > longest) longest = currentRun
    } else {
      currentRun = 0
    }
  }

  let current = 0
  for (let i = playerResults.length - 1; i >= 0; i--) {
    if (playerResults[i].result.rank <= 3) current += 1
    else break
  }

  return { longest, current }
}

export function formatWinRate(winCount: number, playCount: number): string {
  if (playCount === 0) return '—'
  return `${Math.round((winCount / playCount) * 1000) / 10}%`
}
