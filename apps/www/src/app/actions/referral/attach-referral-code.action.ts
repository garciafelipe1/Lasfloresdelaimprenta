'use server';

import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { cookies } from '@/lib/data/cookies';

function medusaBackendUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ''
  );
}

const attachReferralSchema = z.object({
  code: z
    .string()
    .min(3, 'Ingresá un código válido')
    .max(64, 'El código es demasiado largo')
    .transform((s) => s.trim()),
});

export const attachReferralCodeAction = actionClient
  .schema(attachReferralSchema)
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
    const url = `${base.replace(/\/$/, '')}/store/referral/attach`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
        ...(publishableKey ? { 'x-publishable-api-key': publishableKey } : {}),
      },
      body: JSON.stringify({ code: parsedInput.code }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      alreadyAttached?: boolean;
      refereePromoCode?: string;
      message?: string;
    };

    if (!res.ok) {
      throw new Error(body?.message || 'No se pudo aplicar el código.');
    }

    return {
      ok: true as const,
      alreadyAttached: body.alreadyAttached === true,
      refereePromoCode:
        typeof body.refereePromoCode === 'string' ? body.refereePromoCode : null,
    };
  });

