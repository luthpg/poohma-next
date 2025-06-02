'use client';

import { initializeAuthListener } from '@/lib/zustand/store';
import { useEffect } from 'react';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('AuthInitializer: initializeAuthListenerを呼び出し'); // デバッグ用ログ
    initializeAuthListener();
  }, []);
  return <>{children}</>;
}
