# Rivalt v0.3 リリースノート

PR 本文・デプロイ前確認用のまとめ。詳細設計は [`design-v0.3.md`](./design-v0.3.md)。

---

## アプリ内お知らせ（掲載用文案）

管理者は `/admin/announcements` から以下を投稿してください。  
画面フッターには `package.json` の semver（現在 **v0.3.0**）が自動表示されます。

| 項目 | 内容 |
|------|------|
| タイトル | `v0.3.0 アップデートのお知らせ` |
| ピン留め | 任意（おすすめ: ON） |

**本文（コピペ用）:**

```
皆さん、こんにちは。

Rivalt を v0.3.0 にアップデートしました。主な変更点は次のとおりです。

■ 個人成績
・プレイヤー一覧から各メンバーの「詳細」を開けるようになりました
・直近5試合、優勝率・入賞率・平均順位、連続入賞などを確認できます
・プロフィールのメモも詳細画面で表示されます

■ ホーム画面
・お知らせ … 運営からの告知をこの欄に掲載します
・アクティビティ … 新メンバー参加や試合結果追加のタイムラインを表示します

■ 試合まわり
・試合に「第〇戦」の通し番号を付与しました（削除しても番号は詰めず、欠番がある場合があります）
・試合の開催日時を一覧・詳細で見やすく表示します

■ その他
・新規登録後に画面が表示されない問題を修正しました

ご不明点は運営までどうぞ。これからもよろしくお願いします。
```

---

## Summary

v0.3 は **個人成績の深掘り**、**ホームのお知らせ・アクティビティ**、**試合番号・日時の整備**、および **新規登録まわりのバグ修正** を含む。

---

## 新機能

### 個人成績

- プレイヤー詳細画面（`/players/:playerId`）
- 直近5試合・優勝率・入賞率・平均順位・連続入賞
- プレイヤーメモ（既存 `memo`）の表示
- プレイヤー一覧・ランキング・試合詳細から詳細へリンク

### ホーム

- **お知らせ**（管理者が `/admin/announcements` で CRUD、ホームに表示）
- **アクティビティ**（新規登録・試合追加時に自動記録、ホームにタイムライン表示）

### 試合データ

- **第〇戦（`gameNo`）**: カウンター `leagues/{leagueId}/counters/games` で不変採番（削除しても番号は詰めない・欠番あり）
- **開催日時**: `date` + 試合追加時に自動記録する `time`（`HH:mm`、手入力なし）
- Discord 共有文・一覧・詳細で日時表示を統一（`formatGameDateTime`）

### 運用・環境

- **`VITE_LEAGUE_ID`**: 本番 `main` / テスト `dev` などで Firestore データを分離（テストで試合を大量追加しても本番の通し番号が飛ばない）
- Firestore Rules 拡張: `counters` / `activities` / `announcements`

### データ層

- `AppProvider` で announcements / activities をプリロード（スプラッシュ中も購読）

---

## バグ修正

### 新規登録後に画面が真っ白・遷移できない

| 原因 | 対応 |
|------|------|
| 登録直後の `navigate('/')` と `hasPlayerProfile` 更新の競合（`AuthRedirect` が `/register` に戻す） | プロフィール反映後にホームへ遷移。登録成功時に `myPlayer` を即時セット |
| プレイヤー + アクティビティの同一バッチ失敗で登録ごと失敗（Rules 未デプロイ時など） | プレイヤー作成後、アクティビティは別書き込み（失敗しても登録は成功） |
| スプラッシュ後の `history.replaceState` が `/register` を `/` に潰し Router と不一致 | `/register`・`/login` 等は URL を維持 |
| `authLoading` に `adminLoading` を含め、登録後も全画面 `Loading` のまま `navigate` されない | `adminLoading` を全体ローディングから除外。`AuthRedirect` で登録済みなら `/` へ。登録成功時に `navigate` |

---

## デプロイ時の注意

1. **Firestore Rules** を必ずデプロイ  
   `npx firebase deploy --only firestore:rules`
2. 本番ビルドでは **`VITE_LEAGUE_ID=main`**（Vercel 環境変数含む）
3. ローカル検証のみ **`VITE_LEAGUE_ID=dev`** に切り替え可（`docs/setup.md` 参照）
4. 既存試合に `time` が無い場合は日付のみ表示（編集は任意）

---

## 主な変更ファイル（参考）

- `src/context/AppProvider.tsx` — 採番・お知らせ・アクティビティ・登録フロー
- `src/pages/PlayerDetailPage.tsx`, `AdminAnnouncementsPage.tsx`
- `src/components/home/*`, `src/utils/allocateGameNo.ts`, `formatDateTime.ts`, `playerStats.ts`
- `src/firebase.ts` — `VITE_LEAGUE_ID`
- `firestore.rules`
- `src/App.tsx`, `RegisterPage.tsx`, `AuthRedirect.tsx`

---

## Test plan（PR 用チェックリスト）

詳細な手順・期待結果は [`docs/test-cases-v0.3.md`](./test-cases-v0.3.md) を参照。

- [ ] 新規登録 → ホームが表示され、ヘッダに名前が出る（TC-RG1）
- [ ] 管理者: 試合追加 → 第N戦・日時表示・アクティビティに載る（TC-AC2, TC-DT1）
- [ ] 管理者: お知らせ CRUD → ホームに表示（TC-AN2）
- [ ] `/players/:id` で個人成績が見える（TC-PD1）
- [ ] `VITE_LEAGUE_ID=dev` でテスト後、`main` の `gameNo` が飛んでいない（TC-LG1）
- [ ] Rules デプロイ済み環境で permission-denied が出ない
- [ ] v0.2 回帰（ゲスト閲覧・試合 CRUD）が通る
