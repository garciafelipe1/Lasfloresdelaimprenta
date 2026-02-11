import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '../common/section/section';
import { Badge } from '../ui/badge';

interface BannerProps {
  title: string;
  imageUrl: string;
}

const CategoryCard = ({ title, imageUrl }: BannerProps) => (
  <div className='group relative h-50 overflow-hidden rounded-lg transition-all duration-500 ease-out will-change-transform hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1'>
    {/* Imagen de fondo */}
    <Image
      fill
      src={imageUrl}
      alt={title}
      className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-105'
      loading="lazy"
      quality={90}
      sizes="(max-width: 768px) 100vw, 50vw"
    />

    {/* Overlay gradient mejorado */}
    <div className='absolute inset-0 z-10 rounded-lg bg-gradient-to-br from-black/60 via-black/40 to-black/20 transition-all duration-500 group-hover:from-black/50 group-hover:via-black/30 group-hover:to-black/10' />

    {/* Etiqueta (extremo izquierdo) con nombre */}
    <div className='absolute left-0 top-1/2 z-20 -translate-y-1/2 md:hidden'>
      <span className='al rounded-r-md bg-black/45 px-3 py-1 text-[11px] font-cinzel tracking-wide text-white/95 backdrop-blur-[2px]'>
        <span className='truncate'>{title}</span>
      </span>
    </div>

    {/* Overlay negro (hover) - más sutil/pro */}
    <div className='absolute  left-0 right-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out rounded-t-lg'>
      <div className='p-4 bg-gradient-to-b from-black/60 via-black/40 to-black/10 backdrop-blur-[2px]'>
        <h3 className='text-lg sm:text-xl font-cinzel text-white text-center tracking-wide drop-shadow-md'>
          {title}
        </h3>
      </div>
    </div>

    {/* Contenido de la tarjeta */}
    {/* <div className='relative z-20 p-4'>
      <Badge variant='secondary' className='bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors'>
        {title}
      </Badge>
    </div> */}
  </div>
);

const CATEGORY_IMAGES = [
  {
    key: 'sanValentin',
    href: '/catalog?category=San+Valentín',
    imagePath: '/assets/img/productos/san-valentin/pasionsinfiltro.jpeg',
  },
  {
    key: 'ramosPrimaverales',
    href: '/catalog?category=Ramos+primaverales',
    imagePath: '/assets/img/flor-4.jpg',
  },
  {
    key: 'box',
    href: '/catalog?category=Box',
    imagePath: 'public/assets/img/productos/box/fresh.jpeg',
  },
  {
    key: 'rosas',
    href: '/catalog?category=Rosas',
    imagePath: '/assets/img/productos/rosas/blanco.jpeg',
  },
] as const;

export function Categories() {
  const t = useTranslations();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const getImageUrl = (path: string) =>
    baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path;

  return (
    <div className='px-6 categories-section'>
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader className='flex flex-col items-center justify-center mt-16'>
          <h2 className='text-4xl text-primary font-cinzel'>
            {t('landing.categories.title')}
          </h2>
          <SectionSubtitle className='text-center text-black dark:text-white'>
            {t('landing.categories.description')}
          </SectionSubtitle>
        </SectionHeader>
        <div className='grid grid-cols-1 gap-4 py-14 md:grid-cols-2'>
          {CATEGORY_IMAGES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className='block h-full'
            >
              <CategoryCard
                title={t(`landing.categories.items.${c.key}`)}
                imageUrl={getImageUrl(c.imagePath)}
              />
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
