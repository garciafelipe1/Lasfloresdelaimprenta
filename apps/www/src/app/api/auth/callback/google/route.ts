// apps/www/src/app/api/auth/callback/google/route.ts
import { cookies as authCookies } from "@/lib/data/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const url = new URL(req.url);
  const search = url.search; // ?code=...&state=...

  try {
    // 1) Reenviamos el callback a Medusa para que lo valide
    const resp = await fetch(
      `${backend}/auth/customer/google/callback${search}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error(
        "Error en /auth/customer/google/callback:",
        resp.status,
        text
      );
      return NextResponse.redirect(
        `${siteUrl}/login?error=google_callback_failed`
      );
    }

    // 2) Medusa debería devolver un token
    const data = await resp.json();
    const token =
      typeof data === "string"
        ? data
        : (data as any).token ?? (data as any).jwt;

    if (!token) {
      console.error("Callback de Google sin token:", data);
      return NextResponse.redirect(
        `${siteUrl}/login?error=google_no_token_from_callback`
      );
    }

    // 3) Guardamos el token usando tu helper actual
    await authCookies.setAuthToken(token);

    // 4) Redirigimos al dashboard
    return NextResponse.redirect(`${siteUrl}/es/ar/dashboard`);
  } catch (err) {
    console.error("Excepción en callback de Google:", err);
    return NextResponse.redirect(
      `${siteUrl}/login?error=google_callback_exception`
    );
  }
}
