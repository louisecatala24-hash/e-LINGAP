import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Theme } from '../types';

interface ScreenWrapperProps {
  children: ReactNode;
  hasNav?: boolean;
  theme?: Theme;
}

export function ScreenWrapper({ children, hasNav = false, theme = 'light' }: ScreenWrapperProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-[100dvh] w-full md:max-w-[768px] mx-auto flex flex-col relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F7FF]'
      }`}
    >
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </motion.div>
  );
}
