import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Game } from '../types'

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, paths.games), orderBy('gameNo', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Game[]
        setGames(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('試合データの取得に失敗しました')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const addGame = async (params: {
    date: string
    appName: string
    memo: string
  }): Promise<{ id: string; gameNo: number }> => {
    // 既存件数 + 1 で gameNo を決定
    const snapshot = await getDocs(collection(db, paths.games))
    const gameNo = snapshot.size + 1

    const docRef = await addDoc(collection(db, paths.games), {
      gameNo,
      date: params.date,
      appName: params.appName.trim(),
      memo: params.memo.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id, gameNo }
  }

  const addGameWithResults = async (params: {
    date: string
    appName: string
    memo: string
    entries: { playerId: string; rank: number; point: number }[]
  }): Promise<{ id: string; gameNo: number }> => {
    const gamesRef = collection(db, paths.games)
    const resultsRef = collection(db, paths.results)

    // 既存件数 + 1 で gameNo を決定
    const snapshot = await getDocs(gamesRef)
    const gameNo = snapshot.size + 1

    const gameRef = doc(gamesRef)
    const batch = writeBatch(db)

    batch.set(gameRef, {
      gameNo,
      date: params.date,
      appName: params.appName.trim(),
      memo: params.memo.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    for (const entry of params.entries) {
      const resultRef = doc(resultsRef)
      batch.set(resultRef, {
        gameId: gameRef.id,
        ...entry,
        createdAt: serverTimestamp(),
      })
    }

    await batch.commit()

    return { id: gameRef.id, gameNo }
  }

  return { games, loading, error, addGame, addGameWithResults }
}
