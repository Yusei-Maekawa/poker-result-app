import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { Player } from '../types'

export function useMyPlayer(userId: string | undefined) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(!!userId)

  useEffect(() => {
    if (!userId) {
      setPlayer(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const playerRef = doc(db, paths.players, userId)
    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setPlayer(null)
        } else {
          setPlayer({ id: snapshot.id, ...snapshot.data() } as Player)
        }
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setPlayer(null)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [userId])

  return { player, loading, hasPlayerProfile: !!player }
}
