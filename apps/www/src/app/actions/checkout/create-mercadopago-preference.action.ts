'use server';

import { medusa } from '@/lib/medusa-client';
import { mercadoPagoClient } from '@/lib/mp-client';
import { Preference } from 'mercadopago';

/**
 * Crea una preferencia de pago en MercadoPago y retorna la URL de pago
 * 
 * Este action crea una preferencia de pago con los items del carrito
 * y retorna la URL de pago de MercadoPago para que el cliente haga el redirect.
 */
export async function createMercadoPagoPreference(cartId: string): Promise<string> {
  try {
    // Obtener el carrito completo con todos los datos necesarios
    const cart = await medusa.store.cart.retrieve(cartId, {
      fields: [
        'id',
        'total',
        'shipping_total',
        'currency_code',
        'items.*',
        'items.variant.*',
        'items.variant.product.*',
        'shipping_address.*',
        'billing_address.*',
        'email',
        'region.*',
      ],
    });

    if (!cart.cart) {
      throw new Error('Carrito no encontrado');
    }

    const cartData = cart.cart;

    // Preparar los items para la preferencia de MercadoPago
    const items = cartData.items?.map((item) => {
      // Obtener el precio del item (los precios en Medusa están en centavos)
      const unitPrice = item.unit_price || 0;

      return {
        id: item.variant_id || item.id,
        title: item.variant?.product?.title || item.title || 'Producto',
        description:
          item.variant?.product?.description?.substring(0, 250) ||
          item.variant?.title ||
          'Sin descripción',
        quantity: item.quantity || 1,
        unit_price: Number(unitPrice) / 100, // MercadoPago espera el precio en formato decimal (ARS)
        currency_id: cartData.currency_code?.toUpperCase() || 'ARS',
      };
    }) || [];

    // Agregar el costo de envío como un item adicional si existe
    if (cartData.shipping_total && cartData.shipping_total > 0) {
      items.push({
        id: 'shipping',
        title: 'Costo de envío',
        description: 'Gastos de envío',
        quantity: 1,
        unit_price: Number(cartData.shipping_total) / 100,
        currency_id: cartData.currency_code?.toUpperCase() || 'ARS',
      });
    }

    // Si no hay items, lanzar error
    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Crear la preferencia de pago
    const preference = await new Preference(mercadoPagoClient).create({
      body: {
        items,
        payer: {
          email: cartData.email || undefined,
          name:
            cartData.billing_address?.first_name ||
            cartData.shipping_address?.first_name ||
            undefined,
          surname:
            cartData.billing_address?.last_name ||
            cartData.shipping_address?.last_name ||
            undefined,
          phone: {
            area_code:
              cartData.billing_address?.phone?.substring(0, 3) ||
              cartData.shipping_address?.phone?.substring(0, 3) ||
              undefined,
            number:
              cartData.billing_address?.phone?.substring(3) ||
              cartData.shipping_address?.phone?.substring(3) ||
              undefined,
          },
          address: {
            street_name:
              cartData.billing_address?.address_1 ||
              cartData.shipping_address?.address_1 ||
              undefined,
            street_number: undefined,
            zip_code:
              cartData.billing_address?.postal_code ||
              cartData.shipping_address?.postal_code ||
              undefined,
          },
        },
        back_urls: {
          success: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success`,
          failure: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failure`,
          pending: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: cartId, // Guardamos el ID del carrito para poder asociarlo después
        metadata: {
          cart_id: cartId,
          order_type: 'checkout',
        },
        notification_url: process.env.MEDUSA_BACKEND_URL
          ? `${process.env.MEDUSA_BACKEND_URL}/store/mercadopago/webhook`
          : undefined,
      },
    });

    if (!preference.init_point) {
      throw new Error('No se pudo crear la preferencia de pago');
    }

    // Retornar la URL de pago para que el cliente haga el redirect
    return preference.init_point;
  } catch (error: any) {
    console.error('Error al crear preferencia de MercadoPago:', {
      message: error.message,
      stack: error.stack,
      cartId,
      error,
    });
    
    // Proporcionar un mensaje de error más descriptivo
    const errorMessage = error.message || 'No se pudo procesar el pago. Por favor, intentá nuevamente.';
    
    // Si es un error de MercadoPago, incluir más detalles
    if (error.response) {
      console.error('MercadoPago API Error:', error.response);
    }
    
    throw new Error(errorMessage);
  }
}

