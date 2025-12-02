// apps/www/src/app/components/common/dashboard/header/header.tsx
import { Badge } from '@/app/components/ui/badge';
import { ModeToggle } from '@/app/components/ui/mode-toggle';
import { SidebarTrigger } from '@/app/components/ui/sidebar';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import Link from 'next/link';
import { ProfileDropdown } from './profile-dropdown';

export async function DashboardHeader() {
  const subscription = await userService.getSubscriptionInfo();
  const user = await authService.getUser().catch(() => null);

  console.log('[DashboardHeader] user:', user);

  return (
    <header className="bg-background sticky top-0 flex w-full justify-between border-b px-12 py-4">
      <SidebarTrigger />
      <section className="flex items-center gap-12">
        <nav className="flex items-center gap-4">
          <Link href="/catalog">Catálogo</Link>
          <Link href="/memberships">Membresías</Link>
        </nav>
        <section className="flex items-center gap-4">
          {subscription && <Badge>{subscription.membership.name}</Badge>}
          <ModeToggle />
          <ProfileDropdown user={user} />
        </section>
      </section>
    </header>
  );
}
