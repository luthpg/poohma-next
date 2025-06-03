'use client';

import { AccountFilters } from '@/components/custom/accounts/account-filters';
import { AccountList } from '@/components/custom/accounts/account-list';
import { Button } from '@/components/ui/button';
import type { AccountApiResponse, ApiErrorResponse, Tag } from '@/lib/types';
import { useAppStore } from '@/lib/zustand/store';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// アカウントデータをフェッチする関数
const fetchAccounts = async (): Promise<AccountApiResponse[]> => {
  const response = await fetch('/api/accounts');
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.message || 'アカウントの取得に失敗しました。');
  }
  const result = await response.json();
  return result.data;
};

// タグデータをフェッチする関数
const fetchTags = async (): Promise<Tag[]> => {
  const response = await fetch('/api/tags');
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.message || 'タグの取得に失敗しました。');
  }
  const result = await response.json();
  return result.data;
};

export default function DashboardPage() {
  const {
    authStatus,
    user,
    isPrivateKeyLoaded,
    setGlobalError,
    setGlobalLoading,
  } = useAppStore();

  // フィルタリング状態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [filterShared, setFilterShared] = useState<
    'all' | 'shared' | 'personal'
  >('all');

  // Tanstack Query を使用してアカウントデータをフェッチ
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    error: accountsError,
    refetch: refetchAccounts,
  } = useQuery<AccountApiResponse[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
    enabled: authStatus === 'authenticated', // 認証済みの時のみフェッチを有効にする
    staleTime: 5 * 60 * 1000, // 5分間はfreshなデータとして扱う
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再フェッチを無効にする
  });

  // Tanstack Query を使用してタグデータをフェッチ
  const {
    data: availableTags,
    isLoading: isLoadingTags,
    isError: isErrorTags,
    error: tagsError,
  } = useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: fetchTags,
    enabled: authStatus === 'authenticated', // 認証済みの時のみフェッチを有効にする
    staleTime: Number.POSITIVE_INFINITY, // タグは頻繁に変わらないため、キャッシュを永続化
  });

  // グローバルローディングとエラー状態の同期
  useEffect(() => {
    setGlobalLoading(isLoadingAccounts || isLoadingTags);
    if (isErrorAccounts) {
      setGlobalError(
        accountsError?.message ||
          'アカウントデータの読み込み中にエラーが発生しました。',
      );
    } else if (isErrorTags) {
      setGlobalError(
        tagsError?.message || 'タグデータの読み込み中にエラーが発生しました。',
      );
    } else {
      setGlobalError(null);
    }
  }, [
    isLoadingAccounts,
    isLoadingTags,
    isErrorAccounts,
    isErrorTags,
    accountsError,
    tagsError,
    setGlobalLoading,
    setGlobalError,
  ]);

  // フィルタリングされたアカウントの計算
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter((account) => {
      // 検索フィルタ
      const matchesSearch =
        searchTerm === '' ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.loginIds?.some((li) =>
          li.loginId.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      // タグフィルタ
      const matchesTag =
        selectedTagId === null ||
        account.tags?.some((tag) => tag.id === selectedTagId);

      // 共有状態フィルタ
      const matchesShared =
        filterShared === 'all' ||
        (filterShared === 'shared' && account.sharedWithFamily) ||
        (filterShared === 'personal' && !account.sharedWithFamily);

      return matchesSearch && matchesTag && matchesShared;
    });
  }, [accounts, searchTerm, selectedTagId, filterShared]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTagId(null);
    setFilterShared('all');
  };

  return (
    <div className='container mx-auto p-4 sm:p-6 lg:p-8 dark:bg-gray-800 min-h-screen'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          ダッシュボード
        </h1>
        <Link href='/accounts/new' passHref>
          <Button className='bg-green-600 hover:bg-green-700 text-white flex items-center'>
            <PlusCircle className='mr-2 h-5 w-5' />
            新規アカウント
          </Button>
        </Link>
      </div>

      <p className='text-lg text-gray-700 dark:text-gray-300 mb-4'>
        ようこそ、{user?.user_metadata.name || 'ゲスト'}さん！
      </p>

      {/* フィルターコンポーネント */}
      <AccountFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedTagId={selectedTagId}
        onTagChange={setSelectedTagId}
        filterShared={filterShared}
        onFilterSharedChange={setFilterShared}
        availableTags={availableTags || []} // タグがロードされるまで空配列を渡す
        onResetFilters={handleResetFilters}
      />

      {/* アカウントリストコンポーネント */}
      <AccountList
        accounts={filteredAccounts}
        isLoading={isLoadingAccounts}
        isError={isErrorAccounts || isErrorTags} // タグのロードエラーも考慮
        error={accountsError || tagsError}
        isPrivateKeyLoaded={isPrivateKeyLoaded}
      />
    </div>
  );
}
