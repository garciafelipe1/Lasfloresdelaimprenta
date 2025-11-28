import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  // 1) Next llama al backend con el HEADER correcto
  const res = await fetch(`${backend}/store/auth/google`, {
    method: "GET",
    headers: {
      "x-publishable-api-key": pk,
    },
    redirect: "manual", // muy importante: no seguir el redirect del lado del server
  });

  // 2) Leemos la Location que devuelve Medusa (la URL de Google)
  const location = res.headers.get("location");

  if (!location) {
    const text = await res.text().catch(() => "");
    return new NextResponse(
      JSON.stringify({
        error: "No se pudo iniciar el login con Google",
        status: res.status,
        body: text,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }

  // 3) Ahora sí redirigimos al navegador a Google
  return NextResponse.redirect(location);
}
