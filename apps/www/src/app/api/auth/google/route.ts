// apps/www/src/app/api/auth/google/route.ts
import { NextResponse } from "next/server";

// Función para normalizar la URL y asegurar que no tenga trailing slash
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

// Función para construir la callback URL de forma consistente
function getCallbackUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL no está configurada");
  }

  // Normalizar la URL base (sin trailing slash)
  const normalizedSiteUrl = normalizeUrl(siteUrl);
  
  // Construir la callback URL
  const callbackUrl = `${normalizedSiteUrl}/api/auth/callback/google`;
  
  return callbackUrl;
}

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!backend) {
    console.error("[AUTH GOOGLE] NEXT_PUBLIC_MEDUSA_BACKEND_URL no está configurada");
    return NextResponse.json(
      {
        error: "Configuración del backend no encontrada",
        message: "NEXT_PUBLIC_MEDUSA_BACKEND_URL debe estar configurada",
      },
      { status: 500 }
    );
  }

  if (!siteUrl) {
    console.error("[AUTH GOOGLE] NEXT_PUBLIC_SITE_URL no está configurada");
    return NextResponse.json(
      {
        error: "Configuración del sitio no encontrada",
        message: "NEXT_PUBLIC_SITE_URL debe estar configurada. Ejemplo: http://localhost:3000",
      },
      { status: 500 }
    );
  }

  // Normalizar URLs
  const normalizedBackend = normalizeUrl(backend);
  const callbackUrl = getCallbackUrl();

  // URL que vamos a llamar en el backend
  const url = `${normalizedBackend}/auth/customer/google`;

  console.log("[AUTH GOOGLE] Llamando a:", url);
  console.log("[AUTH GOOGLE] callback_url:", callbackUrl);
  console.log("[AUTH GOOGLE] IMPORTANTE: Esta URI debe estar registrada en Google Cloud Console como 'Authorized redirect URI'");

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        callback_url: callbackUrl,
      }),
    });

    const text = await resp.text();

    // Si NO es 2xx, devolvemos info para debug
    if (!resp.ok) {
      console.error(
        "[AUTH GOOGLE] Error desde backend:",
        resp.status,
        text.slice(0, 500)
      );

      // Verificar si el error es relacionado con redirect_uri_mismatch
      const errorText = text.toLowerCase();
      if (errorText.includes("redirect_uri_mismatch") || errorText.includes("redirect_uri")) {
        return NextResponse.json(
          {
            error: "Error de configuración de Google OAuth",
            message: `La URI de redirección no está registrada en Google Cloud Console.`,
            details: `Agrega esta URI en Google Cloud Console > APIs & Services > Credentials > Tu OAuth 2.0 Client ID > Authorized redirect URIs:`,
            callbackUrl: callbackUrl,
            instructions: [
              "1. Ve a https://console.cloud.google.com/",
              "2. Selecciona tu proyecto",
              "3. Ve a APIs & Services > Credentials",
              "4. Haz clic en tu OAuth 2.0 Client ID",
              `5. Agrega esta URI en 'Authorized redirect URIs': ${callbackUrl}`,
              "6. Guarda los cambios",
              "7. Reinicia los servidores",
            ],
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "No se pudo iniciar el login con Google",
          status: resp.status,
          body: text,
          calledUrl: url,
          callbackUrl: callbackUrl,
        },
        { status: 500 }
      );
    }

    // Si el backend devolvió JSON, lo parseamos
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Caso típico: { location: "https://accounts.google.com/..." }
    if (data && typeof data === "object" && "location" in data && data.location) {
      console.log("[AUTH GOOGLE] Redirigiendo a Google:", data.location);
      return NextResponse.redirect(data.location as string);
    }

    // Caso raro: nos devuelve un token directo
    const token =
      typeof data === "string"
        ? data
        : (data as any).token ?? (data as any).jwt;

    if (token) {
      console.log("[AUTH GOOGLE] Recibimos token directo, seteando cookie y yendo al dashboard");
      const normalizedSiteUrl = normalizeUrl(siteUrl);
      const isProduction = process.env.NODE_ENV === "production";
      const res = NextResponse.redirect(`${normalizedSiteUrl}/es/ar/dashboard`);
      res.cookies.set("_medusa_jwt", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "lax" : "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log("[AUTH GOOGLE] Cookie establecida:", {
        tokenLength: token.length,
        secure: isProduction,
        sameSite: isProduction ? "lax" : "strict",
      });
      return res;
    }

    console.error("[AUTH GOOGLE] Respuesta inesperada:", data);
    return NextResponse.json(
      {
        error: "Respuesta inesperada de /auth/customer/google",
        data,
      },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[AUTH GOOGLE] Excepción al llamar al backend:", err);
    return NextResponse.json(
      {
        error: "Excepción al iniciar login con Google",
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
