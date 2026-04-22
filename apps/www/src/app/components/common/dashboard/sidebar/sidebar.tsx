import { Home, LayoutDashboard, Settings, ShoppingBag, Users } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/app/components/ui/sidebar';
import Link from 'next/link';

// Menu items: Inicio = sitio principal, Panel = dashboard.
const items = [
  {
    title: 'Inicio',
    url: '/',
    icon: Home,
  },
  {
    title: 'Panel',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mis pedidos',
    url: '/dashboard/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Referidos',
    url: '/dashboard/settings/account#referrals',
    icon: Users,
  },
  // {
  //   title: 'Inbox',
  //   url: '#',
  //   icon: Inbox,
  // },
  // {
  //   title: 'Calendar',
  //   url: '#',
  //   icon: Calendar,
  // },
  // {
  //   title: 'Search',
  //   url: '#',
  //   icon: Search,
  // },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>La Floreria De La Imprenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
