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
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
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
import type { Activity, Announcement, Game, Player, Result } from '../types'
import { allocateGameNo } from '../utils/allocateGameNo'
import { isBootstrapAdminUid } from '../utils/admin'
import { getDefaultGameTime } from '../utils/formatDateTime'
import { sanitizeUserText } from '../utils/sanitizeUserText'
import { ANNOUNCEMENT_LIMITS } from '../utils/validationLimits'

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
  addGame: (params: {
    date: string
    appName: string
    memo: string
  }) => Promise<{ id: string; gameNo: number }>
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

  announcements: Announcement[]
  announcementsLoading: boolean
  announcementsError: string | null
  createAnnouncement: (params: {
    title: string
    body: string
    isPinned: boolean
  }) => Promise<void>
  updateAnnouncement: (
    id: string,
    params: { title: string; body: string; isPinned: boolean },
  ) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>

  activities: Activity[]
  activitiesLoading: boolean

  /** ホーム表示用: 主要データの初回取得が終わったか */
  homeDataReady: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
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

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null)

  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

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
      return
    }

    if (isBootstrapAdminUid(user.uid)) {
      setIsManagedAdmin(false)
      return
    }

    const adminRef = doc(db, paths.admins, user.uid)
    const unsubscribe = onSnapshot(
      adminRef,
      (snapshot) => {
        setIsManagedAdmin(snapshot.exists())
      },
      (err) => {
        console.error(err)
        setIsManagedAdmin(false)
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
          // 登録直後の楽観更新を、伝播遅延で誤って消さない
          setMyPlayer((prev) =>
            prev?.id === user.uid ? prev : null,
          )
        } else {
          setMyPlayer({ id: snapshot.id, ...snapshot.data() } as Player)
        }
        setPlayerLoading(false)
      },
      (err) => {
        console.error('player snapshot error:', err)
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

  useEffect(() => {
    const q = query(collection(db, paths.announcements), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Announcement,
        )
        items.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
          const aMs = a.createdAt?.toMillis?.() ?? 0
          const bMs = b.createdAt?.toMillis?.() ?? 0
          return bMs - aMs
        })
        setAnnouncements(items)
        setAnnouncementsError(null)
        setAnnouncementsLoading(false)
      },
      (err) => {
        console.error(err)
        setAnnouncementsError('お知らせの取得に失敗しました')
        setAnnouncementsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, paths.activities),
      orderBy('createdAt', 'desc'),
      limit(30),
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setActivities(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity),
        )
        setActivitiesLoading(false)
      },
      (err) => {
        console.error(err)
        setActivitiesLoading(false)
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
      if (icon.length > 4) {
        throw new Error('アイコンは4文字以内で選んでください')
      }
      const playerRef = doc(db, paths.players, uid)
      const now = Timestamp.now()
      const existing = await getDoc(playerRef)

      if (existing.exists()) {
        // 再登録・途中失敗後の再試行は update（setDoc だと createdAt 変更で Rules 拒否）
        await updateDoc(playerRef, {
          name,
          icon,
          memo,
          updatedAt: serverTimestamp(),
        })
      } else {
        await setDoc(playerRef, {
          authUid: uid,
          name,
          icon,
          memo,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // onSnapshot より先に UI を更新（登録直後の AuthRedirect 競合を防ぐ）
      setMyPlayer({
        id: uid,
        authUid: uid,
        name,
        icon,
        memo,
        isActive: true,
        createdAt: (existing.data()?.createdAt as Timestamp | undefined) ?? now,
        updatedAt: now,
      })
      setPlayerLoading(false)

      if (!existing.exists()) {
        // アクティビティは失敗しても登録自体は成功させる（Rules 未デプロイ時など）
        try {
          await addDoc(collection(db, paths.activities), {
            type: 'member_joined',
            playerId: uid,
            playerName: name,
            createdAt: serverTimestamp(),
          })
        } catch (activityErr) {
          console.error('member_joined activity write failed:', activityErr)
        }
      }
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
      const gameNo = await allocateGameNo(db, paths.games, paths.gameCounter)
      const { appName, memo } = sanitizeGameText(params)
      const time = getDefaultGameTime()
      const docRef = await addDoc(collection(db, paths.games), {
        gameNo,
        date: params.date,
        time,
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
      const gameNo = await allocateGameNo(db, paths.games, paths.gameCounter)
      const gamesRef = collection(db, paths.games)
      const resultsRef = collection(db, paths.results)
      const gameRef = doc(gamesRef)
      const batch = writeBatch(db)
      const { appName, memo } = sanitizeGameText(params)
      const time = getDefaultGameTime()
      batch.set(gameRef, {
        gameNo,
        date: params.date,
        time,
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
      const actorUid = auth.currentUser?.uid
      if (!actorUid) throw new Error('ログインが必要です')
      const activityRef = doc(collection(db, paths.activities))
      batch.set(activityRef, {
        type: 'game_added',
        gameId: gameRef.id,
        gameNo,
        gameDate: params.date,
        gameTime: time,
        actorUid,
        createdAt: serverTimestamp(),
      })
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

  const sanitizeAnnouncement = (params: {
    title: string
    body: string
  }) => ({
    title: sanitizeUserText(params.title).trim(),
    body: sanitizeUserText(params.body).trim(),
  })

  const createAnnouncement = useCallback(
    async (params: { title: string; body: string; isPinned: boolean }) => {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('ログインが必要です')
      const { title, body } = sanitizeAnnouncement(params)
      if (!title) throw new Error('タイトルを入力してください')
      if (title.length > ANNOUNCEMENT_LIMITS.title) {
        throw new Error(`タイトルは${ANNOUNCEMENT_LIMITS.title}文字以内です`)
      }
      if (body.length > ANNOUNCEMENT_LIMITS.body) {
        throw new Error(`本文は${ANNOUNCEMENT_LIMITS.body}文字以内です`)
      }
      await addDoc(collection(db, paths.announcements), {
        title,
        body,
        isPinned: params.isPinned,
        authorUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const updateAnnouncement = useCallback(
    async (
      id: string,
      params: { title: string; body: string; isPinned: boolean },
    ) => {
      const { title, body } = sanitizeAnnouncement(params)
      if (!title) throw new Error('タイトルを入力してください')
      if (title.length > ANNOUNCEMENT_LIMITS.title) {
        throw new Error(`タイトルは${ANNOUNCEMENT_LIMITS.title}文字以内です`)
      }
      if (body.length > ANNOUNCEMENT_LIMITS.body) {
        throw new Error(`本文は${ANNOUNCEMENT_LIMITS.body}文字以内です`)
      }
      await updateDoc(doc(db, paths.announcements, id), {
        title,
        body,
        isPinned: params.isPinned,
        updatedAt: serverTimestamp(),
      })
    },
    [],
  )

  const deleteAnnouncement = useCallback(async (id: string) => {
    await deleteDoc(doc(db, paths.announcements, id))
  }, [])

  const isBootstrapAdmin = isBootstrapAdminUid(user?.uid)
  const isAdmin = isBootstrapAdmin || isManagedAdmin
  const hasPlayerProfile = !!myPlayer
  // 管理者 doc の確認は画面全体をブロックしない（登録画面が Loading で固まるのを防ぐ）
  const authLoadingCombined =
    authLoading || (user ? playerLoading && !myPlayer : false)
  const homeDataReady =
    !playersLoading &&
    !gamesLoading &&
    !resultsLoading &&
    !announcementsLoading &&
    !activitiesLoading

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
      announcements,
      announcementsLoading,
      announcementsError,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      activities,
      activitiesLoading,
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
      announcements,
      announcementsLoading,
      announcementsError,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      activities,
      activitiesLoading,
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
