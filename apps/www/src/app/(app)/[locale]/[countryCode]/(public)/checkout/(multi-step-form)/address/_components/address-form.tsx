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
  createCheckoutAddressSchema,
  CheckoutAddressSchema,
} from '@/lib/zod/checkout-address-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
import { steps } from '../../constants';

export function AddressForm() {
  const t = useTranslations('checkout');
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
      toast.error(t('address.toasts.error'));
    },
    onSuccess() {
      toast.success(t('address.toasts.success'));
      router.push(steps[1].href);
    },
  });

  const form = useForm<CheckoutAddressSchema>({
    resolver: zodResolver(createCheckoutAddressSchema(t)),
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
                  <FormLabel>{t('address.fields.firstName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('address.placeholders.firstName')}
                      type=''
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('address.descriptions.firstName')}</FormDescription>
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
                  <FormLabel>{t('address.fields.lastName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('address.placeholders.lastName')}
                      type=''
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('address.descriptions.lastName')}</FormDescription>
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
                <FormLabel>{t('address.fields.province')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('address.placeholders.province')} />
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
                <FormDescription>{t('address.descriptions.province')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('address.fields.city')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('address.placeholders.city')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t('address.descriptions.city')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='postalCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('address.fields.postalCode')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('address.placeholders.postalCode')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t('address.descriptions.postalCode')}</FormDescription>
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
              <FormLabel>{t('address.fields.address')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('address.placeholders.address')}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t('address.descriptions.address')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='phoneNumber'
          render={({ field }) => (
            <FormItem className='flex flex-col items-start'>
              <FormLabel>{t('address.fields.phoneNumber')}</FormLabel>
              <FormControl className='w-full'>
                <PhoneInput
                  placeholder={t('address.placeholders.phoneNumber')}
                  {...field}
                  defaultCountry='AR'
                />
              </FormControl>
              <FormDescription>
                {t('address.descriptions.phoneNumber')}
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
              <FormLabel>{t('address.fields.email')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('address.placeholders.email')}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('address.descriptions.email')}
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
          {t('common.continue')}
        </FormButton>
      </form>
    </Form>
  );
}
