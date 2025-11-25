'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { toast } from 'sonner'

export default function LoginPreview() {
  const i18n = useTranslations('Auth.login')

  const handleGoogleLogin = () => {
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

    if (!backend) {
      toast.error('No se encuentra la URL del backend')
      return
    }

    // 👉 RUTA CORRECTA PARA INICIAR GOOGLE OAUTH
    window.location.href = `${backend}/store/auth/google`
  }

  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{i18n('title')}</CardTitle>
          <CardDescription>{i18n('description')}</CardDescription>
        </CardHeader>

        <CardContent>
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
