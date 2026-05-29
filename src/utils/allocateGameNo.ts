import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  type Firestore,
} from 'firebase/firestore'

/** カウンター未作成時に既存試合から nextGameNo を初期化 */
export async function ensureGameCounterInitialized(
  db: Firestore,
  gamesPath: string,
  counterPath: string,
): Promise<void> {
  const counterRef = doc(db, counterPath)
  const snap = await getDoc(counterRef)
  if (snap.exists()) return

  const gamesSnap = await getDocs(collection(db, gamesPath))
  let maxNo = 0
  for (const gameDoc of gamesSnap.docs) {
    const n = gameDoc.data().gameNo
    if (typeof n === 'number' && n > maxNo) maxNo = n
  }

  await setDoc(counterRef, { nextGameNo: maxNo + 1 })
}

/** 不変の通し番号を1つ採番（削除しても再利用しない） */
export async function allocateGameNo(
  db: Firestore,
  gamesPath: string,
  counterPath: string,
): Promise<number> {
  await ensureGameCounterInitialized(db, gamesPath, counterPath)
  const counterRef = doc(db, counterPath)

  return runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    if (!counterSnap.exists()) {
      throw new Error('試合番号カウンターの初期化に失敗しました')
    }
    const nextGameNo = counterSnap.data().nextGameNo as number
    if (typeof nextGameNo !== 'number' || nextGameNo < 1) {
      throw new Error('試合番号カウンターが不正です')
    }
    transaction.update(counterRef, { nextGameNo: nextGameNo + 1 })
    return nextGameNo
  })
}
