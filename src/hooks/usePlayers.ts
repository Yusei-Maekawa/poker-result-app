import { useAppContext } from '../context/AppProvider'
import type { Player } from '../types'

export function usePlayers() {
  const {
    players,
    playersLoading,
    playersError,
    registerPlayer,
    updateOwnPlayer,
    banPlayer,
    unbanPlayer,
  } = useAppContext()

  return {
    players,
    loading: playersLoading,
    error: playersError,
    registerPlayer,
    updateOwnPlayer,
    banPlayer,
    unbanPlayer,
  }
}

export function useActivePlayers(players: Player[]) {
  return players.filter((p) => p.isActive)
}
