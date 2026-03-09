import Image from 'next/image';
import Link from 'next/link';

interface Props {
  className?: string;
}

export function MobileThemedLogo({ className }: Props) {
  return (
    <Link href='/'>
      <Image
        src='/assets/img/logo3.png'
        alt='Logo Flores Imprenta'
        height={64}
        width={320}
        className={`h-auto w-auto object-contain object-left dark:invert md:h-70 md:min-h-[120px] md:max-w-[320px] md:min-w-[240px] ${className ?? ''}`.trim()}
        priority
      />
    </Link>
  );
}
