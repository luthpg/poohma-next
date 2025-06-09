import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

export interface NavSecondaryItem {
  title: string;
  url?: string;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void | Promise<void>;
  icon: LucideIcon;
  badge?: React.ReactNode;
}

export function NavSecondary({
  items,
  onItemClick,
  ...props
}: {
  items: NavSecondaryItem[];
  onItemClick: () => void | Promise<void>;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
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
              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
