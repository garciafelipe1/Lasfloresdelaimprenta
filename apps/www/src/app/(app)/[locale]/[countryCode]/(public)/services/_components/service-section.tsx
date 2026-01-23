import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  title: string;
  subtitle: string;
  images: string[];
  description: string;
  hash: string;
  slug: string;
  translations: {
    viewDetails: string;
    requestQuote: string;
    premiumService: string;
  };
}

export default function ServiceSection({
  description,
  images,
  subtitle,
  title,
  hash,
  slug,
  translations,
}: Props) {
  const [image1, image2, image3, image4] = images;

  return (
    <section
      className='px-layout py-vertical group/section scroll-mt-12 border-b md:pt-16 md:pb-16 text-primary service-section'
      id={hash}
    >
      <div className='max-w-desktop mx-auto flex flex-col gap-12'>
        <header className='text-center space-y-4'>
          <Badge variant='secondary' className='w-fit mx-auto'>
            <Sparkles className='w-3 h-3 mr-2' />
            {translations.premiumService}
          </Badge>
          <h2 className='text-3xl md:text-4xl font-bold tracking-tight text-primary'>
            {title}
          </h2>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            {subtitle}
          </p>
        </header>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto] text-primary'>
          <div className='relative col-span-full overflow-hidden rounded-xl shadow-lg md:col-span-2 lg:col-span-3 lg:row-span-1 group'>
            <Image
              src={image1}
              alt={`${title} - Imagen principal`}
              width={900}
              height={600}
              className='aspect-[3/2] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              loading='lazy'
            />
          </div>

          <div className='relative col-span-full overflow-hidden rounded-xl shadow-md md:col-span-2 lg:col-span-1 lg:row-span-1 group'>
            <Image
              src={image2}
              alt={`${title} - Galería`}
              width={450}
              height={338}
              className='aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              loading='lazy'
            />
          </div>

          <div className='relative col-span-full overflow-hidden rounded-xl shadow-md md:col-span-2 lg:col-span-2 lg:row-span-1 group'>
            <Image
              src={image3}
              alt={`${title} - Galería`}
              width={600}
              height={400}
              className='aspect-[3/2] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              loading='lazy'
            />
          </div>

          <div className='relative col-span-full overflow-hidden rounded-xl shadow-md md:col-span-2 lg:col-span-2 lg:row-span-1 group'>
            <Image
              src={image4}
              alt={`${title} - Galería`}
              width={600}
              height={400}
              className='aspect-[3/2] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              loading='lazy'
            />
          </div>
        </div>

        <Card className='border-2 hover:border-primary/50 transition-colors'>
          <CardContent className='p-6 md:p-8'>
            <div className='flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8'>
              <div
                className='prose prose-lg w-full md:w-[60%] text-primary max-w-none flex-1'
                dangerouslySetInnerHTML={{ __html: description }}
              />
              <div className='flex flex-col sm:flex-row gap-4 w-full md:w-auto md:flex-shrink-0'>
                <Button size='lg' className='text-base px-8 py-6 group' asChild>
                  <Link href={`/services/${slug}`}>
                    {translations.viewDetails}
                    <ArrowRight className='ml-2 w-5 h-5 transition-transform group-hover:translate-x-1' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' className='text-base px-8 py-6' asChild>
                  <Link href={`/services/${slug}#contacto`}>
                    {translations.requestQuote}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
