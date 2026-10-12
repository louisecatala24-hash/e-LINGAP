import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Theme } from '../types';
import { Button } from './Button';

interface BenefitCardProps {
  key?: string | number;
  title: string;
  amount: string;
  freq: string;
  icon: ReactNode;
  active?: boolean;
  color?: string;
  desc?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onApply?: () => void;
  isLoggedIn?: boolean;
  t?: any;
  theme?: Theme;
}

export function BenefitCard({ 
  title, amount, freq, icon, active, color, desc, 
  isOpen = false, onToggle, onApply, isLoggedIn, t, theme = 'light' 
}: BenefitCardProps) {
  const colorMap: { [key: string]: string } = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    slate: 'bg-slate-50 text-slate-400'
  };

  return (
    <div className={`rounded-[24px] border ${active ? (theme === 'dark' ? 'border-primary/40 bg-primary/10' : 'border-primary/20 bg-primary/5 shadow-float-sm') : (theme === 'dark' ? 'border-white/5' : 'border-slate-200')} mb-3 overflow-hidden shadow-soft transition-all group ${theme === 'dark' ? 'bg-[#161B28]' : 'bg-white'}`}>
       <button 
          onClick={onToggle}
          className={`w-full text-left p-4 flex items-center gap-4 transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
       >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-all ${active ? 'bg-primary text-white' : (colorMap[color || 'slate'] || 'bg-slate-50 text-slate-400')}`}>
            {icon}
          </div>
          <div className="flex-1">
             <h4 className={`font-extrabold text-sm mb-0.5 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
             <p className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-primary' : (theme === 'dark' ? 'text-white/40' : 'text-slate-400')}`}>{amount} {freq}</p>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className={active ? 'text-primary' : (theme === 'dark' ? 'text-white/20' : 'text-slate-200')}>
            <ChevronDown size={16} />
          </motion.div>
       </button>
       <AnimatePresence>
         {isOpen && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className={`px-4 pb-4 border-t pt-3 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}
           >
             <p className={`text-[10px] leading-tight mb-4 font-bold ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>{desc || (t ? t.portalVerified : 'Portal verified program for eligible beneficiaries.')}</p>
             <Button 
               onClick={() => {
                 onApply?.();
               }}
               theme={theme}
               className="w-full text-[9px] h-10 shadow-sm"
               variant="primary"
             >
               {t.benefitDetails || 'View Information'}
             </Button>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
