import { TFunction } from '@/i18n/types';

export const getNavLinks = (i18n: TFunction) => [
  { label: i18n('navigation.catalog'), href: './catalog', type: 'link' },
  {
    label: i18n('navigation.servicios.title'),
    href: './services',
    type: 'dropdown',
    submenu: [
      {
        title: i18n('navigation.services.floralEvents.title'),
        href: '/services/eventos-florales', // ✅ URL individual optimizada para SEO
        description: i18n('navigation.services.floralEvents.description'),
      },
      {
        title: i18n('navigation.services.weddings.title'),
        href: '/services/bodas', // ✅ URL individual optimizada para SEO
        description: i18n('navigation.services.weddings.description'),
      },
    ],
  },
  {
    label: i18n('navigation.memberships'),
    href: './memberships',
    type: 'link',
  },
];
