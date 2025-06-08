'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    onClick?: (
      event: React.MouseEvent<HTMLButtonElement>,
    ) => void | Promise<void>;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            {item.url != null ? (
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            ) : (
              item.onClick != null && (
                <button type='button' onClick={item.onClick}>
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
