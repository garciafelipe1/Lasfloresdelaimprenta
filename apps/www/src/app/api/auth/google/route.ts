// apps/www/src/app/api/auth/google/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  try {
    // 1) Pedimos a Medusa que inicie el login con Google
    const resp = await fetch(`${backend}/auth/customer/google`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      // Le decimos a Medusa que nos devuelva el callback a esta ruta de Next
      body: JSON.stringify({
        callback_url: `${siteUrl}/api/auth/callback/google`,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Error en /auth/customer/google:", resp.status, text);
      return NextResponse.redirect(
        `${siteUrl}/login?error=google_auth_start_failed`
      );
    }

    const data = await resp.json();

    // Caso típico: Medusa devuelve { location: "https://accounts.google.com/..." }
    if (data && typeof data === "object" && "location" in data && data.location) {
      return NextResponse.redirect(data.location as string);
    }

    // En algunos casos podría devolver un token directamente (muy raro, pero por las dudas)
    const token =
      typeof data === "string"
        ? data
        : (data as any).token ?? (data as any).jwt;

    if (token) {
      // Si ya nos devolvió token directo, redirigimos al dashboard
      const res = NextResponse.redirect(`${siteUrl}/es/ar/dashboard`);
      // Si quisieras, acá podrías usar cookies.set, pero lo normal es que el token venga en el callback
      res.cookies.set("__medusa_jwt", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
      return res;
    }

    console.error("Respuesta inesperada de /auth/customer/google:", data);
    return NextResponse.redirect(
      `${siteUrl}/login?error=google_auth_unexpected_response`
    );
  } catch (err) {
    console.error("Fallo al iniciar login con Google:", err);
    return NextResponse.redirect(
      `${siteUrl}/login?error=google_auth_exception`
    );
  }
}
