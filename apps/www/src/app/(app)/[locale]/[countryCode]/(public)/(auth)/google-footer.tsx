'use client'

import { Button } from '@/app/components/ui/button'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { toast } from 'sonner'

export function GoogleFooter() {
  const i18n = useTranslations('Auth.google')

  const loginWithGoogle = () => {
    try {
      const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

      if (!backend || !pk) {
        toast.error('Faltan variables de entorno para Google OAuth')
        return
      }

      // 👇 URL correcta para Google en Medusa 2.x
      const url = `${backend}/store/auth/google?publishable_api_key=${pk}`

      // 👇 Redirige al flujo de Google
      window.location.href = url
    } catch (error) {
      toast.error('Hubo un error al iniciar sesión con Google')
      console.error(error)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="bg-border h-[2px] w-full" />
        <span>o</span>
        <div className="bg-border h-[2px] w-full" />
      </div>

      <Button
        type="button"
        onClick={loginWithGoogle}
        variant="outline"
        className="w-full"
      >
        <Image
          src="/assets/img/google-logo.webp"
          alt="Google icon"
          width={16}
          height={16}
        />
        {i18n('signup')}
      </Button>
    </>
  )
}
