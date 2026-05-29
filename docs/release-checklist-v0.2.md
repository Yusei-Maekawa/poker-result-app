# Rivalt v0.2 公開前チェックリスト

友達内への **v0.2 公開（ベータ）** 直前に、最低限これだけ通すことを推奨する。

## ビルド・リポジトリ

- [ ] `npm run build` がローカルで成功する
- [ ] `.env` を **リポジトリにコミットしていない**（`VITE_ADMIN_UIDS`・Firebase 設定は秘匿）
- [ ] `firestore.rules` を本番と同じ内容で **Firebase にデプロイ済み**

## 環境の一致

- [ ] `.env` の `VITE_ADMIN_UIDS` と、デプロイ済み Rules の **ブートストラップ管理者 UID** が一致
- [ ] Hosting / 実行 URL が指す Firebase **プロジェクト**が期待どおりである

## 手動テスト（抜粋）

詳細は [test-cases-v0.2.md](./test-cases-v0.2.md)。

- [ ] **最重要**: TC-G2, TC-G3, TC-V1, TC-G4, TC-BN5
- [ ] ゲスト: 未ログインで `/`・ランキング・試合一覧が見られる（TC-L1）
- [ ] BAN ユーザーにバナー・プロフィール停止が出る（TC-R3, TC-R4）
- [ ] 新規登録 → 試合参加者に自分が選べる流れ（TC-L2, BN5）

## 運営メモ

- 最初のブートストラップ管理者は **自分の UID** を `.env` と Rules に入れる
- 追加管理者はアプリの「管理者設定」から登録できる
- 公開 URL を Discord の友達に共有するだけで開始可能（アカウントは各自 Google + 新規登録）

## メンテナンス画面の切り替え

手順の詳細は **[maintenance-deploy.md](./maintenance-deploy.md)** を参照。

- **再開（本番）**: `npm run deploy:live`
- **メンテのみ**: `npm run deploy:maintenance`

## リリース後

- Firestore での誤削除に備え、必要なら定期エクスポートやバックアップ方針を決める（将来 v0.x で機能化予定）
