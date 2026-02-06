'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CirclePlay, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';

export function AboutUs() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (open) return;
    const el = videoRef.current;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      // noop
    }
  }, [open]);

  return (
    <section className='about-us-section px-3 sm:px-4 py-6 sm:py-12 lg:py-20'>
      <div className='max-w-desktop mx-auto'>
        <div className='relative overflow-hidden rounded-lg sm:rounded-xl min-h-[520px] sm:min-h-[560px]'>
          {/* Imagen de fondo (siempre) */}
          <div className='absolute inset-0'>
            <Image
              src='/assets/img/aboutus.jpeg'
              alt='Flores'
              fill
              priority
              className='object-cover scale-110 sm:scale-115 will-change-transform'
              quality={85}
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px'
            />
            <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30' />
          </div>

          {/* Contenido centrado */}
          <div className='relative flex items-center justify-center p-4 sm:p-8 lg:p-10 min-h-[520px] sm:min-h-[560px]'>
            <div className='w-full max-w-xs sm:max-w-lg md:max-w-xl'>
              {/* Card principal */}
              <div className='relative rounded-lg sm:rounded-xl bg-white/95 sm:bg-white backdrop-blur-sm px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow-2xl'>
                <div className='relative z-10 flex flex-col items-center justify-center text-center min-h-[180px] sm:min-h-[230px] md:min-h-[260px]'>
                  <h3 className='text-center text-lg sm:text-2xl md:text-3xl font-bold text-primary mb-5 sm:mb-7 uppercase tracking-wide leading-tight font-cinzel'>
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
                    <span className='block mt-1 sm:mt-2'>
                      {t('landing.about-us.title')}
                    </span>
                  </h3>

                  <div className='flex justify-center mt-2 sm:mt-3 md:mt-4'>
                    <Dialog
                      open={open}
                      onOpenChange={setOpen}
                    >
                      <DialogTrigger asChild>
                        <button
                          type='button'
                          className='group flex items-center justify-center gap-3 rounded-full bg-[#d1b3ff] px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg font-semibold text-white transition-all hover:bg-[#c29aff] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#7c4dff] focus:ring-offset-2 w-full sm:w-auto min-w-[220px] sm:min-w-0'
                        >
                          <span className='inline-flex items-center gap-2'>
                            <span className='inline-flex items-center justify-center rounded-full bg-white/15 p-1.5'>
                              <CirclePlay className='h-5 w-5 sm:h-6 sm:w-6' />
                            </span>
                            <span className='leading-none'>
                              Conocé nuestra historia{' '}
                              <span className='opacity-75'>(1 min)</span>
                            </span>
                          </span>
                          <Clock className='h-4 w-4 sm:h-5 sm:w-5 opacity-80 transition group-hover:opacity-100' />
                        </button>
                      </DialogTrigger>

                      <DialogContent className='w-full max-w-[calc(100%-2rem)] sm:max-w-3xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] p-0 overflow-hidden'>
                        <DialogHeader className='sr-only'>
                          <DialogTitle>Conocé nuestra historia</DialogTitle>
                        </DialogHeader>

                        <div className='bg-black'>
                          <div className='relative w-full aspect-video'>
                            <video
                              ref={videoRef}
                              className='h-full w-full'
                              controls
                              playsInline
                              preload='metadata'
                              autoPlay
                            >
                              <source
                                src='/assets/img/video1.mp4'
                                type='video/mp4'
                              />
                            </video>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
