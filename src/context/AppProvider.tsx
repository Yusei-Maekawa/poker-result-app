import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, googleProvider, paths } from '../firebase'
import type { Game, Player, Result } from '../types'
import { isBootstrapAdminUid } from '../utils/admin'
import { sanitizeUserText } from '../utils/sanitizeUserText'

function sanitizeGameText(params: { appName: string; memo: string }) {
  return {
    appName: sanitizeUserText(params.appName).trim(),
    memo: sanitizeUserText(params.memo).trim(),
  }
}

type AppContextValue = {
  user: User | null
  myPlayer: Player | null
  hasPlayerProfile: boolean
  authLoading: boolean
  isAdmin: boolean
  isBootstrapAdmin: boolean
  canManageAdmins: boolean
  isPlayerParticipationSuspended: boolean
  login: () => Promise<void>
  logout: () => Promise<void>

  players: Player[]
  playersLoading: boolean
  playersError: string | null
  registerPlayer: (
    uid: string,
    params: { name: string; icon: string; memo: string },
  ) => Promise<void>
  updateOwnPlayer: (
    uid: string,
    params: { name: string; icon: string; memo: string },
  ) => Promise<void>
  banPlayer: (uid: string) => Promise<void>
  unbanPlayer: (uid: string) => Promise<void>

  games: Game[]
  gamesLoading: boolean
  gamesError: string | null
  addGame: (params: { date: string; appName: string; memo: string }) => Promise<{
    id: string
    gameNo: number
  }>
  addGameWithResults: (params: {
    date: string
    appName: string
    memo: string
    entries: { playerId: string; rank: number; point: number }[]
  }) => Promise<{ id: string; gameNo: number }>
  updateGameWithResults: (
    gameId: string,
    params: {
      date: string
      appName: string
      memo: string
      entries: { playerId: string; rank: number; point: number }[]
    },
  ) => Promise<void>
  deleteGame: (gameId: string) => Promise<void>

  results: Result[]
  resultsLoading: boolean
  resultsError: string | null
  addResults: (
    entries: { gameId: string; playerId: string; rank: number; point: number }[],
  ) => Promise<void>

  /** ホーム表示用: players / games / results の初回取得が終わったか */
  homeDataReady: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminLoading, setAdminLoading] = useState(true)
  const [isManagedAdmin, setIsManagedAdmin] = useState(false)
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [playerLoading, setPlayerLoading] = useState(false)

  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [playersError, setPlayersError] = useState<string | null>(null)

  const [games, setGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [gamesError, setGamesError] = useState<string | null>(null)

  const [results, setResults] = useState<Result[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [resultsError, setResultsError] = useState<string | null>(null)

  // --- Auth（スプラッシュ中から開始） ---
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

  useEffect(() => {
    if (!user?.uid) {
      setMyPlayer(null)
      setPlayerLoading(false)
      return
    }

    setPlayerLoading(true)
    const playerRef = doc(db, paths.players, user.uid)
    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setMyPlayer(null)
        } else {
          setMyPlayer({ id: snapshot.id, ...snapshot.data() } as Player)
        }
        setPlayerLoading(false)
      },
      (err) => {
        console.error(err)
        setMyPlayer(null)
        setPlayerLoading(false)
      },
    )
    return unsubscribe
  }, [user?.uid])

  // --- League データ（スプラッシュ中から並行プリロード） ---
  useEffect(() => {
    const q = query(collection(db, paths.players), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPlayers(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Player),
        )
        setPlayersLoading(false)
      },
      (err) => {
        console.error(err)
        setPlayersError('プレイヤーの取得に失敗しました')
        setPlayersLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const q = query(collection(db, paths.games), orderBy('gameNo', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setGames(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Game))
        setGamesLoading(false)
      },
      (err) => {
        console.error(err)
        setGamesError('試合データの取得に失敗しました')
        setGamesLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const q = query(collection(db, paths.results), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setResults(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Result))
        setResultsLoading(false)
      },
      (err) => {
        console.error(err)
        setResultsError('結果データの取得に失敗しました')
        setResultsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const login = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const registerPlayer = useCallback(
    async (uid: string, params: { name: string; icon: string; memo: string }) => {
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
    },
    [],
  )

  const updateOwnPlayer = useCallback(
    async (uid: string, params: { name: string; icon: string; memo: string }) => {
      const name = sanitizeUserText(params.name).trim()
      const icon = sanitizeUserText(params.icon).trim() || name.slice(0, 2)
      const memo = sanitizeUserText(params.memo).trim()
      await updateDoc(doc(db, paths.players, uid), {
        name,
        icon,
        memo,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const banPlayer = useCallback(async (uid: string) => {
    await updateDoc(doc(db, paths.players, uid), {
      isActive: false,
      updatedAt: serverTimestamp(),
    })
  }, [])

  const unbanPlayer = useCallback(async (uid: string) => {
    await updateDoc(doc(db, paths.players, uid), {
      isActive: true,
      updatedAt: serverTimestamp(),
    })
  }, [])

  const addGame = useCallback(
    async (params: { date: string; appName: string; memo: string }) => {
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
    },
    [],
  )

  const addGameWithResults = useCallback(
    async (params: {
      date: string
      appName: string
      memo: string
      entries: { playerId: string; rank: number; point: number }[]
    }) => {
      const gamesRef = collection(db, paths.games)
      const resultsRef = collection(db, paths.results)
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
    },
    [],
  )

  const updateGameWithResults = useCallback(
    async (
      gameId: string,
      params: {
        date: string
        appName: string
        memo: string
        entries: { playerId: string; rank: number; point: number }[]
      },
    ) => {
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
    },
    [],
  )

  const deleteGame = useCallback(async (gameId: string) => {
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
  }, [])

  const addResults = useCallback(
    async (
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
    },
    [],
  )

  const isBootstrapAdmin = isBootstrapAdminUid(user?.uid)
  const isAdmin = isBootstrapAdmin || isManagedAdmin
  const hasPlayerProfile = !!myPlayer
  const authLoadingCombined =
    authLoading || (user ? adminLoading || playerLoading : false)
  const homeDataReady = !playersLoading && !gamesLoading && !resultsLoading

  const isPlayerParticipationSuspended =
    !!user && !!myPlayer && !myPlayer.isActive && !isAdmin

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      myPlayer,
      hasPlayerProfile,
      authLoading: authLoadingCombined,
      isAdmin,
      isBootstrapAdmin,
      canManageAdmins: isBootstrapAdmin,
      isPlayerParticipationSuspended,
      login,
      logout,
      players,
      playersLoading,
      playersError,
      registerPlayer,
      updateOwnPlayer,
      banPlayer,
      unbanPlayer,
      games,
      gamesLoading,
      gamesError,
      addGame,
      addGameWithResults,
      updateGameWithResults,
      deleteGame,
      results,
      resultsLoading,
      resultsError,
      addResults,
      homeDataReady,
    }),
    [
      user,
      myPlayer,
      hasPlayerProfile,
      authLoadingCombined,
      isAdmin,
      isBootstrapAdmin,
      isPlayerParticipationSuspended,
      login,
      logout,
      players,
      playersLoading,
      playersError,
      registerPlayer,
      updateOwnPlayer,
      banPlayer,
      unbanPlayer,
      games,
      gamesLoading,
      gamesError,
      addGame,
      addGameWithResults,
      updateGameWithResults,
      deleteGame,
      results,
      resultsLoading,
      resultsError,
      addResults,
      homeDataReady,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return ctx
}
