import { PROVINCIAS_ARGENTINA } from '@/app/constants/provincias-argentinas';
import { z } from 'zod';

export type TFn = (key: string) => string;

export const checkoutAddressSchemaBase = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  address: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  province: z.enum(PROVINCIAS_ARGENTINA),
  phoneNumber: z.string().min(1),
  email: z.string().email(),
});

export type CheckoutAddressSchema = z.infer<typeof checkoutAddressSchemaBase>;

export function createCheckoutAddressSchema(t: TFn) {
  return z.object({
    firstName: z
      .string({ message: t('address.errors.firstNameRequired') })
      .min(1, { message: t('address.errors.firstNameRequired') })
      .max(50, { message: t('address.errors.firstNameTooLong') }),
    lastName: z
      .string({ message: t('address.errors.lastNameRequired') })
      .min(1, { message: t('address.errors.lastNameRequired') })
      .max(50, { message: t('address.errors.lastNameTooLong') }),
    address: z
      .string({ message: t('address.errors.addressRequired') })
      .min(1, { message: t('address.errors.addressRequired') }),
    postalCode: z
      .string({ message: t('address.errors.postalCodeRequired') })
      .min(1, { message: t('address.errors.postalCodeRequired') }),
    city: z
      .string({ message: t('address.errors.cityRequired') })
      .min(1, { message: t('address.errors.cityRequired') }),
    province: z.enum(PROVINCIAS_ARGENTINA, {
      errorMap: () => ({
        message: t('address.errors.provinceInvalid'),
      }),
    }),
    phoneNumber: z
      .string({ message: t('address.errors.phoneRequired') })
      .min(1, { message: t('address.errors.phoneRequired') }),
    email: z
      .string()
      .email({ message: t('address.errors.emailInvalid') }),
  });
}
