# Las Flores de la Imprenta

<p align="center">
  <strong>E-commerce full-stack · Headless commerce · Pagos y suscripciones en producción</strong>
</p>

---

## 🚀 Hero Section

**Las Flores de la Imprenta** es una plataforma e-commerce de extremo a extremo construida para una florería en Bahía Blanca, Argentina. No es un demo ni un tutorial: es un sistema en producción que gestiona catálogo, carrito, checkout con Mercado Pago, órdenes, membresías con suscripciones recurrentes y un CMS para contenido, desplegado con Docker y CI/CD.

El proyecto demuestra capacidad para diseñar arquitecturas distribuidas (monorepo, múltiples servicios, bases de datos especializadas), integrar pasarelas de pago con webhooks y flujos de retorno, y operar un producto real con buenas prácticas de código, validación y despliegue automatizado.

---

## 🧠 Problema

Las florerías y pequeños comercios necesitan vender online con **pagos locales** (Mercado Pago en Argentina), **gestión de pedidos** y, en muchos casos, **modelos de suscripción** (membresías, cajas recurrentes). Las soluciones genéricas suelen ser caras, rígidas o no contemplar envíos por zona (por ejemplo, Bahía Blanca con opciones como retiro en local, envío a confirmar en fechas pico). Además, el contenido (landing, textos, media) debe poder editarse sin tocar código.

El reto no es solo “hacer una tienda”, sino **orquestar frontend, backend headless, CMS, pagos, webhooks y suscripciones** de forma mantenible y desplegable en entornos reales.

---

## 💡 Solución

Se implementó un **monorepo** con dos aplicaciones principales y paquetes compartidos:

- **Storefront (Next.js 15)**  
  Catálogo, carrito, checkout multi-paso, panel de cliente, integración con Mercado Pago (preferencias + redirección + webhook) y admin de contenido con Payload CMS.

- **Backend (Medusa 2.7)**  
  API de comercio, módulo custom de **membresías y suscripciones** (Esencial, Premium, Elite) con pre-approvals de Mercado Pago, webhooks para completar órdenes al aprobar el pago, caché con Redis, y lógica de envíos (incluyendo “Envío a confirmar” en fechas pico).

- **Paquetes compartidos**  
  Utilidades, base de datos (Drizzle) y CLI interna para mantener consistencia y reutilización.

La solución se diferencia por: **doble vía de confirmación de pago** (página de éxito al volver de MP + webhook server-side), **suscripciones con ciclo de vida gestionado en backend**, **i18n y rutas por locale/país**, y **CI/CD con Docker y Vercel** listo para producción.

---

## 🏗 Arquitectura y Diseño

### Diagrama de alto nivel

```
                    ┌─────────────────────┐
                    │       Cliente        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Next.js 15 (www)   │
                    │   App Router + SSR   │
                    │   Payload CMS Admin  │
                    └──┬──────────────┬───┘
                       │              │
             SDK (HTTP)│              │ Turso (libSQL)
                       │              │
              ┌────────▼──────┐  ┌────▼───────────┐
              │  Medusa 2.7   │  │  Payload CMS   │
              │  (store)      │  │  Media Storage │
              └──┬─────┬────┬─┘  └────────────────┘
                 │     │    │
          ┌──────▼┐ ┌─▼──┐ ├──────────────┐
          │Postgres│ │Redis│ │Cloudflare R2 │
          └───────┘ └────┘ └───────────────┘
```

- **Cliente** → Next.js (storefront + admin CMS).
- **www** se comunica con **Medusa** vía SDK (API REST) y con **Payload** para media/contenido (Turso/libSQL).
- **store** (Medusa) usa PostgreSQL (datos de comercio), Redis (caché y eventos) y R2 (almacenamiento tipo S3).

### Decisiones técnicas relevantes

| Decisión | Justificación |
|----------|----------------|
| **Medusa como headless** | API de comercio estándar, extensible con módulos y workflows; evita construir desde cero carrito, órdenes, inventario y pagos. |
| **Webhook en ruta `/hooks/mercadopago/webhook`** | Endpoint fuera de `/store/` para no mezclar con rutas de cliente; permite que Mercado Pago notifique al backend sin depender solo del redirect del usuario. |
| **Doble confirmación de pago** | Redirect a página de éxito autoriza sesión y completa carrito; el webhook hace lo mismo en segundo plano. Así se cubren tanto el flujo “usuario vuelve” como “usuario cierra antes del redirect”. |
| **Monorepo con pnpm** | Un solo repo para frontend, backend y paquetes; builds y deploys independientes por app; dependencias compartidas sin duplicar. |
| **Payload CMS dentro de Next.js** | Un solo deploy para tienda y admin de contenido; editor Lexical y media en R2; contenido desacoplado del código. |
| **Validación Zod en middleware** | Todos los endpoints custom (pagos, sesión MP, webhook, membresías) validan body/query con esquemas reutilizables; menos errores y contratos claros. |

---

## ⚙️ Stack Tecnológico

| Capa | Tecnologías | Uso en el proyecto |
|------|-------------|--------------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI | App Router, SSR, formularios accesibles, diseño responsive y consistente. |
| **Backend** | Medusa.js 2.7, Node.js, MikroORM | API de carrito, órdenes, pagos, módulos custom (membership), workflows y subscribers. |
| **CMS** | Payload CMS 3.37, Lexical | Contenido y media editables sin deploys; almacenamiento en R2. |
| **Bases de datos** | PostgreSQL (comercio), Turso/libSQL (Payload), Redis | Separación por dominio; Redis para caché de listados y eventos. |
| **Pagos** | Mercado Pago (preferencias, webhooks, pre-approvals) | Checkout redirigido, notificaciones server-side, suscripciones recurrentes. |
| **Auth** | Módulo Auth de Medusa (email/contraseña + Google OAuth) | Login y sesión para panel de cliente y dashboard. |
| **Almacenamiento** | Cloudflare R2 (S3-compatible) | Imágenes de productos y assets del CMS. |
| **i18n** | next-intl, rutas `[locale]/[countryCode]` | Soporte multi-idioma y por país en URLs. |
| **Validación** | Zod (cliente y servidor) | Schemas únicos para forms, API y webhooks; tipos inferidos en TypeScript. |
| **Testing** | Jest, Playwright | Unitarios y E2E para flujos críticos. |
| **CI/CD** | GitHub Actions, Docker, Vercel | Build de imágenes (store/www), deploy de frontend, pipelines reproducibles. |

---

## ✨ Funcionalidades Clave

- **Tienda**
  - Catálogo con filtros, búsqueda y paginación; detalle de producto con variantes y opciones.
  - Carrito en tiempo real; checkout multi-paso (dirección → envío → pago → confirmación).
  - Panel de cliente: historial de pedidos y configuración de cuenta.

- **Pagos**
  - Integración Mercado Pago: preferencias de checkout, `back_urls` (éxito/pendiente/fallo), `notification_url` (webhook).
  - Autorización de sesión de pago y completado de carrito tanto desde la **página de éxito** (redirect) como desde el **webhook**.

- **Suscripciones**
  - Tres niveles de membresía (Esencial, Premium, Elite); gestión de ciclo de vida con pre-approvals de Mercado Pago; estado y analíticas en admin.

- **Backend**
  - Módulo custom de membresías; caché Redis en rutas de productos; middleware con Zod en endpoints custom; widgets en panel Medusa para membresías.

- **Contenido y media**
  - Payload CMS integrado en Next.js; editor Lexical; media en Cloudflare R2.

- **Operaciones**
  - Docker multi-stage para `www` y `store`; GitHub Actions para build/push de imágenes y deploy en Vercel; Docker Compose para desarrollo y producción.

---

## 📈 Retos y Aprendizajes

### 1. Confirmación de pago sin depender solo del redirect

**Problema:** Si el usuario cierra la ventana antes de que Mercado Pago redirija a la URL de éxito, el pago queda aprobado en MP pero el carrito nunca se completa en nuestro sistema.

**Solución:** Se mantiene el flujo principal en la **página de éxito** (autorizar sesión + completar carrito con los query params que devuelve MP) y se añade un **webhook** (`POST /hooks/mercadopago/webhook`) que, al recibir el evento de pago aprobado, realiza la misma autorización y el `complete` del carrito. Así el sistema queda consistente aunque el usuario no llegue a la URL de éxito.

**Aprendizaje:** En integraciones de pago, conviene diseñar dos vías (redirect + webhook) y tratar el webhook como fuente de verdad para eventos asíncronos.

### 2. Ubicación del webhook fuera de `/store/`

**Problema:** El webhook debe ser accesible por Mercado Pago (server-to-server) sin mezclarse con rutas pensadas para el cliente ni con middlewares de sesión de carrito.

**Solución:** Se creó la ruta `/hooks/mercadopago/webhook` fuera del prefijo `/store/`, con middleware específico (validación Zod del body) y sin auth de sesión. La `notification_url` de la preferencia de Mercado Pago apunta a esta URL.

**Aprendizaje:** Separar rutas de integración (webhooks, callbacks) de las de dominio de negocio mejora seguridad y claridad del enrutado.

### 3. Sincronización precio carrito vs. Mercado Pago

**Problema:** Evitar discrepancias entre el monto del carrito en Medusa y el `transaction_amount` que reporta Mercado Pago al autorizar.

**Solución:** En el webhook se obtiene el `payment_collection.amount` del carrito desde Medusa y se usa ese valor en `authorizePaymentSession`; se registran warnings si hay diferencia con `transaction_amount` de MP para poder auditar.

**Aprendizaje:** En flujos de pago, definir una única fuente de verdad para el monto (en este caso el carrito) y validar contra el proveedor evita sorpresas en producción.

### 4. Completar carrito con reintentos

**Problema:** Tras autorizar la sesión, el `complete` del carrito puede fallar por latencia o estado eventualmente consistente.

**Solución:** Tanto en la página de éxito como en el webhook se implementó un loop de reintentos (por ejemplo 3 intentos con delay) antes de dar por fallido el completado, mejorando la tasa de órdenes creadas correctamente.

**Aprendizaje:** En flujos distribuidos, reintentos con backoff y logging claro son esenciales para robustez operativa.

---

## 🧪 Cómo ejecutarlo localmente

### Requisitos

- **Node.js** 20+
- **pnpm** 10+
- **Docker y Docker Compose** (PostgreSQL y Redis, o instancias propias)
- Cuentas/credenciales: Mercado Pago (opcional para solo navegar), Google OAuth (opcional), Cloudflare R2 o S3-compatible (para media)

### Instalación paso a paso

```bash
# Clonar e instalar dependencias
git clone <repo-url>
cd las-flores-de-la-imprenta-main
pnpm install

# Levantar infraestructura (PostgreSQL, Redis)
docker compose up -d

# Variables de entorno
cp apps/store/.env.template apps/store/.env
cp apps/www/.env.template apps/www/.env
# Editar ambos .env con tus valores (DB, Redis, MP, OAuth, R2, etc.)

# Migraciones y seed del backend
pnpm --filter @floreria/store medusa db:migrate
pnpm --filter @floreria/store medusa exec src/scripts/seed.ts

# Desarrollo (store en :9000, www en :3000)
pnpm dev
```

- **Storefront:** `http://localhost:3000`
- **Backend Medusa:** `http://localhost:9000`

### Variables de entorno principales

Consultar `apps/store/.env.template` y `apps/www/.env.template`. Incluyen, entre otras:

- `DATABASE_URL` / `POSTGRES_URL` — PostgreSQL del store  
- `REDIS_URL` — Redis  
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` — Pagos y webhook  
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — OAuth  
- Claves de Medusa (JWT, cookie, publishable key)  
- Configuración de Payload y R2/S3 para CMS y media  

---

## 🚀 Roadmap / Mejoras futuras

- [ ] Dashboard de métricas de negocio (ventas, suscripciones, conversión).
- [ ] Notificaciones (email/SMS) en cambios de estado de pedido y suscripción.
- [ ] Tests E2E ampliados para checkout completo y flujo de membresía.
- [ ] Optimización de caché (invalidación por evento, TTL por tipo de contenido).
- [ ] Documentación de API (OpenAPI) para endpoints custom del store.

---

## 👨‍💻 Sobre el autor

Desarrollador full-stack con foco en aplicaciones web productivas: arquitectura de sistemas, integración de pagos, APIs y despliegue. Este proyecto refleja experiencia en e-commerce headless, diseño de flujos de pago resilientes y operación en entornos reales.

- **LinkedIn:** [Tu perfil](https://github.com/GarciaFelipe1)  
- **Portafolio:** [Tu sitio](https://felipegarciadev.vercel.app/)  

---

## Licencia

Proyecto privado. Todos los derechos reservados.
