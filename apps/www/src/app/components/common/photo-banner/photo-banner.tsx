import Image from 'next/image';
import { cn } from '@/lib/utils';

type PhotoBannerProps = {
  /** Ruta de la imagen en public (ej: /assets/img/bannerdelasflores.jpeg) */
  src: string;
  alt?: string;
  className?: string;
  /** Si es true, el banner usa más ancho (ej. portfolio de membresías) */
  wide?: boolean;
};

export function PhotoBanner({ src, alt = '', className, wide }: PhotoBannerProps) {
  return (
    <section
      aria-label="Banner"
      className={cn('relative border-t border-primary/10 px-6 py-6 md:px-8 md:py-8', className)}
    >
      <div
        className={cn(
          'relative mx-auto h-[min(400px,62vw)] min-h-[320px] w-full overflow-hidden rounded-xl md:min-h-[380px]',
          wide ? 'max-w-[1920px]' : 'max-w-[1560px]',
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center"
          sizes={wide ? '(max-width: 1920px) 100vw, 1920px' : '(max-width: 1560px) 100vw, 1560px'}
          priority={false}
        />
      </div>
    </section>
  );
}

