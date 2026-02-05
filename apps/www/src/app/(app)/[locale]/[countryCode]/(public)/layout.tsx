import { Footer } from '@/app/components/common/footer/footer';
import { DesktopHeader } from '@/app/components/common/header/desktop/desktop-header';
import { Header } from '@/app/components/common/header/header';
import { MobileHeader } from '@/app/components/common/header/mobile/mobile-header';
import { WhatsAppReserveFloating } from '@/app/components/common/whatsapp/whatsapp-reserve-floating';
import { PropsWithChildren } from 'react';

export default async function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Header
        Desktop={<DesktopHeader />}
        Mobile={<MobileHeader />}
      />
      {children}
      <Footer />
      <WhatsAppReserveFloating />
    </>
  );
}
