// apps/www/src/app/api/auth/google/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // URL que vamos a llamar en el backend
  const url = `${backend.replace(/\/$/, "")}/auth/customer/google`;

  console.log("[AUTH GOOGLE] Llamando a:", url);
  console.log("[AUTH GOOGLE] callback_url:", `${siteUrl}/api/auth/callback/google`);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        callback_url: `${siteUrl}/api/auth/callback/google`,
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

      return NextResponse.json(
        {
          error: "No se pudo iniciar el login con Google",
          status: resp.status,
          body: text,
          calledUrl: url,
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
      const res = NextResponse.redirect(`${siteUrl}/es/ar/dashboard`);
      res.cookies.set("_medusa_jwt", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
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
