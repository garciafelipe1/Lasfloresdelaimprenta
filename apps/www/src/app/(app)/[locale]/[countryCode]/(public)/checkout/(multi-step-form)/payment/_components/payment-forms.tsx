'use client';

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
import { useMercadopagoFormData } from '@/app/context/payment-form-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StoreCart,
  StorePaymentProvider,
  StorePaymentSession,
} from '@medusajs/types';
import { Payment as MpPaymentBrick } from '@mercadopago/sdk-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { steps } from '../../constants';
import { isMercadopago, paymentInfoMap } from '../constants';

// -----------------
// Tipado del controller del Brick
// -----------------
import type {
  IAdditionalData,
  IPaymentFormData,
} from '@mercadopago/sdk-react/esm/bricks/payment/type';

type PaymentBrickController = {
  getAdditionalData: () => Promise<IAdditionalData | null>;
  getFormData: () => Promise<IPaymentFormData | null>;
  unmount: () => void;
};

declare global {
  interface Window {
    paymentBrickController?: PaymentBrickController;
  }
}

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

  const { setFormData, setAdditionalData } = useMercadopagoFormData();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: '',
    },
  });

  const paymentMethod = form.watch('paymentMethod');
  const isMp = isMercadopago(paymentMethod);

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

  // Guardamos el controller del Brick en window
  const handleBrickReady = (brickController: PaymentBrickController) => {
    if (typeof window !== 'undefined') {
      window.paymentBrickController = brickController;
    }
  };

  const handleSubmit = async (data: FormSchema) => {
    console.log('Selected payment method:', data.paymentMethod);
    setIsLoading(true);

    const checkActiveSession =
      activeSession?.provider_id === data.paymentMethod;

    console.log('Active session check:', checkActiveSession);

    try {
      // 1) Aseguramos la sesión de pago en Medusa
      if (!checkActiveSession) {
        console.log(
          'Starting payment session with provider:',
          data.paymentMethod,
        );

        await executeAsync({
          providerId: data.paymentMethod,
        });
      }

      // 2) Si es Mercado Pago, pedimos los datos al Brick
      if (isMp) {
        if (typeof window === 'undefined') {
          throw new Error('Error interno del navegador');
        }

        const controller = window.paymentBrickController;

        if (!controller) {
          throw new Error(
            'Completá primero el formulario de la tarjeta antes de continuar',
          );
        }

        let additionalData: IAdditionalData | null = null;
        let formData: IPaymentFormData | null = null;

        try {
          additionalData = await controller.getAdditionalData();
          formData = await controller.getFormData();
        } catch (err: any) {
          console.error('[MP BRICK ERROR]', err);

          // Si viene el error de cuotas vacías lo explicamos mejor
          if (
            err instanceof Error &&
            err.message &&
            err.message.toLowerCase().includes('empty_installments')
          ) {
            throw new Error(
              'Seleccioná la cantidad de cuotas en el formulario de Mercado Pago',
            );
          }

          throw new Error('Revisá los datos de tu tarjeta e intentá de nuevo');
        }

        if (!additionalData || !formData) {
          throw new Error(
            'Completá todos los campos requeridos de la tarjeta (incluyendo cuotas)',
          );
        }

        // Guardamos en el contexto para el siguiente paso del checkout
        setAdditionalData(additionalData);
        setFormData(formData);
      }

      // 3) Pasamos al siguiente paso del checkout
      router.push(steps[3].href, { scroll: false });
    } catch (error: any) {
      console.error({ error });

      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Completar la información necesaria de tu tarjeta';

      form.setError('paymentMethod', {
        message,
      });

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cuando cambia el método de pago, desmontamos el Brick anterior
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const controller = window.paymentBrickController;
    controller?.unmount();
  }, [paymentMethod]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      const controller = window.paymentBrickController;
      controller?.unmount();
    };
  }, []);

  // Evitamos la advertencia de "uncontrolled -> controlled"
  const radioOptions = useMemo(
    () => availablePaymentMethods ?? [],
    [availablePaymentMethods],
  );

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
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  className='flex flex-col gap-2'
                >
                  {radioOptions.map((option, index) => (
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
                Seleccioná el método de pago que más te convenga
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isMp && (
          <MpPaymentBrick
            customization={{
              paymentMethods: { creditCard: 'all', debitCard: 'all' },
              visual: {
                hidePaymentButton: true,
                hideFormTitle: true,
              },
            }}
            initialization={{
              // Si tus montos están en centavos podés ajustar a /100
              amount: cart.total,
            }}
            onSubmit={async () => await Promise.resolve()}
            // En runtime Mercado Pago pasa el controller como argumento
            onReady={handleBrickReady as any}
          />
        )}

        <FormButton
          isLoading={isLoading || isExecuting}
          disabled={isLoading || isExecuting}
        >
          Continuar
        </FormButton>
      </form>
    </Form>
  );
}
