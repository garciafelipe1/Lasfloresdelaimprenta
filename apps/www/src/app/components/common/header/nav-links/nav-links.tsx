'use client';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavLinks } from '../constants/links';
import { LocaleToggle } from './locale-toggle';

interface SubMenuItem {
  title: string;
  href: string;
  description: string;
}

export function NavLinks() {
  const path = usePathname();
  const t = useTranslations();
  // @ts-expect-error next-intl
  const LINKS = getNavLinks(t);

  return (
    <nav
      aria-label='Global'
      className='flex flex-grow items-center justify-start gap-2'
    >
      <NavigationMenu delayDuration={0}>
        <NavigationMenuList>
          {LINKS.map((link) => {
            const activeSegment = path.split('/').filter(Boolean)[2]; // 'catalog'
            const linkSegment = link.href
              .replace(/^\.\//, '')
              .replace(/^\//, ''); // 'catalog'

            const isActive = activeSegment === linkSegment;

            return (
              <NavigationMenuItem
                data-ok={isActive ? '' : null}
                key={link.href}
                className='group/menu'
              >
                {link.type === 'link' ? (
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link
                      href={`/${link.href}`}
                      className='group-hover/menu:text-foreground/80 relative px-2 transition duration-300 ease-in-out'
                    >
                      {link.label}
                      <span className='group-data-ok/menu:bg-foreground absolute bottom-[-8px] left-0 h-[2px] w-full transition-all duration-300 ease-in-out' />
                    </Link>
                  </NavigationMenuLink>
                ) : (
                  <>
                    <NavigationMenuTrigger
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'relative',
                        isActive ? 'text-foreground' : '',
                      )}
                    >
                      {link.label}
                      <span
                        className={cn(
                          'absolute left-0 h-[2px] w-0 transition-all duration-300 ease-in-out',
                          isActive
                            ? 'bg-primary bottom-[-8px] w-full'
                            : 'bottom-[-8px] bg-transparent',
                        )}
                      />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className='grid w-[300px] gap-2 p-4 md:w-[400px] md:grid-cols-2 lg:w-[500px]'>
                        {link.submenu?.map((item) => (
                          <ListItem
                            key={item.href}
                            item={item}
                          />
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                )}
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
      <LocaleToggle />
    </nav>
  );
}

interface ListItemProps {
  item: SubMenuItem;
}

function ListItem({ item: { description, href, title } }: ListItemProps) {
  const path = usePathname();
  const isActive = path === href;

  return (
    <li>
      <NavigationMenuLink
        href={href}
        className={cn(
          'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none focus:outline-none',
          'relative',
        )}
      >
        <div className='text-sm leading-none font-semibold'>{title}</div>
        <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
          {description}
        </p>
        <span
          className={cn(
            'absolute left-0 h-[2px] w-0 transition-all duration-300 ease-in-out',
            isActive ? 'bottom-[-4px] w-full' : 'bottom-[-4px] bg-transparent',
          )}
        ></span>
      </NavigationMenuLink>
    </li>
  );
}
