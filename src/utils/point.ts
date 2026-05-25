/**
 * ポイント計算
 * - 1位: +7
 * - 2位: +5
 * - 3位: +3
 * - 4位: +1
 * - 5位以下: 0
 * - 最下位: -2（最下位ペナルティ優先）
 *
 * @param rank - 順位（1始まり）
 * @param totalPlayers - 参加人数
 */
export function calculatePoint(rank: number, totalPlayers: number): number {
  const isLast = rank === totalPlayers

  // 最下位ペナルティ優先
  if (isLast) return -2

  switch (rank) {
    case 1: return 7
    case 2: return 5
    case 3: return 3
    case 4: return 1
    default: return 0 // 5位以下（最下位でない）
  }
}

export const POINT_TABLE = [
  { rank: 1, label: '1位', point: '+7' },
  { rank: 2, label: '2位', point: '+5' },
  { rank: 3, label: '3位', point: '+3' },
  { rank: 4, label: '4位', point: '+1' },
  { rank: 5, label: '5位以下', point: '0' },
  { rank: -1, label: '最下位', point: '-2' },
]
