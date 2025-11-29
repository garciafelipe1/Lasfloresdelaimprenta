// apps/www/src/app/(app)/[locale]/[countryCode]/(public)/(auth)/login/page.tsx
import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import LoginPreview from "./LoginPreview";

type LoginPageProps = {
  params: {
    locale: string;
    countryCode: string;
  };
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale, countryCode } = params;

  // Intentamos obtener el usuario actual; si falla, lo tratamos como no logueado
  const user = await authService.getUser().catch(() => null);

  // Si ya está logueado, lo mandamos directo al dashboard
  if (user) {
    redirect(`/${locale}/${countryCode}/dashboard`);
  }

  // Si no está logueado, mostramos el componente cliente de login
  return <LoginPreview />;
}
