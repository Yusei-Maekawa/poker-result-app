# 使用したAIプロンプト

このドキュメントでは、Poker League Board の設計・実装補助に使用したAIプロンプトを記録する。

目的は、開発過程の再現性を高めること、AIに依頼した内容を後から確認できるようにすることである。

## 注意

このファイルには、以下の情報は記載しない。

- Firebase APIキー
- Firebase UID
- `.env` の実値
- 個人情報
- 秘密情報
- 本番環境の認証情報

---
# 1. v0.1 最小実装プロンプト

## 目的

Poker League Board の「今日中に使える最小版 v0.1」を作成するためのプロンプト。

この段階では、モックではなく実際に使える形を目指し、Firebase Firestore にデータを保存できる構成を依頼した。

## 使用先

Claude

## 使用目的

- React + TypeScript + Vite + Tailwind CSS による画面実装
- Firebase Authentication によるGoogleログイン
- Firestoreへのプレイヤー・試合・結果データ保存
- ランキング集計
- 試合一覧表示
- Discord共有文生成
- Vercel公開を見据えた構成作成

## 補足

このプロンプトでは、v0.1の速度優先のため「ログインしているユーザーを管理者として扱う」方針で依頼した。

ただし、公開前の安全性を高めるため、後続修正で `VITE_ADMIN_UIDS` を使った管理者UID制限と、Firestore Rules による書き込み制限を追加する方針に変更した。


## プロンプト本文
```text
Poker League Board の「今日中に使える最小版 v0.1」を実装してください。

目的：
Discordの友達内で行うポーカーの試合結果を記録し、ランキング・試合一覧・Discord共有文を友達がURLから見られるWebアプリを作りたいです。

重要：
今回はデモではなく、実際に使える形にしたいです。
そのため、localStorageではなく Firebase Firestore に保存してください。

ただし、今日中に完成させたいので、機能は最小限に絞ります。

# 技術構成

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Firebase Authentication
- Firebase Firestore
- Vercelで公開予定

# 今回作る機能

## 閲覧者向け

- ホーム画面
- ランキング画面
- 試合一覧画面
- 試合詳細表示
- Discord共有文の表示

## 管理者向け

- Googleログイン
- プレイヤー追加
- プレイヤー一覧表示
- 試合結果追加
- 順位入力
- ポイント自動計算
- Discord共有文コピー

# 今回作らない機能

- 大会機能
- バウンティ大会機能
- 特殊ルール大会機能
- 複数リーグ管理
- 複数管理者
- シーズン管理画面
- スクリーンショット添付
- Discord Bot
- OCR
- リアルマネー管理
- 精算機能
- 賞金管理
- 換金可能ポイント

# 注意事項

リアルマネー、賭け金、精算、賞金、換金可能ポイントに関する項目は絶対に入れないでください。
アプリ内ポイントはランキング表示のためのスコアであり、金銭的価値を持たないものとしてください。

# データ構造

今回は1リーグ固定でよいです。
leagueId は "main" 固定で構いません。
seasonId は "season1" 固定で構いません。

Firestore構成：

leagues/main/players/{playerId}
leagues/main/games/{gameId}
leagues/main/results/{resultId}

# 型定義

Player:
- id
- name
- icon
- memo
- isActive
- createdAt
- updatedAt

Game:
- id
- gameNo
- date
- appName
- memo
- createdAt
- updatedAt

Result:
- id
- gameId
- playerId
- rank
- point
- createdAt

# ポイントルール

- 1位: +7
- 2位: +5
- 3位: +3
- 4位: +1
- 5位以下: 0
- 最下位: -2

ただし、最下位の場合は最下位ペナルティを優先してください。
例：4人参加の場合、4位は +1 ではなく -2。

# 必要な画面

## HomePage

表示内容：
- アプリ名 Poker League Board
- Season 1
- ランキング上位3名
- 直近の試合3件
- ランキング画面へのリンク
- 試合一覧画面へのリンク
- 管理者ログイン状態なら「試合結果を追加」ボタン

## RankingPage

表示内容：
- 順位
- プレイヤー名
- 合計ポイント
- 参加回数
- 優勝回数
- 平均順位
- 入賞率
- 最下位回数

## GamesPage

表示内容：
- 試合番号
- 日付
- 使用アプリ
- 優勝者
- 参加人数
- 上位3名
- メモ
- 詳細表示

## PlayersPage

表示内容：
- プレイヤー一覧
- 管理者ログイン時のみプレイヤー追加フォーム

## NewGamePage

管理者ログイン時のみ表示。

入力項目：
- 試合日
- 使用アプリ名
- 参加者選択
- 各参加者の順位
- メモ

保存時：
- games に試合情報を保存
- results に参加者ごとの順位とポイントを保存
- gameNo は既存games数 + 1 でよい

## GameDetailPage

表示内容：
- 試合番号
- 日付
- 使用アプリ
- 順位
- 獲得ポイント
- メモ
- Discord共有文
- コピーするボタン

# コンポーネント方針

以下のように分けてください。

src/
├─ App.tsx
├─ main.tsx
├─ firebase.ts
├─ types/
│  └─ index.ts
├─ utils/
│  ├─ point.ts
│  ├─ ranking.ts
│  └─ discord.ts
├─ hooks/
│  ├─ useAuth.ts
│  ├─ usePlayers.ts
│  ├─ useGames.ts
│  └─ useResults.ts
├─ components/
│  ├─ Header.tsx
│  ├─ Layout.tsx
│  ├─ RankingCard.tsx
│  ├─ GameCard.tsx
│  └─ Loading.tsx
└─ pages/
   ├─ HomePage.tsx
   ├─ RankingPage.tsx
   ├─ GamesPage.tsx
   ├─ GameDetailPage.tsx
   ├─ PlayersPage.tsx
   └─ NewGamePage.tsx

# デザイン方針

- スマホ優先
- カード型UI
- ダーク系
- ポーカー・リーグ感
- 見やすさ優先
- 友達に見せても最低限ちゃんとして見えるUI

# Firebaseについて

.env に以下を設定する前提で作ってください。

VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

firebase.ts で初期化してください。

# 認証

Firebase Authentication の Googleログインを使ってください。

v0.1では、ログインしているユーザーを管理者として扱って構いません。
ただし、閲覧者はログインなしでランキングと試合一覧を見られるようにしてください。

# 出力してほしいもの

- 必要ファイルのコード
- Firebase側で必要な設定
- Firestore Rulesの簡易版
- 実行コマンド
- Vercelデプロイ時に必要な環境変数

# 今後の展望
v0.1では、通常試合の結果入力・ランキング表示・試合一覧・Discord共有文生成までを最小機能として実装します。
今後は、実際に友達内で使いながら、必要な機能を段階的に追加していきます。
## v0.2：使いやすさ改善
- 試合結果の編集・削除
- プレイヤー情報の編集・非表示
- 入力ミス防止のバリデーション強化
- スマホ表示の改善
- Discord共有文の見た目調整
- ランキング表示項目の整理
## v0.3：シーズン管理
- Season 1、Season 2 のように成績を分ける機能
- シーズンごとのランキング表示
- 通算ランキングとシーズンランキングの切り替え
- シーズン終了時の最終成績表示
## v0.4：個人成績の強化
- プレイヤー詳細画面
- 直近5試合の成績
- 優勝率・入賞率・平均順位の詳細表示
- 連続入賞記録
- 最下位回数
- プレイヤーごとの傾向メモ
## v0.5：大会・イベント機能
- 通常試合とは別に大会結果を記録できる機能
- バウンティ大会のKO数記録
- 特殊ルール大会の記録
- ポイント倍率の設定
- イベント単位のランキング表示
ただし、v0.1では大会機能は実装しません。
まずは通常試合の結果管理に絞ります。
## v0.6：共有・運用機能
- 管理者を複数人設定できる機能
- 閲覧者と管理者の権限分離
- 友達が見やすい共有URL
- Firebase Security Rules の強化
- データバックアップ
## v0.7：見た目・盛り上げ機能
- 称号機能
- 月間MVP
- 優勝回数バッジ
- 入賞率ランキング
- グラフ表示
- 試合結果のスクリーンショット添付
## 将来的に検討する機能
- PWA対応
- Discord Bot連携
- OCRによる結果読み取り
- プレイヤー同士の比較機能
- 月間・年間ランキング
- 試合結果のエクスポート機能
## 今後も入れない方針の機能
以下の機能は、法的リスクや運用トラブルを避けるため、今後も実装しません。
- リアルマネー管理
- 賭け金管理
- 精算機能
- 賞金管理
- 換金可能ポイント
- 金銭の授受を前提とした機能
アプリ内ポイントは、あくまでランキング表示のためのスコアとして扱い、金銭的価値を持たないものとします。

```



