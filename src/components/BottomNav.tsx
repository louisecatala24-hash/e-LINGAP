import React, { ReactNode } from 'react';
import { Home, Briefcase, Calendar, HelpCircle, Settings } from 'lucide-react';
import { Screen, Theme } from '../types';

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (s: Screen) => void;
  t: any;
  theme: Theme;
}

export function BottomNav({ activeScreen, onNavigate, t, theme }: BottomNavProps) {
  const navItems: { screen: Screen, label: string, icon: ReactNode }[] = [
    { screen: 'HOME', label: t.home, icon: <Home size={18} /> },
    { screen: 'BENEFITS', label: t.benefits, icon: <Briefcase size={18} /> },
    { screen: 'TRACKER', label: t.tracker, icon: <Calendar size={18} /> },
    { screen: 'HELP', label: t.help, icon: <HelpCircle size={18} /> },
    { screen: 'SETTINGS', label: t.settings, icon: <Settings size={18} /> },
  ];

  return (
    <div className={`h-[60px] border-t flex justify-between items-center px-1 flex-none z-50 rounded-t-[16px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#161B28] border-white/5' : 'bg-[#001F54] border-[#001F54]'
    }`}>
      {navItems.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className={`flex flex-col items-center gap-0 transition-all w-full py-1 rounded-xl mx-0.5 ${
            activeScreen === item.screen 
              ? 'text-white' 
              : 'text-white/40'
          }`}
        >
          <div className={`${activeScreen === item.screen ? 'scale-100 bg-white/10 rounded-full p-1.5' : 'scale-90 p-1.5'} transition-all`}>
            {item.icon}
          </div>
          <span className={`text-[7px] font-black uppercase tracking-tight ${activeScreen === item.screen ? 'text-white opacity-100' : 'opacity-60'}`}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
