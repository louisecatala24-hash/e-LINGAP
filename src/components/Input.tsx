import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Theme } from '../types';

interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  compact?: boolean;
  theme?: Theme;
}

export function Input({ label, type = 'text', value, onChange, placeholder, error, hint, compact, theme = 'light' }: InputProps) {
  const [showPasswordValue, setShowPasswordValue] = useState(false);
  const isPasswordField = type === 'password';
  const resolvedType = isPasswordField ? (showPasswordValue ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      <div className="flex justify-between items-center ml-1">
        <label className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-black uppercase tracking-widest ${
          error ? 'text-red-500 font-bold' : (theme === 'dark' ? 'text-white/20' : 'text-slate-400')
        }`}>
          {label}
        </label>
        {error && (
          <span className="text-[9px] text-red-500 font-black uppercase tracking-wide animate-pulse">
            ⚠️ {error}
          </span>
        )}
      </div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase tracking-wide px-3 py-2 rounded-xl ml-1 mr-1 animate-pulse flex items-center gap-1.5 shrink-0">
          <span className="shrink-0 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md">⚠️ REQUIRED</span>
          <span>{error === 'Required' || error === 'Kinakailangan' ? 'THIS FIELD MUST BE FILLED OUT / DAPAT PUNAN ANG PUWANG ITO' : error}</span>
        </div>
      )}
      <div className="relative w-full">
        <input 
          type={resolvedType}
          value={value}
          onChange={onChange}
          className={`w-full shadow-sm ${compact ? 'p-3 text-[12px]' : 'p-4.5 text-[13px]'} ${isPasswordField ? 'pr-12' : ''} border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-bold transition-all placeholder:font-medium ${
            theme === 'dark' 
              ? `bg-white/5 ${error ? 'border-red-500 bg-red-950/20' : 'border-white/5'} text-white placeholder:text-white/10` 
              : `bg-white ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'} text-slate-800 placeholder:text-slate-300`
          }`}
          placeholder={placeholder}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPasswordValue(!showPasswordValue)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60 transition-all hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none"
          >
            {showPasswordValue ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {!error && hint && <p className={`text-[9px] font-bold ml-1 tracking-wide ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  );
}
