# メンテナンス画面と本番の切り替え

シーズン外など、**URL はそのまま**で訪問者に「メンテナンス中」だけ見せたいときの手順です。

本番 URL（例）: https://poker-league-76576.web.app

---

## いちばん短い手順

| やりたいこと | コマンド |
|--------------|----------|
| **メンテ画面にする**（シーズンオフなど） | `npm run deploy:maintenance` |
| **本番アプリに戻す**（再開） | `npm run deploy:live` |

どちらも **プロジェクトのルート**で実行します。

---

## 再開するとき（本番に戻す）

1. ルートに **`.env`** があること（Firebase の `VITE_*` と `VITE_ADMIN_UIDS`）
2. 次を実行:

```bash
npm run deploy:live
```

3. ブラウザで本番 URL を開き、ホーム・ログイン・ランキングが表示されることを確認
4. Discord などでメンバーに「再開した」と URL を共有（新規メンバーは **新規登録** から）

`deploy:live` の中身は次のとおりです。

- `npm run build` … 通常ビルド（メンテフラグ **オフ**）
- `firebase deploy --only hosting` … `dist/` を Hosting に反映

---

## メンテナンスにするとき

```bash
npm run deploy:maintenance
```

- `npm run build:maintenance` … `.env.maintenance` を読み、`VITE_MAINTENANCE_MODE=true` でビルド
- 通常の **`.env` は不要**（Firebase 設定を読み込まない軽い画面だけ）

---

## ローカルで確認してからデプロイ

### 本番アプリの見た目

```bash
npm run build
npm run preview
```

ブラウザで表示された URL（だいたい `http://localhost:4173`）を開く。

### メンテ画面の見た目

```bash
npm run build:maintenance
npm run preview
```

「メンテナンス中」のカードだけ出れば OK。

---

## 仕組み（参考）

| ファイル | 役割 |
|----------|------|
| `.env` | 通常ビルド用（Firebase 設定・管理者 UID） |
| `.env.maintenance` | `VITE_MAINTENANCE_MODE=true` のみ |
| `src/main.tsx` | メンテ ON のとき `MaintenancePage` だけ表示、OFF のとき通常の `App` |
| `src/pages/MaintenancePage.tsx` | メンテ用の1画面 |

`package.json` のスクリプト:

| スクリプト | 内容 |
|------------|------|
| `build` | 通常ビルド |
| `build:maintenance` | `vite build --mode maintenance` |
| `deploy:live` | `build` + Hosting デプロイ |
| `deploy:maintenance` | `build:maintenance` + Hosting デプロイ |

---

## 注意事項

### メンテは「画面だけ」止める

- Hosting に載せる HTML/JS がメンテ用になるだけです。
- **Firestore のセキュリティルールは変わりません**（未ログインでも read できる設定のままなら、技術的には API 経由の読み取り余地は残ります）。
- **データまで完全に隠したい**場合は、別途 `firestore.rules` で「read もログイン必須」にするなどの対応が必要です（[design.md](./design.md) のセキュリティ節を参照）。

### Firestore ルールのデプロイ

メンテ切替では **Hosting のみ** デプロイします。ルールを変えたときだけ:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

本番再開時にルール変更がなければ、**`deploy:live` だけで十分**です。

### Firebase ログイン

初回や別 PC では、デプロイ前に:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use poker-league-76576
```

（プロジェクト ID は `.firebaserc` の `default` に合わせる）

---

## トラブル時

| 症状 | 確認すること |
|------|----------------|
| 再開してもメンテのまま | `deploy:live` を実行したか。ブラウザのスーパーリロード（キャッシュ） |
| `deploy:live` でビルド失敗 | `.env` に `VITE_FIREBASE_*` が入っているか |
| 管理者で試合が書けない | `.env` の `VITE_ADMIN_UIDS` とデプロイ済み `firestore.rules` の UID が一致しているか |
| permission-denied | Rules をデプロイしたか（`deploy --only firestore:rules`） |

---

## 関連ドキュメント

- [v0.2 公開前チェックリスト](./release-checklist-v0.2.md)
- [セットアップ手順](./setup.md)
- [ロードマップ](./roadmap.md)
