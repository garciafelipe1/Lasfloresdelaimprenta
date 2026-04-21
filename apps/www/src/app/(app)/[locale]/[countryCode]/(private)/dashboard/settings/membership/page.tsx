import { userService } from '@/services/user.service';
import { SubEmpty } from './_components/sub-empty';
import { SubInformation } from './_components/sub-information';

export default async function MembershipPage() {
  const { subscription: membership } = await userService.getSubscriptionInfo();

  return (
    <section>
      <header className='mb-6 md:mb-8'>
        <h2 className='text-2xl md:text-3xl font-bold'>Membresía</h2>
        <p className='text-sm md:text-base text-muted-foreground mt-2'>Modifica las configuraciones de tu cuenta</p>
      </header>
      {membership ? <SubInformation subscription={membership} /> : <SubEmpty />}
    </section>
  );
}
