'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tag } from '@/lib/types';
import { XCircle } from 'lucide-react';
import * as React from 'react';

interface AccountFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedTagId: string | null;
  onTagChange: (tagId: string | null) => void;
  filterShared: 'all' | 'shared' | 'personal';
  onFilterSharedChange: (filter: 'all' | 'shared' | 'personal') => void;
  availableTags: Tag[];
  onResetFilters: () => void;
}

export function AccountFilters({
  searchTerm,
  onSearchTermChange,
  selectedTagId,
  onTagChange,
  filterShared,
  onFilterSharedChange,
  availableTags,
  onResetFilters,
}: AccountFiltersProps) {
  return (
    <div className='flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm'>
      {/* 検索バー */}
      <Input
        placeholder='アカウントを検索...'
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className='flex-1 min-w-[200px]'
      />

      {/* タグフィルター */}
      <Select
        value={selectedTagId || ''}
        onValueChange={(value) => onTagChange(value === '' ? null : value)}
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='タグでフィルタ' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem defaultChecked value='__none__'>
            すべてのタグ
          </SelectItem>
          {availableTags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 共有状態フィルター */}
      <Select
        value={filterShared}
        onValueChange={(value: 'all' | 'shared' | 'personal') =>
          onFilterSharedChange(value)
        }
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='共有状態' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>すべて</SelectItem>
          <SelectItem value='shared'>家族共有</SelectItem>
          <SelectItem value='personal'>個人用</SelectItem>
        </SelectContent>
      </Select>

      {/* フィルターリセットボタン */}
      {(searchTerm || selectedTagId || filterShared !== 'all') && (
        <Button
          variant='outline'
          onClick={onResetFilters}
          className='flex items-center gap-2'
        >
          <XCircle className='h-4 w-4' />
          リセット
        </Button>
      )}
    </div>
  );
}
