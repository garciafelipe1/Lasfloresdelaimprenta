import { PropsWithChildren } from 'react';
import { Tabs } from './_components/tabs';

export default function SettingsLayout({ children }: PropsWithChildren) {
  return (
    <section className='flex flex-col gap-12 [&>:nth-child(2)]:divide-y'>
      <Tabs />
      {children}
    </section>
  );
}
