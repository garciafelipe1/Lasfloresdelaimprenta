'use server';

import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { actionClient } from '@/lib/safe-action';
import { redirect } from 'next/navigation';

export const logoutAction = actionClient.action(async () => {
  await medusa.auth.logout();
  await cookies.removeAuthToken();
  redirect('/login');
});
