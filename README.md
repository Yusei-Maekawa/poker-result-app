# Rivalt

Rivalt は、Discord の友達内で行うポーカーの試合結果を記録し、ランキング・個人成績・過去試合を管理するWebアプリです。

## アプリ名について

本アプリの名称は **Rivalt** です。

Rivalt は、以下の言葉を組み合わせた造語です。

- **Rival**：ライバル、競い合う相手
- **Result**：試合結果、リザルト
- **Vault**：記録を保管する場所

ポーカーチェイスなどで遊んだ試合結果を記録し、友達やグループ内でランキングとして共有するアプリであることから、  
「ライバルとのリザルトを保管し、リーグのように楽しむ場所」という意味を込めています。

## コンセプト

**ポーカーリザルトを、仲間とリーグ化する。**

Rivalt は、単に勝敗を記録するだけではなく、順位・ポイント・優勝回数・平均順位などを可視化し、友達内で継続的に楽しめるポーカー成績管理アプリを目指します。

## 概要

ポーカーチェイスなどの既存アプリで遊んだ試合結果を入力すると、ポイント・優勝回数・平均順位・入賞率などを自動集計し、Discordで共有しやすい形で表示します。

## バージョン

現在のソースは **v0.3** を目安とする（`docs/roadmap.md`・`docs/release-v0.3.md`、`package.json` の `version`）。

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
3. 本番データは `VITE_LEAGUE_ID=main`（テストだけ別リーグにしたいときは `dev` など — [setup.md](./docs/setup.md) 参照）
4. `npm install`
5. `npm run dev`

### Hosting の切り替え（メンテナンス / 再開）

| コマンド | 内容 |
|----------|------|
| `npm run deploy:live` | **本番アプリに再開**（通常ビルド + デプロイ） |
| `npm run deploy:maintenance` | メンテ画面のみをデプロイ |

詳細は [メンテナンスと本番の切り替え](./docs/maintenance-deploy.md) を参照。

## 注意事項

Rivalt は、友達内で行うポーカーの試合結果を記録し、ランキングや個人成績を管理するためのアプリです。

本アプリでは、リアルマネー、賭け金、精算金額、賞金、換金可能なポイント、金銭の授受に関する情報は扱いません。

記録するポイントは、アプリ内ランキング用のスコアであり、金銭的価値を持たないものとします。

## ドキュメント

- [要件定義](./docs/requirements.md)
- [設計書](./docs/design.md)
- [v0.3 リリースノート](./docs/release-v0.3.md)（PR・デプロイ用）
- [モック要件](./docs/mock.md)
- [画面設計](./docs/screens.md)
- [データベース設計](./docs/database.md)
- [ロードマップ](./docs/roadmap.md)
- [セットアップ手順](./docs/setup.md)
- [v0.1 テストケース](./docs/test-cases-v0.1.md)
- [v0.2 テストケース](./docs/test-cases-v0.2.md)
- [メンテナンスと本番の切り替え](./docs/maintenance-deploy.md)
- [v0.2 公開前チェックリスト](./docs/release-checklist-v0.2.md)
- [使用したAIプロンプト](./docs/usedPrompt.md)

