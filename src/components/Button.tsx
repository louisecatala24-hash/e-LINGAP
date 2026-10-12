import React, { ReactNode } from 'react';
import { Theme } from '../types';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  theme?: Theme;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

export function Button({ children, onClick, className = '', variant = 'primary', disabled, theme = 'light', type = 'button', loading }: ButtonProps) {
  const baseStyles = "px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700",
    outline: theme === 'dark' 
      ? "bg-white/5 border border-white/10 text-white hover:bg-white/10" 
      : "bg-white border-2 border-[#001F54] text-[#001F54] hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
    danger: "bg-red-500 text-white shadow-red-500/30 hover:bg-red-600"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}
