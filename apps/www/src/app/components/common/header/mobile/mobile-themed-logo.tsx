import Image from 'next/image';
import Link from 'next/link';

export function MobileThemedLogo() {
  return (
    <Link href='/'>
      <Image
        src='/assets/img/logo.png'
        alt='Logo Flores Imprenta'
        height={50}
        width={100}
        className='h-full w-full object-contain dark:invert'
      />
    </Link>
  );
}
