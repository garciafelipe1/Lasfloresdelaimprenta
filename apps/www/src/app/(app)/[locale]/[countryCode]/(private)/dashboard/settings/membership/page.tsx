import { userService } from '@/services/user.service';
import { SubEmpty } from './_components/sub-empty';
import { SubInformation } from './_components/sub-information';

export default async function MembershipPage() {
  const membership = await userService.getSubscriptionInfo();

  return (
    <section>
      <header>
        <h2>Membresía</h2>
        <p>Modifica las configuraciones de tu cuenta</p>
      </header>
      {membership ? <SubInformation subscription={membership} /> : <SubEmpty />}
    </section>
  );
}
