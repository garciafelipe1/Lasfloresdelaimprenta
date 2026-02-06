const PEAK_TZ = 'America/Argentina/Buenos_Aires';

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
}

function parseCsvDates(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Activa el modo "fechas pico" para "Envío a confirmar".
 *
 * - `NEXT_PUBLIC_PEAK_SHIPPING_ENABLED=true` fuerza el modo activo.
 * - `NEXT_PUBLIC_PEAK_SHIPPING_DATES=YYYY-MM-DD,YYYY-MM-DD` activa solo en esas fechas
 *   (comparado en zona horaria Argentina para evitar desfasajes).
 */
export function isPeakShippingActive(now = new Date()) {
  const forced = String(process.env.NEXT_PUBLIC_PEAK_SHIPPING_ENABLED ?? '')
    .trim()
    .toLowerCase();
  if (forced === 'true' || forced === '1' || forced === 'yes') return true;

  const dates = parseCsvDates(process.env.NEXT_PUBLIC_PEAK_SHIPPING_DATES);
  if (!dates.length) return false;

  const todayKey = getDateKeyInTimeZone(now, PEAK_TZ);
  return dates.includes(todayKey);
}

