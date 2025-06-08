'use client';

import { NavFavorites } from '@/components/custom/common/nav-favorites';
import { NavMain } from '@/components/custom/common/nav-main';
import { NavSecondary } from '@/components/custom/common/nav-secondary';
import { NavUser } from '@/components/custom/common/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

export interface SidebarConfigs {
  user: { name: string; email: string; avatar: string };
  userMenu: {
    title: string;
    url?: string | undefined;
    onClick?:
      | ((event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>)
      | undefined;
    icon: LucideIcon;
  }[][];
  navMain: {
    title: string;
    url?: string | undefined;
    onClick?:
      | ((event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>)
      | undefined;
    icon: LucideIcon;
    isActive?: boolean | undefined;
  }[];
  navSecondary: {
    title: string;
    url: string;
    icon: LucideIcon;
    badge?: React.ReactNode;
  }[];
  favorites: { name: string; url: string; emoji: string }[];
}
export function AppSidebar({
  contents,
  ...props
}: { contents: SidebarConfigs } & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className='border-r-0' {...props}>
      <SidebarHeader>
        <NavUser user={contents.user} userMenuContents={contents.userMenu} />
        <NavMain items={contents.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={contents.favorites} />
        <NavSecondary items={contents.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
