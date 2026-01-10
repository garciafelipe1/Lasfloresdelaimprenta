import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import MembershipsComparison from './membership-comparison';

export default async function Membresias() {
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
    </div>
  );
}
