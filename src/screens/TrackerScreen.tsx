import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Activity, Shield, ArrowLeft } from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { UserProfile, Screen, Theme, Appointment } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Button } from '../components/Button';

interface TrackerScreenProps {
  key?: string;
  profile: UserProfile | null;
  navigate: (s: Screen) => void;
  t: any;
  theme: Theme;
}

export function TrackerScreen({ profile, navigate, t, theme }: TrackerScreenProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(apts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleCancel = async (docId: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', docId));
      setActionMessage(t.aptCancelled);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      handleFirestoreError(error, 'delete', `appointments/${docId}`);
    }
  };

  const handleReschedule = async (docId: string) => {
    try {
      await updateDoc(doc(db, 'appointments', docId), {
        date: 'May 15, 2026',
        status: 'Rescheduled'
      });
      setActionMessage(t.aptRescheduled.replace('{date}', 'May 15, 2026'));
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      handleFirestoreError(error, 'update', `appointments/${docId}`);
    }
  };

  return (
    <ScreenWrapper hasNav theme={theme}>
      <div className={`h-full flex flex-col overflow-hidden relative pt-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F7FF]'}`}>
        <div className="px-6 mb-4 shrink-0 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('HOME')}
               className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.appointments || 'APPOINTMENTS'}</p>
              <h1 className={`text-2xl font-black tracking-tight leading-none uppercase ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.trackApp}</h1>
            </div>
          </div>
          <AnimatePresence>
            {actionMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg absolute top-6 right-6 z-50"
              >
                {actionMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-24 flex flex-col gap-4">
           {loading ? (
             <div className="py-20 flex flex-col items-center opacity-40">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t.loading}</p>
             </div>
           ) : appointments.length > 0 ? (
             appointments.map((apt, i) => (
                <motion.div 
                  key={apt.docId}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-[28px] border p-5 shadow-soft hover:shadow-float transition-all ${theme === 'dark' ? 'bg-[#161B28] border-white/5' : 'bg-white border-slate-100'}`}
                >
                  {/* Card Content same as original */}
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                           <Calendar size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none font-mono ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>{t.ref || 'REF'}: {apt.docId.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all duration-500 ${
                        ['Approved', 'Inaprubahan', 'Confirmed', 'Kumpirmado'].includes(apt.status) 
                          ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]' : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)]') 
                          : ['Rejected', 'Tinanggihan', 'Declined', 'Cancelled', 'Kinansela', 'Naka-cancel'].includes(apt.status)
                            ? (theme === 'dark' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' : 'bg-red-50 text-red-600 border-red-100 shadow-[0_2px_10px_-3px_rgba(239,68,68,0.1)]')
                            : (theme === 'dark' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)] animate-pulse' : 'bg-orange-50 text-orange-600 border-orange-100 shadow-[0_2px_10px_-3px_rgba(249,115,22,0.1)] animate-pulse')
                      }`}>
                        {apt.status === 'Pending' ? (t.langCode === 'FIL' ? 'Pinoproseso' : 'Processing') : apt.status}
                      </div>
                  </div>

                  <div className="mb-4">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{apt.benefitTitle}</h4>
                      <h3 className={`text-sm font-black tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{apt.date}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin size={10} className={theme === 'dark' ? 'text-white' : 'text-slate-400'} />
                        <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-500'}`}>{apt.location}</span>
                      </div>
                  </div>

                  <div className={`flex items-center gap-3 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-50'}`}>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReschedule(apt.docId)}
                      className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      theme={theme}
                    >
                      {t.reschedule}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleCancel(apt.docId)}
                      className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest border-red-50/50 text-red-400 active:scale-95 transition-all"
                      theme={theme}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </motion.div>
             ))
           ) : (
             <div className="py-12 flex flex-col items-center opacity-40">
                <Calendar size={48} className="text-slate-300 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t.noActiveApt}</p>
             </div>
           )}

            <div className="bg-[#001F54] rounded-[32px] p-6 text-white overflow-hidden relative shadow-float mt-4">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
               <div className="relative z-10 flex flex-col items-center py-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                     <Activity size={24} className="text-white" />
                  </div>
                  <h4 className="text-sm font-black text-center mb-2 uppercase tracking-tight">{t.needSupport}</h4>
                  <p className="text-[10px] text-white/60 text-center mb-6 leading-relaxed">{t.supportSub}</p>
                  <Button onClick={() => navigate('HOME')} className="w-full h-12 text-[10px] uppercase font-black tracking-widest active:scale-95 transition-all" theme={theme} variant="outline">{t.goToDash}</Button>
               </div>
            </div>
        </div>
      </div>
    </ScreenWrapper>
  );
}
