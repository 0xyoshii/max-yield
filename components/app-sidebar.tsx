'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from 'next-auth';
import { usePathname } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SidebarNav } from './sidebar-nav';
import { cn } from '@/lib/utils';

const navigation = [
  { name: "Chat", href: "/chat" },
  { name: "Allocator", href: "/allocator" },
];

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <div className="flex flex-row justify-between items-center px-2 py-2">
          <Link
            href="/"
            onClick={() => {
              setOpenMobile(false);
            }}
            className="flex flex-row gap-3 items-center"
          >
            <span className="text-lg font-semibold hover:bg-muted rounded-md cursor-pointer">
              Defi Assistant
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className="p-2 h-fit"
                onClick={() => {
                  setOpenMobile(false);
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end">New Chat</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
