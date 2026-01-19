import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { getTranslations } from 'next-intl/server';
import MembershipsComparison from './membership-comparison';

export default async function Membresias() {
  const t = await getTranslations('membership.comparison');
  
  return (
    <div className='flex h-full flex-col items-center gap-12 py-12'>
      <div className='w-full px-6'>
        <Section
          variant='page'
          size='desktop'
        >
          <SectionHeader>
            <SectionTitle>{t('title')}</SectionTitle>
            <SectionSubtitle>{t('subtitle')}</SectionSubtitle>
          </SectionHeader>
          <MembershipsComparison />
        </Section>
      </div>
    </div>
  );
}
