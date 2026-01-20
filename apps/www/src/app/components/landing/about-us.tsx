'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function AboutUs() {
  const t = useTranslations();

  return (
    <section className='px-4 py-12 lg:py-20'>
      <div className='max-w-desktop mx-auto '>
        <div className='relative aspect-[16/9] overflow-hidden rounded-xl md:aspect-[2/1]'>
          <Image
            src='/assets/img/aboutus.webp'
            alt='Flores'
            fill
            priority
            className='object-cover will-change-transform'
            quality={85}
            sizes="(max-width: 768px) 100vw, 90vw"
          />
          {/* Overlay centrado */}
          <div className='absolute inset-0 flex items-center justify-center p-8'>
            <div className='relative max-w-lg w-full py-4'>

              {/* Card principal */}
              <div className='relative rounded-xl bg-white px-12 pt-6 pb-10 shadow-xl overflow-visible'>
                {/* Bordes decorativos florales dentro del card */}
                <div className='absolute -left-66 top-4 hidden w-full h-full w-56 md:block'>
                  <Image
                    src='/assets/img/flor-decorativa-izquierda-nueva.png'
                    alt=''
                    width={400}
                    height={2000}
                    className='h-full w-full object-contain ml-10'
                    aria-hidden='true'
                  />
                </div>
                <div className='absolute -right-56 top-5 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/flor-decorativa-derecha-flama.png'
                    alt=''
                    width={400}
                    height={2000}
                    className='h-full w-full object-contain'
                    aria-hidden='true'
                  />
                </div>

                {/* Contenido del card */}
                <div className='relative z-10'>
                  <h3 className='text-center text-3xl font-bold text-primary mb-4 uppercase tracking-wide' style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {/* Imagen de texto arriba del card */}
                    <div className='mb-2 flex justify-center'>
                      <Image
                        src='/assets/img/texto-parrafo-about-us.png'
                        alt=''
                        width={100}
                        height={100}
                        className='object-contain '
                        aria-hidden='true'
                      />
                    </div>
                    {t('landing.about-us.title')}
                  </h3>
                  <div className='flex justify-center'>
                    <a
                      href='#'
                      className='group flex items-center gap-2 rounded-full bg-[#d1b3ff] px-8 py-4 text-white font-semibold text-black transition-all hover:bg-[#c29aff] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff] focus:ring-offset-2'
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
