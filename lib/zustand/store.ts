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
  sidebarOpen: boolean;
}

interface AppActions {
  setAuthStatus: (status: AppState['authStatus']) => void;
  setUser: (user: User | null) => void;
  setPrivateKeyLoaded: (loaded: boolean) => void;
  setGlobalError: (error: string | null) => void;
  setGlobalLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  resetState: () => void;
}

const initialState: AppState = {
  authStatus: 'loading',
  user: null,
  isPrivateKeyLoaded: false,
  globalError: null,
  globalLoading: false,
  sidebarOpen: true,
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
      setSidebarOpen: (open) => {
        console.log('called! setSidebarOpen', open);
        return set({ sidebarOpen: open });
      },
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

  // 1. 初期セッションチェック:
  supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      if (session) {
        setAuthStatus('authenticated');
        setUser(session.user);
      } else {
        setAuthStatus('unauthenticated');
        setUser(null);
        resetState();
      }
    })
    .catch((error) => {
      // エラーが発生した場合も、未認証状態として扱う
      setAuthStatus('unauthenticated');
      setUser(null);
      resetState();
    });

  // 2. 将来の認証状態変化を購読:
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      setAuthStatus('authenticated');
      setUser(session.user);
    } else {
      setAuthStatus('unauthenticated');
      setUser(null);
      resetState();
    }
  });

  // onAuthStateChangeの購読を解除するためのクリーンアップ関数を返す
  return () => {
    subscription.unsubscribe();
  };
};
