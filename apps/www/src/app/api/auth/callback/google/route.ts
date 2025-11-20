import { cookies } from "@/lib/data/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    console.error("NO TOKEN RECEIVED FROM MEDUSA");
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=oauth_failed`
    );
  }

  await cookies.setAuthToken(token);

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/es/ar/dashboard`
  );
}
