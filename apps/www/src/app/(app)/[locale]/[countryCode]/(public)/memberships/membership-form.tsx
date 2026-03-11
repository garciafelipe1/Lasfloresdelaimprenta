'use client';

import { subscribeAction } from '@/app/actions/subscribe.action';
import { AUTH_REQUIRED_MESSAGE } from '@/lib/subscribe-constants';
import { Button } from '@/app/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { subscribeSchema, SubscribeSchema } from '@/lib/zod/subscribe-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { MembershipId } from '@server/constants';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
  membership: MembershipId;
}

export function MembershipForm({ membership }: Props) {
  const t = useTranslations();
  const params = useParams<{ locale: string; countryCode: string }>();
  const locale = params?.locale ?? 'es';
  const countryCode = params?.countryCode ?? 'ar';
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const form = useForm<SubscribeSchema>({
    resolver: zodResolver(subscribeSchema),
  });

  const { execute, isPending } = useAction(subscribeAction, {
    onError({ error }) {
      console.error('[MembershipForm] Error al ejecutar subscribeAction:', error);
      console.error('[MembershipForm] Error details:', {
        message: error?.serverError || error?.validationErrors || error,
        type: typeof error,
      });

      const errorMessage = error?.serverError ?? 'Hubo un error al procesar la suscripción';
      toast.error(errorMessage, {
        duration: 5000,
      });

      // Mostrar aviso de login si el error es por no estar autenticado
      if (error?.serverError === AUTH_REQUIRED_MESSAGE || String(error?.serverError ?? '').includes(AUTH_REQUIRED_MESSAGE)) {
        setShowLoginPrompt(true);
      }
    },
    onSuccess() {
      console.log('[MembershipForm] Suscripción iniciada correctamente');
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', { content_name: membership });
      }
      toast.success('Suscripción iniciada correctamente. Redirigiendo a Mercado Pago...', {
        duration: 3000,
      });
    },
  });

  const handleSubmit = (data: SubscribeSchema) => {
    execute({
      email: data.email,
      membership,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='mx-auto flex max-w-3xl flex-col space-y-8'
      >
        {showLoginPrompt && (
          <div className='rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40'>
            <p className='mb-2 text-sm text-amber-800 dark:text-amber-200'>
              {AUTH_REQUIRED_MESSAGE}
            </p>
            <Button asChild variant='outline' size='sm' className='border-amber-600 text-amber-800 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-200 dark:hover:bg-amber-900/40'>
              <Link href={`/${locale}/${countryCode}/login`}>
                {t('membership.membershipaccount.loginLink', { defaultValue: 'Iniciar sesión' })}
              </Link>
            </Button>
          </div>
        )}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder='juanperez@gmail.com'
                  type='email'
                  {...field}
                />
              </FormControl>
              <FormDescription className='m-0'>
                {t('membership.membershipaccount.subtitle')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          disabled={isPending}
        >
          {isPending
            ? t('membership.membershipaccount.button2') // Corrected here
            : t('membership.membershipaccount.button1')}{' '}
        </Button>
      </form>
    </Form>
  );
}
