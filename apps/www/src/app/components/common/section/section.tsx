import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

const sectionVariants = cva('flex flex-col gap-4', {
  variants: {
    variant: {
      default: '',
      page: 'mx-auto w-full',
    },
    size: {
      default: '',
      desktop: 'max-w-desktop',
      tablet: 'max-w-tablet',
      medium: 'max-w-medium',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type SectionProps = ComponentProps<'section'> &
  VariantProps<typeof sectionVariants>;

function Section({ variant, size, className, ...props }: SectionProps) {
  return (
    <section
      data-role='section'
      className={cn(sectionVariants({ variant, size, className }))}
      {...props}
    >
      {props.children}
    </section>
  );
}

function SectionHeader(args: ComponentProps<'h4'>) {
  return (
    <header
      data-role='header'
      {...args}
    />
  );
}

function SectionTitle(args: ComponentProps<'h4'>) {
  return (
    <h4
      className='text-primary mt-0 text-2xl font-semibold'
      data-role='title'
      {...args}
    />
  );
}

function SectionSubtitle(args: ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-primary/50 mt-0', args.className)}
      data-role='subtitle'
      {...args}
    />
  );
}

export { Section, SectionHeader, SectionSubtitle, SectionTitle };
