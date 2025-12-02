// apps/www/src/app/(app)/[locale]/[countryCode]/(protected)/dashboard/layout.tsx
import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';
import { authService } from '@/services/auth.service';
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
  // Next 15: params async
  const { locale, countryCode } = await params;

  // 👇 chequeamos si hay usuario REAL en el backend
  const user = await authService.getUser().catch(() => null);

  // 👇 si NO hay usuario (sin cookie o token inválido) → al login
  if (!user) {
    redirect(`/${locale}/${countryCode}/login`);
  }

  // 👇 si hay usuario, recién ahí mostramos el dashboard
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
