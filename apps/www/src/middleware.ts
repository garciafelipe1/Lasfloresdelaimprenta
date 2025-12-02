// apps/www/src/middleware.ts
import { StoreRegion } from '@medusajs/types'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL

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

  if (!BACKEND_URL) throw new Error("Missing MEDUSA_BACKEND_URL")

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY! },
      next: { revalidate: 3600 }
    }).then(async (r) => r.json())

    regions?.forEach((region: StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMap.set(c.iso_2!, region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, StoreRegion>
) {
  const vercelCountry = request.headers.get("x-vercel-ip-country")?.toLowerCase()
  const urlCountry = request.nextUrl.pathname.split('/')[1]?.toLowerCase()

  if (urlCountry && regionMap.has(urlCountry)) return urlCountry
  if (vercelCountry && regionMap.has(vercelCountry)) return vercelCountry
  if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION

  return [...regionMap.keys()][0]
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

  const segments = pathname.split('/')
  const urlCountry = segments[2]?.toLowerCase()
  const hasCountry = urlCountry === countryCode

  if (!hasCountry) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/es/${countryCode}${pathname}${request.nextUrl.search}`,
      307,
    )
  }

  const response = intlMiddleware(request)

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
