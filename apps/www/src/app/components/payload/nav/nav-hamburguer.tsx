'use client';

import { Hamburger, useNav } from '@payloadcms/ui';

interface Props {
  baseClass: string;
}

export function NavHamburger({ baseClass }: Props) {
  const { navOpen, setNavOpen } = useNav();

  return (
    <button
      className={`${baseClass}__mobile-close`}
      tabIndex={!navOpen ? -1 : undefined}
      onClick={() => setNavOpen(false)}
      type='button'
    >
      <Hamburger isActive />
    </button>
  );
}
