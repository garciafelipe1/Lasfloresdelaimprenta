import { DashboardHeader } from '@/app/components/common/dashboard/header/header';
import { DashboardSidebar } from '@/app/components/common/dashboard/sidebar/sidebar';
import { SidebarProvider } from '@/app/components/ui/sidebar';
import { PropsWithChildren } from 'react';

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className='relative flex min-h-screen w-full flex-col'>
        <DashboardHeader />
        <div className='flex-1 px-12 py-12'>{children}</div>
      </main>
    </SidebarProvider>
  );
}
