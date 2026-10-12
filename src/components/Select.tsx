import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Theme } from '../types';

interface SelectProps {
  label: string;
  options: (string | { label: string, value: string })[];
  compact?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  theme?: Theme;
  error?: string | boolean;
}

export function Select({ label, options, compact, value, onChange, theme = 'light', error }: SelectProps) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      {label && <label className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{label}</label>}
      <div className="relative">
        <select 
          value={value}
          onChange={onChange}
          className={`w-full shadow-sm appearance-none ${compact ? 'p-3 text-[12px]' : 'p-4.5 text-[13px]'} border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-bold transition-all ${
            theme === 'dark'
              ? `bg-white/5 ${error ? 'border-red-500 bg-red-950/20' : 'border-white/5'} text-white`
              : `bg-white ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'} text-slate-800`
          }`}
        >
          {options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lab = typeof opt === 'string' ? opt : opt.label;
            return <option key={val} value={val} className={theme === 'dark' ? 'bg-[#161B28] text-white' : ''}>{lab}</option>;
          })}
        </select>
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
           <ChevronDown size={compact ? 14 : 18} />
        </div>
      </div>
    </div>
  );
}
