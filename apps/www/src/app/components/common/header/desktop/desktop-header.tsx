import { Logo } from '../logo';
import { NavLinks } from '../nav-links/nav-links';
import { HeaderMenu } from './header-menu';

export function DesktopHeader() {
  return (
    <div className='max-w-desktop mx-auto flex items-center justify-between py-2'>
      <NavLinks />
      <Logo />
      <HeaderMenu />
    </div>
  );
}
