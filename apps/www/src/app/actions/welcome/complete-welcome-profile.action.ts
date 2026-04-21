'use server';

import { actionClient } from '@/lib/safe-action';
import { cookies } from '@/lib/data/cookies';
import { cartService } from '@/services/cart.service';
import { welcomeProfileSchema } from '@/lib/zod/welcome-profile-schema';
import { applyAllEligibleCartPromos } from '@/lib/membership/apply-all-eligible-cart-promos';

function medusaBackendUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ''
  );
}

export const completeWelcomeProfileAction = actionClient
  .schema(welcomeProfileSchema)
  .action(async ({ parsedInput }) => {
    const auth = await cookies.getAuthHeaders();
    if (!('authorization' in auth) || !auth.authorization) {
      throw new Error('Tenés que iniciar sesión.');
    }

    const base = medusaBackendUrl();
    if (!base) {
      throw new Error('Configuración del servidor incompleta.');
    }

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';
    const url = `${base.replace(/\/$/, '')}/store/welcome/complete-profile`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
        ...(publishableKey ? { 'x-publishable-api-key': publishableKey } : {}),
      },
      body: JSON.stringify(parsedInput),
    });

    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      issues?: unknown;
      alreadyCompleted?: boolean;
    };

    if (!res.ok) {
      const msg =
        typeof body.message === 'string'
          ? body.message
          : 'No se pudo guardar el perfil.';
      throw new Error(msg);
    }

    const cart = await cartService.getCart().catch(() => null);
    if (cart?.id) {
      await applyAllEligibleCartPromos(cart.id);
    }

    return {
      ok: true as const,
      alreadyCompleted: body.alreadyCompleted === true,
    };
  });
