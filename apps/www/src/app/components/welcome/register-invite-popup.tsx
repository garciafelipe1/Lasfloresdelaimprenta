'use client';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  WELCOME_INVITE_DISMISS_DAYS,
  WELCOME_INVITE_POPUP_DELAY_MS,
  WELCOME_INVITE_STORAGE_KEY,
} from '@/lib/welcome/ui-constants';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';

const SUPPRESS_INVITE_PATH_SNIPPETS = [
  '/login',
  '/register',
  '/callback',
  '/checkout',
  '/dashboard',
];

function readDismissedUntil(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WELCOME_INVITE_STORAGE_KEY);
    if (!raw) return null;
    const t = Date.parse(raw);
    return Number.isNaN(t) ? null : t;
  } catch {
    return null;
  }
}

function persistDismissed() {
  const until = new Date();
  until.setDate(until.getDate() + WELCOME_INVITE_DISMISS_DAYS);
  localStorage.setItem(WELCOME_INVITE_STORAGE_KEY, until.toISOString());
}

/**
 * Invitación a registrarse: beneficio 10% primera compra. Solo visitantes;
 * se puede cerrar sin obligación; el cupón real se otorga al completar el perfil tras login.
 */
export const RegisterInvitePopup: React.FC<{ isLoggedIn?: boolean }> = ({
  isLoggedIn = false,
}) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (isLoggedIn) return;

    if (
      SUPPRESS_INVITE_PATH_SNIPPETS.some((fragment) => pathname.includes(fragment))
    ) {
      return;
    }

    const dismissedUntil = readDismissedUntil();
    if (dismissedUntil !== null && dismissedUntil > Date.now()) {
      return;
    }

    const t = window.setTimeout(() => {
      setOpen(true);
    }, WELCOME_INVITE_POPUP_DELAY_MS);

    return () => window.clearTimeout(t);
  }, [isLoggedIn, pathname]);

  const handleGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      persistDismissed();
    }
    setOpen(next);
  };

  if (isLoggedIn) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl text-primary'>
            Registrate y obtené un 10% de descuento
          </DialogTitle>
          <DialogDescription className='text-base text-muted-foreground pt-1'>
            En tu primera compra, válido durante 7 días después de completar tu perfil.
            Podés cerrar esta ventana; el beneficio se activa solo cuando te registrás.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3 pt-2'>
          <Button
            type='button'
            size='lg'
            className='w-full gap-2'
            onClick={handleGoogle}
          >
            <Image
              src='/assets/img/google.svg'
              alt=''
              width={20}
              height={20}
            />
            Continuar con Google
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='text-muted-foreground'
            onClick={() => handleOpenChange(false)}
          >
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
