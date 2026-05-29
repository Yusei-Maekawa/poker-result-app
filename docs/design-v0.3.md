# Rivalt v0.3 設計書

## 目的

v0.3 では、**個人成績の深掘り**と、**ホーム画面の情報ハブ化**（お知らせ・アクティビティ）を行う。  
シーズン分け（v0.4）の前提データは触らず、現行の `leagues/main` 全期間データを対象とする。

関連ドキュメント:

- 要件・ロードマップ: `docs/roadmap.md`（v0.3 節）
- 全体設計・権限: `docs/design.md`
- PR・リリースまとめ: `docs/release-v0.3.md`
- 受け入れ観点: [`docs/test-cases-v0.3.md`](./test-cases-v0.3.md)

---

## スコープ

### 含む

| 領域 | 内容 |
|------|------|
| 個人成績 | プレイヤー詳細画面、直近5試合、率・平均順位、連続入賞、メモ表示 |
| お知らせ | 管理者が掲載する告知（手動 CRUD） |
| アクティビティ | メンバー加入・試合追加の自動タイムライン |
| ホーム | 上記2枠のセクション追加、既存ランキング TOP3・直近試合は維持 |
| データ | Firestore コレクション追加、Rules 拡張、`AppProvider` 購読・書き込み |
| 試合番号 | **不変の通し番号**への採番修正（削除後も再採番・欠番の扱いを明文化） |
| 試合日時 | **開催日＋時刻**の入力・表示（一覧・詳細・Discord・直近試合） |

### 含まない（v0.4 以降）

- シーズン ID による成績の分割・シーズン切替 UI
- お知らせの下書き・公開予約・既読管理
- アクティビティの種類拡張（試合編集・BAN など）
- プッシュ通知・メール

---

## 試合番号（第〇戦）と削除

### 問題

「第42戦」のように **通し番号として見せる** と、次のような矛盾が起きる。

| やり方 | 削除後に起きること |
|--------|-------------------|
| 件数 + 1 で採番（現状に近い） | 試合を消すと件数が減り、**既存と重複する番号**が付く可能性がある |
| 削除のたびに残り試合を 1,2,3… と詰め直す | Discord 共有文・アクティビティの「第42戦」と **画面表示が食い違う** |
| 表示だけ並び順で「第N戦」と付け直す | 同上。履歴・外部共有と整合しない |

### 方針（採用）

**`gameNo` は作成時に一度だけ付与する不変 ID** とする。

- 新規試合の番号 = **これまでに使った最大値 + 1**（欠番はそのまま）
- 試合削除時は **`gameNo` を変更しない**（他試合の番号も詰めない）
- UI・Discord 文・アクティビティは、すべて **ドキュメントに保存された `gameNo`** を表示する

例: 第1〜第5戦まで登録 → 第3戦を削除 → 残るのは 1,2,4,5 → 次に追加されるのは **第6戦**（3は欠番のまま）。

欠番はバグではなく仕様とし、必要なら管理者向けヘルプに「削除した試合の番号は再利用しません」と一行書く程度でよい。

### 採番の実装（v0.3 で修正）

現状の `getDocs` 件数 `+ 1` は上記方針に合わないため、次のいずれかに置き換える。

**推奨: カウンタードキュメント（トランザクション）**

```
leagues/{leagueId}/counters/games
  nextGameNo: number   // 次に付与する番号（初回は 1）
```

試合作成時（`addGame` / `addGameWithResults`）:

1. トランザクションで `counters/games` を読む
2. 今回の `gameNo = nextGameNo` を試合 doc に書く
3. `nextGameNo` を `+ 1` して commit

削除は試合 doc と results のみ。カウンターは **減らさない**。

**代替: 既存試合の max(gameNo) + 1**

友達リーグ規模なら可。ただし同時に2人が試合追加すると競合しやすいため、将来はカウンター方式に寄せる。

### 既存データの移行

- 既存試合の `gameNo` はそのまま尊重する
- 初回デプロイ時（またはカウンター未作成時）に  
  `nextGameNo = max(全 games の gameNo) + 1`（試合0件なら `1`）で `counters/games` を初期化
- 過去に `size + 1` で重複 `gameNo` が付いている場合は、運用で手修正するか、重複検出スクリプトを別タスクとする

### アクティビティ・外部共有との関係

v0.3 アクティビティは作成時に `gameNo` を **スナップショット** する（例: 「第42試合の結果が追加されました」）。

- 試合削除後もフィードの文言は **当時の 42 のまま**（正しい）
- リンク先が無い場合は「削除された試合」と表示

### 表示上の補足

- 一覧の並びは引き続き `gameNo` 降順（または日付）でよい。欠番があっても順序は自然
- 「第N戦」の N は **通しの回数** ではなく **リーグ通算の試合 ID** と捉える
- v0.4 でシーズン分けする場合は、`seasonId` ごとに別カウンター（`counters/season2` など）を検討する。v0.3 はシーズン単一のまま `counters/games` で足りる

### やらないこと

- 削除時の一括リナンバリング
- 欠番を埋めるための番号の再利用
- 画面だけ動的に 1,2,3… と付け直す表示専用番号（`gameNo` と二重管理）

### テストと本番で番号が飛ばないようにする（`VITE_LEAGUE_ID`）

カウンターは **リーグごと** に `leagues/{leagueId}/counters/games` にある。テストで試合を大量に追加・削除しても、別リーグの `nextGameNo` には影響しない。

| `VITE_LEAGUE_ID` | 用途 |
|------------------|------|
| `main` | 本番（デフォルト） |
| `dev` 等 | テスト・検証 |

- 実装: `src/firebase.ts` の `LEAGUE_ID = import.meta.env.VITE_LEAGUE_ID ?? 'main'`
- 運用: `docs/setup.md` の「リーグ ID」節

本番デプロイ前に `.env` / Vercel の環境変数が **`main` になっていること** を確認する。

---

## 試合の日付・時刻

### 現状と課題

| フィールド | 意味 | 表示 |
|------------|------|------|
| `date` | 開催日（`YYYY-MM-DD`） | 「2025年5月29日」のみ |
| `createdAt` | Firestore への**登録日時** | 画面ではほぼ未使用 |

「いつ遊んだか」と「いつ管理者が入力したか」は別なので、**表示用の時刻は `createdAt` に頼らない**。

### 方針

試合ドキュメントに **開催時刻** を追加する。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `date` | string | ○ | 従来どおり `YYYY-MM-DD`（開催日） |
| `time` | string | △ | `HH:mm`（24時間制）。**試合追加時に `getDefaultGameTime()` で自動記録**（手入力なし）。旧データは日付のみ表示 |

タイムゾーンは **日本時間（JST）固定** とし、UTC 変換は v0.3 では行わない（友達内利用・入力も JST 想定）。

### 表示フォーマット

共通ユーティリティ `formatGameDateTime(date, time?)`（`src/utils/formatDateTime.ts`）:

| `time` | 表示例 |
|--------|--------|
| あり | `2025年5月29日 21:30` |
| なし（旧データ） | `2025年5月29日` |

秒は表示しない。Discord 共有文も同じ関数を使う。

### 入力 UI（新規・編集試合）

- 日付: 既存の `<input type="date">`（開催日）
- 時刻: **UI なし**。`addGameWithResults` 実行時に `getDefaultGameTime()` で現在時刻を保存
- 編集時は `time` を変更しない（追加時点の記録を維持）
- バリデーション: 日付の未来日チェックのみ（`validateGameForm`）

### 表示箇所

| 画面・出力 | 内容 |
|------------|------|
| 試合一覧 / `GameCard` | 日付＋時刻 |
| 試合詳細 | 日付＋時刻（目立つ位置） |
| ホーム「直近試合」 | 同上 |
| プレイヤー詳細「直近5試合」 | 同上 |
| Discord 共有文 | `📅 2025年5月29日 21:30` |
| アクティビティ（試合追加） | 作成時に `gameDate` / `gameTime` をスナップショットし、文言またはサブ行に表示 |

### `createdAt` の扱い

- **管理者向け**（試合詳細のフッター等）に「登録: 2025/5/30 10:15」と出してもよいが、v0.3 の必須スコープ外
- ユーザー向けの主表示は常に **`date` + `time`（開催日時）**

### 既存データ

- `time` 未設定の試合は **日付のみ** 表示（マイグレーションで時刻を埋めない）
- 必要なら管理者が編集画面で時刻を追入力

### 型・Rules

`Game` 型:

```ts
date: string   // YYYY-MM-DD
time?: string  // HH:mm（v0.3 以降の新規は必須運用）
```

Firestore Rules（games）: `time` が存在する場合は string かつ正規表現 `^([01][0-9]|2[0-3]):[0-5][0-9]$` 程度。create/update の `keys()` に `time` を追加。

### お知らせ・アクティビティの「日時」

| 種別 | 表示に使う値 |
|------|----------------|
| お知らせ | `createdAt` / `updatedAt` → `2025年5月29日 18:00` |
| アクティビティ | `createdAt`（イベント発生時刻） |
| 試合追加アクティビティ | 上記に加え、サブテキストで **開催日時**（`gameDate` + `gameTime` スナップショット） |

例:

```text
第42戦の結果が追加されました
2025年5月29日 21:30  ·  5分前
```

（「5分前」など相対表示は任意。最低限は絶対日時）

---

## 画面・ルーティング

| パス | 画面 | 認証 |
|------|------|------|
| `/` | ホーム（お知らせ・アクティビティ追加） | 不要 |
| `/players/:playerId` | プレイヤー詳細（新規） | 不要 |
| `/admin/announcements` | お知らせ管理（新規） | 管理者のみ |

既存画面からの導線:

- **プレイヤー一覧**・**ランキング**・**試合詳細の参加者名** → `/players/:playerId`
- **ホーム**（管理者ログイン時）→ お知らせセクション内に「管理」リンク → `/admin/announcements`

`playerId` は Firestore の `players/{playerId}` ドキュメント ID（v0.2 以降は原則 Firebase UID）。

---

## ホーム画面レイアウト

スマホは縦積み、PC（`lg`）は既存の2カラム方針を踏襲する。

```
[ヒーロー]（現状維持）

[お知らせ]          ← 新規（全員閲覧）
  - ピン留めを先頭、以降は新しい順
  - 0件時はセクション非表示または「お知らせはありません」

[アクティビティ]    ← 新規（全員閲覧）
  - 直近 N 件（初期値 15、ホームでは折りたたみ可）
  - 0件時は同上

[ランキング TOP3]   （現状維持）
[直近試合]          （現状維持・件数は既存どおり）
```

**お知らせ**と**アクティビティ**は別コンポーネント・別データソースとし、見た目も区別する（例: お知らせはカード＋タイトル強調、アクティビティはタイムライン行）。

---

## 個人成績（プレイヤー詳細）

### 表示対象

- `isActive: false` のプレイヤーも**閲覧可能**（過去成績のため）。画面上部に BAN 告知バナー（v0.2 の共通バナーと整合）。
- `authUid` 未設定の旧プレイヤーは詳細表示可。試合へのリンクは `gameId` が存在する場合のみ。

### 集計ロジック

既存の `buildRankingStats(players, results)` から当該プレイヤーの `RankingStat` を取得する。

| 指標 | 定義（v0.3） |
|------|----------------|
| 優勝率 | `winCount / playCount`（参加0なら `—`） |
| 入賞率 | 既存 `podiumRate`（3位以内 / 参加） |
| 平均順位 | 既存 `avgRank` |
| 最下位回数 | `lastPlaceCount` |
| 合計ポイント | `totalPoint` |

**直近5試合**: 当該 `playerId` の `results` を `games` と結合し、`gameNo` 降順で最大5件。各行に**開催日時**（`formatGameDateTime`）・試合No・順位・ポイント・試合詳細へのリンク。

**連続入賞記録**: 参加した試合を `gameNo` 昇順に並べ、3位以内が連続した最大本数と、**現在進行中**の連続本数（末尾から数える）を表示。

```text
例: 入賞→入賞→圏外→入賞 → 最長2、現在1
```

実装は `src/utils/playerStats.ts`（新規）に純関数として切り出し、詳細画面と将来の Discord 文生成で再利用可能にする。

### 傾向メモ

v0.3 ではプレイヤードキュメントの既存フィールド **`memo`** を詳細画面に表示する（本人は `/profile` で編集、他者は閲覧のみ）。  
管理者専用の別メモ欄は v0.3 では設けない。

### UI 構成（案）

1. ヘッダ（アイコン・名前・メモ）
2. サマリカード（ポイント・参加数・優勝率・入賞率・平均順位）
3. 連続入賞
4. 直近5試合リスト
5. 全試合への導線（既存 `/games` または該当プレイヤーでフィルタは v0.3 外）

---

## お知らせ（運営告知）

### 役割

管理者が手動で掲載する**公式告知**。アップデート・運用連絡・シーズン開始予告など。  
アクティビティと混在させない。

### データモデル

コレクション: `leagues/{leagueId}/announcements/{announcementId}`

| フィールド | 型 | 説明 |
|------------|-----|------|
| `title` | string | タイトル（必須） |
| `body` | string | 本文（プレーンテキスト、改行可） |
| `isPinned` | boolean | ピン留め（ホーム先頭） |
| `authorUid` | string | 作成者 Firebase UID |
| `createdAt` | Timestamp | 作成日時 |
| `updatedAt` | Timestamp | 更新日時 |

ID は `addDoc` の自動 ID。

### 取得

- ホーム: `orderBy('isPinned', 'desc')` + `orderBy('createdAt', 'desc')` は複合インデックスが必要。  
  **代替（推奨）**: クライアントで全件取得（件数上限想定 ~50）し、ピン留め優先・日付降順でソート。友達リーグ規模では十分。
- `AppProvider` で `onSnapshot` 購読し、`useAnnouncements()` フックを提供。

### 管理 UI

- 一覧・新規作成・編集・削除
- 入力は `sanitizeUserText` + `validationLimits`（新規キー `announcementTitle`, `announcementBody`）
- 削除は物理削除でよい（監査ログは v0.3 外）

---

## アクティビティ（自動タイムライン）

### 役割

リーグ内の**事実ベースの動き**を自動記録。お知らせの代替ではない。

### イベント種別（v0.3）

| `type` | 発火タイミング | 表示例 |
|--------|----------------|--------|
| `member_joined` | `registerPlayer` 成功時 | 「○○ さんがリーグに参加しました」 |
| `game_added` | `addGameWithResults` 成功時 | 「第42戦の結果が追加されました」（`gameNo` は不変・削除後も文言は42のまま） |

**発火しないこと**（ノイズ抑制）:

- プロフィール更新
- 試合の編集・削除
- 管理者による BAN / 解除
- 過去データの移行

### データモデル

コレクション: `leagues/{leagueId}/activities/{activityId}`

| フィールド | 型 | 説明 |
|------------|-----|------|
| `type` | string | `member_joined` \| `game_added` |
| `createdAt` | Timestamp | 表示用時刻 |
| `playerId` | string? | `member_joined` 時 |
| `playerName` | string? | 表示用スナップショット |
| `gameId` | string? | `game_added` 時 |
| `gameNo` | number? | 表示用スナップショット |
| `gameDate` | string? | 開催日 `YYYY-MM-DD`（スナップショット） |
| `gameTime` | string? | 開催時刻 `HH:mm`（スナップショット・未設定可） |
| `actorUid` | string? | 試合追加時の管理者 UID |

名前・試合番号・開催日時は**書き込み時点の値**を denormalize する（後から試合を編集してもフィードは当時のまま。削除時はリンクのみ無効化）。

### 書き込み

`AppProvider` 内のトランザクション／バッチ:

1. `registerPlayer` → プレイヤー doc 作成後、同一バッチで `activities` に1件追加
2. `addGameWithResults` → 試合・結果作成後、同一バッチで1件追加

失敗時はアクティビティだけ残らないよう、**試合・プレイヤー作成と同一バッチ**を推奨。

### 取得

- ホーム: `orderBy('createdAt', 'desc')` + `limit(15)`  
- 複合クエリ不要。単一フィールドインデックスはデフォルトで足りる。
- `AppProvider` 購読 + `useActivities()`

### 過去データ

v0.3 リリース時点の既存プレイヤー・試合については**バックフィルしない**（フィードはリリース以降のイベントのみ）。必要なら運用で一度限りのスクリプトを別タスクとする。

---

## Firestore パス拡張

`src/firebase.ts` の `paths` に追加:

```ts
announcements: `leagues/${LEAGUE_ID}/announcements`,
activities: `leagues/${LEAGUE_ID}/activities`,
gameCounter: `leagues/${LEAGUE_ID}/counters/games`,  // nextGameNo
```

---

## セキュリティルール（追加分）

### announcements

| 操作 | 許可 |
|------|------|
| read | 全員（未ログイン含む） |
| create / update / delete | `isLeagueAdmin(leagueId)` |

バリデーション例:

- `title`: 1〜60 文字
- `body`: 0〜2000 文字
- `isPinned`: boolean
- `authorUid` == `request.auth.uid`（create 時）
- `createdAt` / `updatedAt` は create で `request.time`、update で `updatedAt` のみ更新

### activities

| 操作 | 許可 |
|------|------|
| read | 全員 |
| create | **クライアントからは原則禁止**とし、管理者のみ許可するか、または管理者の `addGame` / 登録フローと同様に「認証済みかつ型が正しい create のみ」 |

**推奨**: create は `isLeagueAdmin` **または**（`type == member_joined` かつ `playerId == request.auth.uid` かつ本人登録フローに限る）の二系統。  
一般ユーザーの `registerPlayer` で `member_joined` を書けるよう、プレイヤー create 成功と同一リクエストで activity create を許可するルールを定義する。

| 操作 | 許可 |
|------|------|
| update / delete | 不可（append-only） |

`game_added` の create は `isLeagueAdmin` のみ。

---

## AppProvider 拡張

既存の players / games / results 購読に加え:

```text
onSnapshot(announcements) → announcements[]
onSnapshot(activities, orderBy createdAt desc, limit 30) → activities[]
```

公開 API（`AppContext`）に追加:

- `announcements`, `activities`
- `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`
- （activities は mutation を context 外に出さず、`registerPlayer` / `addGameWithResults` 内で完結）

スプラッシュ中のプリロード: 既存どおり `AppProvider` マウント時に購読開始し、追加コレクションもスプラッシュ中に読み込む（表示待ち時間は増やさない）。

---

## 型定義（追加）

`src/types/index.ts`:

```ts
export type ActivityType = 'member_joined' | 'game_added'

export interface Announcement {
  id: string
  title: string
  body: string
  isPinned: boolean
  authorUid: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Activity {
  id: string
  type: ActivityType
  createdAt: Timestamp
  playerId?: string
  playerName?: string
  gameId?: string
  gameNo?: number
  gameDate?: string
  gameTime?: string
  actorUid?: string
}
```

---

## バリデーション上限（追加案）

`src/constants/validationLimits.ts` に追加:

| キー | 上限 |
|------|------|
| `announcementTitle` | 60 |
| `announcementBody` | 2000 |

---

## コンポーネント構成（案）

```
src/pages/PlayerDetailPage.tsx      # 新規
src/pages/AdminAnnouncementsPage.tsx # 新規
src/components/home/
  AnnouncementsSection.tsx
  ActivityFeedSection.tsx
src/components/player/
  PlayerStatsSummary.tsx
  PlayerRecentGames.tsx
src/utils/playerStats.ts            # 連続入賞・直近試合
src/hooks/useAnnouncements.ts
src/hooks/useActivities.ts
```

---

## 実装順序（推奨）

0. **試合番号**: `counters/games` とトランザクション採番（`size + 1` 廃止）
0b. **試合日時**: `time` フィールド・入力・`formatGameDateTime`・表示・Discord
1. 型・パス・`playerStats` ユーティリティ
2. プレイヤー詳細画面 + 一覧からのリンク
3. `activities` 書き込み + フィード表示（ホーム）
4. `announcements` Rules + 管理画面 + ホーム表示
5. `test-cases-v0.3.md` と手動確認

---

## 非機能・制約

- ユーザー入力は v0.2 同様プレーンテキスト（React エスケープ + `sanitizeUserText`）
- お知らせ・アクティビティに HTML / Markdown レンダリングは v0.3 では行わない
- パフォーマンス: 友達リーグ想定（プレイヤー数十、試合数百）のため全件クライアントソートを許容
- v0.4 シーズン導入時は、集計関数に `seasonId` フィルタを渡す拡張点として `playerStats` / `buildRankingStats` を関数引数化しておく

---

## バージョン

- 本ドキュメント: **v0.3 設計**（実装済・2026-05 時点）
- 実装・バグ修正の一覧: `docs/release-v0.3.md`
- 親設計: `docs/design.md`（権限・全体方針はそちらを優先）
