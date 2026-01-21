'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { toast } from 'sonner'

export default function LoginPreview() {
  const i18n = useTranslations('Auth.login')
  const router = useRouter()
  const params = useParams<{ locale: string; countryCode: string }>()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 🚀 Si ya hay cookie _medusa_jwt, lo sacamos del login al dashboard
  useEffect(() => {
    if (typeof document === 'undefined') return

    const hasToken = document.cookie
      .split('; ')
      .some((c) => c.startsWith('_medusa_jwt='))

    if (hasToken) {
      const locale = params.locale ?? 'es'
      const countryCode = params.countryCode ?? 'ar'

      router.replace(`/${locale}/${countryCode}/dashboard`)
    }
  }, [router, params])

  // Verificar errores en la URL
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error) {
      let errorText = ''
      
      switch (error) {
        case 'redirect_uri_mismatch':
          errorText = 'Error de configuración: La URI de redirección no está registrada en Google Cloud Console. Por favor, contacta al administrador o verifica la configuración de Google OAuth.'
          break
        case 'google_callback_failed':
          errorText = 'Error al procesar la autenticación con Google. Por favor, intenta nuevamente.'
          break
        case 'google_no_token_from_callback':
          errorText = 'No se recibió el token de autenticación. Por favor, intenta nuevamente.'
          break
        case 'backend_not_configured':
          errorText = 'Error de configuración: El backend no está configurado correctamente.'
          break
        case 'site_url_not_configured':
          errorText = 'Error de configuración: La URL del sitio no está configurada correctamente.'
          break
        default:
          errorText = message || 'Ocurrió un error durante la autenticación. Por favor, intenta nuevamente.'
      }

      setErrorMessage(errorText)
      toast.error(errorText)
    }
  }, [searchParams])

  const handleGoogleLogin = () => {
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

    if (!backend) {
      toast.error('No se encuentra la URL del backend')
      return
    }

    // 👉 RUTA CORRECTA PARA INICIAR GOOGLE OAUTH
    window.location.href = "/api/auth/google";
    console.log("Redirigiendo a Google OAuth...");
  }

  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{i18n('title')}</CardTitle>
          <CardDescription>{i18n('description')}</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
          
          <div className="grid gap-4">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
            >
              <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-2" />
              Iniciar sesión con Google
            </button>
          </div>

          <div className="mt-4 text-center text-sm">
            {i18n('noAccount')}{' '}
            <a href="/register" className="underline">
              {i18n('registerLink')}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
