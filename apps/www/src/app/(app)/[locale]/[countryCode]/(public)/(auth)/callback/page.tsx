'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useParams<{ locale: string; countryCode: string }>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Esperar un momento para asegurar que la cookie esté disponible
    const checkAuth = async () => {
      try {
        // Esperar 500ms para que la cookie esté disponible en el servidor
        await new Promise(resolve => setTimeout(resolve, 500))

        const locale = params.locale ?? 'es'
        const countryCode = params.countryCode ?? 'ar'

        // Redirigir al dashboard - el layout del dashboard validará el token
        router.replace(`/${locale}/${countryCode}/dashboard`)
      } catch (err) {
        console.error('[AuthCallbackPage] Error al redirigir:', err)
        setError('Error al completar la autenticación')
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          const locale = params.locale ?? 'es'
          const countryCode = params.countryCode ?? 'ar'
          router.replace(`/${locale}/${countryCode}/login?error=callback_failed`)
        }, 2000)
      }
    }

    checkAuth()
  }, [router, params])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="mb-4 text-red-600">
              <p className="text-lg font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <p className="text-sm text-gray-600">Redirigiendo al login...</p>
          </>
        ) : (
          <>
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-lg">Autenticando...</p>
          </>
        )}
      </div>
    </div>
  )
}
