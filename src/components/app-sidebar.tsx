'use client';

import Link from 'next/link';
import { IconInnerShadowTop } from '@tabler/icons-react';

import { NavAdmin } from '@/components/nav-admin';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SIDEBAR_DATA, COMPANY_INFO } from '@/constants/navigation';
import { User } from '@prisma/client';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User;
  counts?: {
    enquiries?: number;
    jobOrdersPending?: number;
    followUps?: number;
  };
}

export function AppSidebar({ user, counts, ...props }: AppSidebarProps) {
  const navMainWithCounts = SIDEBAR_DATA.navMain.map((item) => {
    if (item.title === 'Enquiries' && counts?.enquiries) {
      return { ...item, badge: counts.enquiries };
    }
    if (item.title === 'Job Orders') {
      return {
        ...item,
        items: item.items?.map((subItem) => {
          if (subItem.title === 'Pending' && counts?.jobOrdersPending) {
            return { ...subItem, badge: counts.jobOrdersPending };
          }
          return subItem;
        }),
      };
    }
    if (item.title === 'Follow-ups' && counts?.followUps) {
      return { ...item, badge: counts.followUps };
    }
    return item;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">{COMPANY_INFO.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithCounts} />
        {user?.role === 'admin' && <NavAdmin items={SIDEBAR_DATA.admin} />}
        {user?.role !== 'telecaller' && (
          <NavSecondary items={SIDEBAR_DATA.navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
