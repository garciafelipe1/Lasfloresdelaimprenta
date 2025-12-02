// apps/www/src/app/(app)/[locale]/[countryCode]/(protected)/dashboard/layout.tsx
import { PropsWithChildren } from 'react';
import { SidebarProvider } from '@/app/components/ui/sidebar';
import { DashboardSidebar } from '@/app/components/common/dashboard/sidebar/sidebar';
import { DashboardHeader } from '@/app/components/common/dashboard/header/header';

type DashboardLayoutProps = PropsWithChildren & {
  params: Promise<{
    locale: string;
    countryCode: string;
  }>;
};

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  // 👇 Si no usás locale/countryCode acá, simplemente esperalos y listo
  await params;

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="relative flex min-h-screen w-full flex-col">
        <DashboardHeader />
        <div className="flex-1 px-12 py-12">{children}</div>
      </main>
    </SidebarProvider>
  );
}
