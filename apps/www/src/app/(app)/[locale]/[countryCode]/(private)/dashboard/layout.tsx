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

  // 👇 chequeamos si hay usuario REAL en el backend (con reintentos tras OAuth)
  const { user, clearedInvalidToken } = await authService.getUserResult().catch(() => ({ user: null, clearedInvalidToken: false }));

  // 👇 si NO hay usuario → al login (con mensaje si se limpió token inválido)
  if (!user) {
    const search = clearedInvalidToken ? '?error=session_invalid' : '';
    redirect(`/${locale}/${countryCode}/login${search}`);
  }

  // 👇 si hay usuario, recién ahí mostramos el dashboard
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="relative flex min-h-screen w-full flex-col">
        <DashboardHeader />
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-12">{children}</div>
      </main>
    </SidebarProvider>
  );
}
