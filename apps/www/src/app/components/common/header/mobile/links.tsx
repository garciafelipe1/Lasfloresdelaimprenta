'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavLinks } from '../constants/links';

interface Props {
  onClose: () => void;
}

export function Links({ onClose }: Props) {
  const path = usePathname();
  const i18n = useTranslations();
  // @ts-expect-error next-intl
  const links = getNavLinks(i18n);

  const safeLinks = links.map((l) => ({
    href: l.href.substring(1),
    label: l.label,
  }));

  return (
    <ul className='flex flex-col divide-y'>
      {safeLinks.map((link) => (
        <Link
          data-active={link.href.includes(path) ? '' : null}
          onClick={() => onClose()}
          key={link.href}
          className='data-active:bg-secondary p-4'
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
    </ul>
  );
}
