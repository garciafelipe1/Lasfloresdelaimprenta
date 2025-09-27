import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';

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
];

export function CommonQuestions() {
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
