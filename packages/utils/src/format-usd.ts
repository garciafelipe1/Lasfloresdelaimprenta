/**
 * Formatea un número como moneda USD
 */
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUSD(amount: string | number): string {
  return formatter.format(Number(amount));
}
