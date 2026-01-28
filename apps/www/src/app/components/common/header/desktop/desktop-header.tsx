import { Logo } from '../logo';
import { NavLinks } from '../nav-links/nav-links';
import { HeaderMenu } from './header-menu';

export function DesktopHeader() {
  return (
    <div className='max-w-desktop mx-auto relative flex items-center py-6'>
      <div className='flex flex-1 items-center justify-start lg:-translate-x-10'>
        <NavLinks />
      </div>
      <Logo />
      <div className='flex flex-1 items-center justify-end lg:translate-x-10'>
        <HeaderMenu />
      </div>
    </div>
  );
}
