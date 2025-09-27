# Servicios externos involucrados

## Integraciones

- **MercadoPago**

Pasarela de pago Procesar pagos en línea (tarjetas, billeteras, efectivo) y recibir la confirmación de la transacción para crear/actualizar pedidos.

- **CorreoArgentino (PAQ.ar)**

Estimación de envíos Consultar el costo y tiempo estimado de envío a partir del código postal del cliente, para mostrar opciones de envío y calcular el total del pedido.

- **Resend**

Notificaciones por email Enviar correos transaccionales (confirmación de pedido, captura de pago, envío, etc.) con un límite gratuito de 3 000 correos al mes.

- **Google OAuth**

Autenticación mediante Google

## Infraestructura

- **Cloudflare** (Gratis)

DNS para cachear imagenes y evitar tener que ir al origen en cada request

- **Redis**

Almacenar temporalmente respuestas de API (productos, catálogos, precios) y datos de sesión para reducir la carga en la base de datos y acelerar la respuesta al cliente.

- **NeonDB | Postgres**

Base de datos Servidor PostgreSQL gestionado que almacena toda la información de la tienda: productos, clientes, pedidos, inventario, etc.

- **n8n** (VPS)

Automatización de tareas Orquestar flujos de trabajo (por ejemplo, crear tickets en soporte, actualizar CRM, sincronizar inventario) mediante integraciones sin código.

- **Railway** (20$USD)

Hosting de servicios Desplegar y escalar los micro‑servicios de Medusa (API, workers, workers de cola) y los componentes auxiliares (Redis, n8n) en un entorno cloud gestionado.
