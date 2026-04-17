'use client';

import { PropsWithChildren } from 'react';
import { WelcomeProfileDialog } from './welcome-profile-dialog';

type Props = PropsWithChildren<{
  needsProfile: boolean;
}>;

export function WelcomeProfileGate({ needsProfile, children }: Props) {
  return (
    <>
      {children}
      <WelcomeProfileDialog open={needsProfile} />
    </>
  );
}
