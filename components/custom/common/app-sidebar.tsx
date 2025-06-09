'use client';

import {
  NavFavorites,
  type NavFavoritesItem,
} from '@/components/custom/common/nav-favorites';
import { NavMain, type NavMainItem } from '@/components/custom/common/nav-main';
import {
  NavSecondary,
  type NavSecondaryItem,
} from '@/components/custom/common/nav-secondary';
import {
  NavUser,
  type NavUserItem,
  type NavUserMenuItem,
} from '@/components/custom/common/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAppStore } from '@/lib/zustand/store';
import React from 'react';

export interface SidebarConfigs {
  user: NavUserItem;
  userMenu: NavUserMenuItem[][];
  navMain: NavMainItem[];
  navSecondary: NavSecondaryItem[];
  favorites: NavFavoritesItem[];
}

export function AppSidebar({
  contents,
  ...props
}: { contents: SidebarConfigs } & React.ComponentProps<typeof Sidebar>) {
  const setOpen = useAppStore((state) => state.setSidebarOpen);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleItemClick = React.useCallback(() => {
    if (isMobile) setOpen(false);
  }, [isMobile, setOpen]);

  return (
    <Sidebar className='border-r-0' {...props}>
      <SidebarHeader>
        <NavUser
          user={contents.user}
          userMenuContents={contents.userMenu}
          onItemClick={handleItemClick}
        />
        <NavMain items={contents.navMain} onItemClick={handleItemClick} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites
          favorites={contents.favorites}
          onItemClick={handleItemClick}
        />
        <NavSecondary
          items={contents.navSecondary}
          className='mt-auto'
          onItemClick={handleItemClick}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
