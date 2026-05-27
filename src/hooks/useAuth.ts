import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider, paths } from '../firebase'
import { isBootstrapAdminUid } from '../utils/admin'
import { useMyPlayer } from './useMyPlayer'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminLoading, setAdminLoading] = useState(true)
  const [isManagedAdmin, setIsManagedAdmin] = useState(false)
  const {
    player: myPlayer,
    loading: playerLoading,
    hasPlayerProfile,
  } = useMyPlayer(user?.uid)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) {
      setIsManagedAdmin(false)
      setAdminLoading(false)
      return
    }

    if (isBootstrapAdminUid(user.uid)) {
      setIsManagedAdmin(false)
      setAdminLoading(false)
      return
    }

    setAdminLoading(true)

    const adminRef = doc(db, paths.admins, user.uid)
    const unsubscribe = onSnapshot(
      adminRef,
      (snapshot) => {
        setIsManagedAdmin(snapshot.exists())
        setAdminLoading(false)
      },
      (err) => {
        console.error(err)
        setIsManagedAdmin(false)
        setAdminLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const login = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isBootstrapAdmin = isBootstrapAdminUid(user?.uid)
  const isAdmin = isBootstrapAdmin || isManagedAdmin
  const canManageAdmins = isBootstrapAdmin
  const loading = authLoading || (user ? adminLoading || playerLoading : false)

  /** 参加者として BAN（閲覧は可・試合参加・ランキング集計は不可）。管理者にはバナーを出さない */
  const isPlayerParticipationSuspended =
    !!user && !!myPlayer && !myPlayer.isActive && !isAdmin

  return {
    user,
    myPlayer,
    hasPlayerProfile,
    loading,
    isAdmin,
    isBootstrapAdmin,
    canManageAdmins,
    isPlayerParticipationSuspended,
    login,
    logout,
  }
}
