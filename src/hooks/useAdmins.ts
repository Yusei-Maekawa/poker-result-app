import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, paths } from '../firebase'
import type { AdminUser } from '../types'

export function useAdmins(enabled: boolean) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setAdmins([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(collection(db, paths.admins), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((adminDoc) => ({
          id: adminDoc.id,
          ...adminDoc.data(),
        })) as AdminUser[]
        setAdmins(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('管理者一覧の取得に失敗しました')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [enabled])

  const addAdmin = async (uid: string, addedBy: string, note: string) => {
    await setDoc(doc(db, paths.admins, uid), {
      uid,
      note: note.trim(),
      addedBy,
      createdAt: serverTimestamp(),
    })
  }

  const removeAdmin = async (uid: string) => {
    await deleteDoc(doc(db, paths.admins, uid))
  }

  return { admins, loading, error, addAdmin, removeAdmin }
}
