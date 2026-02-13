// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/(auth)/login/page.tsx
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import LoginPreview from "./LoginPreview";

type LoginPageProps = {
  params: Promise<{
    locale: string;
    countryCode: string;
  }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  // 👇 Next 15: params es una Promise
  const { locale, countryCode } = await params;

  const { user, clearedInvalidToken } = await authService.getUserResult().catch(() => ({ user: null, clearedInvalidToken: false }));

  if (user) {
    redirect(`/${locale}/${countryCode}/dashboard`);
  }

  if (clearedInvalidToken) {
    redirect(`/${locale}/${countryCode}/login?error=session_invalid`);
  }

  return <LoginPreview />;
}
