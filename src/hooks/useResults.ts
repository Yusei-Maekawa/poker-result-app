import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Result } from '../types'
import { useAppContext } from '../context/AppProvider'

export function useResults() {
  const { results, resultsLoading, resultsError, addResults } = useAppContext()

  return {
    results,
    loading: resultsLoading,
    error: resultsError,
    addResults,
  }
}

/** 試合詳細用（gameId 単位の購読。全体プリロードとは別） */
export function useGameResults(gameId: string) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameId) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(collection(db, paths.results), where('gameId', '==', gameId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Result)
          .sort((a, b) => a.rank - b.rank)
        setResults(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('試合結果の取得に失敗しました')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [gameId])

  return { results, loading, error }
}
