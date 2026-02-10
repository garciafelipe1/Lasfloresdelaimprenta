'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { routing } from '@/i18n/routing';

export function Footer() {
  const locale = useLocale();
  const t = useTranslations('navigation.footer');

  const links = [
    {
      title: t('catalog'),
      href: `/${locale}/ar/catalog`,
    },
    {
      title: t('services'),
      href: `/${locale}/ar/services`,
    },
    {
      title: t('memberships'),
      href: `/${locale}/ar/memberships`,
    },
  ];

  return (
    <footer className='relative py-16 md:py-32'>
      <div className='relative z-10 mx-auto max-w-5xl px-6'>
        <Link
          href={`/${locale}/ar`}
          aria-label='go home'
          className='mx-auto block size-fit'
        ></Link>

        <div className='my-8 flex flex-wrap justify-center gap-6 text-sm'>
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className='text-muted-foreground hover:text-primary block duration-150 text-primary'
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>
        <div className='my-8 flex flex-wrap justify-center gap-6 text-sm'>
          <Link
            href='https://www.facebook.com/profile.php?id=61577345196279'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Facebook'
            className='text-muted-foreground hover:text-primary block '
          >
            <svg
              className='size-6 text-primary'
              xmlns='http://www.w3.org/2000/svg'
              width='1em'
              height='1em'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentColor'
                d='M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95'
              ></path>
            </svg>
          </Link>

          <Link
            href='https://www.instagram.com/lasfloresdelaimprenta/'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Instagram'
            className='text-muted-foreground hover:text-primary block'
          >
            <svg
              className='size-6 text-primary'
              xmlns='http://www.w3.org/2000/svg'
              width='1em'
              height='1em'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentColor'
                d='M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3'
              ></path>
            </svg>
          </Link>
          <Link
              href='https://wa.me/542915321683'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='WhatsApp'
              className='text-muted-foreground hover:text-primary block'
            >
              <svg
                className='size-6 text-primary'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d="M12 2a10 10 0 0 0-8.94 14.47L2 22l5.7-1.5A10 10 0 1 0 12 2Zm5.17 14.24c-.22.62-1.3 1.17-1.8 1.24c-.46.07-1.05.1-1.7-.1c-.4-.12-.9-.3-1.55-.58c-2.72-1.18-4.5-4.05-4.63-4.23c-.13-.18-1.1-1.46-1.1-2.78c0-1.32.7-1.97.95-2.24c.25-.27.55-.34.73-.34c.18 0 .37 0 .53.01c.17.01.4-.06.62.48c.22.54.74 1.86.8 2c.07.13.11.3.02.49c-.09.18-.13.3-.26.46c-.13.15-.27.34-.38.45c-.13.13-.27.27-.12.53c.15.27.66 1.08 1.42 1.75c.98.88 1.8 1.15 2.07 1.28c.27.13.42.11.58-.07c.15-.18.65-.76.82-1.02c.17-.27.35-.22.58-.13c.24.09 1.5.71 1.76.84c.26.13.44.2.5.31c.07.11.07.64-.15 1.26Z"/>
              </svg>
            </Link>

        </div>
        <span className='text-muted-foreground block text-center text-sm text-primary'>
          © {new Date().getFullYear()} {t('copyright')}
        </span>
      </div>
    </footer>
  );
}
