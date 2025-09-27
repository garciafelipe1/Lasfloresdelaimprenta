'use client';

import { updateAddressCartAction } from '@/app/actions/cart/update-address-cart';
import { FormButton } from '@/app/components/ui/form-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { PROVINCIAS_ARGENTINA } from '@/app/constants/provincias-argentinas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  checkoutAddressSchema,
  CheckoutAddressSchema,
} from '@/lib/zod/checkout-address-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
import { steps } from '../../constants';

export function AddressForm() {
  const router = useRouter();
  const [addressLocalStorage, setAddressLocalStorage] =
    useLocalStorage<CheckoutAddressSchema>('floreria-address-step', {
      address: '',
      city: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      postalCode: '',
      province: 'Buenos Aires',
      email: '',
    });

  const { execute, isExecuting } = useAction(updateAddressCartAction, {
    onError() {
      toast.error('Error al establecer la direccion');
    },
    onSuccess() {
      toast.success('Dirección guardada');
      router.push(steps[1].href);
    },
  });

  const form = useForm<CheckoutAddressSchema>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: addressLocalStorage,
  });

  function onSubmit(values: CheckoutAddressSchema) {
    setAddressLocalStorage(values);
    execute(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8 py-10'
      >
        <div className='grid grid-cols-12 gap-4'>
          <div className='col-span-6'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Juan'
                      type=''
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Tu primer nombre</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='col-span-6'>
            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Perez'
                      type=''
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Tu apellido</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <FormField
            control={form.control}
            name='province'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Selecciona una provincia' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVINCIAS_ARGENTINA.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                      >
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Provincias de Argentina</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Bahía Blanca'
                    {...field}
                  />
                </FormControl>
                <FormDescription>Tu ciudad</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='postalCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input
                    placeholder='1613'
                    {...field}
                  />
                </FormControl>
                <FormDescription>Tu código postal</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='address'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder='Av. Libertador 123'
                  {...field}
                />
              </FormControl>
              <FormDescription>Tu dirección</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='phoneNumber'
          render={({ field }) => (
            <FormItem className='flex flex-col items-start'>
              <FormLabel>Número de celular</FormLabel>
              <FormControl className='w-full'>
                <PhoneInput
                  placeholder='11 2323 2323'
                  {...field}
                  defaultCountry='AR'
                />
              </FormControl>
              <FormDescription>
                Tu número de celular para contactarte
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  placeholder='micorreo@gmail.com'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Te estaremos notificando a traves de este medio
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormButton
          isLoading={isExecuting}
          disabled={isExecuting}
          size='lg'
          type='submit'
        >
          Continuar
        </FormButton>
      </form>
    </Form>
  );
}
