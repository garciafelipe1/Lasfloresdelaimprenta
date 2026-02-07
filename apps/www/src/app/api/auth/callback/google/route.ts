// apps/www/src/app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from "next/server";

// Función para normalizar la URL y asegurar que no tenga trailing slash
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!backend) {
    console.error("[AUTH GOOGLE CALLBACK] NEXT_PUBLIC_MEDUSA_BACKEND_URL no está configurada");
    return NextResponse.redirect(
      `${siteUrl || "http://localhost:3000"}/login?error=backend_not_configured`
    );
  }

  if (!siteUrl) {
    console.error("[AUTH GOOGLE CALLBACK] NEXT_PUBLIC_SITE_URL no está configurada");
    return NextResponse.redirect(
      "http://localhost:3000/login?error=site_url_not_configured"
    );
  }

  // Normalizar URLs
  const normalizedBackend = normalizeUrl(backend);
  const normalizedSiteUrl = normalizeUrl(siteUrl);

  const url = new URL(req.url);
  const search = url.search; // ?code=...&state=...

  try {
    // 1) Reenviamos el callback a Medusa para que valide el código de Google
    const callbackUrl = `${normalizedBackend}/auth/customer/google/callback${search}`;
    console.log("[AUTH GOOGLE CALLBACK] Llamando a:", callbackUrl);

    const resp = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(
        "[AUTH GOOGLE CALLBACK] Error en /auth/customer/google/callback:",
        resp.status,
        text
      );

      // Verificar si el error es relacionado con redirect_uri_mismatch
      const errorText = text.toLowerCase();
      if (errorText.includes("redirect_uri_mismatch") || errorText.includes("redirect_uri")) {
        return NextResponse.redirect(
          `${normalizedSiteUrl}/login?error=redirect_uri_mismatch&message=La URI de redirección no está registrada en Google Cloud Console`
        );
      }

      return NextResponse.redirect(
        `${normalizedSiteUrl}/login?error=google_callback_failed`
      );
    }

    // 2) Medusa debería devolver un token (jwt)
    const data = await resp.json();
    console.log("[AUTH GOOGLE CALLBACK] Google callback data desde Medusa:", data);

    const token =
      typeof data === "string"
        ? data
        : (data as any).token ?? (data as any).jwt;

    if (!token) {
      console.error("[AUTH GOOGLE CALLBACK] Callback de Google sin token:", data);
      return NextResponse.redirect(
        `${normalizedSiteUrl}/login?error=google_no_token_from_callback`
      );
    }

    // 3) Creamos la respuesta de redirección a una página intermedia
    // Esto asegura que la cookie esté disponible antes de renderizar el dashboard
    const res = NextResponse.redirect(`${normalizedSiteUrl}/es/ar/callback`);

    // 4) Y ACÁ seteamos la cookie directo sobre la respuesta
    // En producción, sameSite debe ser "lax" para que funcione con redirects desde Google
    const isProduction = process.env.NODE_ENV === "production";

    // Validar que el token sea válido antes de establecerlo
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error("[AUTH GOOGLE CALLBACK] Token inválido recibido:", token);
      return NextResponse.redirect(
        `${normalizedSiteUrl}/login?error=google_invalid_token`
      );
    }

    res.cookies.set("_medusa_jwt", token, {
      httpOnly: true,
      secure: isProduction, // Solo secure en producción
      sameSite: isProduction ? "lax" : "strict", // "lax" permite cookies en redirects cross-site
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      // No establecer domain explícitamente para que funcione en todos los entornos
    });

    console.log("[AUTH GOOGLE CALLBACK] Cookie establecida:", {
      tokenLength: token.length,
      secure: isProduction,
      sameSite: isProduction ? "lax" : "strict",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[AUTH GOOGLE CALLBACK] Excepción en callback de Google:", err);
    return NextResponse.redirect(
      `${normalizedSiteUrl || "http://localhost:3000"}/login?error=google_callback_exception`
    );
  }
}
