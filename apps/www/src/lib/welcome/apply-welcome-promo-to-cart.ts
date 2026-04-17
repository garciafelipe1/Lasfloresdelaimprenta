import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { revalidateTag } from 'next/cache';
import { WELCOME_METADATA } from './metadata-keys';

function parseIso(s: unknown): Date | null {
  if (typeof s !== 'string') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isTruthyConsumed(v: unknown): boolean {
  return v === true || v === 'true';
}

/**
 * Si el cliente tiene cupón de bienvenida vigente y el carrito tiene ítems,
 * aplica el código promocional único (sin exponerlo al cliente).
 */
export async function applyWelcomePromoToCartIfEligible(
  cartId: string,
): Promise<void> {
  const auth = await cookies.getAuthHeaders();
  if (!('authorization' in auth) || !auth.authorization) {
    return;
  }

  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';
  const headers: Record<string, string> = {
    ...auth,
    ...(publishableKey ? { 'x-publishable-api-key': publishableKey } : {}),
  };

  let customer: { metadata?: Record<string, unknown> } | undefined;
  try {
    const res = await medusa.client.fetch<{
      customer: { metadata?: Record<string, unknown> };
    }>('/store/customers/me', {
      method: 'GET',
      headers,
    });
    customer = res.customer;
  } catch {
    return;
  }

  const meta = customer?.metadata ?? {};

  if (!meta[WELCOME_METADATA.profileCompletedAt]) {
    return;
  }

  if (isTruthyConsumed(meta[WELCOME_METADATA.promoConsumed])) {
    return;
  }

  const until = parseIso(meta[WELCOME_METADATA.promoEligibleUntil]);
  if (!until || until.getTime() < Date.now()) {
    return;
  }

  const codeRaw = meta[WELCOME_METADATA.promoCode];
  if (typeof codeRaw !== 'string' || !codeRaw.trim()) {
    return;
  }

  const promoCode = codeRaw.trim().toUpperCase();

  const { cart } = await medusa.store.cart.retrieve(cartId, {
    fields: '*items,*promotions',
  });

  if (!cart?.items?.length) {
    return;
  }

  const promotions = (cart as { promotions?: { code?: string }[] })
    .promotions;
  const existingCodes =
    promotions?.map((p) => p.code?.trim().toUpperCase()).filter(Boolean) ??
    [];

  if (existingCodes.includes(promoCode)) {
    return;
  }

  const newPromoCodes = [
    ...(promotions?.map((p) => p.code).filter(Boolean) as string[]),
    promoCode,
  ];

  try {
    await medusa.store.cart.update(cartId, {
      promo_codes: newPromoCodes,
    } as Record<string, unknown>);
    revalidateTag(`cart-${cartId}`);
  } catch (e) {
    console.warn('[applyWelcomePromoToCartIfEligible]', e);
  }
}
