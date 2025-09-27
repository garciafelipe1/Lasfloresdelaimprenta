import Image from 'next/image';

export function Logo() {
  return (
    <div className='relative h-20 w-full'>
      <Image
        fill
        className='h-full w-full object-contain'
        src='/assets/img/floresimprenta.png'
        alt='Logo'
      />
    </div>
  );
}
