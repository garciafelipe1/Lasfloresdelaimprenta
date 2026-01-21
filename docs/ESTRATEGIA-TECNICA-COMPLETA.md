# Estrategia Técnica Completa: E-commerce Multimoneda y Multilenguaje

## 📋 Resumen Ejecutivo

Esta estrategia cubre tres objetivos principales:
1. **Migración de categorías**: "Follaje" → "Bodas" (SEO-friendly)
2. **Servicios individuales**: Páginas optimizadas para conversión y SEO
3. **Sistema multilenguaje + multimoneda**: Automático y escalable

---

## 🎯 OBJETIVO 1: Migración "Follaje" → "Bodas"

### Estrategia de Migración SEO-Friendly

#### Fase 1: Preparación (Sin cambios visibles)

**1.1. Crear mapeo de categorías en backend**

```typescript
// apps/store/src/shared/category-mapping.ts
export const CATEGORY_ALIASES = {
  // Mapeo bidireccional para compatibilidad
  "Bodas": ["Bodas", "Follaje"],
  "Follaje": ["Bodas", "Follaje"], // Mantener compatibilidad temporal
} as const;

export const CATEGORY_REDIRECTS = {
  // URLs antiguas → nuevas (para SEO)
  "/catalog?category=Follaje": "/catalog?category=Bodas",
  "/es/ar/catalog?category=Follaje": "/es/ar/catalog?category=Bodas",
  "/en/ar/catalog?category=Follaje": "/en/ar/catalog?category=Bodas",
} as const;
```

**1.2. Actualizar constantes (mantener compatibilidad)**

```typescript
// apps/store/src/shared/constants.ts
export const CATEGORIES = {
  ramosPrimaverales: "Ramos primaverales",
  rosas: "Rosas",
  box: "Box",
  bodas: "Bodas", // ✅ Nueva categoría principal
  // follaje: "Follaje", // ❌ Comentado pero no eliminado aún
  funebre: "Funebre",
  complementos: "Complementos",
  diseniosExclusivos: "Diseños exclusivos",
} as const;

// Mantener referencia temporal para migración
export const LEGACY_CATEGORIES = {
  follaje: "Follaje", // Para productos existentes
} as const;
```

#### Fase 2: Implementación de Alias en Backend

**2.1. Actualizar API de productos custom**

```typescript
// apps/store/src/api/store/custom/route.ts
import { CATEGORY_ALIASES } from "@/shared/category-mapping";

// En la función GET, modificar el filtro de categorías:
if (params.category) {
  // Expandir categoría con aliases
  const categoryName = Array.isArray(params.category) 
    ? params.category[0] 
    : params.category;
  
  const expandedCategories = CATEGORY_ALIASES[categoryName as keyof typeof CATEGORY_ALIASES]
    ? CATEGORY_ALIASES[categoryName as keyof typeof CATEGORY_ALIASES]
    : [categoryName];

  result = result.filter((p) =>
    p.categories?.some((c) => expandedCategories.includes(c?.name!))
  );
}
```

**2.2. Actualizar servicio de productos recomendados**

```typescript
// apps/www/src/services/product.service.ts
import { CATEGORY_ALIASES } from '@server/category-mapping';

async getRecommended(handle: string) {
  // ... código existente ...
  
  const categoryName = product.categories?.[0]?.name;
  if (!categoryName) return [];

  // Expandir con aliases
  const expandedCategories = CATEGORY_ALIASES[categoryName as keyof typeof CATEGORY_ALIASES]
    ? CATEGORY_ALIASES[categoryName as keyof typeof CATEGORY_ALIASES]
    : [categoryName];

  const { products } = await medusa.store.product.list({
    region_id: region.id,
    category_id: expandedCategories.map(cat => 
      categories.find(c => c.name === cat)?.id
    ).filter(Boolean),
    limit: PRODUCTS_RECOMMENDED + 1,
  });
  
  // ... resto del código ...
}
```

#### Fase 3: Actualización de Frontend

**3.1. Actualizar traducciones**

```json
// apps/www/messages/es/categories-products.json
{
  "bodas": "Bodas",
  "follaje": "Bodas" // ✅ Mapeo para compatibilidad
}

// apps/www/messages/en/categories-products.json
{
  "bodas": "Weddings",
  "follaje": "Weddings" // ✅ Mapeo para compatibilidad
}
```

**3.2. Actualizar componentes de categorías**

```typescript
// apps/www/src/app/components/landing/categories.tsx
const categories = [
  // ... otras categorías ...
  {
    value: 'Bodas', // ✅ Cambiado de 'Follaje'
    href: '/catalog?category=Bodas',
    imageUrl: '/assets/img/follaje.jpg', // Mantener imagen existente
  },
];
```

**3.3. Crear middleware de redirección SEO**

```typescript
// apps/www/src/middleware.ts
import { CATEGORY_REDIRECTS } from '@/lib/category-redirects';

export async function middleware(request: NextRequest) {
  // ... código existente de i18n ...
  
  // Redirección de categorías antiguas
  const url = request.nextUrl.clone();
  const categoryParam = url.searchParams.get('category');
  
  if (categoryParam === 'Follaje') {
    url.searchParams.set('category', 'Bodas');
    return NextResponse.redirect(url, 301); // Redirect permanente para SEO
  }
  
  // ... resto del middleware ...
}
```

#### Fase 4: Migración de Base de Datos (Opcional, futuro)

```sql
-- Script de migración (ejecutar cuando estés listo)
-- Actualizar productos existentes
UPDATE product_category 
SET name = 'Bodas' 
WHERE name = 'Follaje';

-- Actualizar relaciones
UPDATE product_category_product 
SET category_id = (SELECT id FROM product_category WHERE name = 'Bodas')
WHERE category_id = (SELECT id FROM product_category WHERE name = 'Follaje');
```

### Checklist de Migración

- [ ] Crear `category-mapping.ts` con aliases
- [ ] Actualizar API custom con lógica de aliases
- [ ] Actualizar servicio de productos recomendados
- [ ] Actualizar traducciones (es/en)
- [ ] Actualizar componentes de categorías
- [ ] Implementar redirecciones 301 en middleware
- [ ] Probar filtros y búsquedas
- [ ] Verificar que productos "Follaje" aparecen en "Bodas"
- [ ] Monitorear logs por 1 semana
- [ ] (Futuro) Ejecutar migración de BD cuando estés seguro

---

## 🎯 OBJETIVO 2: Servicios en Páginas Individuales

### Arquitectura Propuesta

```
/services
  ├── [locale]/[countryCode]/(public)/services/
  │   ├── page.tsx                    # Listado de servicios (opcional)
  │   ├── eventos-florales/
  │   │   └── page.tsx                # Página individual
  │   ├── bodas/
  │   │   └── page.tsx                # Página individual
  │   └── _components/
  │       ├── service-detail-page.tsx # Componente reutilizable
  │       └── service-hero.tsx        # Hero section optimizado
```

### Estructura de Página Individual

**Características SEO:**
- Slug descriptivo: `/servicios/eventos-florales`
- Meta tags dinámicos por idioma
- Schema.org markup (Service)
- Breadcrumbs
- Open Graph tags

**Características UX/Conversión:**
- Hero section con CTA prominente
- Galería de imágenes
- Testimonios (opcional)
- Formulario de contacto integrado
- CTA flotante en mobile

### Implementación

**1. Crear componente reutilizable**

```typescript
// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/services/_components/service-detail-page.tsx
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ServiceHero } from './service-hero';
import { ServiceGallery } from './service-gallery';
import { ServiceCTA } from './service-cta';
import { ServiceTestimonials } from './service-testimonials';

interface ServiceDetailPageProps {
  slug: string;
  locale: string;
}

export async function generateMetadata(
  { slug, locale }: ServiceDetailPageProps
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'services' });
  const service = getServiceBySlug(slug, locale);
  
  return {
    title: `${service.title} | La Florería de la Imprenta`,
    description: service.metaDescription,
    openGraph: {
      title: service.title,
      description: service.metaDescription,
      images: [service.heroImage],
    },
    alternates: {
      canonical: `/${locale}/ar/services/${slug}`,
      languages: {
        'es-AR': `/es/ar/services/${slug}`,
        'en-US': `/en/ar/services/${slug}`,
      },
    },
  };
}

export default async function ServiceDetailPage({
  slug,
  locale,
}: ServiceDetailPageProps) {
  const service = getServiceBySlug(slug, locale);
  
  return (
    <>
      <ServiceHero 
        title={service.title}
        subtitle={service.subtitle}
        image={service.heroImage}
        ctaText={service.ctaText}
      />
      <ServiceGallery images={service.gallery} />
      <ServiceContent description={service.description} />
      <ServiceTestimonials testimonials={service.testimonials} />
      <ServiceCTA 
        serviceSlug={slug}
        locale={locale}
      />
    </>
  );
}
```

**2. Crear páginas individuales**

```typescript
// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/services/eventos-florales/page.tsx
import { ServiceDetailPage } from '../_components/service-detail-page';

export default async function EventosFloralesPage({
  params,
}: {
  params: Promise<{ locale: string; countryCode: string }>;
}) {
  const { locale } = await params;
  
  return (
    <ServiceDetailPage 
      slug="eventos-florales"
      locale={locale}
    />
  );
}
```

**3. Actualizar navegación**

```typescript
// apps/www/src/app/components/common/header/constants/links.ts
export const getNavLinks = (i18n: TFunction) => [
  // ... otros links ...
  {
    label: i18n('navigation.servicios.title'),
    href: './services',
    type: 'dropdown',
    submenu: [
      {
        title: i18n('navigation.services.floralEvents.title'),
        href: '/services/eventos-florales', // ✅ URL individual
        description: i18n('navigation.services.floralEvents.description'),
      },
      {
        title: i18n('navigation.services.weddings.title'),
        href: '/services/bodas', // ✅ URL individual
        description: i18n('navigation.services.weddings.description'),
      },
    ],
  },
];
```

**4. Agregar Schema.org**

```typescript
// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/services/_components/service-schema.tsx
export function ServiceSchema({ service }: { service: ServiceData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.metaDescription,
    provider: {
      '@type': 'LocalBusiness',
      name: 'La Florería de la Imprenta',
      // ... más datos del negocio
    },
    areaServed: 'Argentina',
    serviceType: service.category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## 🎯 OBJETIVO 3: Sistema Multilenguaje + Multimoneda Automático

### Arquitectura de Moneda

**Regla de negocio:**
- `locale === 'es'` → `currency = 'ARS'`
- `locale === 'en'` → `currency = 'USD'`

**Precio base:** ARS (almacenado en centavos en Medusa)

### Implementación Completa

#### 1. Utilidades de Moneda

```typescript
// apps/www/src/lib/currency.ts
export type CurrencyCode = 'ars' | 'usd';

export function getCurrencyFromLocale(locale: string): CurrencyCode {
  return locale === 'en' ? 'usd' : 'ars';
}

export function getLocaleFromCurrency(currency: CurrencyCode): string {
  return currency === 'usd' ? 'en' : 'es';
}
```

#### 2. Formateador de Precios por Locale

```typescript
// apps/www/src/lib/money-formatter.ts
import { formatARS, formatUSD } from 'utils';
import { getCurrencyFromLocale } from './currency';

export function formatMoneyByLocale(
  amount: number | string,
  locale: string
): string {
  const currency = getCurrencyFromLocale(locale);
  
  if (currency === 'usd') {
    return formatUSD(amount);
  }
  
  return formatARS(amount);
}

// Para emails y notificaciones
export function formatMoneyForEmail(
  amount: number | string,
  locale: string
): string {
  // Mismo formateo pero con formato más legible para emails
  return formatMoneyByLocale(amount, locale);
}
```

#### 3. Componente de Precio Universal

```typescript
// apps/www/src/app/components/price-display.tsx
'use client';

import { formatMoneyByLocale } from '@/lib/money-formatter';
import { useLocale } from 'next-intl';

interface PriceDisplayProps {
  amount: number | string;
  className?: string;
  showCurrency?: boolean;
}

export function PriceDisplay({ 
  amount, 
  className,
  showCurrency = true 
}: PriceDisplayProps) {
  const locale = useLocale();
  const formattedPrice = formatMoneyByLocale(amount, locale);

  return (
    <span className={className}>
      {formattedPrice}
    </span>
  );
}
```

#### 4. Sincronización de Moneda en Carrito

```typescript
// apps/www/src/services/cart.service.ts
import { getCurrencyFromLocale } from '@/lib/currency';

export const cartService = {
  async getOrSetCart(countryCode: string, locale?: string) {
    const region = await getRegion(countryCode);
    const expectedCurrency = getCurrencyFromLocale(locale || 'es');

    let cart = await this.getCart();

    // Si no hay carrito, crear con moneda correcta
    if (!cart) {
      const cartResp = await medusa.store.cart.create({
        region_id: region.id,
        currency_code: expectedCurrency, // ✅ Moneda según locale
      });
      cart = cartResp.cart;
      await cookies.setCartId(cart.id);
    }

    // Si el locale cambió, los precios se mostrarán correctamente
    // aunque el carrito tenga otra moneda (limitación de Medusa)
    return cart;
  },
};
```

#### 5. Middleware de Sincronización

```typescript
// apps/www/src/middleware.ts
import { getCurrencyFromLocale } from '@/lib/currency';

export async function middleware(request: NextRequest) {
  // ... código existente de i18n ...
  
  const locale = segments[1] || 'es';
  const currency = getCurrencyFromLocale(locale);
  
  // Agregar header para que el backend sepa la moneda esperada
  const response = intlMiddleware(request);
  response.headers.set('x-expected-currency', currency);
  
  return response;
}
```

#### 6. Actualización de Todos los Componentes

**Listado de productos:**
```typescript
// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/catalog/_components/products/product-card.tsx
'use client';

import { PriceDisplay } from '@/app/components/price-display';

export const ProductCard = ({ product }: Props) => {
  const lowestPrice = product.variants.reduce(
    (min, variant) => Math.min(min, variant.calculated_price?.calculated_amount ?? Infinity),
    Infinity,
  );

  return (
    <div>
      {/* ... */}
      <PriceDisplay amount={lowestPrice} />
    </div>
  );
};
```

**Página de producto:**
```typescript
// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/products/[handle]/_components/interactive-section.tsx
import { PriceDisplay } from '@/app/components/price-display';

export function InteractiveSection({ product }: Props) {
  return (
    <div>
      <PriceDisplay 
        amount={selectedVariant?.calculated_price?.calculated_amount ?? 0} 
      />
    </div>
  );
}
```

**Carrito:**
```typescript
// Ya implementado con PriceDisplay
```

**Checkout:**
```typescript
// Ya implementado con formatMoneyByLocale
```

#### 7. Emails y Notificaciones

```typescript
// apps/store/src/workflows/send-order-confirmation.ts
import { formatMoneyForEmail } from '@/lib/money-formatter';

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    // ... obtener order ...
    
    // Determinar locale del cliente (puedes guardarlo en metadata)
    const customerLocale = order.metadata?.locale || 'es';
    const currency = getCurrencyFromLocale(customerLocale);
    
    // Formatear precios para email
    const formattedTotal = formatMoneyForEmail(order.total, customerLocale);
    
    // Enviar email con precios formateados
    // ...
  }
);
```

### Edge Cases y Consideraciones

#### 1. Cache de Precios

```typescript
// Invalida cache cuando cambia el locale
export function getPriceCacheKey(productId: string, locale: string) {
  return `price:${productId}:${locale}`;
}
```

#### 2. Cookies de Moneda

```typescript
// No necesitas cookie de moneda, se deriva del locale
// Pero puedes guardar preferencia del usuario si quieres
```

#### 3. Cambio de Idioma en Medio del Checkout

```typescript
// Si el usuario cambia de idioma durante checkout:
// 1. Los precios se muestran en nueva moneda
// 2. El carrito mantiene su moneda original (limitación Medusa)
// 3. Mostrar advertencia si es necesario
```

#### 4. Redondeo y Precisión

```typescript
// Medusa guarda precios en centavos
// Al convertir ARS → USD, usar tipo de cambio fijo
// Ejemplo: 1 USD = 1000 ARS (ajustar según necesidad)

const EXCHANGE_RATE = 1000; // ARS por USD

export function convertARSToUSD(amountARS: number): number {
  return Math.round((amountARS / 100) / EXCHANGE_RATE * 100) / 100;
}
```

---

## 📊 Plan de Implementación

### Fase 1: Migración de Categorías (Semana 1)
- [ ] Implementar sistema de aliases
- [ ] Actualizar API y servicios
- [ ] Actualizar frontend
- [ ] Implementar redirecciones
- [ ] Testing completo

### Fase 2: Servicios Individuales (Semana 2)
- [ ] Crear estructura de páginas
- [ ] Implementar componentes reutilizables
- [ ] Agregar SEO (meta, schema)
- [ ] Optimizar para conversión
- [ ] Testing y ajustes

### Fase 3: Sistema Multimoneda (Semana 3)
- [ ] Implementar utilidades de moneda
- [ ] Actualizar todos los componentes
- [ ] Sincronizar carrito
- [ ] Actualizar emails
- [ ] Testing cross-locale

### Fase 4: Optimización y Testing (Semana 4)
- [ ] Testing end-to-end
- [ ] Optimización de performance
- [ ] Ajustes de UX
- [ ] Documentación
- [ ] Deploy gradual

---

## 🔍 Consideraciones Finales

### SEO
- Redirecciones 301 para URLs antiguas
- Canonical tags en todas las páginas
- Schema.org markup
- Sitemap actualizado

### Performance
- Cache de precios por locale
- Lazy loading de imágenes
- Code splitting por ruta

### Escalabilidad
- Fácil agregar nuevos idiomas/monedas
- Sistema de aliases extensible
- Arquitectura modular

### Monitoreo
- Logs de conversiones de moneda
- Tracking de redirecciones
- Métricas de uso por locale

---

¿Quieres que implemente alguna parte específica primero?
