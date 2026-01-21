'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useParams<{ locale: string; countryCode: string }>()

  useEffect(() => {
    // Esperar un momento para asegurar que la cookie esté disponible
    const checkAuth = async () => {
      // Esperar 500ms para que la cookie esté disponible
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const locale = params.locale ?? 'es'
      const countryCode = params.countryCode ?? 'ar'
      
      // Redirigir al dashboard
      router.replace(`/${locale}/${countryCode}/dashboard`)
    }

    checkAuth()
  }, [router, params])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-lg">Autenticando...</p>
      </div>
    </div>
  )
}
