export const links = [
  {
    label: 'Miembros',
    href: '/admin/miembros',
  },
] as const;

export type CustomLinks = (typeof links)[number]['label'];
