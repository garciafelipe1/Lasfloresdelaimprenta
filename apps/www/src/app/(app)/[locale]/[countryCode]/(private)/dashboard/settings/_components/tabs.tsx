'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    label: 'General',
    href: '/dashboard/settings',
  },
  {
    label: 'Cuenta',
    href: '/dashboard/settings/account',
  },
  {
    label: 'Membresía',
    href: '/dashboard/settings/membership',
  },
];

export function Tabs() {
  const path = usePathname();

  return (
    <nav className='flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x border-b sm:border-b-0 sm:border-r-0'>
      {tabs.map((tab) => (
        <Link
          data-active={path === tab.href ? '' : null}
          className='data-active:bg-secondary px-4 py-3 sm:py-2 text-sm transition w-full sm:w-auto text-center sm:text-left'
          key={tab.href}
          href={tab.href}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
