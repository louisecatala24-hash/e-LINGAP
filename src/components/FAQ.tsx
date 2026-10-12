import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Theme } from '../types';

interface FAQProps {
  key?: string | number;
  title: string;
  answer: string;
  theme?: Theme;
}

export function FAQ({ title, answer, theme = 'light' }: FAQProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-3 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-[16px] px-5 py-4 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.99] ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-[#F1F5F9] hover:bg-[#E2E8F0]'}`}
      >
         <span className={`text-[13px] font-bold text-left leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</span>
         <div className={`w-8 h-8 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
           <ChevronDown size={18} />
         </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`px-5 py-4 text-[12px] leading-relaxed font-medium rounded-b-[16px] border border-t-0 -mt-2 ${theme === 'dark' ? 'bg-white/5 text-white/50 border-white/5' : 'bg-white/50 text-slate-600 border-[#F1F5F9]'}`}>
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
