import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  const url = `${backend}/store/auth/google?x-publishable-api-key=${pk}`;

  return NextResponse.redirect(url);
}
