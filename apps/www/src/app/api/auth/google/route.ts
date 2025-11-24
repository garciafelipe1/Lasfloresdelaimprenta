import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  try {
    const res = await fetch(`${backend}/store/auth/google`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": pk,
      },
      redirect: "manual",
    });

    const redirectUrl = res.headers.get("location");

    if (!redirectUrl) {
      return NextResponse.json(
        { error: "Google redirect missing" },
        { status: 500 }
      );
    }

    // 🔥 Agregamos CORS para que el navegador NO bloquee la respuesta
    return NextResponse.redirect(redirectUrl, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-publishable-api-key",
      },
    });

  } catch (err) {
    console.error("GOOGLE LOGIN ERROR", err);
    return NextResponse.json({ error: "OAuth failed" }, { status: 500 });
  }
}

// Necesario para preflight CORS
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-publishable-api-key",
    },
  });
}
