import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppState {
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  isPrivateKeyLoaded: boolean;
  globalError: string | null;
  globalLoading: boolean;
}

interface AppActions {
  setAuthStatus: (status: AppState['authStatus']) => void;
  setUser: (user: User | null) => void;
  setPrivateKeyLoaded: (loaded: boolean) => void;
  setGlobalError: (error: string | null) => void;
  setGlobalLoading: (loading: boolean) => void;
  resetState: () => void;
}

const initialState: AppState = {
  authStatus: 'loading',
  user: null,
  isPrivateKeyLoaded: false,
  globalError: null,
  globalLoading: false,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuthStatus: (status) => set({ authStatus: status }),
      setUser: (user) => set({ user: user }),
      setPrivateKeyLoaded: (loaded) => set({ isPrivateKeyLoaded: loaded }),
      setGlobalError: (error) => set({ globalError: error }),
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      resetState: () => set(initialState),
    }),
    {
      name: 'poohma-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (_state) => ({}),
    },
  ),
);

// Supabase Authのイベントをリッスンし、Zustandストアを更新する関数
export const initializeAuthListener = () => {
  const supabase = createClient();
  const { setAuthStatus, setUser, resetState } = useAppStore.getState();

  console.log('initializeAuthListener: 開始'); // デバッグ用ログ

  // 1. 初期セッションチェック:
  supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      console.log('initializeAuthListener: getSession結果:', session); // デバッグ用ログ
      if (session) {
        setAuthStatus('authenticated');
        setUser(session.user);
      } else {
        setAuthStatus('unauthenticated');
        setUser(null);
        resetState();
      }
      console.log('initializeAuthListener: authStatusを更新完了 (getSession)'); // デバッグ用ログ
    })
    .catch((error) => {
      console.error(
        'initializeAuthListener: Error fetching initial session:',
        error,
      ); // デバッグ用ログ
      // エラーが発生した場合も、未認証状態として扱う
      setAuthStatus('unauthenticated');
      setUser(null);
      resetState();
    });

  // 2. 将来の認証状態変化を購読:
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('onAuthStateChange event:', event, session); // デバッグ用ログ
    if (session) {
      setAuthStatus('authenticated');
      setUser(session.user);
    } else {
      setAuthStatus('unauthenticated');
      setUser(null);
      resetState();
    }
    console.log('onAuthStateChange event: authStatusを更新完了'); // デバッグ用ログ
  });

  // onAuthStateChangeの購読を解除するためのクリーンアップ関数を返す
  return () => {
    console.log('onAuthStateChange subscription unsubscribed.'); // デバッグ用ログ
    subscription.unsubscribe();
  };
};
