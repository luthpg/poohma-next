import { importPublicKey } from '@/crypto/keys'; // 鍵管理ヘルパー (公開鍵のインポートのみサーバーで必要)
import { prisma } from '@/lib/prisma/client';
import { createClient } from '@/lib/supabase/server';
import type {
  AccountApiResponse,
  ApiErrorResponse,
  CreateAccountPayload,
  CreateFamilyPayload,
  CreateInvitationPayload,
  FamilyApiResponse,
  UpdateAccountPayload,
} from '@/lib/types';
import { zValidator } from '@hono/zod-validator'; // HonoとZodの連携
import {
  InvitationStatus,
  type PasswordHintEncryptedDek,
  type Tag,
} from '@prisma/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';

// 注意: サーバーサイドでDEKの暗号化/復号は行わないため、client.tsからの関数は通常不要です。
// ただし、もし将来的にサーバーサイドで一時的にDEKを扱う必要がある場合は、
// そのセキュリティリスクを十分に評価し、Node.jsのcryptoモジュールを使用してください。

interface HonoContext {
  Variables: {
    user: SupabaseUser;
    supabase: Awaited<ReturnType<typeof createClient>>;
  };
}

// Hono アプリケーションの初期化
const app = new Hono<HonoContext>().basePath('/api');

// ========================================================================
// ミドルウェア: 認証チェックとユーザー情報のコンテキストへの追加
// ========================================================================
app.use('*', async (c, next) => {
  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    c.status(401);
    return c.json({
      message: 'Unauthorized',
      statusCode: 401,
    } as ApiErrorResponse);
  }

  c.set('user', session.user);
  c.set('supabase', supabase); // Supabaseクライアントもコンテキストに追加

  await next();
});

// ========================================================================
// ルーティング定義
// ========================================================================

// アカウント関連エンドポイント
app.get('/accounts', async (c) => {
  const user = c.get('user');

  try {
    // RLSにより、ユーザーがアクセスできるアカウントのみが取得される
    // ここでは、RLSが正しく設定されていることを前提に、Prismaのクエリで
    // 明示的な権限フィルタリングを冗長に行うが、RLSが主たる制御となる。
    const accounts = await prisma?.account.findMany({
      where: {
        OR: [
          { ownerUserId: user.id }, // 自身がオーナーのアカウント
          {
            // 家族共有されており、かつ自身がその家族のメンバーであるアカウント
            sharedWithFamily: true,
            Family: {
              FamilyMember: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        ],
      },
      include: {
        AccountLoginId: true,
        AccountPasswordHint: {
          include: {
            PasswordHintEncryptedDek: {
              // 現在のユーザーが復号できるDEKのみ取得 (RLSと連携)
              where: { userId: user.id },
            },
          },
        },
        AccountTag: {
          include: {
            Tag: true,
          },
        },
      },
    });

    // passwordHintsのencryptedDeksが配列になるため、フロントエンドで扱いやすいように調整
    const formattedAccounts: AccountApiResponse[] =
      accounts?.map((account) => ({
        ...account,
        passwordHints: account.AccountPasswordHint.map((hint) => ({
          ...hint,
          // encryptedDeksは単一のオブジェクトとして返すか、配列のまま返すかフロントエンドの要件に合わせる
          // ここでは、現在のユーザー用のDEKのみを返す
          encryptedDeks: hint.PasswordHintEncryptedDek,
        })),
        tags: account.AccountTag.map((at) => at.Tag),
      })) ?? [];

    return c.json({ data: formattedAccounts });
  } catch (error) {
    console.error('アカウント取得エラー:', error);
    c.status(500);
    return c.json({
      message: 'Failed to fetch accounts',
      statusCode: 500,
    } as ApiErrorResponse);
  }
});

app.post(
  '/accounts',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'アカウント名は必須です。'),
      description: z.string().optional(),
      sharedWithFamily: z.boolean().default(false),
      familyId: z.string().optional(),
      loginIds: z
        .array(
          z.object({ loginId: z.string().min(1, 'ログインIDは必須です。') }),
        )
        .optional(),
      passwordHints: z
        .array(
          z.object({
            encryptedHint: z.string().min(1, '暗号化されたヒントは必須です。'),
            encryptedDeksForUsers: z
              .array(
                z.object({
                  userId: z.string().min(1, 'ユーザーIDは必須です。'),
                  encryptedDekForUser: z
                    .string()
                    .min(1, '暗号化されたDEKは必須です。'),
                }),
              )
              .min(1, '少なくともオーナー用のDEKが必要です。'),
          }),
        )
        .optional(),
      tags: z
        .array(
          z
            .object({
              id: z.string().optional(),
              name: z.string().min(1, 'タグ名は必須です。'),
            })
            .refine(
              (tag) => tag.id || tag.name,
              'タグにはIDまたは名前が必要です。',
            ),
        )
        .optional(),
    }),
  ),
  async (c) => {
    const user = c.get('user');
    const body: CreateAccountPayload = c.req.valid('json');

    try {
      // タグの処理: 既存タグの紐付けと新規タグの作成
      const accountTags: { tagId: string }[] = [];
      if (body.tags && body.tags.length > 0) {
        for (const tagInput of body.tags) {
          if (tagInput.id) {
            // 既存タグ
            accountTags.push({ tagId: tagInput.id });
          } else if (tagInput.name) {
            // 新規タグまたは既存ユーザータグの再利用
            let tag = await prisma?.tag.findUnique({
              where: {
                name_userId: {
                  name: tagInput.name,
                  userId: user.id,
                },
              },
            });
            if (!tag) {
              tag = await prisma?.tag.create({
                data: {
                  name: tagInput.name,
                  userId: user.id,
                },
              });
            }
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            accountTags.push({ tagId: tag?.id! });
          }
        }
      }

      const newAccount = await prisma?.account.create({
        data: {
          name: body.name,
          description: body.description,
          sharedWithFamily: body.sharedWithFamily,
          ownerUserId: user.id,
          familyId: body.sharedWithFamily ? body.familyId : null,
          AccountLoginId: {
            create: body.loginIds,
          },
          AccountPasswordHint: {
            create: body.passwordHints?.map((hint) => ({
              encryptedHint: hint.encryptedHint,
              encryptedDeks: {
                create: hint.encryptedDeksForUsers.map((dek) => ({
                  userId: dek.userId,
                  encryptedDekForUser: dek.encryptedDekForUser,
                })),
              },
            })),
          },
          AccountTag: {
            create: accountTags,
          },
        },
        include: {
          AccountLoginId: true,
          AccountPasswordHint: {
            include: {
              PasswordHintEncryptedDek: true,
            },
          },
          AccountTag: {
            include: {
              Tag: true,
            },
          },
        },
      });

      c.status(201);
      return c.json({ data: newAccount });
    } catch (error) {
      console.error('アカウント作成エラー:', error);
      c.status(400);
      return c.json({
        message: 'Failed to create account',
        statusCode: 400,
        details: (error as Error).message,
      } as ApiErrorResponse);
    }
  },
);

// アカウント詳細取得
app.get('/accounts/:id', async (c) => {
  const user = c.get('user');
  const accountId = c.req.param('id');

  try {
    const account = await prisma?.account.findUnique({
      where: { id: accountId },
      include: {
        AccountLoginId: true,
        AccountPasswordHint: {
          include: {
            PasswordHintEncryptedDek: {
              where: { userId: user.id }, // 現在のユーザーが復号できるDEKのみ取得
            },
          },
        },
        AccountTag: {
          include: {
            Tag: true,
          },
        },
      },
    });

    if (!account) {
      c.status(404);
      return c.json({
        message: 'Account not found',
        statusCode: 404,
      } as ApiErrorResponse);
    }

    // RLSが適用されることを前提に、ここでは追加の権限チェックを強化
    // 自身がオーナーであるか、または共有家族のメンバーであるか
    const isOwner = account.ownerUserId === user.id;
    let isFamilyMember = false;
    if (account.sharedWithFamily && account.familyId) {
      const familyMembership = await prisma?.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: account.familyId,
            userId: user.id,
          },
        },
      });
      isFamilyMember = !!familyMembership;
    }

    if (!isOwner && !isFamilyMember) {
      c.status(403);
      return c.json({
        message: 'Forbidden: Not authorized to access this account',
        statusCode: 403,
      } as ApiErrorResponse);
    }

    const formattedAccount: AccountApiResponse = {
      ...account,
      passwordHints: account.AccountPasswordHint.map((hint) => ({
        ...hint,
        encryptedDeks: hint.PasswordHintEncryptedDek,
      })),
      tags: account.AccountTag.map((at) => at.Tag),
    };

    return c.json({ data: formattedAccount });
  } catch (error) {
    console.error('アカウント詳細取得エラー:', error);
    c.status(500);
    return c.json({
      message: 'Failed to fetch account details',
      statusCode: 500,
    } as ApiErrorResponse);
  }
});

// アカウント更新 (PUT/PATCH)
app.put(
  '/accounts/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'アカウント名は必須です。').optional(),
      description: z.string().optional(),
      sharedWithFamily: z.boolean().optional(),
      familyId: z.string().optional().optional(),
      loginIds: z
        .array(
          z.object({
            id: z.string().optional(),
            loginId: z.string().min(1, 'ログインIDは必須です。'),
          }),
        )
        .optional(),
      passwordHints: z
        .array(
          z.object({
            id: z.string().optional(),
            encryptedHint: z.string().min(1, '暗号化されたヒントは必須です。'),
            encryptedDeksForUsers: z
              .array(
                z.object({
                  userId: z.string().min(1, 'ユーザーIDは必須です。'),
                  encryptedDekForUser: z
                    .string()
                    .min(1, '暗号化されたDEKは必須です。'),
                }),
              )
              .min(1, '少なくともオーナー用のDEKが必要です。'),
          }),
        )
        .optional(),
      tags: z
        .array(
          z
            .object({
              id: z.string().optional(),
              name: z.string().min(1, 'タグ名は必須です。'),
            })
            .refine(
              (tag) => tag.id || tag.name,
              'タグにはIDまたは名前が必要です。',
            ),
        )
        .optional(),
    }),
  ),
  async (c) => {
    const user = c.get('user');
    const accountId = c.req.param('id');
    const body: UpdateAccountPayload = c.req.valid('json');

    try {
      const existingAccount = await prisma?.account.findUnique({
        where: { id: accountId },
      });

      if (!existingAccount || existingAccount.ownerUserId !== user.id) {
        c.status(403);
        return c.json({
          message: 'Forbidden: Not authorized to update this account',
          statusCode: 403,
        } as ApiErrorResponse);
      }

      // ログインIDの更新ロジック
      // 既存のものを削除し、新しいものを再作成する簡易的な戦略
      if (body.loginIds !== undefined) {
        await prisma?.accountLoginId.deleteMany({
          where: { accountId: accountId },
        });
        if (body.loginIds.length > 0) {
          await prisma?.accountLoginId.createMany({
            data: body.loginIds.map((li) => ({
              accountId: accountId,
              loginId: li.loginId,
            })),
          });
        }
      }

      // passwordHintsの更新ロジック
      // 既存のものを削除し、新しいものを再作成する簡易的な戦略
      if (body.passwordHints !== undefined) {
        // 関連する encryptedDeks も含めて削除
        await prisma?.accountPasswordHint.deleteMany({
          where: { accountId: accountId },
        });
        if (body.passwordHints.length > 0) {
          for (const hint of body.passwordHints) {
            await prisma?.accountPasswordHint.create({
              data: {
                accountId: accountId,
                encryptedHint: hint.encryptedHint,
                PasswordHintEncryptedDek: {
                  create: hint.encryptedDeksForUsers.map((dek) => ({
                    userId: dek.userId,
                    encryptedDekForUser: dek.encryptedDekForUser,
                  })),
                },
              },
            });
          }
        }
      }

      // タグの更新ロジック
      // 既存の紐付けを一旦削除し、新しい紐付けを再作成する簡易的な戦略
      if (body.tags !== undefined) {
        await prisma?.accountTag.deleteMany({
          where: { accountId: accountId },
        });
        const tagConnects: { tagId: string }[] = [];
        for (const tagInput of body.tags) {
          if (tagInput.id) {
            tagConnects.push({ tagId: tagInput.id });
          } else if (tagInput.name) {
            let tag = await prisma?.tag.findUnique({
              where: { name_userId: { name: tagInput.name, userId: user.id } },
            });
            if (!tag) {
              tag = await prisma?.tag.create({
                data: { name: tagInput.name, userId: user.id },
              });
            }
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            tagConnects.push({ tagId: tag?.id! });
          }
        }
        if (tagConnects.length > 0) {
          await prisma?.accountTag.createMany({
            data: tagConnects.map((tc) => ({
              accountId: accountId,
              tagId: tc.tagId,
            })),
          });
        }
      }

      const updatedAccount = await prisma?.account.update({
        where: { id: accountId },
        data: {
          name: body.name,
          description: body.description,
          sharedWithFamily: body.sharedWithFamily,
          familyId: body.sharedWithFamily ? body.familyId : null,
        },
        include: {
          AccountLoginId: true,
          AccountPasswordHint: {
            include: {
              PasswordHintEncryptedDek: true,
            },
          },
          AccountTag: {
            include: {
              Tag: true,
            },
          },
        },
      });

      c.status(200);
      return c.json({ data: updatedAccount });
    } catch (error) {
      console.error('アカウント更新エラー:', error);
      c.status(400);
      return c.json({
        message: 'Failed to update account',
        statusCode: 400,
        details: (error as Error).message,
      } as ApiErrorResponse);
    }
  },
);

// アカウント削除
app.delete('/accounts/:id', async (c) => {
  const user = c.get('user');
  const accountId = c.req.param('id');

  try {
    const existingAccount = await prisma?.account.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount || existingAccount.ownerUserId !== user.id) {
      c.status(403);
      return c.json({
        message: 'Forbidden: Not authorized to delete this account',
        statusCode: 403,
      } as ApiErrorResponse);
    }

    await prisma?.account.delete({
      where: { id: accountId },
    });

    c.status(204);
    return c.json(null);
  } catch (error) {
    console.error('アカウント削除エラー:', error);
    c.status(500);
    return c.json({
      message: 'Failed to delete account',
      statusCode: 500,
    } as ApiErrorResponse);
  }
});

// 家族関連エンドポイント
app.post(
  '/families',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, '家族名は必須です。'),
    }),
  ),
  async (c) => {
    const user = c.get('user');
    const body: CreateFamilyPayload = c.req.valid('json');

    try {
      const newFamily = await prisma?.family.create({
        data: {
          name: body.name,
          ownerUserId: user.id,
          FamilyMember: {
            create: { userId: user.id }, // 作成者自身をメンバーとして追加
          },
        },
        include: {
          FamilyMember: {
            include: { User: true }, // メンバー情報も取得
          },
        },
      });
      c.status(201);
      return c.json({ data: newFamily });
    } catch (error) {
      console.error('家族作成エラー:', error);
      c.status(400);
      return c.json({
        message: 'Failed to create family',
        statusCode: 400,
        details: (error as Error).message,
      } as ApiErrorResponse);
    }
  },
);

app.get('/families', async (c) => {
  const user = c.get('user');
  try {
    const families = await prisma?.family.findMany({
      where: {
        FamilyMember: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        FamilyMember: {
          include: { User: true },
        },
        Account: true, // 共有アカウントも取得
        Invitation: true,
      },
    });
    return c.json({ data: families });
  } catch (error) {
    console.error('家族一覧取得エラー:', error);
    c.status(500);
    return c.json({
      message: 'Failed to fetch families',
      statusCode: 500,
    } as ApiErrorResponse);
  }
});

// 家族招待関連エンドポイント
app.post(
  '/invitations',
  zValidator(
    'json',
    z.object({
      familyId: z.string().min(1, '家族IDは必須です。'),
      inviteeEmail: z
        .string()
        .email('有効なメールアドレスを入力してください。')
        .optional(),
    }),
  ),
  async (c) => {
    const user = c.get('user');
    const body: CreateInvitationPayload = c.req.valid('json');

    try {
      // 招待を作成するユーザーがその家族のオーナーであることを確認
      const family = await prisma?.family.findUnique({
        where: { id: body.familyId },
      });

      if (!family || family.ownerUserId !== user.id) {
        c.status(403);
        return c.json({
          message: 'Forbidden: Only family owner can create invitations',
          statusCode: 403,
        } as ApiErrorResponse);
      }

      // 招待トークンを生成
      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後に期限切れ

      const newInvitation = await prisma?.invitation.create({
        data: {
          familyId: body.familyId,
          invitedByUserId: user.id,
          inviteeEmail: body.inviteeEmail,
          token: token,
          expiresAt: expiresAt,
          status: InvitationStatus.PENDING,
        },
      });

      c.status(201);
      return c.json({ data: newInvitation });
    } catch (error) {
      console.error('招待作成エラー:', error);
      c.status(400);
      return c.json({
        message: 'Failed to create invitation',
        statusCode: 400,
        details: (error as Error).message,
      } as ApiErrorResponse);
    }
  },
);

// 招待の承諾エンドポイント
app.post('/invitations/:token/accept', async (c) => {
  const user = c.get('user');
  const token = c.req.param('token');

  try {
    const invitation = await prisma?.invitation.findUnique({
      where: { token: token },
      include: { Family: true },
    });

    if (
      !invitation ||
      invitation.expiresAt < new Date() ||
      invitation.status !== InvitationStatus.PENDING
    ) {
      c.status(404);
      return c.json({
        message: 'Invitation not found or expired',
        statusCode: 404,
      } as ApiErrorResponse);
    }

    // 招待されたユーザーがメールアドレス指定されている場合、現在のユーザーのメールと一致するか確認
    if (invitation.inviteeEmail && invitation.inviteeEmail !== user.email) {
      c.status(403);
      return c.json({
        message: 'Forbidden: This invitation is not for your email address',
        statusCode: 403,
      } as ApiErrorResponse);
    }

    // 既に家族メンバーであるか確認
    const existingMembership = await prisma?.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: invitation.familyId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      c.status(409);
      return c.json({
        message: 'Already a member of this family',
        statusCode: 409,
      } as ApiErrorResponse);
    }

    // 家族メンバーに追加
    await prisma?.familyMember.create({
      data: {
        familyId: invitation.familyId,
        userId: user.id,
      },
    });

    // 招待をACCEPTEDに更新
    await prisma?.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    // 重要: 家族共有アカウントのDEKを新メンバーの公開鍵で暗号化して追加するロジックは、
    // サーバーサイドでは行いません。これはクライアントサイド (アカウントオーナーのブラウザ) で
    // 実施されるべき処理です。クライアントは、新メンバーの公開鍵を取得し、既存の共有アカウントの
    // 各passwordHintのDEKを再暗号化し、そのデータを別途API (例: /api/accounts/:id/add-dek-for-user)
    // に送信する必要があります。このAPIは、既存のPasswordHintEncryptedDekレコードに新しいエントリを追加します。
    // このエンドポイントは、新メンバーが家族に参加した後に、アカウントオーナーが共有アカウントにアクセスした際に
    // トリガーされることが考えられます。

    c.status(200);
    return c.json({
      message: 'Invitation accepted successfully',
      statusCode: 200,
    });
  } catch (error) {
    console.error('招待承諾エラー:', error);
    c.status(500);
    return c.json({
      message: 'Failed to accept invitation',
      statusCode: 500,
      details: (error as Error).message,
    } as ApiErrorResponse);
  }
});

// 新しいエンドポイントの提案: 既存の共有アカウントのDEKを、特定のユーザー向けに再暗号化して追加/更新する
// このエンドポイントは、アカウントオーナーがクライアントサイドでDEKを再暗号化した後に呼び出すことを想定
app.post(
  '/accounts/:accountId/reencrypt-dek-for-user',
  zValidator(
    'json',
    z.object({
      userId: z.string().min(1, 'ユーザーIDは必須です。'),
      encryptedDekForUser: z.string().min(1, '暗号化されたDEKは必須です。'),
      passwordHintId: z.string().min(1, 'パスワードヒントIDは必須です。'),
    }),
  ),
  async (c) => {
    const user = c.get('user');
    const accountId = c.req.param('accountId');
    const body = c.req.valid('json');

    try {
      // 1. リクエストユーザーがアカウントのオーナーであることを確認
      const account = await prisma?.account.findUnique({
        where: { id: accountId },
      });

      if (!account || account.ownerUserId !== user.id) {
        c.status(403);
        return c.json({
          message: 'Forbidden: Only account owner can re-encrypt DEKs',
          statusCode: 403,
        } as ApiErrorResponse);
      }

      // 2. 対象のpasswordHintが存在し、このアカウントに紐づいていることを確認
      const passwordHint = await prisma?.accountPasswordHint.findUnique({
        where: { id: body.passwordHintId, accountId: accountId },
      });

      if (!passwordHint) {
        c.status(404);
        return c.json({
          message: 'Password hint not found for this account',
          statusCode: 404,
        } as ApiErrorResponse);
      }

      // 3. 対象ユーザーが既にそのDEKを持っているか確認し、あれば更新、なければ作成
      const existingDek = await prisma?.passwordHintEncryptedDek.findUnique({
        where: {
          id: body.passwordHintId,
          accountPasswordHintId: {
            equals: body.passwordHintId,
          },
          userId: {
            equals: body.userId,
          },
        },
      });

      if (existingDek) {
        // 既存のDEKを更新
        await prisma?.passwordHintEncryptedDek.update({
          where: {
            id: existingDek.id,
            accountPasswordHintId: {
              equals: body.passwordHintId,
            },
            userId: {
              equals: body.userId,
            },
          },
          data: {
            encryptedDekForUser: body.encryptedDekForUser,
          },
        });
      } else {
        // 新しいDEKを作成
        await prisma?.passwordHintEncryptedDek.create({
          data: {
            accountPasswordHintId: body.passwordHintId,
            userId: body.userId,
            encryptedDekForUser: body.encryptedDekForUser,
          },
        });
      }

      c.status(200);
      return c.json({
        message: 'DEK re-encrypted and updated successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('DEK再暗号化エラー:', error);
      c.status(500);
      return c.json({
        message: 'Failed to re-encrypt DEK',
        statusCode: 500,
        details: (error as Error).message,
      } as ApiErrorResponse);
    }
  },
);

// タグ関連エンドポイント
app.get('/tags', async (c) => {
  const user = c.get('user');
  try {
    const tags = await prisma?.tag.findMany({
      where: {
        OR: [
          { userId: user.id },
          {
            AccountTag: {
              some: {
                Account: {
                  OR: [
                    { ownerUserId: user.id },
                    {
                      sharedWithFamily: true,
                      Family: {
                        FamilyMember: {
                          some: {
                            userId: user.id,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      distinct: ['id'], // 重複を排除
    });
    return c.json({ data: tags });
  } catch (error) {
    console.error('タグ取得エラー:', error);
    c.status(500);
    return c.json({
      message: 'Failed to fetch tags',
      statusCode: 500,
    } as ApiErrorResponse);
  }
});

// ========================================================================
// エラーハンドリング (Honoのデフォルトエラーハンドラーをオーバーライド)
// ========================================================================
app.onError((err, c) => {
  console.error(`${err}`);
  c.status(500);
  return c.json({
    message: 'Internal Server Error',
    statusCode: 500,
    details: err.message,
  } as ApiErrorResponse);
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
