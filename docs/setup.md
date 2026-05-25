# Poker League Board v0.1

友達内ポーカーリーグの試合結果・ランキング管理アプリ

## セットアップ手順

### 1. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. 「プロジェクトを追加」→ プロジェクト名を入力（例: `poker-league`）
3. Google Analytics は任意（スキップしてOK）

### 2. Firebase サービスを有効化

#### Authentication
1. 左サイドバー「Authentication」→「始める」
2. 「Sign-in method」タブ →「Google」を有効化
3. プロジェクトのサポートメールを設定して保存

#### Firestore Database
1. 左サイドバー「Firestore Database」→「データベースを作成」
2. **「本番環境モード」で開始**（後でRulesを設定する）
3. ロケーションは `asia-northeast1`（東京）を推奨

### 3. Firebase SDK の設定情報を取得

1. プロジェクト設定（⚙️アイコン）→「全般」タブ
2. 「マイアプリ」→「</> ウェブ」でアプリを登録
3. 表示された `firebaseConfig` の値をコピー

### 4. 環境変数を設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` に Firebase の設定値を貼り付け：

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### 5. Firestore Security Rules を設定

Firebase Console → Firestore → 「ルール」タブに以下を貼り付けて「公開」：

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /leagues/{leagueId}/{collection}/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Firestore インデックスを作成

Firebase Console → Firestore → 「インデックス」タブ → 複合インデックスを追加：

**インデックス 1（results コレクション）:**
- コレクションID: `results`
- フィールド1: `gameId` (昇順)
- フィールド2: `rank` (昇順)

または Firebase CLI を使う場合：
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:indexes
```

### 7. ローカル起動

```bash
npm install
npm run dev
```

→ http://localhost:5173 で開く

### 8. 初期データ投入

1. アプリを開き、Header の「管理者ログイン」をクリック
2. Google アカウントでログイン
3. 「Players」→ プレイヤーを追加
4. 「+ 追加」→ 試合結果を追加

---

## Vercel へのデプロイ

### 方法A: GitHub 連携（推奨）

1. このリポジトリを GitHub に push
2. [Vercel](https://vercel.com) でインポート
3. 「Environment Variables」に `.env` の内容をすべて追加
4. 「Deploy」

### 方法B: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Vercel に設定が必要な環境変数

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Firebase Authentication の承認済みドメイン設定

Vercel でデプロイ後：
1. Firebase Console → Authentication → 「Settings」→「承認済みドメイン」
2. Vercel のデプロイURL（例: `poker-league.vercel.app`）を追加

---

## ポイントルール

| 順位 | ポイント |
|------|----------|
| 1位  | +7       |
| 2位  | +5       |
| 3位  | +3       |
| 4位  | +1       |
| 5位以下 | 0     |
| 最下位 | -2（最優先） |

※ 最下位ペナルティ（-2）は順位ポイントより優先されます。
例：4人参加の場合、4位は +1 でなく -2 になります。

---

## データ構造（Firestore）

```
leagues/
  main/
    players/{playerId}
      - name: string
      - icon: string
      - memo: string
      - isActive: boolean
      - createdAt: Timestamp
      - updatedAt: Timestamp

    games/{gameId}
      - gameNo: number
      - date: string (YYYY-MM-DD)
      - appName: string
      - memo: string
      - createdAt: Timestamp
      - updatedAt: Timestamp

    results/{resultId}
      - gameId: string
      - playerId: string
      - rank: number
      - point: number
      - createdAt: Timestamp
```

---

## 注意事項

- アプリ内ポイントはランキング表示のためのスコアです
- 金銭的価値は一切持ちません
- 精算・賞金・換金機能は実装していません（今後も実装しない方針）
