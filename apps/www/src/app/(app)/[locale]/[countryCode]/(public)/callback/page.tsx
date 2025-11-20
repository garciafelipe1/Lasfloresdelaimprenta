"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    Cookies.set("_medusa_jwt", token, { expires: 30 });

    router.replace("/es/ar/dashboard");
  }, [searchParams, router]);

  return <p>Procesando autenticación…</p>;
}
