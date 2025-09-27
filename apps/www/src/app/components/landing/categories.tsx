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
  <div className='group relative h-50 overflow-hidden rounded-lg transition-all duration-300 hover:shadow-md'>
    <div className='relative z-20 p-4'>
      <p className='text-sm text-white'>ALWAYS NEW</p>
      <Badge>{title}</Badge>
    </div>

    <Image
      fill
      src={imageUrl}
      alt='category'
      className='absolute inset-0 h-full w-full rounded-lg object-cover transition-all duration-300 group-hover:scale-105'
    />
    <div className='absolute inset-0 z-10 rounded-lg bg-gradient-to-br from-black/50 to-transparent transition-opacity duration-300 group-hover:opacity-0 hover:bg-black/0' />
  </div>
);

const categories = [
  {
    value: 'Ramos primaverales',
    href: '/catalog?category=Ramos+primaverales',
    imageUrl: '/assets/img/flor-4.jpg', // Agregado: Imagen para ramos
  },
  {
    value: 'Rosas',
    href: '/catalog?category=Rosas',
    imageUrl: '/assets/img/rosascategoria.jpg', // Agregado: Imagen para rosas
  },
  {
    value: 'Box',
    href: '/catalog?category=Box',
    imageUrl: '/assets/img/boxprimaveral.webp', // Agregado: Imagen para box
  },
  {
    value: 'Follaje',
    href: '/catalog?category=Follaje',
    imageUrl: '/assets/img/follaje.jpg', // Agregado: Imagen para follaje
  },
];

export function Categories() {
  const t = useTranslations();

  return (
    <div className='px-6'>
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader className='flex flex-col items-center justify-center'>
          <SectionTitle className='text-4xl'>
            {t('landing.categories.title')}
          </SectionTitle>
          <SectionSubtitle className='text-center'>
            {t('landing.categories.description')}
          </SectionSubtitle>
        </SectionHeader>
        <div className='grid grid-cols-1 gap-4 py-14 md:grid-cols-2'>
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
            >
              <CategoryCard
                title={c.value}
                imageUrl={c.imageUrl} // Modificado: Ahora usa la URL de la categoría
              />
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}