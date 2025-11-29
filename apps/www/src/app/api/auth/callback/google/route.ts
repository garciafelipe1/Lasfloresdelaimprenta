// apps/www/src/app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const url = new URL(req.url);
  const search = url.search; // ?code=...&state=...

  try {
    // 1) Reenviamos el callback a Medusa para que valide el código de Google
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

    // 2) Medusa debería devolver un token (jwt)
    const data = await resp.json();
    console.log("Google callback data desde Medusa:", data);

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

    // 3) Creamos la respuesta de redirección AL DASHBOARD
    const res = NextResponse.redirect(`${siteUrl}/es/ar/dashboard`);

    // 4) Y ACÁ seteamos la cookie directo sobre la respuesta
    res.cookies.set("_medusa_jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Excepción en callback de Google:", err);
    return NextResponse.redirect(
      `${siteUrl}/login?error=google_callback_exception`
    );
  }
}
