# Las Flores de la Imprenta

Plataforma e-commerce full-stack desarrollada para una florería ubicada en Bahía Blanca, Argentina. El sistema gestiona el ciclo completo de venta online — desde la navegación de productos y suscripciones de membresía hasta el checkout con Mercado Pago y la gestión de pedidos — desplegado como servicios containerizados con automatización CI/CD.

---

## Arquitectura

```
                          ┌─────────────────────┐
                          │       Cliente        │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Next.js 15 (www)   │
                          │   App Router + SSR    │
                          │   Payload CMS Admin   │
                          └──┬──────────────┬────┘
                             │              │
                   SDK (HTTP)│              │Turso (libSQL)
                             │              │
                  ┌──────────▼──────┐  ┌───▼───────────┐
                  │  Medusa 2.7     │  │  Payload CMS   │
                  │  (store)        │  │  Media Storage  │
                  │                 │  └───────────────┘
                  └──┬─────┬────┬──┘
                     │     │    │
              ┌──────▼┐ ┌─▼──┐ ├──────────────┐
              │Postgres│ │Redis│ │Cloudflare R2 │
              └───────┘ └────┘ └──────────────┘
```

El proyecto es un **monorepo con pnpm** que contiene dos aplicaciones principales y tres paquetes compartidos:

| App / Paquete | Descripción |
|---|---|
| `apps/www` | Storefront Next.js 15 — catálogo de productos, checkout, panel de cliente, admin de Payload CMS |
| `apps/store` | Backend Medusa 2.7 — API REST, módulos custom, workflows, webhooks |
| `packages/utils` | Utilidades compartidas (formateo de moneda, helpers de membresías) |
| `packages/database` | Capa Drizzle ORM con seeds y migraciones |
| `packages/cli` | Herramientas CLI internas |

---

## Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI |
| **Backend** | Medusa.js 2.7 (headless commerce), Node.js, MikroORM |
| **CMS** | Payload CMS 3.37 con editor Lexical |
| **Bases de datos** | PostgreSQL 12 (datos de comercio), Turso/libSQL (media del CMS), Redis 7 (caché + eventos) |
| **Pagos** | Mercado Pago (preferencias de checkout, webhooks, pre-approvals de suscripción) |
| **Autenticación** | Módulo Auth de Medusa (email/contraseña + Google OAuth) |
| **Almacenamiento** | Cloudflare R2 (compatible con S3) para imágenes de productos y media |
| **i18n** | next-intl con routing basado en locale (`[locale]/[countryCode]`) |
| **Validación** | Esquemas Zod en cliente y servidor |
| **Testing** | Jest (unitarios), Playwright (E2E) |
| **CI/CD** | GitHub Actions — builds automáticos de imágenes Docker + deploys en Vercel |
| **Infraestructura** | Docker multi-stage builds, GitHub Container Registry, Vercel (frontend), Railway/VPS (backend) |

---

## Funcionalidades Principales

### Tienda Online
- Catálogo de productos responsive con filtros por categoría, búsqueda y paginación
- Páginas de detalle de producto con selección de variantes, opciones de personalización y control de cantidad
- Carrito de compras en tiempo real con panel lateral
- Flujo de checkout multi-paso (dirección → envío → pago → confirmación)
- Panel de cliente con historial de pedidos y configuración de cuenta

### Pagos y Suscripciones
- Integración con Mercado Pago mediante preferencias de checkout y webhooks server-side
- Completado automático de órdenes vía webhook cuando el pago es aprobado
- Sistema de suscripciones con tres niveles de membresía (Esencial, Premium, Elite)
- Gestión del ciclo de vida de suscripciones (creación, cancelación, seguimiento de estado vía pre-approvals)

### Backend
- Módulo custom de Medusa para gestión de membresías y suscripciones
- Caché de rutas API con Redis para listados de productos
- Middleware con validación Zod en todos los endpoints custom
- Widgets del panel de administración para analíticas de membresías
- Scripts automatizados de gestión de inventario y canales de venta

### CMS y Contenido
- Payload CMS integrado dentro de la app Next.js para gestión de media
- Editor de texto enriquecido Lexical para creación de contenido

### DevOps
- Dockerfile multi-stage que produce imágenes independientes para `www` y `store`
- Pipelines de GitHub Actions para build y push de imágenes a GHCR
- Pipeline de deploy en Vercel para el frontend
- Configuraciones Docker Compose para desarrollo local, staging y producción
- Configuración basada en variables de entorno con archivos `.env.template`

---

## Estructura del Proyecto

```
├── apps/
│   ├── www/                     # Storefront Next.js 15 + Payload CMS
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (app)/       # Rutas de la tienda (catálogo, checkout, dashboard)
│   │   │   │   ├── (payload)/   # Rutas del admin CMS
│   │   │   │   ├── actions/     # Server Actions (carrito, checkout, auth)
│   │   │   │   └── components/  # Componentes UI (header, carrito, formularios)
│   │   │   ├── services/        # Capa de servicios API (productos, carrito, pagos)
│   │   │   ├── lib/             # Utilidades y helpers
│   │   │   └── config/          # Configuración del entorno y la app
│   │   └── payload.config.ts
│   │
│   └── store/                   # Backend Medusa 2.7
│       └── src/
│           ├── api/             # Rutas API custom (pagos, membresías, webhooks)
│           ├── modules/         # Módulos custom (membership)
│           ├── workflows/       # Workflows de lógica de negocio
│           ├── subscribers/     # Event subscribers (orden creada, envío creado)
│           ├── admin/           # Widgets del panel de administración
│           └── scripts/         # Seeds de base de datos y scripts de mantenimiento
│
├── packages/
│   ├── utils/                   # Utilidades compartidas
│   ├── database/                # Drizzle ORM + migraciones
│   └── cli/                     # CLI interna
│
├── setup/docker/                # Configs Docker Compose de producción
├── .github/workflows/           # Pipelines CI/CD
├── Dockerfile                   # Build multi-stage (www + store)
└── docker-compose.yml           # Servicios de desarrollo local
```

---

## Cómo Levantar el Proyecto

### Requisitos Previos

- Node.js 20+
- pnpm 10+
- Docker y Docker Compose
- PostgreSQL 12+ (o usar el Docker Compose incluido)
- Redis 7+ (o usar el Docker Compose incluido)

### Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Levantar infraestructura (PostgreSQL, Redis)
docker compose up -d

# Configurar variables de entorno
cp apps/store/.env.template apps/store/.env
cp apps/www/.env.template apps/www/.env
# Editar ambos archivos .env con tus credenciales

# Ejecutar migraciones y seed de base de datos
pnpm --filter @floreria/store medusa db:migrate
pnpm --filter @floreria/store medusa exec src/scripts/seed.ts

# Iniciar todas las apps en modo desarrollo
pnpm dev
```

El storefront corre en `http://localhost:3000` y el backend Medusa en `http://localhost:9000`.

---

## Deploy

El proyecto soporta dos estrategias de deploy:

**Frontend (Vercel):** Automatizado vía GitHub Actions en cada push a `main`. El workflow compila la app Next.js y la despliega usando el CLI de Vercel.

**Backend (Docker):** GitHub Actions construye una imagen Docker y la sube a GitHub Container Registry. El entorno de producción descarga la última imagen y la ejecuta con Docker Compose junto a PostgreSQL y Redis.

```bash
# Construir imágenes de producción
docker build --target runner_store -t floreria-medusa .
docker build --target runner_www -t floreria-www .
```

---

## Variables de Entorno

Consultar `apps/store/.env.template` y `apps/www/.env.template` para la lista completa de variables de entorno requeridas, incluyendo:

- Cadenas de conexión a bases de datos (PostgreSQL, Turso)
- URL de Redis
- Credenciales de Mercado Pago (access token, webhook secret)
- Credenciales de Cloudflare R2 / S3
- Client ID y secret de Google OAuth
- Publishable API key y secrets de Medusa
- Secret de Payload CMS

---

## Licencia

Proyecto privado. Todos los derechos reservados.
