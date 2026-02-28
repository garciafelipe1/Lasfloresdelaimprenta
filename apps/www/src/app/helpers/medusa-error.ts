/* eslint-disable @typescript-eslint/no-explicit-any */

/** Extrae mensaje de error del backend (axios, fetch/Medusa SDK, etc.). */
function getMessageFromError(error: any): string {
  // Respuesta HTTP (axios)
  if (error.response?.data) {
    const d = error.response.data;
    if (typeof d.message === 'string' && d.message) return d.message;
    if (Array.isArray(d.message)) return d.message.map((m: any) => m?.message ?? m).join('. ');
    if (typeof d === 'string') return d;
    if (d.errors && Array.isArray(d.errors)) {
      const first = d.errors[0];
      return typeof first === 'string' ? first : first?.message ?? first?.error ?? JSON.stringify(first);
    }
  }
  // Medusa JS SDK v2 (fetch) suele devolver error.body
  if (error.body) {
    const b = error.body;
    if (typeof b.message === 'string' && b.message) return b.message;
    if (Array.isArray(b.message)) return b.message.map((m: any) => m?.message ?? m).join('. ');
    if (b.errors?.[0]?.message) return b.errors[0].message;
  }
  // Error estándar
  if (typeof error.message === 'string' && error.message) return error.message;
  return '';
}

export default function medusaError(error: any): never {
  const message = getMessageFromError(error);

  if (error.response) {
    const u = error.config ? new URL(error.config.url, error.config.baseURL) : null;
    if (u) console.error('Resource:', u.toString());
    console.error('Response data:', error.response.data);
    console.error('Status code:', error.response.status);
  } else if (message) {
    console.error('[Medusa] Error:', message, error);
  }

  const finalMessage = message.trim() || 'Error desconocido';

  if (/stock|inventory|insufficient|insuficiente|sin stock/i.test(finalMessage)) {
    throw new Error(
      'Uno o más productos ya no tienen stock. Actualizá tu carrito e intentá de nuevo.'
    );
  }

  if (finalMessage !== 'Error desconocido') {
    throw new Error(finalMessage.charAt(0).toUpperCase() + finalMessage.slice(1) + (finalMessage.endsWith('.') ? '' : '.'));
  }

  if (error.request) {
    throw new Error(
      'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.'
    );
  }

  throw new Error(
    'Ocurrió un error al procesar la solicitud. Por favor, intentá de nuevo.'
  );
}
