export const DEFAULT_WHATSAPP_PHONE = "5491123456789";

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

