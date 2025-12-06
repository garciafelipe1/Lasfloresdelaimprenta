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
import { useEffect, useState } from 'react';
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

  const { setFormData, setAdditionalData } = useMercadopagoFormData();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: '',
    },
  });

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

  const isMp = isMercadopago(form.watch('paymentMethod'));

  // Guardamos el controller del Brick en window sin romper TypeScript
  const handleBrickReady = (brickController: any) => {
    (window as any).paymentBrickController = brickController;
  };

  const handleSubmit = async (data: FormSchema) => {
    console.log('Selected payment method:', data.paymentMethod);
    setIsLoading(true);

    const checkActiveSession =
      activeSession?.provider_id === data.paymentMethod;

    console.log('Active session check:', checkActiveSession);

    try {
      if (!checkActiveSession) {
        console.log(
          'Starting payment session with provider:',
          data.paymentMethod,
        );

        await executeAsync({
          providerId: data.paymentMethod,
        });
      }

      if (isMp) {
        const controller = (window as any).paymentBrickController;

        if (!controller) {
          throw new Error('Completar la información necesaria de tu tarjeta');
        }

        const additionalData = await controller.getAdditionalData();
        const formData = await controller.getFormData();

        if (!additionalData) {
          throw new Error('Completar la información necesaria de tu tarjeta');
        }
        if (!formData) {
          throw new Error('Completar la información necesaria de tu tarjeta');
        }

        setAdditionalData(additionalData);
        setFormData(formData);
      }

      router.push(steps[3].href, { scroll: false });
    } catch (error) {
      console.error({ error });

      form.setError('paymentMethod', {
        message: 'Completar la información necesaria de tu tarjeta',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = (window as any).paymentBrickController;
    controller?.unmount();
  }, [form.watch('paymentMethod')]);

  useEffect(() => {
    return () => {
      const controller = (window as any).paymentBrickController;
      controller?.unmount();
    };
  }, []);

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
              <FormLabel>Método de envío</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
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
                Selecciona el método de envío que mejor te convenga
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
              amount: cart.total,
            }}
            onSubmit={async () => await Promise.resolve()}
            // Los types del SDK dicen () => void, pero en runtime Mercado Pago
            // pasa el brickController como argumento.
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
