// Este componente se usa en conjunto con motion-list.tsx

'use client';

import { HTMLMotionProps, motion, Variants } from 'motion/react';

type Props = HTMLMotionProps<'div'>;

const fadeIn: Variants = {
  visible: {
    opacity: 1,
    transition: {
      type: 'spring',
      duration: 0.5,
    },
    y: 0,
  },
  hidden: {
    opacity: 0,
    y: 10,
  },
};

export function MotionItem({ ...args }: Props) {
  return (
    <motion.div
      variants={fadeIn}
      {...args}
    />
  );
}
