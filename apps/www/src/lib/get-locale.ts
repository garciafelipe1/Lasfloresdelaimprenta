import { headers } from 'next/headers';

/**
 * Obtiene el locale actual desde los headers de Next.js
 * 
 * Next-intl agrega el locale en el header 'x-next-intl-locale'
 */
export async function getLocale(): Promise<string> {
  const headersList = await headers();
  const locale = headersList.get('x-next-intl-locale') || 'es';
  return locale;
}
