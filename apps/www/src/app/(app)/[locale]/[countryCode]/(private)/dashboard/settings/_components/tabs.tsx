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
    <nav className='flex divide-x'>
      {tabs.map((tab) => (
        <Link
          data-active={path === tab.href ? '' : null}
          className='data-active:bg-secondary px-4 py-2 text-sm transition'
          key={tab.href}
          href={tab.href}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
