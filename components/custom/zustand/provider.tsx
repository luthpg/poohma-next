'use client';

import type { ChildrenProps } from '@/lib/types';
import { initializeAuthListener } from '@/lib/zustand/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

const queryClient = new QueryClient();

/**
 * Zustandストアと認証リスナーを初期化するプロバイダーコンポーネント。
 * アプリケーションのルートレイアウトで一度だけ使用します。
 */
export function ZustandProvider({ children }: ChildrenProps) {
  const initialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!initialized.current) {
      unsubscribeRef.current = initializeAuthListener();
      initialized.current = true;
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        initialized.current = false;
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
