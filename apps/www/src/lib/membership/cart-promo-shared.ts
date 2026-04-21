import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { WELCOME_METADATA } from '@/lib/welcome/metadata-keys';
import { revalidateTag } from 'next/cache';
import {
  getLineItemProductId,
  getMembershipProductIdsFromEnv,
} from './membership-product-ids';

/** Campos necesarios para evaluar ítems y promociones del carrito. */
export const CART_PROMO_RETRIEVE_FIELDS =
  '*items,*items.variant,*items.variant.product,*items.product,*promotions' as const;

export type CartPromoApplyOptions = {
  /**
   * Si la orquestación ya cargó metadata del cliente, se reutiliza y se evitan
   * llamadas repetidas a `/store/customers/me` por cada cupón.
   */
  customerMetadata?: Record<string, unknown> | null;
};

export async function getStoreAuthHeaders(): Promise<Record<
  string,
  string
> | null> {
  const auth = await cookies.getAuthHeaders();
  if (!('authorization' in auth) || !auth.authorization) {
    return null;
  }
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';
  return {
    ...auth,
    ...(publishableKey ? { 'x-publishable-api-key': publishableKey } : {}),
  };
}

export async function fetchCustomerMetadata(
  headers: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await medusa.client.fetch<{
      customer: { metadata?: Record<string, unknown> };
    }>('/store/customers/me', {
      method: 'GET',
      headers,
    });
    return res.customer?.metadata ?? null;
  } catch {
    return null;
  }
}

export async function loadCustomerMetadataForCartPromos(): Promise<
  Record<string, unknown> | null
> {
  const headers = await getStoreAuthHeaders();
  if (!headers) return null;
  return fetchCustomerMetadata(headers);
}

export async function resolveCartPromoCustomerMetadata(
  options: CartPromoApplyOptions | undefined,
): Promise<Record<string, unknown> | null> {
  if (options?.customerMetadata != null) {
    return options.customerMetadata;
  }
  return loadCustomerMetadataForCartPromos();
}

/** Carrito solo con líneas de producto membresía (no aplicar cupones de catálogo). */
export function cartHasOnlyMembershipProducts(cart: {
  items?: unknown[];
}): boolean {
  const membershipIds = new Set(getMembershipProductIdsFromEnv());
  if (membershipIds.size === 0) {
    return false;
  }
  const items = cart.items ?? [];
  if (!items.length) return false;
  return items.every((item) => {
    const pid = getLineItemProductId(item);
    return pid ? membershipIds.has(pid) : false;
  });
}

export function getExistingPromoCodesUpper(cart: unknown): string[] {
  const promotions = (cart as { promotions?: { code?: string }[] }).promotions;
  const raw =
    promotions?.map((p) => p.code?.trim().toUpperCase()) ?? [];
  return raw.filter((c): c is string => typeof c === 'string' && c.length > 0);
}

export function getWelcomeCodeUpper(
  meta: Record<string, unknown>,
): string {
  const welcomeRaw = meta[WELCOME_METADATA.promoCode];
  return typeof welcomeRaw === 'string' && welcomeRaw.trim()
    ? welcomeRaw.trim().toUpperCase()
    : '';
}

/**
 * Cupones de catálogo (RV / Inner Circle / RR): solo sustituyen al cupón de
 * bienvenida si es el único cupón presente en el carrito.
 */
export function canApplyCatalogPromoOverCart(
  existingCodes: string[],
  welcomeCodeUpper: string,
): boolean {
  if (existingCodes.length === 0) return true;
  return (
    Boolean(welcomeCodeUpper) &&
    existingCodes.length === 1 &&
    existingCodes[0] === welcomeCodeUpper
  );
}

export async function updateCartWithPromoCode(
  cartId: string,
  promoCode: string,
): Promise<void> {
  await medusa.store.cart.update(cartId, {
    promo_codes: [promoCode],
  } as Record<string, unknown>);
  revalidateTag(`cart-${cartId}`);
}
