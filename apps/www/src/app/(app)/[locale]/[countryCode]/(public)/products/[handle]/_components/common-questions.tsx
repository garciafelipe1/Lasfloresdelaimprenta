'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { useTranslations } from 'next-intl';

export function CommonQuestions() {
  const t = useTranslations('landing.questions.items');

  const questions = [
    {
      question: t('0.question'),
      answer: t('0.answer'),
    },
    {
      question: t('1.question'),
      answer: t('1.answer'),
    },
    {
      question: t('2.question'),
      answer: t('2.answer'),
    },
    {
      question: t('3.question'),
      answer: t('3.answer'),
    },
  ];

  return (
    <Accordion
      type='single'
      collapsible
      className='w-full gap-20'
    >
      {questions.map((q, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
        >
          <AccordionTrigger className='text-left text-base font-semibold md:text-lg'>
            {q.question}
          </AccordionTrigger>
          <AccordionContent className='leading-relaxed'>
            {q.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
