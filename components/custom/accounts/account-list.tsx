'use client';

import { Button } from '@/components/ui/button';
import type { AccountApiResponse } from '@/lib/types';
import { Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { AccountCard } from './account-card';

interface AccountListProps {
  accounts: AccountApiResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPrivateKeyLoaded: boolean;
}

export function AccountList({
  accounts,
  isLoading,
  isError,
  error,
  isPrivateKeyLoaded,
}: AccountListProps) {
  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin text-indigo-500' />
        <p className='ml-2 text-lg text-gray-700 dark:text-gray-300'>
          アカウントを読み込み中...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-center'>
        <h2 className='text-xl font-bold text-red-600 dark:text-red-400'>
          エラーが発生しました
        </h2>
        <p className='mt-2 text-gray-700 dark:text-gray-300'>
          {error?.message ||
            'データの読み込み中に予期せぬエラーが発生しました。'}
        </p>
        {/* 再試行ボタンはpage.tsxでrefetchを渡すことで実装可能 */}
      </div>
    );
  }

  if (!isPrivateKeyLoaded) {
    // 秘密鍵がロードされていない場合の警告はlayout.tsxで表示されるため、ここでは簡略化
    // 必要であれば、より詳細なメッセージや設定へのリンクをここに含める
    return (
      <div className='text-center p-8 border-2 border-dashed border-yellow-300 dark:border-yellow-600 rounded-lg'>
        <p className='text-lg text-yellow-600 dark:text-yellow-400'>
          パスワードヒントを復号するには、秘密鍵がロードされている必要があります。
        </p>
        <Link href='/settings' passHref>
          <Button
            variant='link'
            className='mt-2 text-yellow-600 dark:text-yellow-400 underline'
          >
            設定へ移動
          </Button>
        </Link>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className='text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg'>
        <p className='text-lg text-gray-600 dark:text-gray-400'>
          まだアカウントが登録されていません。
        </p>
        <Link href='/accounts/new' passHref>
          <Button className='mt-4 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center mx-auto'>
            <PlusCircle className='mr-2 h-5 w-5' />
            最初のアカウントを作成
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
