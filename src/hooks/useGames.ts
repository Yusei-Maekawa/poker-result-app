import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Game } from '../types'
import { sanitizeUserText } from '../utils/sanitizeUserText'

function sanitizeGameText(params: { appName: string; memo: string }) {
  return {
    appName: sanitizeUserText(params.appName).trim(),
    memo: sanitizeUserText(params.memo).trim(),
  }
}

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

    const { appName, memo } = sanitizeGameText(params)
    const docRef = await addDoc(collection(db, paths.games), {
      gameNo,
      date: params.date,
      appName,
      memo,
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

    const { appName, memo } = sanitizeGameText(params)
    batch.set(gameRef, {
      gameNo,
      date: params.date,
      appName,
      memo,
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

  const updateGameWithResults = async (
    gameId: string,
    params: {
      date: string
      appName: string
      memo: string
      entries: { playerId: string; rank: number; point: number }[]
    },
  ): Promise<void> => {
    const resultsRef = collection(db, paths.results)
    const existingResults = await getDocs(
      query(resultsRef, where('gameId', '==', gameId)),
    )

    const batch = writeBatch(db)
    const gameRef = doc(db, paths.games, gameId)

    const { appName, memo } = sanitizeGameText(params)
    batch.update(gameRef, {
      date: params.date,
      appName,
      memo,
      updatedAt: serverTimestamp(),
    })

    for (const resultDoc of existingResults.docs) {
      batch.delete(resultDoc.ref)
    }

    for (const entry of params.entries) {
      const resultRef = doc(resultsRef)
      batch.set(resultRef, {
        gameId,
        ...entry,
        createdAt: serverTimestamp(),
      })
    }

    await batch.commit()
  }

  const deleteGame = async (gameId: string): Promise<void> => {
    const resultsRef = collection(db, paths.results)
    const existingResults = await getDocs(
      query(resultsRef, where('gameId', '==', gameId)),
    )

    const batch = writeBatch(db)
    batch.delete(doc(db, paths.games, gameId))

    for (const resultDoc of existingResults.docs) {
      batch.delete(resultDoc.ref)
    }

    await batch.commit()
  }

  return {
    games,
    loading,
    error,
    addGame,
    addGameWithResults,
    updateGameWithResults,
    deleteGame,
  }
}
