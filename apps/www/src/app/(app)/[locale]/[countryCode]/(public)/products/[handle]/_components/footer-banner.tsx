import Image from 'next/image';

export function FooterBanner() {
  return (
    <div className='relative overflow-hidden rounded-xl'>
      <div className='relative w-full h-[clamp(200px,22vw,280px)]'>
        <Image
          className='h-full w-full object-contain sm:object-cover object-center'
          fill
          src='/assets/img/bannerdelasflores.jpeg'
          alt='Banner'
          sizes='(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1024px'
          priority
        />
      </div>
    </div>
  );
}
