'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

export function NavUser({
  user,
  userMenuContents,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  userMenuContents: {
    title: string;
    icon: LucideIcon;
    url?: string;
    onClick?: (
      event: React.MouseEvent<HTMLButtonElement>,
    ) => void | Promise<void>;
  }[][];
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.name}</span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='start'
            sideOffset={4}
          >
            <DropdownMenuLabel>アカウント設定</DropdownMenuLabel>
            {userMenuContents.map((group) => (
              <div key={group[0].title}>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {group.map((item) => (
                    <DropdownMenuItem key={item.title}>
                      {item.url != null ? (
                        <Link
                          href={item.url}
                          className='flex w-full items-center gap-2 overflow-hidden text-left outline-hidden'
                        >
                          <item.icon />
                          {item.title}
                        </Link>
                      ) : (
                        item.onClick != null && (
                          <button
                            type='button'
                            onClick={item.onClick}
                            className='flex w-full items-center gap-2 overflow-hidden text-left outline-hidden'
                          >
                            <item.icon />
                            {item.title}
                          </button>
                        )
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
