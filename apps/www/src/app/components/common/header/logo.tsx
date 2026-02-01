import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
      <Link href="/" className="block">
        <Image
          src="/assets/img/logo3.png"
          alt="Logo Flores Imprenta"
          width={720}
          height={440}
          className="site-logo-desktop h-60 w-auto object-contain dark:invert md:h-36 lg:h-44 xl:h-48 2xl:h-52"
          priority
        />
      </Link>
    </div>
  );
}
