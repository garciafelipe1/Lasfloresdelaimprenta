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

  const { executeAsync: executeMercadoPago, isExecuting: isExecutingMP } = useAction(
    createMercadoPagoPreference,
    {
      onError(error: any) {
        console.error('[PaymentForms] Error en useAction de MercadoPago:', error);
        const errorMessage = error?.error?.serverError || error?.serverError || 'Hubo un error al crear la preferencia de pago';
        toast.error(errorMessage);
      },
      onSuccess(data: any) {
        console.log('[PaymentForms] Preferencia creada exitosamente desde useAction');
        console.log('[PaymentForms] Datos recibidos:', data);
        if (data?.data) {
          console.log('[PaymentForms] Redirigiendo a MercadoPago desde onSuccess...');
          window.location.href = data.data;
        }
      },
    },
  );

  const handleSubmit = async (data: FormSchema) => {
    console.log('[PaymentForms] Iniciando submit del formulario');
    console.log('[PaymentForms] Método de pago seleccionado:', data.paymentMethod);
    console.log('[PaymentForms] Es MercadoPago:', isMp);
    console.log('[PaymentForms] Cart ID:', cart.id);
    
    setIsLoading(true);

    try {
      // Si es MercadoPago, crear preferencia y redirigir
      if (isMp) {
        console.log('[PaymentForms] Creando preferencia de MercadoPago usando useAction...');
        try {
          const result = await executeMercadoPago();
          console.log('[PaymentForms] Resultado de executeMercadoPago:', result);
          
          // El redirect se maneja en onSuccess del useAction
          // Pero por si acaso, también lo hacemos aquí
          if (result?.data) {
            console.log('[PaymentForms] URL de pago obtenida:', result.data.substring(0, 50) + '...');
            console.log('[PaymentForms] Redirigiendo a MercadoPago...');
            window.location.href = result.data;
          }
          return;
        } catch (mpError: any) {
          console.error('[PaymentForms] Error específico de MercadoPago:', {
            message: mpError?.message,
            stack: mpError?.stack,
            error: mpError,
            serverError: mpError?.serverError,
            validationErrors: mpError?.validationErrors,
          });
          throw mpError;
        }
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
      console.log('[PaymentForms] Pago procesado exitosamente, redirigiendo al siguiente paso');
      router.push(steps[3].href, { scroll: false });
    } catch (error: any) {
      console.error('[PaymentForms] ERROR al procesar el pago');
      console.error('[PaymentForms] Tipo de error:', error?.constructor?.name);
      console.error('[PaymentForms] Mensaje:', error?.message);
      console.error('[PaymentForms] Stack:', error?.stack);
      console.error('[PaymentForms] Error completo:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
        response: error?.response,
      });

      const message =
        error?.message || 'Hubo un error al procesar el pago. Intentá nuevamente.';

      console.error('[PaymentForms] Mostrando error al usuario:', message);

      form.setError('paymentMethod', {
        message,
      });

      toast.error(message);
    } finally {
      console.log('[PaymentForms] Finalizando proceso de pago');
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
          isLoading={isLoading || isExecuting || isExecutingMP}
          disabled={isLoading || isExecuting || isExecutingMP}
        >
          {isMp ? 'Pagar con Mercado Pago' : 'Continuar'}
        </FormButton>
      </form>
    </Form>
  );
}
