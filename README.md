# Poker League Board

Poker League Board は、Discord の友達内で行うポーカーの試合結果を記録し、ランキング・個人成績・過去試合を管理するWebアプリです。

## 概要

ポーカーチェイスなどの既存アプリで遊んだ試合結果を入力すると、ポイント・優勝回数・平均順位・入賞率などを自動集計し、Discordで共有しやすい形で表示します。

## バージョン

現在のソースは **v0.2.x** を目安とする（詳細は `docs/roadmap.md` と `package.json` の `version`）。

## 主な機能

- Google ログイン・新規登録（**1 アカウント = 1 プレイヤー**）
- プロフィール（名前・アイコン・メモ）の編集
- 試合結果の入力・**編集・削除**（管理者）
- プレイヤー **BAN**（管理者・無効化）
- ランキング表示・過去試合一覧
- Discord共有文生成
- Firebase Security Rules による試合データの書き込み制限

## 技術構成

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore

## セットアップ

1. `.env.example` をコピーして `.env` を作成
2. Firebase の設定値と `VITE_ADMIN_UIDS` を入力
3. `npm install`
4. `npm run dev`

## 注意事項

Poker League Board は、友達内で行うポーカーの試合結果を記録し、ランキングや個人成績を管理するためのアプリです。

本アプリでは、リアルマネー、賭け金、精算金額、賞金、換金可能なポイント、金銭の授受に関する情報は扱いません。

記録するポイントは、アプリ内ランキング用のスコアであり、金銭的価値を持たないものとします。

## ドキュメント

- [要件定義](./docs/requirements.md)
- [設計書](./docs/design.md)
- [モック要件](./docs/mock.md)
- [画面設計](./docs/screens.md)
- [データベース設計](./docs/database.md)
- [ロードマップ](./docs/roadmap.md)
- [セットアップ手順](./docs/setup.md)
- [v0.1 テストケース](./docs/test-cases-v0.1.md)
- [v0.2 テストケース](./docs/test-cases-v0.2.md)
- [v0.2 公開前チェックリスト](./docs/release-checklist-v0.2.md)
- [使用したAIプロンプト](./docs/usedPrompt.md)

