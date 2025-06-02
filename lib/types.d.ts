// ============================================================================
// 1. Prisma Models (データベースモデルに対応する型定義)
//    `prisma generate`によって自動生成される型を直接インポートします。
//    必要に応じて、これらの型を拡張またはOmit/Pickで調整します。
// ============================================================================

export type {
  Account,
  AccountLoginId,
  AccountPasswordHint,
  AccountTag,
  Family,
  FamilyMember,
  Invitation,
  InvitationStatus,
  PasswordHintEncryptedDek,
  Tag,
  User,
} from '@prisma/client';

// ============================================================================
// 2. API Request/Response Types (Hono APIとのやり取りに使用する型定義)
// ============================================================================

/**
 * 新規アカウント作成時のリクエストペイロード
 */
export interface CreateAccountPayload {
  name: string;
  description?: string;
  sharedWithFamily: boolean;
  familyId?: string; // sharedWithFamilyがtrueの場合に必要
  loginIds?: { loginId: string }[];
  // passwordHintsは暗号化された形式で送られる
  passwordHints?: {
    encryptedHint: string;
    encryptedDeksForUsers: { userId: string; encryptedDekForUser: string }[];
  }[];
  tags?: { id?: string; name: string }[]; // 既存タグのIDまたは新規タグ名
}

/**
 * アカウント更新時のリクエストペイロード
 */
export interface UpdateAccountPayload extends Partial<CreateAccountPayload> {
  // IDはパスパラメータで渡されるため、ここでは不要
}

/**
 * 家族作成時のリクエストペイロード
 */
export interface CreateFamilyPayload {
  name: string;
}

/**
 * 家族招待作成時のリクエストペイロード
 */
export interface CreateInvitationPayload {
  familyId: string;
  inviteeEmail?: string; // 招待するユーザーのメールアドレス (任意)
}

/**
 * APIからのアカウント情報レスポンス (関連データを含む場合)
 */
export interface AccountApiResponse extends Account {
  loginIds?: AccountLoginId[];
  passwordHints?: AccountPasswordHint[];
  tags?: Tag[]; // アカウントに紐づくタグ情報
}

/**
 * APIからの家族情報レスポンス (関連データを含む場合)
 */
export interface FamilyApiResponse extends Family {
  members?: (FamilyMember & { user: User })[]; // メンバー情報とユーザー詳細
  accounts?: Account[]; // 共有アカウント情報
  invitations?: Invitation[]; // 招待情報
}

// ============================================================================
// 3. Encryption Related Types (暗号化関連の型定義)
//    @/crypto/client.ts からインポートして再エクスポートする
// ============================================================================

import type {
  EncryptedData,
  EncryptedDekForUser,
  ExportedKeyPair,
  KeyPair,
} from '@/crypto/client';

export type { EncryptedData, EncryptedDekForUser, KeyPair, ExportedKeyPair };

// ============================================================================
// 4. Utility Types (その他の共通ユーティリティ型)
// ============================================================================

/**
 * ReactコンポーネントのPropsでchildrenを受け取る場合の型
 */
export type ChildrenProps = {
  children: React.ReactNode;
};

/**
 * ページネーション情報
 */
export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * APIレスポンスの共通構造 (例: 成功時のデータとメタデータ)
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: Pagination;
}

/**
 * APIエラーレスポンスの共通構造
 */
export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  details?: string | object;
}
