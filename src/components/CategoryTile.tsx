import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Theme } from '../types';

interface CategoryTileProps {
  title: string;
  sub: string;
  icon: ReactNode;
  onClick: () => void;
  delay: number;
  theme?: Theme;
  t?: any;
}

export function CategoryTile({ title, sub, icon, onClick, delay, theme = 'light', t }: CategoryTileProps) {
  const isFilipino = t?.langCode === 'FIL';
  const badgeLabel = isFilipino ? 'KATEGORYA' : 'ELIGIBILITY';
  const actionLabel = isFilipino ? 'Pumili ng kategorya' : 'Select category';

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-5 rounded-[24px] border flex flex-col gap-4 cursor-pointer transition-all duration-300 group overflow-hidden ${
        theme === 'dark' 
          ? 'bg-[#131d35]/90 border-blue-900/40 text-slate-100 shadow-sm' 
          : 'bg-slate-50 border-slate-200 text-slate-800 shadow-md'
      }`}
    >
      {/* Upper row: Pill badge and small visual accent indicator */}
      <div className="flex items-center justify-between w-full">
        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
          theme === 'dark'
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-blue-100 text-[#001F54]'
        }`}>
          {badgeLabel}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-primary'} opacity-70`} />
      </div>

      {/* Main row: Icon and content matching the text weight and letter-spacing */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
          theme === 'dark' 
            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/10 shadow-inner' 
            : 'bg-blue-50 text-[#1B4FD8] border border-blue-100 shadow-sm'
        }`}>
          {icon}
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <h3 className={`text-[14px] font-black uppercase tracking-tight leading-none ${
            theme === 'dark' ? 'text-white' : 'text-[#001F54]'
          }`}>
            {title}
          </h3>
          <p className={`text-[10px] font-bold uppercase tracking-wide leading-none mt-1 line-clamp-1 truncate ${
            theme === 'dark' ? 'text-white/40' : 'text-slate-400'
          }`}>
            {sub}
          </p>
        </div>
      </div>

      {/* Lower row: Elegant text link action separated by divider */}
      <div className="flex items-center justify-between pt-2.5 border-t border-current/10">
        <span className={`text-[8.5px] font-black uppercase tracking-widest leading-none ${
          theme === 'dark' ? 'text-blue-400' : 'text-primary'
        }`}>
          {actionLabel}
        </span>
        <motion.div 
          className="text-current opacity-60"
        >
          <ChevronRight size={12} />
        </motion.div>
      </div>
    </motion.div>
  );
}
