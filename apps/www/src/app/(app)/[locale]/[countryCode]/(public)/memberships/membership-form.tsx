'use client';

import { subscribeAction } from '@/app/actions/subscribe.action';
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
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
  membership: MembershipId;
}

export function MembershipForm({ membership }: Props) {
  const t = useTranslations();

  const form = useForm<SubscribeSchema>({
    resolver: zodResolver(subscribeSchema),
  });

  const { execute, isPending } = useAction(subscribeAction, {
    onError({ error }) {
      console.error({ error });
      toast('Hubo un error');
    },
    onSuccess() {
      toast('Suscripción iniciada correctamente. Redirigiendo a Mercado Pago.');
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
