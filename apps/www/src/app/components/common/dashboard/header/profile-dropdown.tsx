'use client';

import { useAction } from 'next-safe-action/hooks';
import { logoutAction } from '@/app/actions/user/logout.action';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { StoreCustomer } from '@medusajs/types';
import { UserCircleIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const links = [
  {
    label: 'Configuraciones',
    href: '/dashboard/settings',
  },
];

interface Props {
  user: StoreCustomer | null; // 👈 clave que acepte null
}

export function ProfileDropdown({ user }: Props) {
  const { execute } = useAction(logoutAction);
  const userImage = '';

  // 👈 si no hay usuario, no renderizamos nada
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='flex gap-2'>
          <div className='relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border'>
            {userImage ? (
              <Image
                className='h-full w-full object-cover'
                alt='Profile picture'
                src={userImage}
                fill
              />
            ) : (
              <UserCircleIcon />
            )}
          </div>
          <p className='m-0'>{user.first_name}</p>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end'>
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {links.map((link) => (
            <DropdownMenuItem key={link.label}>
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => execute()}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
