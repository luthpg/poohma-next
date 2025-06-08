'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Copy,
  CornerUpRight,
  GalleryVerticalEnd,
  Link,
  MoreHorizontal,
  Star,
  Trash2,
} from 'lucide-react';
import * as React from 'react';

interface SidebarGroupContentType {
  label: string;
  icon: React.ElementType;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void | Promise<void>;
}

const data: SidebarGroupContentType[][] = [
  [
    {
      label: 'リンクをコピー',
      icon: Link,
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
];

export function NavActions() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className='flex items-center gap-2 text-sm'>
      <Button variant='ghost' size='icon' className='h-7 w-7'>
        <Star />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='data-[state=open]:bg-accent h-7 w-7'
          >
            <MoreHorizontal />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-56 overflow-hidden rounded-lg p-0'
          align='end'
        >
          <Sidebar collapsible='none' className='bg-transparent'>
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup key={index} className='border-b last:border-none'>
                  <SidebarGroupContent className='gap-0'>
                    <SidebarMenu>
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton onClick={item.onClick}>
                            <item.icon /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  );
}
