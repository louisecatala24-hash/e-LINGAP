import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, CreditCard, Star, ChevronRight, 
  CheckCircle2, QrCode, Smartphone, ArrowLeft
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Screen, UserProfile, Theme, Benefit, Language, Category } from '../types';
import { subscribeToBenefits, fetchRequirements } from '../lib/benefitService';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { QuickAction } from '../components/QuickAction';

interface ApplyingBenefitScreenProps {
  key?: string;
  profile: UserProfile | null;
  category: Category;
  onCategorySelect?: (c: Category) => void;
  navigate: (s: Screen) => void;
  language: Language;
  t: any;
  theme: Theme;
}

export function ApplyingBenefitScreen({ profile, category, onCategorySelect, navigate, language, t, theme }: ApplyingBenefitScreenProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingFor, setApplyingFor] = useState<Benefit | null>(null);
  const [appStep, setAppStep] = useState<'info' | 'requirements' | 'appointment' | 'success'>('info');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateError, setDateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    
    // Subscribe to benefits real-time
    const unsubscribeBenefits = subscribeToBenefits(language, category, (data) => {
      setBenefits(data);
    });

    async function getReqs() {
      try {
        const reqData = await fetchRequirements(language, category);
        setRequirements(reqData);
      } catch (err) {
        console.error("Failed to load application data:", err);
      } finally {
        setLoading(false);
      }
    }
    getReqs();

    return () => unsubscribeBenefits();
  }, [category, language]);
  
  const effectiveCategory = category;
  const topBenefits = benefits.slice(0, 3);

  // If no category is selected, show a selection screen first
  if (!effectiveCategory) {
    const handleCategoryPick = (cat: Category) => {
      if (onCategorySelect) onCategorySelect(cat);
    };

    return (
      <ScreenWrapper hasNav theme={theme}>
        <div className={`h-full flex flex-col overflow-hidden relative pt-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F7FF]'}`}>
          <div className="px-6 mb-8 shrink-0 flex items-center gap-4 relative z-[100]">
             <button onClick={() => navigate('HOME')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}>
               <ArrowLeft size={20} />
             </button>
             <div>
                <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.socialAidPortal}</p>
                <h1 className={`text-xl font-black tracking-tight leading-none uppercase ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                  {t.selectCategory}
                </h1>
             </div>
          </div>

          <div className="flex-1 px-6 flex flex-col justify-center gap-4 -mt-20 overflow-y-auto pb-32 scrollbar-none relative z-10">
             <div className="text-center mb-8">
               <p className={`text-sm font-bold leading-relaxed px-4 ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                 {t.pleaseSelectCategoryDesc}
               </p>
             </div>
             
             <motion.button
               whileTap={{ scale: 0.98 }}
               onClick={() => handleCategoryPick('solo-parent')}
               className={`p-6 rounded-[32px] border text-left flex items-center gap-4 transition-all ${theme === 'dark' ? 'bg-[#161B28] border-white/5 active:bg-white/10' : 'bg-white border-slate-100 active:bg-slate-50 shadow-sm'}`}
             >
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                 <User size={24} />
               </div>
               <div className="flex-1">
                  <h4 className={`text-base font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.soloParent}</h4>
                  <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.soloParentSub}</p>
               </div>
               <ChevronRight size={16} className="text-slate-300" />
             </motion.button>

             <motion.button
               whileTap={{ scale: 0.98 }}
               onClick={() => handleCategoryPick('pwd')}
               className={`p-6 rounded-[32px] border text-left flex items-center gap-4 transition-all ${theme === 'dark' ? 'bg-[#161B28] border-white/5 active:bg-white/10' : 'bg-white border-slate-100 active:bg-slate-50 shadow-sm'}`}
             >
               <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                 <Shield size={24} />
               </div>
               <div className="flex-1">
                  <h4 className={`text-base font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.pwds}</h4>
                  <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.pwdSub}</p>
               </div>
               <ChevronRight size={16} className="text-slate-300" />
             </motion.button>

             <motion.button
               whileTap={{ scale: 0.98 }}
               onClick={() => handleCategoryPick('senior')}
               className={`p-6 rounded-[32px] border text-left flex items-center gap-4 transition-all ${theme === 'dark' ? 'bg-[#161B28] border-white/5 active:bg-white/10' : 'bg-white border-slate-100 active:bg-slate-50 shadow-sm'}`}
             >
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                 <Star size={24} />
               </div>
               <div className="flex-1">
                  <h4 className={`text-base font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.seniorCitizen}</h4>
                  <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.seniorSub}</p>
               </div>
               <ChevronRight size={16} className="text-slate-300" />
             </motion.button>
          </div>
        </div>
      </ScreenWrapper>
    );
  }

  const handleApply = () => {
    setAppStep('requirements');
  };

  const handleConfirmRequirements = () => {
    setAppStep('appointment');
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDate) {
      setDateError(true);
      return;
    }
    
    if (!profile || !applyingFor) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: profile.uid,
        userName: `${profile.firstName} ${profile.lastName}`,
        userCategory: profile.category, // Original user category
        appliedCategory: effectiveCategory, // The category they chose to apply under
        benefitTitle: applyingFor.title,
        benefitCategory: applyingFor.category,
        date: selectedDate,
        status: 'Pending',
        location: 'DSWD Processing Center - District 1',
        createdAt: serverTimestamp()
      });
      setAppStep('success');
    } catch (error) {
      console.error("Error creating appointment:", error);
      handleFirestoreError(error, 'create', 'appointments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setApplyingFor(null);
    setAppStep('info');
    setSelectedDate('');
    setDateError(false);
  };

  const categoryConfigs: { [key: string]: { bg: string, text: string, icon: any, label: string } } = {
    'solo-parent': { bg: 'bg-blue-600', text: 'text-white', icon: <User size={20} />, label: t.soloParent },
    'senior': { bg: 'bg-indigo-600', text: 'text-white', icon: <Star size={20} />, label: t.seniorCitizen },
    'pwd': { bg: 'bg-emerald-600', text: 'text-white', icon: <Shield size={20} />, label: t.pwds }
  };

  const config = categoryConfigs[effectiveCategory];

  return (
    <ScreenWrapper hasNav theme={theme}>
      <div className={`h-full flex flex-col overflow-hidden relative pt-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F7FF]'}`}>
        <div className="px-6 mb-6 shrink-0 flex items-center gap-4 relative z-[100]">
           <button 
             onClick={() => category ? onCategorySelect?.(null) : navigate('HOME')}
             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}
           >
             <ArrowLeft size={20} />
           </button>
           <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.socialAidPortal}</p>
              <h1 className={`text-xl font-black tracking-tight leading-none uppercase ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                {config.label}
              </h1>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 pb-28">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-12">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
               <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Loading Programs...</p>
             </div>
           ) : (
             <>
               {/* Summary Card */}
              <div className={`p-5 rounded-[32px] border shadow-soft mb-6 relative overflow-hidden transition-all ${theme === 'dark' ? 'bg-[#161B28] border-white/5' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.appStatus}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.activeVerified}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.refId}</p>
                    <p className="text-[11px] font-mono font-black text-primary uppercase">
                      {profile ? `REF-${profile.uid.slice(0, 8)}` : t.guestMode}
                    </p>
                  </div>
                </div>
                <div className={`h-[1px] w-full mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`} />
                <div className="flex items-center justify-between font-bold">
                   <span className={`${theme === 'dark' ? 'text-white/60' : 'text-slate-500'} text-xs tracking-tight`}>{t.availBen}</span>
                   <span className="text-primary text-xl font-black">{benefits.length}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                 <div className={`${config.bg} ${config.text} px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 border border-current border-opacity-10`}>
                    <CreditCard size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.next}: May 2025</span>
                 </div>
                 <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                    <Star size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.benefits}: {benefits.length}</span>
                 </div>
                 <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 ${theme === 'dark' ? 'bg-[#001F54] text-white overflow-hidden relative shadow-inner' : 'bg-slate-900 text-white'}`}>
                    <Shield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.validUntil}: Dec 2025</span>
                 </div>
              </div>

              <div className="grid gap-3 mb-8">
                {benefits.map((b, i) => (
                  <motion.button 
                    key={i} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setApplyingFor(b)}
                    className={`p-4 rounded-[24px] border shadow-sm flex items-center justify-between transition-all text-left w-full group ${
                      theme === 'dark' ? 'bg-[#161B28] border-white/5 active:bg-white/5' : 'bg-white border-slate-100 active:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-400'}`}>
                        {b.icon}
                      </div>
                      <div>
                        <h4 className={`text-[13px] font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{b.title}</h4>
                        <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{b.amount} {b.freq}</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-white/20 group-hover:text-primary' : 'bg-slate-50 text-slate-300'}`}>
                      <ChevronRight size={16} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <QuickAction icon={<QrCode size={20} />} label={t.dswdId} sub={t.secureId} color="bg-blue-50 text-blue-600" theme={theme} />
            <QuickAction icon={<Smartphone size={20} />} label={t.digitalWallet} sub={t.payments} color="bg-emerald-50 text-emerald-600" theme={theme} />
          </div>
        </div>

        <AnimatePresence>
          {applyingFor && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className={`absolute inset-0 backdrop-blur-sm z-[100] ${theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/60'}`}
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className={`absolute inset-x-0 bottom-0 z-[101] rounded-t-[40px] px-8 pt-8 pb-12 shadow-2xl ${theme === 'dark' ? 'bg-[#121826]' : 'bg-white'}`}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-pointer" onClick={closeModal} />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                    {applyingFor.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest leading-none mb-1.5 font-mono ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    <h3 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{applyingFor.title}</h3>
                  </div>
                </div>

                <div className={`p-5 rounded-3xl mb-8 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                   {appStep === 'success' ? (
                    <div className="flex flex-col items-center py-4 gap-3">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>
                          <CheckCircle2 size={24} />
                       </div>
                       <p className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.applicationFiled}</p>
                       <p className={`text-xs font-bold text-center leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.appQueued.replace('{date}', selectedDate)}</p>
                    </div>
                  ) : appStep === 'requirements' ? (
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest leading-none mb-5 font-mono ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.docsRequired}</p>
                      <ul className="space-y-3">
                        {requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>{req}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : appStep === 'appointment' ? (
                    <div>
                      <Input 
                        label={t.enterAppoint}
                        type="date"
                        compact
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          if (e.target.value) setDateError(false);
                        }}
                        error={dateError ? t.dateError : undefined}
                        theme={theme}
                      />
                    </div>
                  ) : (
                    <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                      {t.proceedInitiate.replace('{title}', applyingFor.title).replace('{name}', profile ? `${profile.firstName} ${profile.lastName}` : 'Guest')}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  {appStep === 'info' && (
                    <Button onClick={handleApply} className="w-full py-4 h-14" theme={theme}>
                      {t.confirmApp}
                    </Button>
                  )}
                  {appStep === 'requirements' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => setAppStep('info')} className="w-full py-4 h-14" theme={theme}>
                        {t.goBack || 'Back'}
                      </Button>
                      <Button onClick={handleConfirmRequirements} className="w-full py-4 h-14" theme={theme}>
                        {t.proceedAppoint}
                      </Button>
                    </div>
                  )}
                  {appStep === 'appointment' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => setAppStep('requirements')} className="w-full py-4 h-14" theme={theme}>
                        {t.goBack || 'Back'}
                      </Button>
                      <Button onClick={handleConfirmAppointment} loading={isSubmitting} className="w-full py-4 h-14" theme={theme}>
                        {t.confirm}
                      </Button>
                    </div>
                  )}
                  {appStep === 'success' && (
                    <Button onClick={closeModal} className="w-full py-4 h-14" theme={theme}>
                      {t.goToDash}
                    </Button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  );
}
