// apps/www/src/app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from "next/server";

// Función para normalizar la URL y asegurar que no tenga trailing slash
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Decodifica el payload del JWT sin verificar (solo para logging). Compatible Node y Edge. */
function decodeJwtPayload(token: string): { actor_id?: string; actor_type?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(b64, "base64").toString("utf8")
        : atob(b64);
    return JSON.parse(json) as { actor_id?: string; actor_type?: string };
  } catch {
    return null;
  }
}

/** Valida el token con Medusa (customers/me). Reintenta con delay por si Medusa vincula customer de forma asíncrona. */
async function validateToken(
  backendUrl: string,
  token: string,
  publishableKey: string,
  retries = 5,
  initialDelayMs = 2000,
  delaysMs = [2000, 3000, 4000, 5000]
): Promise<boolean> {
  const url = `${backendUrl}/store/customers/me`;
  const hasPk = !!publishableKey?.trim();
  console.log("[AUTH GOOGLE CALLBACK] validateToken: URL=", url, "| publishableKey presente:", hasPk, "| longitud PK:", publishableKey?.length ?? 0);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
  };

  if (initialDelayMs > 0) {
    console.log("[AUTH GOOGLE CALLBACK] Esperando", initialDelayMs, "ms antes del primer intento (por si Medusa vincula customer de forma asíncrona)");
    await new Promise((r) => setTimeout(r, initialDelayMs));
  }

  for (let i = 0; i < retries; i++) {
    console.log(`[AUTH GOOGLE CALLBACK] validateToken intento ${i + 1}/${retries} → GET ${url}`);
    const res = await fetch(url, { method: "GET", headers });
    const status = res.status;
    console.log(`[AUTH GOOGLE CALLBACK] validateToken intento ${i + 1} respuesta: status=${status} ok=${res.ok}`);

    if (res.ok) {
      console.log("[AUTH GOOGLE CALLBACK] validateToken ✅ token válido (200)");
      return true;
    }
    if (status !== 401) {
      const body = await res.text();
      console.warn("[AUTH GOOGLE CALLBACK] customers/me no 401:", status, "body:", body?.slice(0, 200));
      return false;
    }
    if (i < retries - 1) {
      const delay = delaysMs[i] ?? 1000;
      console.log(`[AUTH GOOGLE CALLBACK] Token 401, reintento en ${delay}ms (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  console.log("[AUTH GOOGLE CALLBACK] validateToken ❌ 401 en todos los intentos");
  return false;
}

export async function GET(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

  console.log("[AUTH GOOGLE CALLBACK] ENV: backend presente:", !!backend, "| siteUrl presente:", !!siteUrl, "| publishableKey presente:", !!pk?.trim(), "| PK length:", pk?.length ?? 0);
  if (backend) console.log("[AUTH GOOGLE CALLBACK] backend host:", new URL(backend).host);
  if (siteUrl) console.log("[AUTH GOOGLE CALLBACK] siteUrl host:", new URL(siteUrl).host);

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
  console.log("[AUTH GOOGLE CALLBACK] request url (path+search):", url.pathname + url.search);

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
    const tokenFromData = typeof data === "string" ? data : (data as any)?.token ?? (data as any)?.jwt;
    console.log("[AUTH GOOGLE CALLBACK] Google callback data desde Medusa (tiene token):", !!tokenFromData);

    const token = tokenFromData;

    if (!token) {
      console.error("[AUTH GOOGLE CALLBACK] Callback de Google sin token:", data);
      return NextResponse.redirect(
        `${normalizedSiteUrl}/login?error=google_no_token_from_callback`
      );
    }

    const payload = decodeJwtPayload(token);
    console.log("[AUTH GOOGLE CALLBACK] JWT payload (para diagnóstico): actor_id=", payload?.actor_id ?? "n/a", "| actor_type=", payload?.actor_type ?? "n/a");

    let tokenToUse = token;
    if (!payload?.actor_id || String(payload.actor_id).trim() === "") {
      console.log("[AUTH GOOGLE CALLBACK] actor_id vacío → llamando a /store/auth/google/link-customer para crear y vincular customer");
      try {
        const linkRes = await fetch(`${normalizedBackend}/store/auth/google/link-customer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
              ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
              : {}),
          },
        });
        if (linkRes.ok) {
          const linkData = await linkRes.json();
          const newToken = linkData?.token;
          if (newToken) {
            tokenToUse = newToken;
            console.log("[AUTH GOOGLE CALLBACK] link-customer OK, usando nuevo token con actor_id");
          } else {
            console.warn("[AUTH GOOGLE CALLBACK] link-customer no devolvió token");
          }
        } else {
          const errText = await linkRes.text();
          console.warn("[AUTH GOOGLE CALLBACK] link-customer falló:", linkRes.status, errText?.slice(0, 200));
        }
      } catch (linkErr: any) {
        console.warn("[AUTH GOOGLE CALLBACK] Error llamando a link-customer:", linkErr?.message);
      }
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

    // Validar con /store/customers/me (reintentos por si Medusa vincula customer después)
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";
    console.log("[AUTH GOOGLE CALLBACK] Validando token con Medusa (store/customers/me)...");
    const tokenValid = await validateToken(normalizedBackend, tokenToUse, publishableKey);
    if (!tokenValid) {
      console.warn("[AUTH GOOGLE CALLBACK] Decisión: NO guardar cookie. Redirigiendo a login?error=session_invalid (token 401 en todos los reintentos)");
      return NextResponse.redirect(
        `${normalizedSiteUrl}/login?error=session_invalid`
      );
    }

    console.log("[AUTH GOOGLE CALLBACK] Decisión: guardar cookie y redirigir a /es/ar/callback");
    res.cookies.set("_medusa_jwt", tokenToUse, {
      httpOnly: true,
      secure: isProduction, // Solo secure en producción
      sameSite: isProduction ? "lax" : "strict", // "lax" permite cookies en redirects cross-site
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      // No establecer domain explícitamente para que funcione en todos los entornos
    });

    console.log("[AUTH GOOGLE CALLBACK] Cookie establecida:", {
      tokenLength: tokenToUse.length,
      secure: isProduction,
      sameSite: isProduction ? "lax" : "strict",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[AUTH GOOGLE CALLBACK] Excepción en callback de Google:", err);
    console.error("[AUTH GOOGLE CALLBACK] Exception message:", err instanceof Error ? err.message : String(err));
    return NextResponse.redirect(
      `${normalizedSiteUrl || "http://localhost:3000"}/login?error=google_callback_exception`
    );
  }
}
