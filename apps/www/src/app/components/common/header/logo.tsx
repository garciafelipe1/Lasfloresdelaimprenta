import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <div className='absolute left-1/2 -translate-x-1/2'>
      <Link href='/'>
        <Image
          src={'/assets/img/logo.png'}
          alt='Logo Flores Imprenta'
          width={120}
          height={80}
          className='h-full w-full object-contain dark:invert'
        />
      </Link>
    </div>
  );
}
