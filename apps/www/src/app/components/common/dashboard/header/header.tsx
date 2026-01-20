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
    <header className="bg-background sticky top-0 flex w-full justify-between border-b px-4 py-3 md:px-8 md:py-4 lg:px-12">
      <SidebarTrigger />
      <section className="flex items-center gap-4 md:gap-8 lg:gap-12">
        <nav className="hidden items-center gap-3 md:flex lg:gap-4">
          <Link href="/catalog" className="text-sm md:text-base">Catálogo</Link>
          <Link href="/memberships" className="text-sm md:text-base">Membresías</Link>
        </nav>
        <section className="flex items-center gap-2 md:gap-4">
          {subscription && <Badge className="text-xs md:text-sm">{subscription.membership.name}</Badge>}
          <ModeToggle />
          <ProfileDropdown user={user} />
        </section>
      </section>
    </header>
  );
}
