'use client';

import { logoutAction } from '@/app/actions/user/logout.action';
import { Button } from '@/app/components/ui/button';
import { useAction } from 'next-safe-action/hooks';

export function SignOutButton() {
  const { execute } = useAction(logoutAction);

  return (
    <Button
      variant='outline'
      onClick={() => execute()}
      className='w-full sm:w-auto'
    >
      Cerrar sesión
    </Button>
  );
}
