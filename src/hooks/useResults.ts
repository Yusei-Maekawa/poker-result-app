import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Result } from '../types'

export function useResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, paths.results), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Result[]
        setResults(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('結果データの取得に失敗しました')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const addResults = async (
    entries: { gameId: string; playerId: string; rank: number; point: number }[],
  ) => {
    await Promise.all(
      entries.map((entry) =>
        addDoc(collection(db, paths.results), {
          ...entry,
          createdAt: serverTimestamp(),
        }),
      ),
    )
  }

  return { results, loading, error, addResults }
}

export function useGameResults(gameId: string) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return
    const q = query(
      collection(db, paths.results),
      where('gameId', '==', gameId),
      orderBy('rank', 'asc'),
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResults(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Result),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [gameId])

  return { results, loading }
}
