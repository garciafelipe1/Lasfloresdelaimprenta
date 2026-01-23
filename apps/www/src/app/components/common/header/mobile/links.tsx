'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavLinks } from '../constants/links';
import { LocaleToggle } from '../nav-links/locale-toggle';

interface Props {
  onClose: () => void;
}

export function Links({ onClose }: Props) {
  const path = usePathname();
  const locale = useLocale();
  const i18n = useTranslations();
  // @ts-expect-error next-intl
  const links = getNavLinks(i18n);

  const normalizeHref = (href: string): string => {
    // Si es una ruta relativa (./services), convertirla a absoluta con locale y countryCode
    if (href.startsWith('./')) {
      return `/${locale}/ar${href.substring(1)}`;
    }
    // Si ya es absoluta, Next.js con next-intl la manejará automáticamente
    // pero para consistencia, si no tiene locale/countryCode, los agregamos
    if (href.startsWith('/')) {
      const segments = href.split('/').filter(Boolean);
      // Si ya tiene locale y countryCode, devolverla tal cual
      if (segments.length >= 2 && (segments[0] === 'es' || segments[0] === 'en')) {
        return href;
      }
      // Si no, agregar locale y countryCode
      return `/${locale}/ar${href}`;
    }
    return href;
  };

  return (
    <div className='flex flex-col'>
      <ul className='flex flex-col divide-y'>
        {links.map((link) => {
        const normalizedHref = normalizeHref(link.href);
        const isActive = path.includes(normalizedHref.split('?')[0]);

        if (link.type === 'dropdown' && link.submenu) {
          const accordionValue = link.href.replace(/[./]/g, '-');
          return (
            <li
              key={link.href}
              className='border-b last:border-b-0'
            >
              <Accordion
                type='single'
                collapsible
                className='w-full'
              >
                <AccordionItem
                  value={accordionValue}
                  className='border-0'
                >
                  <AccordionTrigger
                    className={cn(
                      'p-4 hover:no-underline',
                      isActive && 'bg-secondary',
                    )}
                  >
                    <span className='text-left'>{link.label}</span>
                  </AccordionTrigger>
                  <AccordionContent className='pb-0'>
                    <ul className='flex flex-col divide-y pl-4'>
                      {link.submenu.map((subItem) => {
                        const subHref = normalizeHref(subItem.href);
                        const isSubActive = path === subHref;

                        return (
                          <li key={subItem.href}>
                            <Link
                              href={subHref}
                              onClick={() => onClose()}
                              className={cn(
                                'block p-4 text-sm transition-colors',
                                'hover:bg-secondary/50',
                                isSubActive && 'bg-secondary font-semibold',
                              )}
                            >
                              <div className='font-medium'>{subItem.title}</div>
                              {subItem.description && (
                                <p className='mt-1 text-xs text-muted-foreground'>
                                  {subItem.description}
                                </p>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
          );
        }

        return (
          <li key={link.href}>
            <Link
              data-active={isActive ? '' : null}
              onClick={() => onClose()}
              className={cn(
                'block p-4 transition-colors',
                'data-active:bg-secondary hover:bg-secondary/50',
              )}
              href={normalizedHref}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
      </ul>
      <div className='border-t pt-4 mt-4'>
        <div className='px-4'>
          <LocaleToggle />
        </div>
      </div>
    </div>
  );
}
