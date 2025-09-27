import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '../common/section/section';
import { Skeleton } from '../ui/skeleton';

export function ExamplesSkeleton() {
  return (
    <div className='py-24 sm:py-32'>
      <Section className='mx-auto w-full max-w-7xl px-20'>
        <SectionHeader className='flex flex-col items-center justify-center'>
          <SectionTitle className=''>
            Ejemplos de nuestra temporada
          </SectionTitle>
          <SectionSubtitle>
            Explora nuestra colección de arreglos de peonía de temporada,
            perfectos para cualquier occasión.
          </SectionSubtitle>
        </SectionHeader>
        <div className='grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8'>
          {Array(3)
            .fill(1)
            .map((n, idx) => (
              <Skeleton
                key={idx}
                className='h-[500px] rounded-md'
              />
            ))}
        </div>
      </Section>
    </div>
  );
}
