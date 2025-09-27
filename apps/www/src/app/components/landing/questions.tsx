'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

const questions = [
  {
    question: 'Lorem ipsum, dolor sit amet consectetur?',
    answer:
      'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda cum amet blanditiis quis vero saepe quo veritatis ab dicta ratione cumque, labore velit omnis sequi voluptatem harum distinctio reiciendis eveniet!',
  },
  {
    question: 'Can I use this component in production?',
    answer:
      'Yes, it is designed to be production-ready and accessible by default.',
  },
  {
    question: 'How customizable is it?',
    answer:
      'You can customize the styling using Tailwind classes and extend functionality easily.',
  },
  {
    question: 'Is it mobile responsive?',
    answer:
      'Yes, it’s built with mobile responsiveness in mind and works well across screen sizes.',
  },
  {
    question: 'Can I animate the accordion transitions?',
    answer:
      'Yes, animations are enabled by default but can be adjusted or disabled if desired.',
  },
  {
    question: 'What is the typical use case for this component?',
    answer:
      'This component is commonly used to display a list of questions and their corresponding answers in a space-saving and interactive way.',
  },
  {
    question: 'Does it support multiple open items?',
    answer:
      'The current implementation is set to `type="single"`, meaning only one item can be open at a time. You can change this behavior if needed.',
  },
  {
    question: 'Are there any accessibility considerations?',
    answer:
      'Yes, this component is built with accessibility in mind, ensuring it is usable by everyone, including those using assistive technologies.',
  },
];

export function Questions() {
  const i18n = useTranslations();
  return (
    <div className='bg-custom relative isolate overflow-hidden'>
      <p className='text-base-content justify-center text-center text-3xl font-extrabold sm:text-4xl'>
        {i18n('landing.questions.title')}
      </p>
      <div className='mx-auto flex max-w-5xl flex-col gap-12 px-8 py-24 md:flex-row'>
        <div className='basis-1/2 flex-col text-left'>
          <Accordion
            type='single'
            collapsible
            className='w-full gap-0'
          >
            {questions
              .slice(0, Math.ceil(questions.length / 2))
              .map((q, index) => (
                <AccordionItem
                  key={index}
                  value={`item-left-${index}`}
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
        </div>

        <div className='basis-1/2'>
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
                  <AccordionTrigger className='text-left text-base font-semibold md:text-lg'>
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className='leading-relaxed'>
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
