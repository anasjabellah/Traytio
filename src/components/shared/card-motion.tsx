'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

type CardMotionProps = {
  index?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
};

export function CardMotion({ index = 0, delay = 0.03, className, children }: CardMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
