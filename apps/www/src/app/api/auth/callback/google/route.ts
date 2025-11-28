// apps/www/src/app/api/auth/callback/google/route.ts
import { cookies as authCookies } from "@/lib/data/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const url = new URL(req.url);
  const search = url.search; // ?code=...&state=...

  try {
    const resp = await fetch(
      `${backend}/auth/customer/google/callback${search}`,
      {
        method: "POST",
        // credentials no hace daño, por si el provider quiere usar cookies
        credentials: "include",
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

    await authCookies.setAuthToken(token);

    // redirigimos al dashboard
    return NextResponse.redirect(`${siteUrl}/es/ar/dashboard`);
  } catch (err) {
    console.error("Excepción en callback de Google:", err);
    return NextResponse.redirect(
      `${siteUrl}/login?error=google_callback_exception`
    );
  }
}
