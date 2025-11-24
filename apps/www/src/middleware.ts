// middleware.ts

import { StoreRegion } from '@medusajs/types'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { cookies } from './lib/data/cookies'

const intlMiddleware = createIntlMiddleware(routing)

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = '/login'
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = '/dashboard'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'ar'
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

//
// =======================================================
//  REGION CACHE HANDLER (tu código original intacto)
// =======================================================
//

const regionMapCache = {
  regionMap: new Map<string, StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) throw new Error('Missing MEDUSA_BACKEND_URL')

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: 'force-cache',
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) throw new Error('No regions found')

    regions.forEach((region: StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMap.set(c.iso_2 ?? '', region)
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
  const vercelCountryCode = request.headers
    .get('x-vercel-ip-country')
    ?.toLowerCase()
  const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    return urlCountryCode
  }
  if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    return vercelCountryCode
  }
  if (regionMap.has(DEFAULT_REGION)) {
    return DEFAULT_REGION
  }

  return regionMap.keys().next().value
}

//
// =======================================================
//  MIDDLEWARE PRINCIPAL (Versión final, completa y estable)
// =======================================================
//

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ============================================
  // 🔐 EXCLUSIONES CRÍTICAS (Google OAuth + Medusa)
  // ============================================
  if (
    pathname.startsWith('/api/auth') ||          // frontend OAuth
    pathname.includes('/callback/google') ||     // ruta token OAuth
    pathname.startsWith('/store/auth') ||        // backend Medusa OAuth
    pathname.startsWith('/admin')                // admin
  ) {
    return NextResponse.next()
  }

  //
  // ============================================
  // 🌍 INTERNACIONALIZACIÓN Y REGIONES
  // ============================================
  //
  const cacheIdCookie = request.cookies.get('_medusa_cache_id')
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)
  const countryCode = await getCountryCode(request, regionMap)

  const segments = pathname.split('/')
  const urlCountryCode = segments[2]?.toLowerCase()
  const urlHasCountryCode = urlCountryCode === countryCode

  if (!urlHasCountryCode && countryCode) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/es/${countryCode}${pathname}${request.nextUrl.search}`,
      307
    )
  }

  const response = intlMiddleware(request)

  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  //
  // ============================================
  // 🔐 PROTECCIÓN DE DASHBOARD
  // ============================================
  //
  const jwtToken = await cookies.getAuthToken()
  const isAuthenticated = Boolean(jwtToken)

  const isAuthPage =
    pathname.includes('/login') || pathname.includes('/register')
  const isProtectedDashboardRoute = pathname.includes('/dashboard')

  if (isAuthenticated && isAuthPage) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = REDIRECT_WHEN_AUTHENTICATED_ROUTE
    return NextResponse.redirect(redirect)
  }

  if (!isAuthenticated && isProtectedDashboardRoute) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE
    return NextResponse.redirect(redirect)
  }

  return response
}

//
// =======================================================
//  MATCHER FINAL (Solo 1 línea. Seguro y eficiente.)
// =======================================================
//

export const config = {
  matcher: [
    '/((?!api/auth|store/auth|_next|_vercel|.*\\..*).*)',
  ],
}
