'use client';

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { ChildrenProps } from '@/lib/types';
import { useAppStore } from '@/lib/zustand/store';
import {
  FolderOpen,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from './actions';

export default function MainLayout({ children }: ChildrenProps) {
  const router = useRouter();
  const {
    authStatus,
    user,
    isPrivateKeyLoaded,
    setGlobalError,
    setGlobalLoading,
  } = useAppStore();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
    setGlobalError(null);
    setGlobalLoading(false);
  }, [authStatus, router, setGlobalError, setGlobalLoading]);

  const handleSignOut = async () => {
    setGlobalLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
      setGlobalError('ログアウトに失敗しました。');
      setGlobalLoading(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center dark:bg-gray-800'>
        <Loader2 className='h-8 w-8 animate-spin text-indigo-500' />
        <p className='ml-4'>authStatus: {authStatus}</p>
        <p className='ml-2 text-lg text-gray-700 dark:text-gray-300'>
          認証情報を確認中...
        </p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return null;
  }

  return (
    <div className='flex min-h-screen bg-gray-50 dark:bg-gray-800'>
      <aside className='hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 shadow-md p-4 border-r dark:border-gray-700'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
            PoohMa
          </h1>
          <ModeToggle />
        </div>
        <nav className='flex-1 space-y-2'>
          <Link href='/dashboard' passHref>
            <Button
              variant='ghost'
              className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              <Home className='mr-3 h-5 w-5' /> ダッシュボード
            </Button>
          </Link>
          <Link href='/accounts' passHref>
            <Button
              variant='ghost'
              className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              <FolderOpen className='mr-3 h-5 w-5' /> アカウント
            </Button>
          </Link>
          <Link href='/family' passHref>
            <Button
              variant='ghost'
              className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              <Users className='mr-3 h-5 w-5' /> 家族管理
            </Button>
          </Link>
          <Link href='/settings' passHref>
            <Button
              variant='ghost'
              className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              <Settings className='mr-3 h-5 w-5' /> 設定
            </Button>
          </Link>
        </nav>
        <div className='mt-auto pt-4 border-t dark:border-gray-700'>
          {user && (
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-2 truncate'>
              {user.email}
            </p>
          )}
          <Button
            onClick={handleSignOut}
            variant='ghost'
            className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400'
          >
            <LogOut className='mr-3 h-5 w-5' /> ログアウト
          </Button>
        </div>
      </aside>

      {/* メインコンテンツエリア */}
      <main className='flex-1 flex flex-col'>
        {/* モバイル用ヘッダー (モバイル用) */}
        <header className='md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700'>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MenuIcon className='h-6 w-6' />
              </Button>
            </SheetTrigger>
            <SheetContent
              side='left'
              className='w-64 bg-white dark:bg-gray-900 p-4'
            >
              <SheetHeader>
                <SheetTitle className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
                  PoohMa
                </SheetTitle>
              </SheetHeader>
              <nav className='flex flex-col space-y-2 mt-8'>
                <Link href='/dashboard' passHref>
                  <Button
                    variant='ghost'
                    className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <Home className='mr-3 h-5 w-5' /> ダッシュボード
                  </Button>
                </Link>
                <Link href='/accounts' passHref>
                  <Button
                    variant='ghost'
                    className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <FolderOpen className='mr-3 h-5 w-5' /> アカウント
                  </Button>
                </Link>
                <Link href='/family' passHref>
                  <Button
                    variant='ghost'
                    className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <Users className='mr-3 h-5 w-5' /> 家族管理
                  </Button>
                </Link>
                <Link href='/settings' passHref>
                  <Button
                    variant='ghost'
                    className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <Settings className='mr-3 h-5 w-5' /> 設定
                  </Button>
                </Link>
              </nav>
              <div className='mt-auto pt-4 border-t dark:border-gray-700'>
                {user && (
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2 truncate'>
                    {user.email}
                  </p>
                )}
                <Button
                  onClick={handleSignOut}
                  variant='ghost'
                  className='w-full justify-start text-lg px-4 py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400'
                >
                  <LogOut className='mr-3 h-5 w-5' /> ログアウト
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className='text-xl font-bold text-indigo-600 dark:text-indigo-400'>
            Poohma
          </h1>
          <ModeToggle />
        </header>

        {!isPrivateKeyLoaded && (
          <div className='bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 text-center text-sm font-medium flex items-center justify-center gap-2'>
            <KeyRound className='h-4 w-4' />
            <span>
              パスワード復号キーがロードされていません。設定ページでマスターパスワードを入力してください。
            </span>
            <Link href='/settings' passHref>
              <Button
                variant='link'
                className='text-yellow-800 dark:text-yellow-200 p-0 h-auto underline'
              >
                設定へ
              </Button>
            </Link>
          </div>
        )}

        <div className='flex-1 overflow-auto'>{children}</div>
      </main>
    </div>
  );
}
