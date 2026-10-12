import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Theme } from '../types';

interface SettingsItemProps {
  icon: ReactNode;
  title: string;
  sub?: string;
  onClick?: () => void;
  toggle?: boolean;
  toggled?: boolean;
  badge?: string;
  arrow?: boolean;
  iconBg?: string;
  iconColor?: string;
  isDark?: boolean;
}

export function SettingsItem({ 
  icon, 
  title, 
  sub, 
  onClick, 
  toggle, 
  toggled,
  badge,
  arrow,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  isDark = false
}: SettingsItemProps) {
  return (
    <button 
      onClick={toggle ? undefined : onClick}
      className={`w-full h-[76px] border rounded-[22px] px-5 flex items-center gap-4 transition-all active:scale-[0.98] mb-3 group ${isDark ? 'bg-[#161B28] border-white/5' : 'bg-[#F8FAFC] border-slate-100'}`}
    >
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center shrink-0 shadow-sm ${iconColor}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <div className="flex-1 overflow-hidden">
        <h4 className={`text-[14px] font-bold text-left leading-tight truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
        {sub && <p className="text-[11px] text-slate-400 font-bold text-left mt-0.5 truncate uppercase tracking-widest">{sub}</p>}
      </div>
      {badge && (
        <div className="bg-primary/10 px-2.5 py-1.5 rounded-xl">
          <span className="text-[10px] font-black text-primary uppercase leading-none">{badge}</span>
        </div>
      )}
      {toggle ? (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${toggled ? 'bg-[#059669]' : 'bg-[#CBD5E1]'}`}
        >
           <motion.div 
            animate={{ x: toggled ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4 h-4 bg-white rounded-full shadow-md" 
           />
        </div>
      ) : (
        arrow && <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      )}
    </button>
  );
}
