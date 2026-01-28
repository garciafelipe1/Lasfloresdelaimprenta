// apps/www/src/middleware.ts
import { StoreRegion } from '@medusajs/types'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
// Función inline para evitar problemas con Edge Runtime
// El middleware se ejecuta en Edge Runtime que tiene limitaciones de importación
function getCurrencyFromLocale(locale: string): string {
  return locale === 'en' ? 'usd' : 'ars';
}

// Función inline para redirección de categorías (Edge Runtime compatible)
function getCategoryRedirect(pathname: string, searchParams: URLSearchParams): string | null {
  const category = searchParams.get('category');
  
  if (category === 'Follaje' || category === 'Bodas') {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', 'San Valentín');
    return `${pathname}?${newSearchParams.toString()}`;
  }
  
  return null;
}

const intlMiddleware = createIntlMiddleware(routing)

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:9000'

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'ar'
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// ===============================================
// REGION CACHE
// ===============================================
const regionMapCache = {
  regionMap: new Map<string, StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    // Evitar overlay/ruido: el middleware corre en edge y esto se spamea.
    console.warn("[Middleware] Missing BACKEND_URL; skipping regions fetch")
    // Retornar mapa vacío si no hay backend configurado
    return regionMap
  }

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    try {
      // Usar AbortController para timeout en Edge Runtime
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY || "" },
        cache: 'no-store', // Edge Runtime no soporta next.revalidate
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`[Middleware] Error fetching regions: ${response.status} ${response.statusText}`)
        return regionMap
      }

      const { regions } = await response.json()

      if (regions && Array.isArray(regions)) {
        regions.forEach((region: StoreRegion) => {
          region.countries?.forEach((c) => {
            if (c?.iso_2) {
              regionMap.set(c.iso_2, region)
            }
          })
        })

        regionMapCache.regionMapUpdated = Date.now()
      }
    } catch (error) {
      // Ignorar errores de abort (timeout) y otros errores de red
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn("[Middleware] Error fetching regions:", error.message)
      }
      // Retornar el mapa existente si hay error, para no bloquear la aplicación
      return regionMap
    }
  }

  return regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, StoreRegion>
) {
  const vercelCountry = request.headers.get("x-vercel-ip-country")?.toLowerCase()
  const segments = request.nextUrl.pathname.split('/').filter(Boolean)
  
  // Si el regionMap está vacío (backend no disponible), usar DEFAULT_REGION
  if (!regionMap || regionMap.size === 0) {
    return DEFAULT_REGION
  }
  
  // El countryCode está en el segundo segmento: /[locale]/[countryCode]/...
  // Los locales válidos son 'es' y 'en', así que si el segundo segmento existe y no es un locale, es el countryCode
  const urlCountry = segments.length >= 2 && !routing.locales.includes(segments[1] as any) 
    ? segments[1]?.toLowerCase() 
    : segments.find(seg => regionMap.has(seg.toLowerCase()))?.toLowerCase()

  if (urlCountry && regionMap.has(urlCountry)) return urlCountry
  if (vercelCountry && regionMap.has(vercelCountry)) return vercelCountry
  if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION

  // Si hay algún país en el mapa, usar el primero, sino usar DEFAULT_REGION
  const firstCountry = [...regionMap.keys()][0]
  return firstCountry || DEFAULT_REGION
}

// ===============================================
// MIDDLEWARE
// ===============================================
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1) Excluir API y auth backend
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/store/auth') ||
    pathname.includes('/callback/google')
  ) {
    return NextResponse.next()
  }

  // 2) INTERNATIONALIZATION + REGION
  const cacheIdCookie = request.cookies.get('_medusa_cache_id')
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)
  const countryCode = await getCountryCode(request, regionMap)

  const segments = pathname.split('/').filter(Boolean)
  
  // Detectar locale y countryCode de la URL
  // La estructura esperada es: /[locale]/[countryCode]/...
  const urlLocale = segments[0] && routing.locales.includes(segments[0] as any) 
    ? segments[0] 
    : null
  // Verificar si el segundo segmento es un countryCode válido
  // Si el regionMap está vacío, aceptar cualquier valor como válido para evitar bloqueos
  const urlCountry = segments[1] && (regionMap.size === 0 || regionMap.has(segments[1].toLowerCase()))
    ? segments[1].toLowerCase()
    : null

  // Si falta locale o countryCode, redirigir a la ruta correcta
  if (!urlLocale || !urlCountry || urlCountry !== countryCode) {
    const locale = urlLocale || 'es'
    
    // Si tiene locale pero no countryCode, insertar el countryCode
    if (urlLocale && !urlCountry) {
      // Caso: /en -> /en/ar
      // Caso: /en/catalog -> /en/ar/catalog
      const restOfPath = segments.length > 1 
        ? '/' + segments.slice(1).join('/') 
        : ''
      const newPath = `/${locale}/${countryCode}${restOfPath}`
      
      return NextResponse.redirect(
        `${request.nextUrl.origin}${newPath}${request.nextUrl.search}`,
        307,
      )
    }
    
    // Si no tiene locale, redirigir a /es/[countryCode]
    if (!urlLocale) {
      const newPath = `/${locale}/${countryCode}${pathname === '/' ? '' : pathname}`
      
      return NextResponse.redirect(
        `${request.nextUrl.origin}${newPath}${request.nextUrl.search}`,
        307,
      )
    }
    
    // Si tiene locale y countryCode pero es diferente, redirigir al correcto
    if (urlLocale && urlCountry && urlCountry !== countryCode) {
      const restOfPath = segments.length > 2 
        ? '/' + segments.slice(2).join('/') 
        : ''
      const newPath = `/${locale}/${countryCode}${restOfPath}`
      
      return NextResponse.redirect(
        `${request.nextUrl.origin}${newPath}${request.nextUrl.search}`,
        307,
      )
    }
  }

  // Redirección de categorías antiguas (SEO-friendly 301)
  const categoryRedirect = getCategoryRedirect(pathname, request.nextUrl.searchParams);
  if (categoryRedirect) {
    const redirectUrl = new URL(categoryRedirect, request.url);
    return NextResponse.redirect(redirectUrl, 301); // 301 = permanente para SEO
  }

  // Determinar locale y moneda esperada
  const locale = urlLocale || 'es';
  const expectedCurrency = getCurrencyFromLocale(locale);

  const response = intlMiddleware(request)

  // Agregar header de moneda esperada para que el backend pueda usarlo
  response.headers.set('x-expected-currency', expectedCurrency);

  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, { maxAge: 86400 })
  }

  // 👇 YA NO HAY LÓGICA DE AUTH ACÁ
  return response
}

export const config = {
  matcher: [
    '/((?!api|store/auth|_next|_vercel|.*\\..*).*)',
  ],
}
