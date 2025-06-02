'use client';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/zustand/store';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signInWithGoogle } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const { authStatus, setGlobalError, globalLoading, setGlobalLoading } =
    useAppStore();

  // 認証状態の監視
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push('/dashboard');
    }
    if (authStatus !== 'loading' && globalLoading) {
      setGlobalLoading(false);
    }
  }, [authStatus, router, globalLoading, setGlobalLoading]);

  const handleGoogleLogin = async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Googleログインエラー:', error);
      setGlobalError('ログインに失敗しました。もう一度お試しください。');
      setGlobalLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center'>
      <Button
        onClick={handleGoogleLogin}
        disabled={globalLoading || authStatus === 'authenticated'}
        className='w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
      >
        {globalLoading ? (
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          'Googleでログイン'
        )}
      </Button>
      {useAppStore.getState().globalError && (
        <p className='mt-4 text-sm text-red-600'>
          {useAppStore.getState().globalError}
        </p>
      )}
    </div>
  );
}
