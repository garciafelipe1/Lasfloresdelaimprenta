import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { authService } from '@/services/auth.service';
import AccountForm from '../_components/account-form';
import { UserInfo } from './user-info';
import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string; countryCode: string }>;
};

export default async function AccountSettingsPage({ params }: Props) {
  const { locale, countryCode } = await params;
  const user = await authService.getUser();

  if (!user) {
    redirect(`/${locale}/${countryCode}/login?error=session_invalid`);
  }

  const { created_at, first_name, email, id } = user;

  return (
    <section className=''>
      <header className='mb-6 md:mb-8'>
        <h2 className='text-2xl md:text-3xl font-bold'>Configuraciones de la cuenta</h2>
        <p className='text-sm md:text-base text-muted-foreground mt-2'>Modifica las configuraciones de tu cuenta</p>
      </header>
      <section className='grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-6 lg:gap-0 lg:divide-x [&>[data-role=section]:first-child]:lg:pr-4 [&>[data-role=section]:last-child]:lg:pl-4'>
        <Section>
          <SectionHeader>
            <SectionTitle>Datos de tu cuenta</SectionTitle>
            <SectionSubtitle>Modificalos a tu gusto</SectionSubtitle>
          </SectionHeader>
          <AccountForm
            image={''}
            name={first_name!}
          />
        </Section>
        <UserInfo
          createdAt={created_at as string}
          email={email}
          id={id}
        />
      </section>
    </section>
  );
}
