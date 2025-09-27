import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { authService } from '@/services/auth.service';
import AccountForm from '../_components/account-form';
import { UserInfo } from './user-info';

export default async function AccountSettingsPage() {
  const user = await authService.getUser();

  if (!user) {
    throw new Error('User not found');
  }

  const { created_at, first_name, email, id } = user;

  return (
    <section className=''>
      <header>
        <h2>Configuraciones de la cuenta</h2>
        <p>Modifica las configuraciones de tu cuenta</p>
      </header>
      <section className='grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] divide-x [&>[data-role=section]:first-child]:pr-4 [&>[data-role=section]:last-child]:pl-4'>
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
