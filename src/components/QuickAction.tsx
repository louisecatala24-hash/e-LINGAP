import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Theme } from '../types';

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  sub: string;
  color?: string;
  onClick?: () => void;
  theme?: Theme;
}

export function QuickAction({ icon, label, sub, color, onClick, theme = 'light' }: QuickActionProps) {
  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`p-4 text-left rounded-[24px] shadow-soft hover:shadow-float transition-all flex flex-col gap-3 group border ${theme === 'dark' ? 'bg-[#161B28] border-white/5 shadow-none' : 'bg-white border-slate-50'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${color || 'bg-slate-50 text-slate-600'}`}>
        {icon}
      </div>
      <div>
        <h4 className={`font-extrabold text-[13px] mb-0.5 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{label}</h4>
        <p className={`text-[8px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{sub}</p>
      </div>
    </motion.button>
  );
}
