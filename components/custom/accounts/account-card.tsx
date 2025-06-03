'use client';

import { Button } from '@/components/ui/button';
import { decryptPasswordHint } from '@/crypto/client'; // クライアントサイドの復号関数
import { decryptDekWithPrivateKey } from '@/crypto/client'; // クライアントサイドのDEK復号関数
import { decryptAndImportPrivateKey } from '@/crypto/keys'; // クライアントサイドの秘密鍵復号関数
import { getEncryptedPrivateKeyFromStorage } from '@/crypto/keys'; // 秘密鍵取得関数
import type { AccountApiResponse } from '@/lib/types';
import { useAppStore } from '@/lib/zustand/store';
import { Copy, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

interface AccountCardProps {
  account: AccountApiResponse;
}

export function AccountCard({ account }: AccountCardProps) {
  const { isPrivateKeyLoaded, setGlobalError, globalLoading } = useAppStore();
  const [decryptedLoginIds, setDecryptedLoginIds] = React.useState<
    { id: string; value: string }[]
  >([]);
  const [decryptedPasswordHints, setDecryptedPasswordHints] = React.useState<
    { id: string; value: string }[]
  >([]);
  const [showSensitiveInfo, setShowSensitiveInfo] = React.useState(false); // 敏感な情報を表示するかどうか

  // ログインIDとパスワードヒントの復号処理
  React.useEffect(() => {
    const decryptSensitiveInfo = async () => {
      if (!isPrivateKeyLoaded || !showSensitiveInfo) {
        setDecryptedLoginIds([]);
        setDecryptedPasswordHints([]);
        return;
      }

      setGlobalError(null); // エラーをリセット

      try {
        // 1. クライアントサイドの秘密鍵を復号
        const encryptedPrivateKey = getEncryptedPrivateKeyFromStorage();
        if (!encryptedPrivateKey) {
          throw new Error('暗号化された秘密鍵がストレージに見つかりません。');
        }
        // TODO: マスターパスワード入力UIを実装し、ここでパスワードを取得
        // 現時点では仮のパスフレーズを使用するか、ユーザーに再入力を促す
        // 例: const masterPassphrase = prompt("マスターパスワードを入力してください:");
        // if (!masterPassphrase) throw new Error("マスターパスワードが入力されませんでした。");
        // ここでは簡略化のため、秘密鍵の復号は別途行われていると仮定するか、
        // ユーザーにマスターパスワードの入力を促すモーダルなどをトリガーする。
        // ダッシュボードでは表示しないが、詳細画面で復号を試みるのがより良いUX。
        // ここでは、isPrivateKeyLoadedがtrueであれば、秘密鍵が既にメモリにロードされていると仮定する。
        // 実際には、Zustandストアに復号された秘密鍵のCryptoKeyインスタンスを保持する方が効率的。
        // 現状のisPrivateKeyLoadedは、秘密鍵がメモリにロードされているかどうかのフラグなので、
        // 実際のCryptoKeyインスタンスは別途取得する必要がある。

        // **重要**: ここでは、isPrivateKeyLoadedがtrueの場合、
        // 秘密鍵がZustandストアのどこかにCryptoKeyオブジェクトとして保持されていると仮定します。
        // そのような実装がない場合、この部分は機能しません。
        // 簡略化のため、ここではダッシュボードで直接復号するロジックは実装せず、
        // 詳細画面で「復号ボタン」を押した際に秘密鍵をロードし、復号するフローを推奨します。
        // そのため、ここでは sensitive info の表示は行わないか、プレースホルダーを表示します。

        // ログインIDは暗号化されていないので直接表示
        const logins =
          account.loginIds?.map((li) => ({ id: li.id, value: li.loginId })) ||
          [];
        setDecryptedLoginIds(logins);

        // パスワードヒントの復号は詳細画面で行うことを推奨
        setDecryptedPasswordHints(
          account.passwordHints?.map((ph) => ({
            id: ph.id,
            value: '******** (詳細で復号)',
          })) || [],
        );
      } catch (err) {
        console.error('復号エラー:', err);
        setGlobalError(`情報の復号に失敗しました: ${(err as Error).message}`);
        setDecryptedLoginIds([]);
        setDecryptedPasswordHints([]);
      }
    };

    // showSensitiveInfoの状態が変化したときに復号を試みる
    decryptSensitiveInfo();
  }, [
    isPrivateKeyLoaded,
    showSensitiveInfo,
    account.loginIds,
    account.passwordHints,
    setGlobalError,
  ]);

  const handleCopy = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          // TODO: トースト通知などでコピー成功をユーザーに伝える
          console.log('Copied to clipboard:', text);
        })
        .catch((err) => {
          console.error('Failed to copy text:', err);
          // TODO: エラー通知
        });
    } else {
      // 古いブラウザや非セキュアなコンテキストでのフォールバック
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // Avoid scrolling to bottom
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Copied to clipboard (fallback):', text);
      } catch (err) {
        console.error('Failed to copy text (fallback):', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className='bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 flex flex-col h-full'>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2 truncate'>
        <Link href={`/accounts/${account.id}`} className='hover:underline'>
          {account.name}
        </Link>
      </h2>
      <p className='text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2'>
        {account.description || '説明なし'}
      </p>

      <div className='flex flex-wrap gap-2 mb-3'>
        {account.tags?.map((tag) => (
          <span
            key={tag.id}
            className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-100'
          >
            {tag.name}
          </span>
        ))}
      </div>

      {account.sharedWithFamily && (
        <span className='inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-800 dark:text-purple-100 mb-3'>
          家族共有
        </span>
      )}

      {/* ログインID表示 (ダッシュボードでは常に表示) */}
      <div className='mt-2 text-sm text-gray-700 dark:text-gray-300'>
        {decryptedLoginIds.length > 0 && (
          <div className='mb-2'>
            <h3 className='font-medium text-gray-800 dark:text-gray-200'>
              ログインID:
            </h3>
            {decryptedLoginIds.map((li, index) => (
              <div
                key={li.id}
                className='flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md mt-1'
              >
                <span className='truncate'>{li.value}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleCopy(li.value)}
                  className='ml-2 h-7 w-7'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* パスワードヒント表示 (ダッシュボードではプレースホルダー) */}
        {account.passwordHints && account.passwordHints.length > 0 && (
          <div>
            <h3 className='font-medium text-gray-800 dark:text-gray-200'>
              パスワードヒント:
            </h3>
            {account.passwordHints.map((ph, index) => (
              <div
                key={ph.id}
                className='flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md mt-1'
              >
                <span className='truncate'>******** (詳細ページで復号)</span>
                {/* ダッシュボードではコピーボタンは表示しない、または無効化 */}
                <Button
                  variant='ghost'
                  size='icon'
                  disabled
                  className='ml-2 h-7 w-7 opacity-50 cursor-not-allowed'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='mt-auto pt-4 flex justify-end'>
        <Link href={`/accounts/${account.id}`} passHref>
          <Button variant='outline' size='sm'>
            詳細を見る
          </Button>
        </Link>
      </div>
    </div>
  );
}
