# Poohma アプリケーション構成案 (with Gemini)

## 1. はじめに

このドキュメントでは、アカウント情報管理アプリ「Poohma」の全体的なアーキテクチャと技術構成について提案します。
Next.js (App Router)、Supabase、Prisma、Hono、Tailwind CSS、Shadcn/UI、Zustand、Tanstack Query、そして @t3-oss/env-nextjs を活用し、
要件を満たすスケーラブルでメンテナンス性の高い、サーバーサイドレンダリング (SSR) を行うアプリケーションを目指します。

## 2. 技術スタック

- フロントエンドフレームワーク: Next.js (App Router) - SSRを活用
- UIライブラリ: React
- スタイリング: Tailwind CSS + Shadcn/UI (シンプルなスタイリングで、モバイルファースト/PCも考慮)
- バックエンド (BFF): Hono (Next.js App Router の Route Handlers に統合)
- データベース: Supabase (PostgreSQL) - RLS (Row Level Security) を活用
- 認証: Supabase Auth (Google OAuth)
- ORM: Prisma
- 状態管理: Zustand
- サーバーキャッシュ状態管理 / データフェッチング: Tanstack Query (React Query)
- 環境変数管理: @t3-oss/env-nextjs
- 暗号化ライブラリ: Web Crypto API (クライアントサイド)、Node.js crypto モジュール (サーバーサイド補助、必要に応じて)
- 型システム: TypeScript
- デプロイ: Vercel

## 3. ディレクトリ構造 (Next.js App Router ベース)
```
poohma/
├── app/                                # App Router
│   ├── (auth)/                         # 認証関連ルートグループ
│   │   └── login/
│   │       └── page.tsx                # ログインページ
│   ├── (main)/                         # メイン機能ルートグループ (認証後)
│   │   ├── layout.tsx                  # メインレイアウト (ナビゲーション等)
│   │   ├── dashboard/                  # ダッシュボード (アカウント一覧)
│   │   │   └── page.tsx
│   │   ├── accounts/                   # アカウント関連
│   │   │   ├── new/                    # 新規作成
│   │   │   │   └── page.tsx
│   │   │   └── [id]/                   # 詳細・編集
│   │   │       └── page.tsx
│   │   ├── family/                     # 家族管理
│   │   │   └── page.tsx
│   │   ├── settings/                   # 設定 (タグ管理など)
│   │   │   └── page.tsx
│   │   └── ...                         # その他必要なページ
│   ├── layout.tsx                      # ルートレイアウト
│   ├── page.tsx                        # トップページ (ランディング等)
│   └── api/                            # App Router Route Handlers (Hono)
│       └── [[...route]]/
│           └── route.ts                # Hono ルーターのエントリーポイント
│
├── components/                         # 再利用可能なコンポーネント
│   ├── ui/                             # Shadcn/UI から導入したコンポーネント (自動生成 - 編集しない)
│   └── custom/                         # アプリケーション固有のカスタムコンポーネント
│       ├── zustand/                    # ストア関連コンポーネント
│       ├── accounts/                   # アカウント関連コンポーネント
│       ├── family/                     # 家族関連コンポーネント
│       └── common/                     # 共通コンポーネント (ボタン、モーダル等)
│
├── crypto/                             # 暗号化関連ユーティリティ (クライアント/サーバー共通または分離)
│   ├── client.ts                       # クライアントサイド暗号化ヘルパー (Web Crypto API)
│   └── keys.ts                         # 鍵生成・管理関連ヘルパー
│
├── env.ts                             # @t3-oss/env-nextjs による環境変数のスキーマ定義と検証
│
├── lib/                                # ライブラリ、ヘルパー関数、型定義
│   ├── supabase/                       # Supabase クライアント設定 (主に認証用)
│   │   └── client.ts
│   ├── prisma/                         # Prisma Client インスタンス
│   │   └── client.ts
│   ├── zustand/                        # Zustand ストア定義
│   │   └── store.ts
│   ├── utils.ts                        # 共通ユーティリティ関数
│   └── types.ts                        # アプリケーション全体の型定義 (AccountInfoなど)
│
├── prisma/                             # Prisma スキーマ、マイグレーション
│   └── schema.prisma
│
├── public/                             # 静的ファイル
└── ...                                 # 設定ファイル (tailwind.config.js, tsconfig.json等)
```

## 4. 主要機能とコンポーネントの役割

### 4.1. 認証 (Auth)
- Supabase Auth (Google OAuth):
  - `app/(auth)/login/page.tsx`: Googleログインボタンを配置。
  - Supabaseクライアント (`lib/supabase/client.ts`) で認証処理を実装。
  - 認証状態は Zustand ストアでグローバルに管理。
  - Next.js Middleware (`middleware.ts`) で認証が必要なページへのアクセス制御。

### 4.2. アカウント情報 (Accounts)
- 一覧表示・フィルタリング (SSR対応):
  - `app/(main)/dashboard/page.tsx`: アカウント情報の一覧を表示。サーバーサイドで初期データをフェッチ (Tanstack Query + Prisma)。
  - フィルターコンポーネント (個人/家族共有、タグ) を配置。クライアントサイドでのインタラクティブなフィルタリングも Tanstack Query を活用。

- 登録・編集・削除:
  - `app/(main)/accounts/new/page.tsx`: 新規登録フォーム。
  - `app/(main)/accounts/[id]/page.tsx`: 詳細表示と編集フォーム。
  - フォームコンポーネントは `components/custom/accounts/` に配置。
  - AccountInfo 型定義 (`lib/types.ts`) に基づくデータ構造。データ操作はHono API経由で行い、API内部でPrismaを使用。

- クリップボードコピー:
  - アカウント詳細画面で、ログインIDやパスワードヒントの横にコピーボタンを設置。
  - `navigator.clipboard.writeText()`を使用。

### 4.3. 家族管理 (Family)
- 作成・編集・削除:
  - `app/(main)/family/page.tsx`: 家族情報の表示、作成・編集フォームへの導線。
  - 家族作成・編集用モーダルまたは専用ページ。

- メンバー招待:
  - 招待URL生成機能 (Honoバックエンドでトークン生成・管理、Prismaで永続化)。
  - 招待URL受け入れページ (例: `app/invite/[token]/page.tsx`)。

### 4.4. タグ管理 (Tags)
- アカウント登録・編集画面内でタグの選択・新規作成ができるUI。
- 必要であれば専用のタグ管理ページ `app/(main)/settings/page.tsx` を設ける。

### 4.5. API (Hono on Next.js with Prisma)
- Next.js App Router の Route Handlers (`app/api/[[...route]]/route.ts`) に Hono を組み込み、以下のエンドポイントを想定:
  - `/api/accounts`: CRUD処理
  - `/api/families`: CRUD処理、メンバー招待URL生成
  - `/api/tags`: CRUD処理
  - `/api/invitations`: 招待の検証・承諾処理

- 各APIハンドラ内で Prisma Client (`lib/prisma/client.ts`) を使用してSupabaseデータベースと対話します。
- 
- Supabaseの RLS (Row Level Security) と併用し、データベースレベルでのアクセス制御を徹底します。PrismaからのクエリもRLSポリシーの対象となります。

# 5. データモデル (Prisma Schema & Supabase RLS)

Prismaのスキーマファイル (prisma/schema.prisma) でデータモデルを定義します。passwordHints の暗号化戦略を反映するため、関連モデルを修正・追加します。

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Supabaseの接続文字列 (@t3-oss/env-nextjs経由で検証・提供)
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                  String    @id @default(uuid()) // Supabase Authのusersテーブルのidと同期
  email               String?   @unique
  publicKey           String?   // ユーザーの公開鍵 (PEM形式などで保存)
  encryptedPrivateKey String?   // ユーザーの秘密鍵 (ユーザーのパスワード等で暗号化して保存) - クライアント管理が主
  accounts            Account[] @relation("AccountOwner")
  ownedFamilies       Family[]  @relation("FamilyOwner")
  familyMemberships   FamilyMember[]
  tags                Tag[]
  createdInvitations  Invitation[] @relation("InvitedByUser")
  passwordHintDeks    PasswordHintEncryptedDek[] // このユーザーが復号できるDEK
}

model Family {
  id            String    @id @default(uuid())
  name          String
  ownerUserId   String
  owner         User      @relation("FamilyOwner", fields: [ownerUserId], references: [id])
  members       FamilyMember[]
  accounts      Account[] @relation("SharedFamilyAccount")
  invitations   Invitation[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model FamilyMember {
  familyId  String
  userId    String
  family    Family   @relation(fields: [familyId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  joinedAt  DateTime @default(now())

  @@id([familyId, userId])
}

model Account {
  id                String    @id @default(uuid())
  name              String
  description       String?
  sharedWithFamily  Boolean   @default(false)
  ownerUserId       String
  owner             User      @relation("AccountOwner", fields: [ownerUserId], references: [id])
  familyId          String?   // sharedWithFamilyがtrueの場合
  family            Family?   @relation("SharedFamilyAccount", fields: [familyId], references: [id])
  loginIds          AccountLoginId[]
  passwordHints     AccountPasswordHint[]
  tags              AccountTag[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model AccountLoginId {
  id        String  @id @default(uuid())
  accountId String
  account   Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  loginId   String
}

// passwordHintsの暗号化された実体
model AccountPasswordHint {
  id            String  @id @default(uuid())
  accountId     String
  account       Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  encryptedHint String  // 対称鍵(DEK)で暗号化されたヒント本体 (Base64エンコードなど)
  // DEK自体はPasswordHintEncryptedDekテーブルで管理
  encryptedDeks PasswordHintEncryptedDek[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// passwordHintごとのデータ暗号化キー(DEK)を、アクセス権のあるユーザーの公開鍵で暗号化したもの
model PasswordHintEncryptedDek {
  id                    String              @id @default(uuid())
  accountPasswordHintId String
  accountPasswordHint   AccountPasswordHint @relation(fields: [accountPasswordHintId], references: [id], onDelete: Cascade)
  userId                String              // このDEKを復号できるユーザーID (オーナーまたは家族メンバー)
  user                  User                @relation(fields: [userId], references: [id])
  encryptedDekForUser   String              // DEKをuserIdのユーザーの公開鍵で暗号化したもの (Base64エンコードなど)
  createdAt             DateTime            @default(now())
}

model Tag {
  id          String       @id @default(uuid())
  name        String
  userId      String       // タグを作成したユーザー
  user        User         @relation(fields: [userId], references: [id])
  accounts    AccountTag[]
  createdAt   DateTime     @default(now())

  @@unique([name, userId]) // ユーザーごとにタグ名はユニーク
}

model AccountTag {
  accountId String
  tagId     String
  account   Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([accountId, tagId])
}

model Invitation {
  id                String   @id @default(uuid())
  familyId          String
  family            Family   @relation(fields: [familyId], references: [id])
  invitedByUserId   String
  invitedByUser     User     @relation("InvitedByUser", fields: [invitedByUserId], references: [id])
  inviteeEmail      String?
  token             String   @unique
  status            InvitationStatus @default(PENDING)
  expiresAt         DateTime
  createdAt         DateTime @default(now())
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
}
```

# 6. 状態管理とデータフェッチング

- UI状態: Reactの `useState`, `useReducer` を基本とします。

- グローバル状態: Zustand を使用し、認証状態、ユーザープロファイル、UIテーマ、そしてクライアントサイドの暗号鍵の状態などのグローバルな状態を管理します。

- サーバーキャッシュ状態 / データフェッチング: Tanstack Query (React Query) を使用し、Hono API (内部でPrismaを使用) からのデータフェッチ、キャッシュ管理、ミューテーションを効率的に行います。

- Next.js App RouterのServer Components内でTanstack Queryを利用して初期データをフェッチし、SSRを実現します。

- Client ComponentsでもTanstack Queryを活用し、データの再フェッチ、楽観的更新、ローディング/エラー状態の管理を行います。暗号化されたデータの取り扱いにも配慮します。

# 7. 開発ステップの提案

1. 環境構築: Next.jsプロジェクト作成、Tailwind CSS, Shadcn/UI, Supabaseプロジェクトセットアップ。
2. 環境変数管理セットアップ: `@t3-oss/env-nextjs` を導入。
3. Prismaセットアップ: `prisma init`、`schema.prisma` の定義（上記データモデル含む）、Supabaseへの接続設定。`prisma migrate dev` で初期マイグレーション。
4. 暗号化ユーティリティ実装: `crypto/` ディレクトリに鍵ペア生成、対称・非対称暗号化/復号ヘルパー関数を実装 (Web Crypto API中心)。
5. 認証基盤: Supabase Auth (Googleログイン) の実装。ログイン時にユーザーの鍵ペア生成（または既存鍵の復号準備）フローを組み込む。Zustandによる認証状態・鍵状態管理。
6. API設計と実装 (Hono + Prisma):
   - `lib/prisma/client.ts` 設定。
   - 基本的なCRUD APIエンドポイントの設計とHonoでの実装開始。
   - `passwordHints` 関連APIでは、暗号化データの授受と `PasswordHintEncryptedDek` の適切な管理を行う。
   - Supabase RLSポリシーの初期設定とテスト (後述の戦略に沿う)。
7. アカウント管理 (コア機能 - SSR対応): (SSRで暗号化データを扱う際の注意点を考慮)
8. アカウント管理 (拡張機能): `passwordHints` の登録・編集・表示時にクライアントサイドでの暗号化・復号処理を実装。
   - クリップボードコピー機能は復号後の平文に対して行う。
9.  タグ機能、家族管理機能、家族招待機能
10. UI/UX改善
11. RLSポリシーの強化とテスト。
12. テスト (ユニット/結合) とデプロイ準備。

# 8. 次のステップ と `passwordHints` の暗号化・アクセス制御戦略

## 8.1. `passwordHints`の暗号化とアクセス制御戦略

**基本方針**: ハイブリッド暗号化（対称鍵 + 非対称鍵）を採用し、クライアントサイドで暗号化・復号を行います。

### 1. ユーザー鍵ペアの管理:

- 生成: ユーザーが初めてログインまたは登録する際、クライアントサイドでRSAなどの公開鍵/秘密鍵ペアを生成します (`Web Crypto API`)。
- 秘密鍵の保護: 生成された秘密鍵は、ユーザーのGoogleアカウントのアクセストークンや、ユーザーに追加で設定させるマスターパスワードなどを用いてクライアントサイドで暗号化し、`localStorage` やブラウザの`IndexedDB`に安全に保存します。サーバーには平文の秘密鍵を保存しません。
- 公開鍵の保存: 公開鍵は `User` テーブルの `publicKey` カラムに保存し、他のユーザーがデータを共有する際に利用できるようにします。

### 2. `passwordHints` の暗号化フロー (登録・編集時):

1. クライアントサイドで、新しい `passwordHint` のために一意の対称鍵（データ暗号化キー: `DEK`、`AES-GCM`などを推奨）を生成します。
2. 生成したDEKを用いて `passwordHint` の内容を暗号化します (`AccountPasswordHint.encryptedHint`)。
3. オーナー用DEKの暗号化: アカウントのオーナー（現在の操作ユーザー）の公開鍵（自身の `User.publicKey`）を取得し、これでDEKを暗号化します。これが `PasswordHintEncryptedDek.encryptedDekForUser` となります。
4.  家族共有の場合のDEK暗号化:
    1. もしアカウントが家族共有 (`Account.sharedWithFamily` が `true`) の場合、API経由で所属する家族メンバー全員の `userId` と `publicKey` を取得します。
    2. 各家族メンバーの公開鍵それぞれで、同じDEKを暗号化します。これにより、メンバーごとに `PasswordHintEncryptedDek` レコードが生成されます。
5. クライアントは、API (`/api/accounts/{accountId}/hints` など) に以下の情報を送信します:
   * 暗号化されたヒント (`encryptedHint`)
   * オーナー用に暗号化されたDEK (`encryptedDekForUser` とオーナーの `userId`)
   * (家族共有の場合) 各家族メンバー用に暗号化されたDEK群 (それぞれの `encryptedDekForUser` と対象メンバーの `userId`)
6. サーバーサイド (Hono API) `は受け取った情報を元に、AccountPasswordHint` テーブルと、関連する `PasswordHintEncryptedDek` テーブルにレコードを作成・更新します。

### 3. `passwordHints` の復号フロー (閲覧時):
1. ユーザーが特定アカウントの `passwordHints` を閲覧しようとします。
2.  クライアントはAPIにリクエストを送信します。
3.  サーバーサイド (Hono API) は、リクエストユーザーの `userId` と対象の `AccountPasswordHint.id` に基づいて、`PasswordHintEncryptedDek` テーブルからそのユーザーに対応する `encryptedDekForUser` レコードを取得します。同時に `AccountPasswordHint.encryptedHint` も取得します。RLSポリシーにより、権限のないデータアクセスはブロックされます。
4.  `APIは、encryptedHint` と、ユーザーに対応する `encryptedDekForUser` をクライアントに返します。
5.  クライアントサイドでは:
      1.  保護されている自身の秘密鍵を復号（必要に応じてマスターパスワード入力などを要求）。
      2. 復号した秘密鍵を用いて、APIから受け取った `encryptedDekForUser` を復号し、元のDEKを取得します。
      3. 取得したDEKを用いて `encryptedHint` を復号し、平文のパスワードヒントを表示します。

### 4. Supabase RLS (Row Level Security) ポリシー案:

- `User.publicKey`:
  - SELECT: 認証済みユーザーは全員の公開鍵を読み取り可能（データを共有暗号化するため）。
  - UPDATE: ユーザーは自身の公開鍵のみ更新可能。

- `AccountPasswordHint` テーブル:
  - SELECT:
    - アカウントのオーナー (`Account.ownerUserId`)。
    - または、`Account.sharedWithFamily` が `true` であり、かつリクエストユーザーがその `Account.familyId` に所属する `FamilyMember` である場合。
  - INSERT, UPDATE, DELETE: アカウントのオーナーのみ。

- `PasswordHintEncryptedDek` テーブル:
  - SELECT:
    - `userId` がリクエストユーザーIDと一致するレコード。
    - かつ、関連する `AccountPasswordHint` へのSELECT権限がある場合 (上記ポリシーと連動)。
  - INSERT: 関連する `AccountPasswordHint` へのINSERT権限があるユーザー (実質オーナー)。
  - UPDATE, DELETE: レコードの `userId` がリクエストユーザーIDと一致するユーザー、または関連アカウントのオーナー。

### 5. 家族メンバーの変更時の対応:

- メンバー追加時: 新メンバーが家族に追加された際、既存の共有アカウントの `passwordHints` については、新メンバーの公開鍵で各DEKを再暗号化し、新しい `PasswordHintEncryptedDek` レコードを追加する必要があります。これは非同期ジョブや、オーナーが次回アクセスした際などにトリガーされる処理として実装できます。

- メンバー削除時: 家族からメンバーが削除された場合、その旧メンバーに対応する `PasswordHintEncryptedDek` レコードをすべて削除します。これにより、旧メンバーは既存のDEKを復号できなくなります。

### この戦略のメリット:

- サーバーは平文のパスワードヒントやDEKを一切扱わないため、セキュリティが向上します (ゼロ知識に近い)。

- RLSにより、暗号化されたデータへのアクセスもデータベースレベルで制御されます。

- 家族共有の要件を満たしつつ、柔軟なアクセス制御が可能です。

### この戦略の考慮事項:

- クライアントサイドの鍵管理の複雑さ: ユーザーが秘密鍵を紛失した場合、データの復旧は極めて困難（または不可能）になります。ニーモニックフレーズやリカバリーキーなどのバックアップ手段の検討も必要になる場合がありますが、アプリの複雑性が増します。

- パフォーマンス: クライアントサイドでの暗号化・復号処理は、特に多数のヒントを扱う場合にパフォーマンスに影響を与える可能性があります。

- 実装の複雑度: クライアントとサーバーの両方で暗号ロジックと鍵管理ロジックの実装が必要です。

## 8.2. Supabase Authのユーザー情報とPrismaの User モデルの同期方法

- 初期同期: Supabase Authでユーザーが新規登録・ログインした際、Next.jsのAPIルート (Hono) を介してPrismaの User テーブルに対応するレコードを作成・更新します。この時、クライアントから送信された公開鍵も保存します。SupabaseのAuthトリガー (Functions) を使用して、`auth.users` テーブルの変更を検知し、自動的にPrisma側の User テーブルを更新することも可能です。

- 情報更新: メールアドレス変更など、Auth側の情報が更新された場合も同様に同期処理が必要です。
