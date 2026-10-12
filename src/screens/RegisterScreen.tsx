import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, CheckCircle2, ChevronRight } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Language, Category, Theme, UserProfile } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';

interface RegisterScreenProps {
  key?: string;
  initialCategory: Category;
  isSocialAuth: boolean;
  onBack: () => void;
  onSuccess: () => void;
  t: any;
  theme: Theme;
}

export function RegisterScreen({ initialCategory, isSocialAuth, onBack, onSuccess, t, theme }: RegisterScreenProps) {
  // Lock in the registration flow type on mount to avoid shifts
  // QUICK: Social auth or Modal-based (Direct to Home)
  // FORMAL: Lobby Button (Show Success Popup)
  const [registrationMode] = useState<'QUICK' | 'FORMAL'>(() => {
    if (auth.currentUser || isSocialAuth) return 'QUICK';
    return 'FORMAL';
  });

  const [formData, setFormData] = useState(() => {
    const user = auth.currentUser;
    let firstName = '';
    let lastName = '';
    if (user && user.displayName) {
      const parts = user.displayName.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
    return {
      firstName,
      lastName,
      username: user?.email || '', // Pre-fill with Google email if available
      mobile: '',
      birthYear: 'Year',
      birthMonth: 'January',
      birthDay: 'Day',
      password: '',
      confirmPassword: '',
      middleName: '',
      sex: 'Male',
      civilStatus: 'Single',
      address: '',
      category: initialCategory || 'solo-parent'
    };
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // For Firebase Auth compatibility, we'll append a domain if it's not a valid email
  const getAuthIdentifier = (id: string) => {
    return id.includes('@') ? id : `${id}@app.local`;
  };

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = t.months || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Personal Info
    if (!formData.firstName.trim()) newErrors.firstName = t.req;
    if (!formData.lastName.trim()) newErrors.lastName = t.req;
    
    // Username & Password (only if not quick/social flow)
    if (registrationMode === 'FORMAL') {
      if (!formData.username.trim()) {
        newErrors.username = t.req;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username.trim())) {
        newErrors.username = 'Please enter a valid working email address';
      }
      
      if (!formData.password) newErrors.password = t.req;
      else if (formData.password.length < 6) newErrors.password = t.charCount.replace('{n}', '6');
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t.passMismatch || 'Passwords do not match';
      }
    }

    // Birthdate
    if (formData.birthYear === 'Year' || formData.birthYear === t.year) newErrors.birthYear = t.req;
    if (formData.birthDay === 'Day' || formData.birthDay === t.day) newErrors.birthDay = t.req;

    // Mobile
    if (!formData.mobile) {
      newErrors.mobile = t.req;
    } else {
      const mobile = formData.mobile;
      if (mobile.startsWith('+639')) {
        if (mobile.length !== 13) newErrors.mobile = t.charCount.replace('{n}', '13');
        else if (!/^\+639\d{9}$/.test(mobile)) newErrors.mobile = t.invalidFormat;
      } else if (mobile.startsWith('09')) {
        if (mobile.length !== 11) newErrors.mobile = t.charCount.replace('{n}', '11');
        else if (!/^09\d{9}$/.test(mobile)) newErrors.mobile = t.invalidFormat;
      } else {
        newErrors.mobile = t.phoneStart;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      let user = auth.currentUser;

      // 1. Create Auth User if not logged in
      if (!user) {
        const authId = getAuthIdentifier(formData.username);
        const userCredential = await createUserWithEmailAndPassword(auth, authId, formData.password);
        user = userCredential.user;
      }

      // 2. Save profile to Firestore
      const { password, confirmPassword, ...profileData } = formData;
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        ...profileData,
        username: formData.username,
        email: user.email || `${formData.username}@app.local`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Handle different registration flows
      if (registrationMode === 'QUICK') {
        // If they were already signed in (Social Auth) or modal-path, go to Home immediately
        onSuccess();
      } else {
        // If it's a new manual registration, sign out and show success popup
        await signOut(auth);
        setShowSuccessPopup(true);
      }
    } catch (err: any) {
      setErrors({ username: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper theme={theme}>
      <div className={`h-full flex flex-col overflow-hidden relative pt-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-blue-50'}`}>
        <div className="flex-1 overflow-y-auto px-6 pt-10">
          <div className="mb-6 shrink-0 flex items-center gap-4 relative z-10">
             <button 
              onClick={onBack} 
              className={`w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/40' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-[#555]'}`}>{t.registration}</p>
              <h1 className={`text-2xl font-black tracking-tight leading-none uppercase ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.register}</h1>
            </div>
          </div>

          <div className="grid gap-5 pb-10">
            {/* Account Info Section */}
            {registrationMode === 'FORMAL' && (
              <div className={`p-6 rounded-[32px] ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
                <h2 className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-40 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.accountSecurity}</h2>
                <div className="space-y-4">
                  <Input 
                    label={t.usernameLabel || 'Username'} 
                    placeholder="email@example.com" 
                    value={formData.username} 
                    onChange={(e) => handleInputChange('username', e.target.value)} 
                    error={errors.username || (formData.username.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username) ? 'Please enter a valid working email address' : '')} 
                    theme={theme} 
                  />
                  <Input label={t.password} type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} error={errors.password} theme={theme} />
                  <Input label={t.confirmPassword} type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} error={errors.confirmPassword} theme={theme} />
                </div>
              </div>
            )}

            {registrationMode === 'QUICK' && (
              <div className={`p-6 rounded-[32px] border flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                  <User size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.loggedInAs}</p>
                  <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                    {auth.currentUser?.email?.replace('@app.local', '')}
                  </p>
                </div>
              </div>
            )}

            {/* Profile Info Section */}
            <div className={`p-6 rounded-[32px] ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
              <h2 className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-40 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.personalInfo || 'Personal Information'}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label={t.firstName} placeholder="Maria" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} error={errors.firstName} theme={theme} />
                  <Input label={t.lastName} placeholder="Dela Cruz" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} error={errors.lastName} theme={theme} />
                </div>
                
                <Input label={t.mobileNumber} placeholder="+639..." value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value)} error={errors.mobile} theme={theme} />

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className={`text-[9px] font-black uppercase tracking-widest ${errors.birthYear || errors.birthDay ? 'text-red-500 font-bold' : (theme === 'dark' ? 'text-white/20' : 'text-slate-400')}`}>
                      {t.birthDate} ({t.month} / {t.day} / {t.year})
                    </label>
                    {(errors.birthYear || errors.birthDay) && (
                      <span className="text-[9px] text-red-500 font-black uppercase tracking-wide animate-pulse">
                        ⚠️ REQUIRED
                      </span>
                    )}
                  </div>
                  {(errors.birthYear || errors.birthDay) && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase tracking-wide px-3 py-2 rounded-xl animate-pulse">
                      ⚠️ {t.birthDateFull}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Select label="" options={months} value={formData.birthMonth} onChange={(e) => handleInputChange('birthMonth', e.target.value)} theme={theme} />
                    <Select label="" options={[{ label: t.day, value: 'Day' }, ...days]} value={formData.birthDay} onChange={(e) => handleInputChange('birthDay', e.target.value)} theme={theme} error={!!errors.birthDay} />
                    <Select label="" options={[{ label: t.year, value: 'Year' }, ...years]} value={formData.birthYear} onChange={(e) => handleInputChange('birthYear', e.target.value)} theme={theme} error={!!errors.birthYear} />
                  </div>
                </div>

                {/* Removed Application Category selection */}
              </div>
            </div>

            <Button 
              onClick={handleRegister} 
              loading={loading} 
              disabled={loading}
              className={`py-4 h-14 shadow-blue-500/30 ${
                theme === 'dark' ? 'bg-[#001F54] hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
              }`} 
              theme={theme}
            >
              {t.register}
            </Button>
            
            <p className={`text-center text-[9px] font-black leading-relaxed uppercase tracking-widest opacity-60 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
               {t.secureVerification}
            </p>
          </div>
        </div>

        {/* Success Popup */}
        <AnimatePresence>
          {showSuccessPopup && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[32px] p-8 z-[101] text-center shadow-2xl ${theme === 'dark' ? 'bg-[#161B28]' : 'bg-white'}`}
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className={`text-xl font-extrabold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Registration Successful</h3>
                <p className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>You're all set up!</p>
                
                <div className={`p-4 rounded-2xl mb-6 flex flex-col items-center gap-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Account Secured
                  </div>
                  <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
                    Your username: <span className={theme === 'dark' ? 'text-white/60' : 'text-slate-600'}>{formData.username}</span>
                  </p>
                </div>

                <p className={`text-[11px] font-black uppercase tracking-widest mb-4 opacity-70 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                   Note: Please sign in here
                </p>

                <Button onClick={() => { setShowSuccessPopup(false); onBack(); }} className="w-full py-4 h-14 flex items-center justify-center gap-2" theme={theme}>
                   Sign In Now
                   <ChevronRight size={18} />
                </Button>
                
                <p className={`mt-4 text-[9px] font-black uppercase tracking-tighter opacity-20 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Encrypted & Secured by Firebase
                </p>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  );
}
