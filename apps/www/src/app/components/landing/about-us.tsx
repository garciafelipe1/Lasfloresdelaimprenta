'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function AboutUs() {
  const t = useTranslations();

  return (
    <section className='px-3 sm:px-4 py-6 sm:py-12 lg:py-20'>
      <div className='max-w-desktop mx-auto'>
        <div className='relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-lg sm:rounded-xl md:aspect-[2/1]'>
          <Image
            src='/assets/img/aboutus.webp'
            alt='Flores'
            fill
            priority
            className='object-cover will-change-transform'
            quality={85}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          />
          {/* Overlay con gradiente para mejor legibilidad en móvil */}
          <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30 sm:bg-transparent' />
          
          {/* Overlay centrado */}
          <div className='absolute inset-0 flex items-center justify-center p-3 sm:p-4 md:p-6'>
            <div className='relative w-full max-w-[95%] sm:max-w-lg py-2 sm:py-4'>
              {/* Card principal */}
              <div className='relative rounded-lg sm:rounded-xl bg-white/95 sm:bg-white backdrop-blur-sm px-5 sm:px-8 md:px-12 pb-5 sm:pb-6 md:pb-8 pt-5 sm:pt-6 md:pt-8 shadow-2xl overflow-visible'>
                {/* Contenido del card */}
                <div className='relative z-10'>
                  <h3 className='text-center text-lg sm:text-2xl md:text-3xl font-bold text-primary mb-3 sm:mb-4 uppercase tracking-wide leading-tight' style={{ fontFamily: 'var(--font-cinzel), Georgia, "Times New Roman", serif' }}>
                    {/* Imagen de texto arriba del card */}
                    <div className='mb-2 sm:mb-3 flex justify-center'>
                      <Image
                        src='/assets/img/texto-parrafo-about-us.png'
                        alt=''
                        width={180}
                        height={100}
                        className='object-contain w-[100px] h-auto sm:w-[140px] md:w-[180px]'
                        aria-hidden='true'
                      />
                    </div>
                    <span className='block mt-1 sm:mt-2'>{t('landing.about-us.title')}</span>
                  </h3>
                  <div className='flex justify-center mt-4 sm:mt-5 md:mt-6'>
                    <a
                      href='#'
                      className='group flex items-center justify-center gap-2 rounded-full bg-[#d1b3ff] px-5 sm:px-7 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-semibold text-black transition-all hover:bg-[#c29aff] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#7c4dff] focus:ring-offset-2 w-full sm:w-auto min-w-[140px] sm:min-w-0'
                    >
                      {t('landing.about-us.button')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
