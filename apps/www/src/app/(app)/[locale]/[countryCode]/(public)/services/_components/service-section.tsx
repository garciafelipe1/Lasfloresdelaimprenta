import { Button } from '@/app/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  title: string;
  subtitle: string;
  images: string[];
  description: string;
  hash: string;
}

export default function ServiceSection({
  description,
  images,
  subtitle,
  title,
  hash,
}: Props) {
  const [image1, image2, image3, image4] = images;

  return (
    <section
      className='px-layout py-vertical group/section scroll-mt-12 border-b md:pt-16 md:pb-16'
      id={hash}
    >
      <div className='max-w-desktop mx-auto flex flex-col gap-12'>
        <header>
          <h2 className='text-primary text-center tracking-tight'>{title}</h2>
          <p className='mt-3 text-center'>{subtitle}</p>
        </header>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto]'>
          <div className='relative col-span-full overflow-hidden shadow-lg md:col-span-2 lg:col-span-3 lg:row-span-1'>
            <Image
              src={image1}
              alt='Arreglo floral exquisito en chimenea'
              width={900}
              height={600}
              className='aspect-[3/2] h-full w-full object-cover'
            />
          </div>

          <div className='relative col-span-full overflow-hidden shadow-md md:col-span-2 lg:col-span-1 lg:row-span-1'>
            <Image
              src={image2}
              alt='Centro de mesa de Navidad con velas rojas'
              width={450}
              height={338}
              className='aspect-[4/3] h-full w-full object-cover'
            />
          </div>

          <div className='relative col-span-full overflow-hidden shadow-md md:col-span-2 lg:col-span-2 lg:row-span-1'>
            <Image
              src={image3}
              alt='Bañera vintage decorada con flores'
              width={600}
              height={400}
              className='aspect-[3/2] h-full w-full object-cover'
            />
          </div>

          <div className='relative col-span-full overflow-hidden shadow-md md:col-span-2 lg:col-span-2 lg:row-span-1'>
            <Image
              src={image4}
              alt='Arreglo floral en el alféizar de una ventana'
              width={600}
              height={400}
              className='aspect-[3/2] h-full w-full object-cover'
            />
          </div>
        </div>
        <footer className='bg-secondary flex flex-wrap items-center gap-4 rounded-md p-4 group-even/section:flex-row-reverse'>
          <div
            className='prose w-[300px] flex-1'
            dangerouslySetInnerHTML={{ __html: description }}
          />
          <div className='flex flex-1 items-center justify-center'>
            <Link
              href='#'
              className='group'
            >
              <Button size='lg'>
                Contratar servicio{' '}
                <ArrowUpRight className='transition group-hover:translate-x-[2px] group-hover:translate-y-[-2px]' />
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
