import { MembershipId } from '@server/constants';

type MembershipColors = {
  [key in MembershipId]: {
    bg: string;
    accent: string;
  };
};

export const membershipColors: MembershipColors = {
  esencial: {
    bg: 'rgb(241, 245, 249)',
    accent: 'bg-slate-500',
  },
  premium: {
    bg: '#dbeafe',
    accent: 'bg-blue-500',
  },
  elite: {
    bg: 'rgb(243, 232, 255)',
    accent: 'bg-purple-500',
  },
};
