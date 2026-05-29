import { useAppContext } from '../context/AppProvider'

export function useGames() {
  const {
    games,
    gamesLoading,
    gamesError,
    addGame,
    addGameWithResults,
    updateGameWithResults,
    deleteGame,
  } = useAppContext()

  return {
    games,
    loading: gamesLoading,
    error: gamesError,
    addGame,
    addGameWithResults,
    updateGameWithResults,
    deleteGame,
  }
}
