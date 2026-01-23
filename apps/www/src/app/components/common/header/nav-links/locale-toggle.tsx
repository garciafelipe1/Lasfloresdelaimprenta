'use client';

import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useLocale } from 'next-intl';
import { usePathname as useNextPathname, useRouter } from 'next/navigation';

export function LocaleToggle() {
  const currentLocale = useLocale();
  const pathname = useNextPathname(); // Usar el pathname completo de next/navigation
  const router = useRouter();

  const languages = [
    {
      code: 'es',
      flag: '🇦🇷',
      label: 'ARG / Español',
      labelShort: 'ARG',
    },
    {
      code: 'en',
      flag: '🇺🇲',
      label: 'EN / English',
      labelShort: 'EN',
    },
  ];

  const currentLanguage = languages.find(
    (l) => l.code === currentLocale,
  ) || languages[0];

  const handleOnClick = (newLocale: string) => {
    // Guardar preferencia en localStorage para persistencia
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }
    
    // Obtener la ruta completa actual (ej: /es/ar/catalog)
    const fullPath = pathname;
    const segments = fullPath.split('/').filter(Boolean);
    
    // Obtener query params si existen
    const searchParams = typeof window !== 'undefined' ? window.location.search : '';
    
    // La estructura es: /[locale]/[countryCode]/[...rest]
    // Necesitamos reemplazar solo el primer segmento (locale)
    if (segments.length >= 2) {
      // Reemplazar el locale (primer segmento) con el nuevo
      segments[0] = newLocale;
      const newPath = '/' + segments.join('/') + searchParams;
      router.push(newPath);
    } else {
      // Si no hay suficientes segmentos, redirigir a la página principal
      router.push(`/${newLocale}/ar${searchParams}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size='default'
          variant='outline'
          className='gap-2'
        >
          <span className='text-lg'>{currentLanguage.flag}</span>
          <span className='hidden sm:inline'>{currentLanguage.labelShort}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[180px]'>
        {languages.map((lang) => (
          <DropdownMenuItem
            onClick={() => handleOnClick(lang.code)}
            key={lang.code}
            className={`flex items-center gap-2 cursor-pointer ${
              currentLocale === lang.code ? 'bg-accent font-semibold' : ''
            }`}
          >
            <span className='text-lg'>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
