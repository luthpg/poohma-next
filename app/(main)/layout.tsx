'use client';

import {
  AppSidebar,
  type SidebarConfigs,
} from '@/components/custom/common/app-sidebar';
import {
  NavActions,
  type SidebarGroupContentType,
} from '@/components/custom/common/nav-actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import type { ChildrenProps } from '@/lib/types';
import { initializeAuthListener, useAppStore } from '@/lib/zustand/store';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Copy,
  CornerUpRight,
  GalleryVerticalEnd,
  Home,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MessageCircleQuestion,
  Moon,
  Search,
  Settings,
  Sun,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
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
    sidebarOpen,
  } = useAppStore();
  
  const { theme, setTheme } = useTheme();

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
    initializeAuthListener();
    redirect('/login');
  };

  const sidebarContents: SidebarConfigs & {
    sidebarActions: SidebarGroupContentType[][];
  } = {
    user: {
      name: user?.user_metadata?.name ?? 'unknown user',
      email: user?.email ?? 'user@example.com',
      avatar: user?.user_metadata?.avatar_url,
    },
    userMenu: [
      [
        {
          title: 'アカウント情報',
          url: '/settings',
          icon: Settings,
        },
        {
          title: 'ログアウト',
          icon: LogOut,
          onClick: handleSignOut,
        },
      ],
    ],
    navMain: [
      {
        title: '検索',
        icon: Search,
        onClick: () => console.log('Search'),
      },
      {
        title: 'ダッシュボード',
        url: '/dashboard',
        icon: Home,
        isActive: true,
      },
      {
        title: '家族管理',
        url: '/family',
        icon: UsersRound,
      },
    ],
    navSecondary: [
      {
        title: '設定',
        url: '/settings',
        icon: Settings,
      },
      theme === 'dark'
        ? {
            title: 'ライトモード',
            icon: Sun,
            onClick: () => setTheme('light'),
          }
        : {
            title: 'ダークモード',
            icon: Moon,
            onClick: () => setTheme('dark'),
          },
      {
        title: 'ヘルプ',
        url: '/help',
        icon: MessageCircleQuestion,
      },
    ],
    favorites: [],
    sidebarActions: [
      [
        {
          label: 'リンクをコピー',
          icon: LinkIcon,
        },
        {
          label: 'コピーして新規作成',
          icon: Copy,
        },
        {
          label: 'レコードを移動',
          icon: CornerUpRight,
        },
        {
          label: 'レコードを削除',
          icon: Trash2,
        },
      ],
      [
        {
          label: 'バージョン履歴',
          icon: GalleryVerticalEnd,
        },
        {
          label: 'アプリからのお知らせ',
          icon: Bell,
        },
      ],
      [
        {
          label: 'インポート',
          icon: ArrowUp,
        },
        {
          label: 'エクスポート',
          icon: ArrowDown,
        },
      ],
    ],
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
    return <span>unauthenticated</span>;
  }

  return (
    <SidebarProvider open={sidebarOpen}>
      <AppSidebar contents={sidebarContents} />
      <SidebarInset>
        <header className='flex h-14 shrink-0 items-center gap-2 sticky top-0 bg-background'>
          <div className='flex flex-1 items-center gap-2 px-3'>
            <SidebarTrigger />
            <Separator
              orientation='vertical'
              className='mr-2 data-[orientation=vertical]:h-4'
            />
            <h1 className='font-bold text-primary'>
              <Link href='/'>PoohMa</Link>
            </h1>
          </div>
          <div className='ml-auto px-3'>
            <NavActions data={sidebarContents.sidebarActions} />
          </div>
        </header>
        <main className='flex-1 flex flex-col'>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
