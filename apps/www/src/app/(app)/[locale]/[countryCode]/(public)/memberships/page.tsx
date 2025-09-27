import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { authService } from '@/services/auth.service';
import MembershipsComparison from './membership-comparison';
import { MembershipDetails } from './membership-details';

export default async function Membresias() {
  const user = await authService.getUser();

  return (
    <div className='flex h-full flex-col items-center gap-12 py-12'>
      <div className='w-full px-6'>
        <Section
          variant='page'
          size='desktop'
        >
          <SectionHeader>
            <SectionTitle>Compara nuestras membresías</SectionTitle>
            <SectionSubtitle>Elige el plan perfecto para ti</SectionSubtitle>
          </SectionHeader>
          <MembershipsComparison />
        </Section>
      </div>
      <MembershipDetails user={user} />
    </div>
  );
}
