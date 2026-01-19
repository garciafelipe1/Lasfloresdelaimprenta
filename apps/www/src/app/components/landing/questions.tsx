'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

export function Questions() {
  const i18n = useTranslations();
  
  // Obtener todas las preguntas desde las traducciones
  const questionsCount = 8; // Número total de preguntas
  const questions = Array.from({ length: questionsCount }, (_, index) => ({
    question: i18n(`landing.questions.items.${index}.question`),
    answer: i18n(`landing.questions.items.${index}.answer`),
  }));

  return (
    <div className='bg-custom relative isolate overflow-hidden'>
      <p className='text-primary justify-center text-center text-3xl font-extrabold sm:text-4xl'>
        {i18n('landing.questions.title')}
      </p>
      <div className='mx-auto flex max-w-5xl flex-col gap-12 px-8 py-24 md:flex-row'>
        <div className='basis-1/2 flex-col text-left text-primary '>
          <Accordion
            type='single'
            collapsible
            className='w-full gap-0 text-primary '
          >
            {questions
              .slice(0, Math.ceil(questions.length / 2))
              .map((q, index) => (
                <AccordionItem
                  key={index}
                  value={`item-left-${index }`}
                >
                  <AccordionTrigger className='text-left text-base text-primary font-semibold md:text-lg'>
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className='leading-relaxed text-primary'>
                    {q.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>

        <div className='basis-1/2 text-primary'>
          <Accordion
            type='single'
            collapsible
            className='w-full gap-0'
          >
            {questions
              .slice(Math.ceil(questions.length / 2))
              .map((q, index) => (
                <AccordionItem
                  key={index + Math.ceil(questions.length / 2)}
                  value={`item-right-${index}`}
                >
                  <AccordionTrigger className='text-left text-base font-semibold md:text-lg text-primary'>
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className='leading-relaxed text-primary'>
                    {q.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
