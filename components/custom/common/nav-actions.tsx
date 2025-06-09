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
import { type LucideIcon, MoreHorizontal, Star } from 'lucide-react';
import * as React from 'react';

export interface SidebarGroupContentType {
  label: string;
  icon: LucideIcon;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void | Promise<void>;
}

export function NavActions({ data }: { data: SidebarGroupContentType[][] }) {
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
