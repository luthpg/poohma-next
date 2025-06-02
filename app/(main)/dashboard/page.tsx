'use client';

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/zustand/store';
import { initializeAuthListener } from '@/lib/zustand/store';
import { useEffect } from 'react';
import { signOut } from './actions';

export default function DashboardPage() {
  const authStatus = useAppStore((state) => state.authStatus);
  const user = useAppStore((state) => state.user);
  const isPrivateKeyLoaded = useAppStore((state) => state.isPrivateKeyLoaded);
  const globalError = useAppStore((state) => state.globalError);
  const globalLoading = useAppStore((state) => state.globalLoading);

  useEffect(() => {
    initializeAuthListener();
  }, []);

  if (authStatus === 'loading' || globalLoading) {
    return <div>ロード中...</div>;
  }

  if (globalError) {
    return <div className='text-red-500'>エラー: {globalError}</div>;
  }

  return (
    <div className='min-h-screen'>
      <h1 className='text-2xl font-bold p-4'>ダッシュボード</h1>
      {user ? (
        <p className='p-4'>
          ようこそ、{user.user_metadata?.name ?? user.email}さん！
          <br />
          秘密鍵のロード状態: {isPrivateKeyLoaded ? '完了' : '未完了'}
        </p>
      ) : (
        <p className='p-4'>ログインしていません。</p>
      )}

      {/* shadcn/uiのModeToggleコンポーネントを配置 */}
      <div className='m-4'>
        <ModeToggle />
        <Button onClick={() => signOut()}>ログアウト</Button>
      </div>

      {/* ここにアカウント一覧などのコンテンツ */}
    </div>
  );
}
