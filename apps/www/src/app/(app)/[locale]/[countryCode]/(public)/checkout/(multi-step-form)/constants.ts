export const steps = [
  {
    id: 1,
    href: '/checkout/address',
    label: 'Dirección',
  },
  {
    id: 2,
    href: '/checkout/shipping',
    label: 'Envío',
  },
  {
    id: 3,
    href: '/checkout/payment',
    label: 'Pago',
  },
  {
    id: 4,
    href: '/checkout/summary',
    label: 'Resumen',
  },
];

export const STEPS = {
  address: {
    href: '/checkout/address',
    label: 'Dirección',
  },
  shipping: {
    href: '/checkout/shipping',
    label: 'Envío',
  },
  payment: {
    href: '/checkout/payment',
    label: 'Pago',
  },
  summary: {
    href: '/checkout/summary',
    label: 'Resumen',
  },
};

export type Step = keyof typeof STEPS;
