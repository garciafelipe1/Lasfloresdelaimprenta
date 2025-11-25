import { StoreRegion } from '@medusajs/types'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { cookies } from './lib/data/cookies'

const intlMiddleware = createIntlMiddleware(routing)

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = '/login'
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = '/dashboard'

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

  // 1) EXCLUSIÓN TOTAL DE ROUTES DE AUTH Y API
  if (
    pathname.startsWith('/api/') ||           // api interna
    pathname.startsWith('/store/auth') ||     // OAuth backend Medusa
    pathname.includes('/callback/google')     // callback OAuth
  ) {
    return NextResponse.next()
  }

  // 2) INTERNATIONALIZATION
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

  // 3) DASHBOARD GUARD
  const jwtToken = await cookies.getAuthToken()
  const isLogged = Boolean(jwtToken)

  const isAuthPage = pathname.includes('/login') || pathname.includes('/register')
  const isDashboard = pathname.includes('/dashboard')

  if (isLogged && isAuthPage) {
    const r = request.nextUrl.clone()
    r.pathname = REDIRECT_WHEN_AUTHENTICATED_ROUTE
    return NextResponse.redirect(r)
  }

  if (!isLogged && isDashboard) {
    const r = request.nextUrl.clone()
    r.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE
    return NextResponse.redirect(r)
  }

  return response
}

// ===============================================
// MATCHER FINAL (SEGURO Y COMPROBADO)
// ===============================================
export const config = {
  matcher: [
    '/((?!api|store/auth|_next|_vercel|.*\\..*).*)',
  ],
}
