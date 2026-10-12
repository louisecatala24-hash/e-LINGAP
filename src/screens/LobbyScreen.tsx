import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Star, Heart, Shield, LogOut, Facebook, Mail, ChevronRight, Eye, EyeOff } from 'lucide-react';
import dswdLogo from '@/images/DSWD.png';
import { Screen, Category, Language, Theme } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { WordRotate } from '../components/WordRotate';
import { Button } from '../components/Button';
import { CategoryTile } from '../components/CategoryTile';

interface LobbyScreenProps {
  key?: string;
  navigate: (s: Screen) => void;
  onCategorySelect: (cat: Category) => void;
  onGoogleAuth: () => void;
  onFacebookAuth: () => void;
  onEmailAuth: (email: string, pass: string, isLogin: boolean) => Promise<void>;
  language: Language;
  onLanguageToggle: () => void;
  t: any;
  theme: Theme;
}

export function LobbyScreen({ navigate, onCategorySelect, onGoogleAuth, onFacebookAuth, onEmailAuth, language, onLanguageToggle, t, theme }: LobbyScreenProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalType, setModalType] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authMethod, setAuthMethod] = useState<'CHOICE' | 'EMAIL'>('CHOICE');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthIdentifier = (id: string) => {
    return id.includes('@') ? id : `${id}@app.local`;
  };

  const openModal = (type: 'LOGIN' | 'REGISTER') => {
    setModalType(type);
    setAuthMethod('CHOICE');
    setError(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setShowLoginModal(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const authId = getAuthIdentifier(username);
      await onEmailAuth(authId, password, modalType === 'LOGIN');
      setShowLoginModal(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrapper theme={theme}>
      <div className={`flex flex-col h-full bg-[#001F54] transition-colors duration-300 relative overflow-hidden`}>
        {/* Decorative elements for the brand look */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32" />

        <div className="pt-8 px-8 mb-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-0.5 overflow-hidden">
              <img src={dswdLogo} alt="DSWD Logo" className="w-9 h-9 object-contain scale-[1.25]" referrerPolicy="no-referrer" />
            </div>
            <button 
              onClick={onLanguageToggle}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              {t.langName}
            </button>
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">{t.republic}</p>
          <WordRotate 
            words={[
              "Bawat Buhay Mahalaga Sa DSWD",
              "Henerasyon Ngayon Para sa Henerasyon ng Kinabukasan",
              "Maagap at Mapagkalinga",
              "Matapat at Mahusay"
            ]}
            duration={3000}
            containerClassName="h-16 flex items-center mb-2 overflow-hidden relative"
            className="text-xl sm:text-2xl font-serif italic text-white leading-tight font-extrabold tracking-tight filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] select-none"
          />
          <p className="text-xs font-bold text-white/60 leading-relaxed max-w-[240px] uppercase tracking-wide">{t.empowering}</p>
        </div>

        <div className={`flex-1 bg-${theme === 'dark' ? '[#0B101B]' : 'white'} rounded-t-[40px] p-8 shadow-2xl relative z-10 transition-colors duration-300 overflow-y-auto scrollbar-none pb-12`}>
          <div className="mb-8 overflow-hidden">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-6 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.selectElig}</p>
            <div className="flex flex-col gap-4">
              <CategoryTile 
                title={t.soloParent}
                sub={t.grantsAid}
                icon={<UserPlus size={24} />}
                onClick={() => onCategorySelect('solo-parent')}
                delay={0}
                theme={theme}
                t={t}
              />
              <CategoryTile 
                title={t.seniorCitizen}
                sub={t.pensionSupport}
                icon={<Star size={24} />}
                onClick={() => onCategorySelect('senior')}
                delay={0.1}
                theme={theme}
                t={t}
              />
              <CategoryTile 
                title={t.pwdSupport}
                sub={t.accessPrograms}
                icon={<Heart size={24} />}
                onClick={() => onCategorySelect('pwd')}
                delay={0.2}
                theme={theme}
                t={t}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
             <Button onClick={() => openModal('LOGIN')} variant="outline" className={`h-14 rounded-[24px] ${theme === 'dark' ? 'border-white/10 text-white' : ''}`} theme={theme}>
               {t.signIn}
             </Button>
             <Button onClick={() => navigate('REGISTER')} className="h-14 rounded-[24px] shadow-blue-500/40" theme={theme}>
               {t.signUp}
             </Button>
          </div>
        </div>

        {/* Login/Signup Modal */}
        <AnimatePresence> //johndoe
          {showLoginModal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLoginModal(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[100]"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className={`absolute inset-x-0 bottom-0 z-[101] rounded-t-[40px] px-8 pt-8 pb-12 shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-none ${theme === 'dark' ? 'bg-[#161B28] border-t border-white/5' : 'bg-white'}`}
              >
                <div className={`w-12 h-1.5 rounded-full mx-auto mb-8 cursor-pointer ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} onClick={() => setShowLoginModal(false)} />
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white border border-slate-100 dark:border-white/5 shadow-md p-1 overflow-hidden">
                    <img src={dswdLogo} alt="DSWD Logo" className="w-14 h-14 object-contain scale-[1.25]" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className={`text-xl font-black mb-2 uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                    {modalType === 'LOGIN' ? (language === 'FIL' ? 'Maligayang Pagdating' : 'Welcome') : t.createAccount}
                  </h3>
                  <p className={`text-xs font-bold leading-relaxed px-4 mb-8 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                    {modalType === 'LOGIN' 
                      ? 'Access your DSWD personal dashboard and benefit tracker securely.' 
                      : 'Join the DSWD platform to access government support and programs.'}
                  </p>
                  
                  <div className="w-full mb-8">
                    {authMethod === 'CHOICE' ? (
                      <div className="space-y-3">
                        <button 
                          onClick={onGoogleAuth}
                          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 border transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
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
                          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-white text-slate-900 shadow-lg shadow-white/5' : 'bg-slate-900 text-white shadow-lg'}`}
                        >
                          <Mail size={20} />
                          <span className="font-bold text-sm tracking-tight">{t.manualLogin}</span>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-500 font-bold uppercase tracking-wider text-center">
                            {error}
                          </div>
                        )}
                        <div className="space-y-2 text-left w-full">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.emailAddress || 'Email Address'} / {t.usernameLabel || 'Username'}</label>
                          <input 
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full h-14 px-5 rounded-2xl border transition-all ${
                              theme === 'dark' 
                                ? `bg-white/5 ${username.trim() !== '' && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || /^[a-zA-Z0-9_.-]{3,}$/.test(username)) ? 'border-red-500' : 'border-white/10'} text-white focus:border-primary/50` 
                                : `bg-slate-50 ${username.trim() !== '' && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || /^[a-zA-Z0-9_.-]{3,}$/.test(username)) ? 'border-red-500' : 'border-slate-200'} text-slate-900 focus:border-blue-500/50`
                            }`}
                            placeholder="demo@example.com"
                          />
                          {username.trim() !== '' && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || /^[a-zA-Z0-9_.-]{3,}$/.test(username)) && (
                            <p className="text-[9px] text-red-500 font-bold ml-1 tracking-wide mt-1">Please enter a valid email address or username (at least 3 characters)</p>
                          )}
                        </div>
                        <div className="space-y-2 text-left w-full">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.password}</label>
                          <div className="relative w-full">
                            <input 
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={`w-full h-14 pl-5 pr-12 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500/50'}`}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60 transition-all hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <Button 
                          type="submit"
                          loading={loading}
                          disabled={username.trim() === '' || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || /^[a-zA-Z0-9_.-]{3,}$/.test(username))}
                          className={`w-full h-14 rounded-2xl shadow-lg ${
                            (username.trim() === '' || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || /^[a-zA-Z0-9_.-]{3,}$/.test(username)))
                              ? 'opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400'
                              : ''
                          }`}
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
                    onClick={() => setModalType(modalType === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
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
