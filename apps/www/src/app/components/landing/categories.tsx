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
    
    {/* Overlay negro transparente superior que aparece en hover */}
    <div className='absolute top-0 left-0 right-0 z-30 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out rounded-t-lg'>
      <div className='p-4'>
        <h3 className='text-xl font-bold text-white text-center drop-shadow-lg'>
          {title}
        </h3>
      </div>
    </div>
    
    {/* Contenido de la tarjeta */}
    <div className='relative z-20 p-4'>
      <Badge variant='secondary' className='bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors'>
        {title}
      </Badge>
    </div>
  </div>
);

const categories = [
  {
    key: 'ramosPrimaverales',
    href: '/catalog?category=Ramos+primaverales',
    imageUrl: '/assets/img/flor-4.jpg',
  },
  {
    key: 'rosas',
    href: '/catalog?category=Rosas',
    imageUrl: '/assets/img/rosascategoria.jpg',
  },
  {
    key: 'box',
    href: '/catalog?category=Box',
    imageUrl: '/assets/img/boxprimaveral.webp',
  },
  {
    key: 'sanValentin',
    href: '/catalog?category=San+Valentín',
    imageUrl: '/assets/img/follaje.jpg',
  },
];

export function Categories() {
  const t = useTranslations();

  return (
    <div className='px-6 categories-section'>
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader className='flex flex-col items-center justify-center'>
          <SectionTitle className='text-4xl text-primary'>
            {t('landing.categories.title')}
          </SectionTitle>
          <SectionSubtitle className='text-center text-primary'>
            {t('landing.categories.description')}
          </SectionSubtitle>
        </SectionHeader>
        <div className='grid grid-cols-1 gap-4 py-14 md:grid-cols-2'>
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className='block h-full'
            >
              <CategoryCard
                title={t(`landing.categories.items.${c.key}`)}
                imageUrl={c.imageUrl}
              />
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
