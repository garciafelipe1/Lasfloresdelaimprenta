// Formato wa.me: sin "+" y solo dígitos (código de país + número).
export const DEFAULT_WHATSAPP_PHONE = '5492914724362';

/**
 * Genera URL de WhatsApp (wa.me) con mensaje opcional.
 * phone debe ir sin "+" y solo dígitos.
 */
export function getWhatsAppUrl(opts?: { phone?: string; text?: string }) {
  const phone = opts?.phone ?? DEFAULT_WHATSAPP_PHONE;
  const text = opts?.text?.trim();
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function getCheerfulReserveWhatsAppText() {
  return [
    'Hola! Quiero hacer una reserva.',
    '',
    '¿Me contás disponibilidad y cómo seguimos?',
    '',
    'Gracias!',
  ].join('\n');
}

export function getCheerfulServiceWhatsAppText(serviceTitle: string) {
  return [
    `Hola! Me encantó el servicio "${serviceTitle}".`,
    '',
    'Quisiera reservar y recibir un presupuesto.',
    '¿Me contás disponibilidad, tiempos y valores?',
    '',
    'Gracias!',
  ].join('\n');
}
