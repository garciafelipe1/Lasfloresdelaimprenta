'use client';

import { createMercadoPagoPreference } from '@/app/actions/checkout/create-mercadopago-preference.action';
import { initiatePaymentSessionAction } from '@/app/actions/checkout/initiate-payment-session.action';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { FormButton } from '@/app/components/ui/form-button';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StoreCart,
  StorePaymentProvider,
  StorePaymentSession,
} from '@medusajs/types';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { steps } from '../../constants';
import { isMercadopago, paymentInfoMap } from '../constants';

interface Props {
  cart: StoreCart;
  availablePaymentMethods: StorePaymentProvider[];
}

const formSchema = z.object({
  paymentMethod: z.string({ message: 'Seleccioná un método de pago' }),
});

type FormSchema = z.infer<typeof formSchema>;

export function PaymentForms({ cart, availablePaymentMethods }: Props) {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: StorePaymentSession) =>
      paymentSession.status === 'pending',
  );

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: '',
    },
  });

  const selectedPaymentMethod = form.watch('paymentMethod') || '';
  const isMp = isMercadopago(selectedPaymentMethod);

  const router = useRouter();

  const { isExecuting, executeAsync } = useAction(
    initiatePaymentSessionAction,
    {
      onError() {
        toast.error('Hubo un error al iniciar el pago');
      },
      onSuccess() {
        toast.success('Proveedor de pago seleccionado correctamente');
      },
    },
  );

  const handleSubmit = async (data: FormSchema) => {
    setIsLoading(true);

    try {
      // Si es MercadoPago, crear preferencia y redirigir
      if (isMp) {
        await createMercadoPagoPreference(cart.id);
        // La función createMercadoPagoPreference hace redirect, así que no llegamos aquí
        return;
      }

      // Para otros métodos de pago, usar el flujo normal
      const checkActiveSession =
        activeSession?.provider_id === data.paymentMethod;

      if (!checkActiveSession) {
        await executeAsync({
          providerId: data.paymentMethod,
        });
      }

      // Si todo salió bien, pasamos al siguiente paso del checkout
      router.push(steps[3].href, { scroll: false });
    } catch (error: any) {
      console.error('Error al continuar con el pago', error);

      const message =
        error?.message || 'Hubo un error al procesar el pago. Intentá nuevamente.';

      form.setError('paymentMethod', {
        message,
      });

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-8 py-10'
      >
        <FormField
          control={form.control}
          name='paymentMethod'
          render={({ field }) => (
            <FormItem className='space-y-3'>
              <FormLabel>Método de pago</FormLabel>
              <FormControl>
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={(value) => field.onChange(value)}
                  className='flex flex-col gap-2'
                >
                  {availablePaymentMethods.map((option, index) => (
                    <FormItem
                      className='flex items-center space-y-0 space-x-3'
                      key={index}
                    >
                      <FormLabel className='hover:bg-secondary w-full rounded-xl border p-2 py-4 font-normal transition'>
                        <FormControl>
                          <RadioGroupItem value={option.id} />
                        </FormControl>
                        <div className='flex items-center gap-2'>
                          {paymentInfoMap[option.id].icon}
                          {paymentInfoMap[option.id].title}
                        </div>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Seleccioná el método de pago que mejor te convenga
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormButton
          isLoading={isLoading || isExecuting}
          disabled={isLoading || isExecuting}
        >
          {isMp ? 'Pagar con Mercado Pago' : 'Continuar'}
        </FormButton>
      </form>
    </Form>
  );
}
