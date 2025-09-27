import { PropsWithChildren } from 'react';
import Fond from './fond';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <section className='grid min-h-dvh grid-rows-[200px_1fr] md:grid-cols-2 md:grid-rows-1'>
      <Fond />
      <section className='pattern-1'>{children}</section>
    </section>
  );
}
