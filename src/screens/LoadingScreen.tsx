import React from 'react';
import { motion } from 'motion/react';
import dswdLogo from '@/images/DSWD.png';

interface LoadingScreenProps {
  t: any;
  key?: string;
}

export function LoadingScreen({ t }: LoadingScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col items-center justify-center bg-[#001F54] p-8 text-center text-white overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32" />
      
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mb-8 shadow-2xl p-1 overflow-hidden"
      >
        <img 
          src={dswdLogo} 
          alt="DSWD Logo" 
          className="w-18 h-18 object-contain scale-[1.25]" 
          referrerPolicy="no-referrer" 
        />
      </motion.div>
      <h1 className="text-2xl font-black tracking-tighter mb-2 uppercase italic">DSWD</h1>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{t.verifyingSession || 'Verifying Session...'}</p>
    </motion.div>
  );
}
