'use client';

import { setShippingMethodAction } from '@/app/actions/checkout/set-shipping-method.action';
import { FormButton } from '@/app/components/ui/form-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GetShippingOptions } from '@/services/cart.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { BAHIA_BLANCA_SHIPPING_CODES } from '@server/constants';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
import { formatARS } from 'utils';
import * as z from 'zod';
import { steps } from '../../constants';

const formSchema = z
  .object({
    shippingMethod: z.string(),
    bahiaBlancaCity: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Verifica que si se selecciona el método de envío 'bahia-blanca', la ciudad de Bahía Blanca sea obligatoria
    if (data.shippingMethod === 'bahia-blanca' && !data.bahiaBlancaCity) {
      ctx.addIssue({
        path: ['bahiaBlancaCity'],
        code: z.ZodIssueCode.custom,
        message: 'La ciudad de Bahía Blanca es obligatoria.',
      });
    }
  });

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  shippingMethodsAvailables: GetShippingOptions;
}

export function ShippingForm({
  shippingMethodsAvailables: { pricesMap, shippingOptions },
}: Props) {
  const router = useRouter();
  const [shippingLocalStorage, setShippingLocalStorage] =
    useLocalStorage<FormSchema>('floreria-shipping-step', {
      shippingMethod: '',
      bahiaBlancaCity: '',
    });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: shippingLocalStorage,
  });

  const { execute, isPending } = useAction(setShippingMethodAction, {
    onError() {
      toast.error('Failed to submit the form. Please try again.');
    },
    onSuccess() {
      setShippingLocalStorage({
        shippingMethod: form.watch('shippingMethod'),
        bahiaBlancaCity: form.watch('bahiaBlancaCity'),
      });
      toast.success('Shipping method set correctly');
      router.push(steps[2].href);
    },
  });

  const isBahiaBlancaSelected = form.watch('shippingMethod') === 'bahia-blanca';

  function onSubmit(values: FormSchema) {
    execute({
      optionId: isBahiaBlancaSelected
        ? values.bahiaBlancaCity!
        : values.shippingMethod,
    });
  }
  const [bahiaBlancaCities, otherShippingMethods] = [
    shippingOptions.filter(
      (s) => s.type.code === BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca,
    ),
    shippingOptions.filter(
      (s) => s.type.code !== BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca,
    ),
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8 py-10'
      >
        <FormField
          control={form.control}
          name='shippingMethod'
          render={({ field }) => (
            <FormItem className='space-y-3'>
              <FormLabel>Método de envío</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className='flex flex-col gap-2'
                >
                  {otherShippingMethods?.map((option, index) => (
                    <FormItem
                      className='flex items-center space-y-0 space-x-3'
                      key={index}
                    >
                      <FormLabel className='hover:bg-secondary w-full justify-between rounded-xl border p-2 py-4 font-normal transition'>
                        <div className='flex gap-2'>
                          <FormControl>
                            <RadioGroupItem value={option.id} />
                          </FormControl>
                          <p>{option.name}</p>
                        </div>
                        {Boolean(pricesMap[option.id]) && (
                          <p>{formatARS(pricesMap[option.id])}</p>
                        )}
                      </FormLabel>
                    </FormItem>
                  ))}
                  <FormItem className='flex items-center space-y-0 space-x-3'>
                    <FormLabel className='hover:bg-secondary w-full justify-between rounded-xl border p-2 py-4 font-normal transition'>
                      <div className='flex gap-2'>
                        <FormControl>
                          <RadioGroupItem value='bahia-blanca' />
                        </FormControl>
                        <p>Dentro de Bahia Blanca</p>
                      </div>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Selecciona el método de envío que mejor te convenga
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {isBahiaBlancaSelected && (
          <FormField
            control={form.control}
            name='bahiaBlancaCity'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad de Bahía Blanca</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className='w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona una de las ciudades' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bahiaBlancaCities.map((city) => (
                      <SelectItem
                        key={city.id}
                        value={city.id}
                      >
                        {city.name} |
                        <span className='opacity-50'>
                          {formatARS(pricesMap[city.id])}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Los envíos dentro de Bahía suelen ser más rapidos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormButton
          isLoading={isPending}
          disabled={isPending || !Boolean(form.watch('shippingMethod'))}
          type='submit'
        >
          Continuar
        </FormButton>
      </form>
    </Form>
  );
}
