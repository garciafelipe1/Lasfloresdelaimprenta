// Este componente se usa en conjunto con motion-item.tsx

'use client';

import { HTMLMotionProps, motion, Variants } from 'motion/react';

type Props = HTMLMotionProps<'ul'>;

const listVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  hidden: {},
};

export function MotionList({ ...args }: Props) {
  return (
    <motion.ul
      variants={listVariants}
      animate='visible'
      initial='hidden'
      exit='hidden'
      {...args}
    />
  );
}
