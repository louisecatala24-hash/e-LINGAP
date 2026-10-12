import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowLeft, Shield, LogIn, ChevronRight, X, Facebook, Mail } from 'lucide-react';
import dswdLogo from '@/images/DSWD.png';
import { Screen, Category, Language, Theme, Benefit } from '../types';
import { subscribeToBenefits } from '../lib/benefitService';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { BenefitCard } from '../components/BenefitCard';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'motion/react';

interface BenefitsScreenProps {
  key?: string;
  navigate: (s: Screen) => void;
  category: Category;
  onGoogleAuth: () => void;
  onFacebookAuth: () => void;
  onEmailAuth: (email: string, pass: string, isLogin: boolean) => Promise<void>;
  hasProfile: boolean;
  language: Language;
  t: any;
  theme: Theme;
}

export function BenefitsScreen({ navigate, category, onGoogleAuth, onFacebookAuth, onEmailAuth, hasProfile, language, t, theme }: BenefitsScreenProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMethod, setAuthMethod] = useState<'CHOICE' | 'EMAIL'>('CHOICE');
  const [modalType, setModalType] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToBenefits(language, category, (data) => {
      setBenefits(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [category, language]);

  const handleAction = (benefit: Benefit) => {
    if (!hasProfile) {
      setAuthMethod('CHOICE');
      setModalType('LOGIN');
      setError(null);
      setShowLoginModal(true);
    } else {
      setSelectedBenefit(benefit);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onEmailAuth(email, password, modalType === 'LOGIN');
      setShowLoginModal(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper hasNav theme={theme}>
      <div className={`h-full flex flex-col overflow-hidden relative pt-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#E9F0F8]'}`}>
        <div className="px-6 mb-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(hasProfile ? 'HOME' : 'LOBBY')}
               className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-[#001F54]/50'}`}>{t.programs}</p>
              <h1 className={`text-2xl font-black tracking-tight leading-none uppercase ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                {category ? category.replace('-', ' ') : t.allCategories || 'All Programs'}
              </h1>
            </div>
          </div>
          
          <div className={`px-3 py-2 rounded-2xl border flex flex-col items-center justify-center min-w-[70px] ${theme === 'dark' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-blue-50 border-blue-100 text-[#001F54]'}`}>
            <span className="text-xl font-black leading-none">{benefits.length}</span>
            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">{t.available || 'Active'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-28 pt-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin mb-4" />
               <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Loading Benefits...</p>
             </div>
          ) : benefits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-white/5 text-white/20' : 'bg-[#001F54]/5 text-[#001F54]/20'}`}>
                <Briefcase size={40} />
              </div>
              <h2 className={`text-lg font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.noPrograms || 'No Programs Found'}</h2>
              <p className={`text-xs font-bold leading-relaxed px-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                {t.noProgramsDesc || 'Check back later for new government grants and social aid available in your category.'}
              </p>
              <Button 
                onClick={() => navigate('HOME')} 
                className="mt-8 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                theme={theme}
              >
                Go to Home
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {benefits.map((b, i) => (
                <BenefitCard 
                  key={i} 
                  title={b.title} 
                  amount={b.amount} 
                  freq={b.freq} 
                  icon={b.icon} 
                  color={b.color}
                  desc={b.desc}
                  active={expandedIndex === i} 
                  isOpen={expandedIndex === i}
                  onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  onApply={() => handleAction(b)}
                  isLoggedIn={hasProfile}
                  t={t}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </div>

        {/* Benefit Details Modal */}
        <AnimatePresence>
          {selectedBenefit && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBenefit(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[110]"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className={`absolute inset-x-0 bottom-0 z-[111] rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl overflow-y-auto max-h-[85vh] ${theme === 'dark' ? 'bg-[#161B28]' : 'bg-white'}`}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setSelectedBenefit(null)} />
                
                <div className="flex items-start gap-5 mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${selectedBenefit.color === 'primary' ? 'bg-primary text-white' : 'bg-blue-50 text-primary'}`}>
                    {selectedBenefit.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-black leading-tight uppercase mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                      {selectedBenefit.title}
                    </h3>
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-primary' : 'text-blue-600'}`}>
                         {selectedBenefit.amount} {selectedBenefit.freq}
                       </span>
                       <span className="w-1 h-1 rounded-full bg-slate-300" />
                       <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                         {selectedBenefit.category || 'General'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Program Description</h4>
                    <p className={`text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                      {selectedBenefit.desc || 'This government-backed program provides financial assistance and social support to eligible citizens as part of the DSWD national welfare initiative.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                         <Shield size={18} />
                       </div>
                       <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-slate-900'}`}>Eligibility Status</h4>
                    </div>
                    <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                      You are eligible for this program based on your verified {selectedBenefit.category || 'citizen'} profile. Applications are processed within 3-5 working days.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => navigate('APPLYING_BENEFIT')}
                      className="flex-[2] h-14 rounded-2xl shadow-lg"
                      theme={theme}
                    >
                      {t.applyNow || 'Apply Now'}
                    </Button>
                    <button 
                      onClick={() => setSelectedBenefit(null)}
                      className={`flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {t.close || 'Close'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Login Prompt Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLoginModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className={`absolute inset-x-0 bottom-0 z-[101] rounded-t-[40px] px-8 pt-8 pb-12 shadow-2xl ${theme === 'dark' ? 'bg-[#161B28]' : 'bg-white'}`}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setShowLoginModal(false)} />
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white border border-slate-100 dark:border-white/5 shadow-md p-1 overflow-hidden">
                    <img src={dswdLogo} alt="DSWD Logo" className="w-14 h-14 object-contain scale-[1.25]" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className={`text-xl font-black mb-2 uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>Secure Portal Access</h3>
                  <p className={`text-xs font-bold leading-relaxed px-4 mb-8 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                    To apply for benefits and view full program details, please sign in to your secure DSWD account.
                  </p>
                  
                  <div className="w-full mb-8">
                    {authMethod === 'CHOICE' ? (
                      <div className="space-y-3">
                        <button 
                          onClick={onGoogleAuth}
                          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 border transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
                        >
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                          <span className="font-bold text-sm tracking-tight text-current">Continue with Google</span>
                        </button>

                        <button 
                          onClick={onFacebookAuth}
                          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 bg-[#1877F2] text-white transition-all active:scale-[0.98] hover:bg-[#166fe5] shadow-lg shadow-blue-500/20"
                        >
                          <Facebook size={20} fill="currentColor" />
                          <span className="font-bold text-sm tracking-tight text-white">Continue with Facebook</span>
                        </button>

                        <button 
                          onClick={() => setAuthMethod('EMAIL')}
                          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-900 text-white shadow-lg'}`}
                        >
                          <Mail size={20} />
                          <span className="font-bold text-sm tracking-tight text-current">{t.manualLogin}</span>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-500 font-bold uppercase tracking-wider text-center">
                            {error}
                          </div>
                        )}
                        <div className="space-y-2 text-left">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.emailAddress}</label>
                          <input 
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full h-14 px-5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500/50'}`}
                            placeholder="name@example.com"
                          />
                        </div>
                        <div className="space-y-2 text-left">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.password}</label>
                          <input 
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full h-14 px-5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500/50'}`}
                            placeholder="••••••••"
                          />
                        </div>
                        <Button 
                          type="submit"
                          loading={loading}
                          className="w-full h-14 rounded-2xl shadow-lg"
                          theme={theme}
                        >
                          {modalType === 'LOGIN' ? t.signIn : t.signUp}
                        </Button>
                        <button 
                          type="button"
                          onClick={() => setAuthMethod('CHOICE')}
                          className={`w-full text-[10px] font-black uppercase tracking-widest py-2 ${theme === 'dark' ? 'text-white/20 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                          {t.goBack}
                        </button>
                      </form>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (modalType === 'LOGIN') {
                        setShowLoginModal(false);
                        navigate('REGISTER');
                      } else {
                        setModalType('LOGIN');
                      }
                    }}
                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group transition-colors ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-primary'}`}
                  >
                    {modalType === 'LOGIN' ? t.dontHaveAccount : t.alreadyHaveAccount} 
                    <span className="text-primary underline flex items-center gap-1">
                      {modalType === 'LOGIN' ? t.signUpHere : t.signInHere} 
                      <ChevronRight size={12} />
                    </span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  );
}
