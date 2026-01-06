import type { Metadata } from 'next';
import './../globals.css';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import prisma from '@/lib/prisma';
import { APP_CONFIG, theme } from '@/config/app';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { User } from '@prisma/client';

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user as User | undefined;

  let counts = {
    enquiries: 0,
    jobOrdersPending: 0,
    followUps: 0,
  };

  if (user) {
    const isManagerial = ['admin', 'manager'].includes(user.role || '');
    const isManager = user.role === 'manager';
    const isAdmin = user.role === 'admin';

    // Enquiries Count (Unassigned)
    // Admin: All unassigned
    // Manager: Unassigned in their branch
    const enquiryCountPromise = isManagerial
      ? prisma.enquiry.count({
        where: {
          assignedToUserId: null,
          ...(isManager && user.branch ? { branchId: user.branch } : {}),
        },
      })
      : Promise.resolve(0);

    // Job Leads Pending Count (Count of actual pending tasks/leads)
    // Admin: All pending leads
    // Manager: Pending leads in their branch's jobs
    // Others: Pending leads assigned to them (via the job they manage? or assigned lead? User said "pending job lead". Assuming lead assignment logic follows job management or direct lead assignment)
    // Re-reading logic: Job Leads link to a Job Order. 
    // If "Others" see jobs they manage, they should see pending leads in those jobs.

    const jobLeadWhere: any = {
      status: 'PENDING',
    };

    if (isAdmin) {
      // No extra filter
    } else if (isManager && user.branch) {
      jobLeadWhere.job = { branchId: user.branch };
    } else {
      // For others (Telecallers/Executive/etc), count pending leads assigned to them
      jobLeadWhere.lead = { assignedToUserId: user.id };
    }

    const jobOrdersPendingPromise = prisma.jobLead.count({
      where: jobLeadWhere,
    });

    // Follow-ups Pending
    // Admin: All pending
    // Manager: Pending in their branch
    // Others: Pending assigned to them
    const followUpWhere: any = { status: 'PENDING' };
    if (isAdmin) {
      // No extra filter
    } else if (isManager && user.branch) {
      followUpWhere.enquiry = { branchId: user.branch };
    } else {
      followUpWhere.enquiry = { assignedToUserId: user.id };
    }

    const followUpsPromise = prisma.followUp.count({
      where: followUpWhere,
    });

    const [enquiriesCount, jobOrdersPendingCount, followUpsCount] = await Promise.all([
      enquiryCountPromise,
      jobOrdersPendingPromise,
      followUpsPromise,
    ]);

    counts = {
      enquiries: enquiriesCount,
      jobOrdersPending: jobOrdersPendingCount,
      followUps: followUpsCount,
    };
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': theme.sidebarWidth,
          '--header-height': theme.headerHeight,
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="floating" user={user} counts={counts} />
      <SidebarInset>
        <SiteHeader />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
