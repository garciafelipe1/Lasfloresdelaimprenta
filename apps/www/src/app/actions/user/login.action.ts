'use server';

import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { actionClient } from '@/lib/safe-action';
import { loginSchema } from '@/lib/zod/login-schema';
import { FetchError } from '@medusajs/js-sdk';

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const loginToken = await medusa.auth.login('customer', 'emailpass', {
        email,
        password,
      });

      // Validar que el token sea válido antes de guardarlo
      if (!loginToken || typeof loginToken !== 'string') {
        throw new Error('No se recibió un token válido del servidor');
      }

      await cookies.setAuthToken(loginToken);
      
      return { success: true };
    } catch (error) {
      const fetchError = error as FetchError;
      
      // Manejar errores de autenticación (credenciales incorrectas)
      if (fetchError?.status === 401 || fetchError?.statusText === 'Unauthorized') {
        throw new Error('Email o contraseña incorrectos. Por favor, verifica tus credenciales.');
      }
      
      // Manejar otros errores
      const errorMessage = fetchError?.message || 'Ocurrió un error al intentar iniciar sesión. Por favor, intenta nuevamente.';
      throw new Error(errorMessage);
    }
  });
