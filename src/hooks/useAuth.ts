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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminLoading, setAdminLoading] = useState(true)
  const [isManagedAdmin, setIsManagedAdmin] = useState(false)

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
  const loading = authLoading || adminLoading

  return {
    user,
    loading,
    isAdmin,
    isBootstrapAdmin,
    canManageAdmins,
    login,
    logout,
  }
}
