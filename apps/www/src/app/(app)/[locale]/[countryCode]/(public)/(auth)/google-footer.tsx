'use client';

import { Button } from '@/app/components/ui/button';
import { medusa } from '@/lib/medusa-client';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { toast } from 'sonner';

export function GoogleFooter() {
  const i18n = useTranslations('Auth.google');

  const loginWithGoogle = async () => {
    try {
      const result = await medusa.auth.login('customer', 'google', {});

      if (typeof result === 'object' && result.location) {
        window.location.href = result.location;
        return;
      }

      if (typeof result !== 'string') {
        // result failed, show an error
        alert('Authentication failed');
        return;
      }

      // all subsequent requests are authenticated
      await medusa.store.customer.retrieve();
    } catch (error) {
      toast.error('Hubo un error al iniciar sesión con Google');
      console.error({ error });
    }
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        <div className='bg-border h-[2px] w-full' />
        <span>o</span>
        <div className='bg-border h-[2px] w-full' />
      </div>
      <Button
        type='button'
        onClick={() => loginWithGoogle()}
        variant='outline'
        className='w-full'
      >
        <Image
          src='/assets/img/google-logo.webp'
          alt='Google icon'
          width={16}
          height={16}
        />
        {i18n('signup')}
      </Button>
    </>
  );
}
