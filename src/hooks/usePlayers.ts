import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Player } from '../types'
import { sanitizeUserText } from '../utils/sanitizeUserText'

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

  const registerPlayer = async (
    uid: string,
    params: { name: string; icon: string; memo: string },
  ) => {
    const name = sanitizeUserText(params.name).trim()
    const icon = sanitizeUserText(params.icon).trim() || name.slice(0, 2)
    const memo = sanitizeUserText(params.memo).trim()
    await setDoc(doc(db, paths.players, uid), {
      authUid: uid,
      name,
      icon,
      memo,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const updateOwnPlayer = async (
    uid: string,
    params: { name: string; icon: string; memo: string },
  ) => {
    const name = sanitizeUserText(params.name).trim()
    const icon = sanitizeUserText(params.icon).trim() || name.slice(0, 2)
    const memo = sanitizeUserText(params.memo).trim()
    await updateDoc(doc(db, paths.players, uid), {
      name,
      icon,
      memo,
      updatedAt: serverTimestamp(),
    })
  }

  const banPlayer = async (uid: string) => {
    // 管理者がBANする（実質的には削除扱い）
    await updateDoc(doc(db, paths.players, uid), {
      isActive: false,
      updatedAt: serverTimestamp(),
    })
  }

  const unbanPlayer = async (uid: string) => {
    await updateDoc(doc(db, paths.players, uid), {
      isActive: true,
      updatedAt: serverTimestamp(),
    })
  }

  return {
    players,
    loading,
    error,
    registerPlayer,
    updateOwnPlayer,
    banPlayer,
    unbanPlayer,
  }
}

export function useActivePlayers(players: Player[]) {
  return players.filter((p) => p.isActive)
}
