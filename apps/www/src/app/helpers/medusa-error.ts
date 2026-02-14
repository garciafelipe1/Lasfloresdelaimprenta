/* eslint-disable @typescript-eslint/no-explicit-any */
export default function medusaError(error: any): never {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const u = new URL(error.config.url, error.config.baseURL);
    console.error('Resource:', u.toString());
    console.error('Response data:', error.response.data);
    console.error('Status code:', error.response.status);
    console.error('Headers:', error.response.headers);

    // Extracting the error message from the response data
    const raw =
      typeof error.response.data.message === 'string'
        ? error.response.data.message
        : typeof error.response.data === 'string'
          ? error.response.data
          : '';
    const message = String(raw || 'Error desconocido');

    // Mensaje amigable para errores de stock/inventario
    if (/stock|inventory|insufficient|insuficiente|sin stock/i.test(message)) {
      throw new Error(
        'Uno o más productos ya no tienen stock. Actualizá tu carrito e intentá de nuevo.'
      );
    }

    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + '.');
  } else if (error.request) {
    // The request was made but no response was received (red caída, timeout, CORS, etc.)
    throw new Error(
      'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.'
    );
  } else {
    // Something happened in setting up the request (config, red, etc.)
    throw new Error(
      'Ocurrió un error al procesar la solicitud. Por favor, intentá de nuevo.'
    );
  }
}
