import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'El nombre tiene que tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'El email no es válido' }),
    phone: z
      .string()
      .min(10, { message: 'El número de teléfono no es válido' }),
    password: z
      .string()
      .min(6, {
        message: 'La contraseña tiene que tener al menos 6 caracteres',
      })
      .regex(/[a-zA-Z0-9]/, {
        message: 'La contraseña tiene que ser alfanumérica',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });
