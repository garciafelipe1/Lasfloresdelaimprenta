import { PROVINCIAS_ARGENTINA } from '@/app/constants/provincias-argentinas';
import { z } from 'zod';

export const checkoutAddressSchema = z.object({
  firstName: z
    .string({ message: 'Por favor, ingresá tu nombre.' })
    .min(1, { message: 'Por favor, ingresá tu nombre.' })
    .max(50, { message: 'El nombre no puede tener más de 50 caracteres.' }),
  lastName: z
    .string({ message: 'Por favor, ingresá tu apellido.' })
    .min(1, { message: 'Por favor, ingresá tu nombre.' })
    .max(50, { message: 'El apellido no puede tener más de 50 caracteres.' }),
  address: z.string({ message: 'La dirección es obligatoria.' }).min(1),
  postalCode: z.string({ message: 'El código postal es obligatorio.' }).min(1),
  city: z.string({ message: 'La ciudad es obligatoria.' }).min(1),
  province: z.enum(PROVINCIAS_ARGENTINA, {
    errorMap: () => ({
      message: 'Seleccioná una provincia válida.',
    }),
  }),
  phoneNumber: z
    .string({ message: 'El número de teléfono es obligatorio.' })
    .min(1, { message: 'El número de teléfono es obligatorio.' }),
  email: z.string().email(),
});

export type CheckoutAddressSchema = z.infer<typeof checkoutAddressSchema>;
