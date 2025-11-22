// middleware.ts
import { StoreRegion } from '@medusajs/types';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { cookies } from './lib/data/cookies';

const intlMiddleware = createIntlMiddleware(routing);

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = '/login';
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = '/dashboard';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'ar';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;


console.log('[INIT] BACKEND_URL:', BACKEND_URL);
console.log('[INIT] DEFAULT_REGION:', DEFAULT_REGION);
console.log('[INIT] PUBLISHABLE_API_KEY:', PUBLISHABLE_API_KEY);

const regionMapCache = {
  regionMap: new Map<string, StoreRegion>(),
  regionMapUpdated: Date.now(),
};

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache;
  console.log('[getRegionMap] cacheId:', cacheId);
  console.log('[getRegionMap] cache updated:', regionMapUpdated);

  if (!BACKEND_URL) throw new Error('Missing MEDUSA_BACKEND_URL');

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    console.log('[getRegionMap] fetching regions from backend…');
    console.log('[getRegionMap] using PUBLISHABLE_API_KEY:', PUBLISHABLE_API_KEY);

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
      console.log('[getRegionMap] fetch status:', response.status);
      const json = await response.json();
      console.log('[getRegionMap] response json:', json);

      if (!response.ok) {
        throw new Error(json.message);
      }

      return json;
    });

    if (!regions?.length) throw new Error('No regions found');

    regions.forEach((region: StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMap.set(c.iso_2 ?? '', region);
      });
    });

    console.log('[getRegionMap] regions loaded, keys:', Array.from(regionMap.keys()));
    regionMapCache.regionMapUpdated = Date.now();
  }

  return regionMap;
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, StoreRegion>,
) {
  const vercelCountryCode = request.headers
    .get('x-vercel-ip-country')
    ?.toLowerCase();
  const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase();

  console.log('[getCountryCode] urlCountryCode:', urlCountryCode);
  console.log('[getCountryCode] vercelCountryCode:', vercelCountryCode);

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    console.log('[getCountryCode] using urlCountryCode');
    return urlCountryCode;
  }
  if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    console.log('[getCountryCode] using vercelCountryCode');
    return vercelCountryCode;
  }
  if (regionMap.has(DEFAULT_REGION)) {
    console.log('[getCountryCode] using DEFAULT_REGION');
    return DEFAULT_REGION;
  }
  console.log('[getCountryCode] fallback to first region key');
  return regionMap.keys().next().value;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('[middleware] pathname:', pathname);

  // ✅ Skip admin
  if (pathname.startsWith('/admin')) {
    console.log('[middleware] skipping admin path');
    return NextResponse.next();
  }

  const cacheIdCookie = request.cookies.get('_medusa_cache_id');
  const cacheId = cacheIdCookie?.value || crypto.randomUUID();
  console.log('[middleware] cacheIdCookie:', cacheIdCookie?.value);
  console.log('[middleware] cacheId:', cacheId);

  const regionMap = await getRegionMap(cacheId);
  const countryCode = await getCountryCode(request, regionMap);
  console.log('[middleware] resolved countryCode:', countryCode);

  const segments = request.nextUrl.pathname.split('/');
  const urlCountryCode = segments[2]?.toLowerCase();
  const urlHasCountryCode = countryCode && urlCountryCode === countryCode;
  console.log('[middleware] urlCountryCode:', urlCountryCode);
  console.log('[middleware] urlHasCountryCode:', urlHasCountryCode);

  // Skip static files
  if (request.nextUrl.pathname.includes('.')) {
    console.log('[middleware] static file, skip intlMiddleware');
    return intlMiddleware(request);
  }

  const redirectPath =
    request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname;
  const queryString = request.nextUrl.search ? request.nextUrl.search : '';
  console.log('[middleware] redirectPath:', redirectPath);
  console.log('[middleware] queryString:', queryString);
  if (!urlHasCountryCode && countryCode) {
    console.log('[middleware] missing countryCode in URL → redirect');
    return NextResponse.redirect(
      `${request.nextUrl.origin}/es/${countryCode}${redirectPath}${queryString}`,
      307,
    );
    
  }
  console.log('[middleware] countryCode in URL → continue');  

  const response = intlMiddleware(request);

  if (!cacheIdCookie) {
    console.log('[middleware] setting cacheId cookie');
    response.cookies.set('_medusa_cache_id', cacheId, {
      maxAge: 60 * 60 * 24,
    });
    console.log('[middleware] cacheId cookie set:', cacheId);
  }

  const path = request.nextUrl.pathname;
  const jwtToken = await cookies.getAuthToken();
  const isAuthenticated = Boolean(jwtToken);
  console.log('[middleware] jwtToken:', jwtToken);
  console.log('[middleware] isAuthenticated:', isAuthenticated);

  const isAuthPage = path.includes('/login') || path.includes('/register');
  const isProtectedDashboardRoute = path.includes('/dashboard');
  console.log('[middleware] isAuthPage:', isAuthPage);
  console.log('[middleware] isProtectedDashboardRoute:', isProtectedDashboardRoute);

  if (isAuthenticated && isAuthPage) {
    console.log('[middleware] authenticated user on login/register → redirect to dashboard');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = REDIRECT_WHEN_AUTHENTICATED_ROUTE;
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtectedDashboardRoute && !isAuthenticated) {
    console.log('[middleware] unauthenticated user on dashboard → redirect to login');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE;
    return NextResponse.redirect(redirectUrl);
  }

  console.log('[middleware] default → intlMiddleware response');
  return response;
}
  

export const config = {
  matcher: [
    '/',
    '/(es|en)/:countryCode/:path*',
    '/((?!_next|_vercel|api|_next/static|_next/image|.*\\..*|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
