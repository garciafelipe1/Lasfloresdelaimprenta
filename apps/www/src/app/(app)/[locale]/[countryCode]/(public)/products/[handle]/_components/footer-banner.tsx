import Image from 'next/image';

const SAN_VALENTIN_BANNER_URL =
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/sanvalentinbanner.jpg';

export function FooterBanner() {
  return (
    <div className='relative w-full overflow-hidden rounded-xl'>
      <div className='relative w-full min-h-[200px] h-[min(320px,55vw)] sm:h-[280px] md:h-[340px] lg:h-[400px] xl:h-[460px]'>
        <Image
          className='h-full w-full object-contain object-center sm:object-cover'
          fill
          src={SAN_VALENTIN_BANNER_URL}
          alt='Banner San Valentín'
          sizes='(max-width: 480px) 100vw, (max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px'
          priority={false}
        />
      </div>
    </div>
  );
}
