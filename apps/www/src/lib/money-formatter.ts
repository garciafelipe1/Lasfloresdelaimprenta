import { formatARS, formatUSD } from 'utils';
import { getCurrencyFromLocale } from './currency';

function getUsdExchangeRateArsPerUsd(): number {
  // ARS por 1 USD (display). Configurable para evitar “valores inventados”.
  const raw =
    process.env.NEXT_PUBLIC_USD_EXCHANGE_RATE ||
    process.env.USD_EXCHANGE_RATE ||
    '';

  const rate = Number(raw);
  // Fallback razonable para dev si no está configurado (NO es “exacto”)
  return Number.isFinite(rate) && rate > 0 ? rate : 1000;
}

/**
 * Formatea un monto según el locale actual
 * 
 * @param amount - Monto en centavos (formato Medusa)
 * @param locale - Locale actual ('es' o 'en')
 * @returns String formateado con símbolo de moneda
 */
export function formatMoneyByLocale(
  amount: number | string,
  locale: string
): string {
  const currency = getCurrencyFromLocale(locale);
  
  if (currency === 'usd') {
    // En AR (Mercado Pago AR), la moneda de cobro es ARS.
    // Para EN mostramos USD como estimado: ARS → USD usando tasa configurable.
    const ars = Number(amount);
    const usd = ars / getUsdExchangeRateArsPerUsd();
    return formatUSD(usd.toFixed(2));
  }
  
  return formatARS(amount);
}

/**
 * Formatea un monto para emails y notificaciones
 * Usa el mismo formateo pero puede ser extendido para formato específico de email
 */
export function formatMoneyForEmail(
  amount: number | string,
  locale: string
): string {
  return formatMoneyByLocale(amount, locale);
}
