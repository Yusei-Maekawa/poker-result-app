import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Player } from '../types'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, paths.players), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[]
        setPlayers(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('プレイヤーの取得に失敗しました')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const addPlayer = async (params: {
    name: string
    icon: string
    memo: string
  }) => {
    await addDoc(collection(db, paths.players), {
      name: params.name.trim(),
      icon: params.icon.trim() || params.name.slice(0, 2),
      memo: params.memo.trim(),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return { players, loading, error, addPlayer }
}

export function useActivePlayers(players: Player[]) {
  return players.filter((p) => p.isActive)
}
