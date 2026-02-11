// Borra la cookie de sesión inválida y redirige al login.
// Se usa cuando Medusa devuelve 401 (p. ej. token con actor_id vacío tras OAuth).
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_REDIRECT = '/es/ar/login?error=session_invalid';

export async function GET(req: NextRequest) {
  const redirectTo =
    req.nextUrl.searchParams.get('redirect') || DEFAULT_REDIRECT;
  const res = NextResponse.redirect(new URL(redirectTo, req.url));

  res.cookies.set('_medusa_jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}
