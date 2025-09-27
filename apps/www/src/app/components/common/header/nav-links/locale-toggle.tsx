import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export function LocaleToggle() {
  const countryCode = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const languajes = [
    {
      abbreviation: 'es',
      image: '🇦🇷',
      href: '',
    },
    {
      abbreviation: 'en',
      image: '🇺🇲',
      href: '',
    },
  ];

  const currentLocaleFlag = languajes.find(
    (l) => l.abbreviation === countryCode,
  )!;

  const handleOnClick = (newLocale: string) => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length < 2) return;

    segments[0] = newLocale;

    const newPath = '/' + segments.join('/');
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className='hidden lg:block'
          size='icon'
          variant='outline'
        >
          {currentLocaleFlag.image}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='min-w-0'>
        {languajes.map((l) => (
          <DropdownMenuItem
            onClick={() => handleOnClick(l.abbreviation)}
            key={l.abbreviation}
            className='flex justify-center gap-2'
          >
            {l.abbreviation}
            <span>{l.image}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
