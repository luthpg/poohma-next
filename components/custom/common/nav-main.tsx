'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface NavMainItem {
  title: string;
  url?: string;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void | Promise<void>;
  icon: LucideIcon;
  isActive?: boolean;
}

export function NavMain({
  items,
  onItemClick,
}: { items: NavMainItem[]; onItemClick: () => void | Promise<void> }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            {item.url != null ? (
              <Link href={item.url} onClick={onItemClick}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            ) : (
              item.onClick != null && (
                <button
                  type='button'
                  onClick={async (event) => {
                    item.onClick != null && (await item.onClick(event));
                    await onItemClick();
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </button>
              )
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
