import { Card } from '@/app/components/ui/card';
import { CheckCheckIcon, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Step, STEPS } from '../constants';

interface Props {
  stepSlug: Step;
}

export function EditCard({ stepSlug }: Props) {
  const step = STEPS[stepSlug];

  return (
    <Card className='flex-row justify-between bg-gradient-to-r from-green-400/20 to-transparent px-4'>
      <div className='flex items-center gap-2'>
        <CheckCheckIcon />
        <p className='m-0'>{step.label}</p>
      </div>
      <Link
        href={step.href}
        className='group flex'
      >
        <ChevronLeft className='translate-x-2 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100' />
        Editar
      </Link>
    </Card>
  );
}
