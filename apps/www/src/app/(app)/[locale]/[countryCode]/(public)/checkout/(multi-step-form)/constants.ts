export const steps = [
  {
    id: 1,
    href: '../address',
    labelKey: 'steps.address',
  },
  {
    id: 2,
    href: '../shipping',
    labelKey: 'steps.shipping',
  },
  {
    id: 3,
    href: '../payment',
    labelKey: 'steps.payment',
  },
  {
    id: 4,
    href: '../summary',
    labelKey: 'steps.summary',
  },
];

export const STEPS = {
  address: {
    href: '../address',
    labelKey: 'steps.address',
  },
  shipping: {
    href: '../shipping',
    labelKey: 'steps.shipping',
  },
  payment: {
    href: '../payment',
    labelKey: 'steps.payment',
  },
  summary: {
    href: '../summary',
    labelKey: 'steps.summary',
  },
};

export type Step = keyof typeof STEPS;
