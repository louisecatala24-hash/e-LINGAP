import React, { useState } from 'react';
import { ArrowLeft, User, Star, Globe, Moon, Bell, HelpCircle, Info, LogOut, X, Save, ShieldCheck } from 'lucide-react';
import { Screen, UserProfile, Category, Language, Theme } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SettingsItem } from '../components/SettingsItem';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

interface SettingsScreenProps {
  key?: string;
  profile: UserProfile | null;
  category: Category;
  language: Language;
  theme: Theme;
  notifications: boolean;
  onLogout: () => void;
  onCategoryChange: () => void;
  navigate: (s: Screen) => void;
  setLanguage: (l: Language) => void;
  setTheme: (t: Theme) => void;
  setNotifications: (n: boolean) => void;
  t: any;
  onProfileUpdate: () => void;
}

export function SettingsScreen({ 
  profile, 
  category, 
  language, 
  theme, 
  notifications, 
  onLogout, 
  onCategoryChange, 
  navigate,
  setLanguage,
  setTheme,
  setNotifications,
  t,
  onProfileUpdate
}: SettingsScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    middleName: profile?.middleName || '',
    mobile: profile?.mobile || '',
    address: profile?.address || ''
  });

  const handleEditProfile = () => {
    if (!profile) return;
    setEditForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      mobile: profile.mobile,
      address: profile.address
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        ...editForm,
        updatedAt: new Date()
      });
      setIsEditing(false);
      onProfileUpdate();
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${profile.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScreenWrapper hasNav theme={theme}>
        <div className={`h-full flex flex-col overflow-hidden relative transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F7FF]'}`}>
        <div className={`p-8 pb-10 bg-[#001F54] text-white rounded-b-[40px] shadow-lg relative overflow-hidden transition-colors duration-300`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => navigate('HOME')}
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-[18px] font-black uppercase tracking-tight">{t.settings}</h2>
            </div>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{t.version} 1.0.0</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-36">
          <section className="mb-8">
            <h4 className={`text-[12px] font-black uppercase tracking-[0.05em] mb-4 ml-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.account}</h4>
            <SettingsItem 
              icon={<User size={22} />} 
              title={t.userProfile} 
              sub={profile ? `${profile.firstName} ${profile.lastName}` : t.guestUser} 
              onClick={handleEditProfile}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              arrow
              isDark={theme === 'dark'}
            />
            <SettingsItem 
              icon={<Star size={22} />} 
              title={t.eligCategory || 'Eligibility Category'} 
              sub={category?.replace('-', ' ') || t.selectCategory} 
              onClick={onCategoryChange}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              arrow
              isDark={theme === 'dark'}
            />
          </section>

          <section className="mb-8">
            <h4 className={`text-[12px] font-black uppercase tracking-[0.05em] mb-4 ml-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.preferences}</h4>
            <SettingsItem 
              icon={<Globe size={22} />} 
              title={t.language} 
              sub={t.langName} 
              badge={language}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              onClick={() => setLanguage(language === 'EN' ? 'FIL' : 'EN')}
              isDark={theme === 'dark'}
            />
            <SettingsItem 
              icon={<Moon size={22} />} 
              title={t.appearance} 
              sub={theme === 'dark' ? t.darkModeOn : t.lightModeOn} 
              toggle
              toggled={theme === 'dark'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              isDark={theme === 'dark'}
            />
            <SettingsItem 
              icon={<Bell size={22} />} 
              title={t.notifications} 
              sub={notifications ? t.enabled : t.disabled} 
              toggle
              toggled={notifications}
              onClick={() => setNotifications(!notifications)}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              isDark={theme === 'dark'}
            />
          </section>

          <section className="mb-0">
            <h4 className={`text-[12px] font-black uppercase tracking-[0.05em] mb-4 ml-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.support}</h4>
            <SettingsItem 
              icon={<HelpCircle size={22} />} 
              title={t.helpFaq} 
              sub={t.faqSub} 
              onClick={() => navigate('HELP')}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              arrow
              isDark={theme === 'dark'}
            />
            <SettingsItem 
              icon={<Info size={22} />} 
              title={t.aboutPortal} 
              sub={`${t.version} 1.0.0`} 
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              arrow
              isDark={theme === 'dark'}
            />
          </section>

          <div className="mt-8 mb-8"> 
            <Button variant="danger" onClick={() => setShowLogoutConfirm(true)} className="w-full py-4 h-14 rounded-[20px] text-[10px] uppercase font-black tracking-widest active:scale-95 transition-all" theme={theme}>
              <LogOut size={16} /> {t.logout}
            </Button>
          </div>
        </div>
      </div>
    </ScreenWrapper>

    <AnimatePresence>
      {isEditing && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[110]"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className={`absolute inset-x-0 bottom-0 z-[111] rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl overflow-y-auto max-h-[85vh] ${theme === 'dark' ? 'bg-[#161B28]' : 'bg-white'}`}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setIsEditing(false)} />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-primary/20 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                  <User size={24} />
                </div>
                <div>
                  <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                    {t.editProfile || 'Edit Profile'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.govService}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.firstName}</label>
                  <input 
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className={`w-full h-14 rounded-2xl px-5 text-sm font-bold border transition-all outline-none ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-[#001F54] focus:border-primary'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.lastName}</label>
                  <input 
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className={`w-full h-14 rounded-2xl px-5 text-sm font-bold border transition-all outline-none ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-[#001F54] focus:border-primary'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.middleName}</label>
                <input 
                  type="text"
                  value={editForm.middleName}
                  onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                  className={`w-full h-14 rounded-2xl px-5 text-sm font-bold border transition-all outline-none ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-[#001F54] focus:border-primary'}`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.mobileNumber}</label>
                <input 
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className={`w-full h-14 rounded-2xl px-5 text-sm font-bold border transition-all outline-none ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-[#001F54] focus:border-primary'}`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.currentResidence}</label>
                <textarea 
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className={`w-full h-24 rounded-2xl px-5 py-4 text-sm font-bold border transition-all outline-none resize-none ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-[#001F54] focus:border-primary'}`}
                />
              </div>

              <div className={`p-5 rounded-3xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                <ShieldCheck size={24} className="shrink-0" />
                <p className="text-[11px] font-bold leading-relaxed">
                  {t.dataSecure || 'Your data is encrypted and secure. Updates will be reflected across your registered benefits.'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveProfile}
                  className="flex-[2] h-14 rounded-2xl shadow-lg"
                  theme={theme}
                  disabled={isSaving}
                >
                  {isSaving ? t.loading : (t.saveChanges || 'Save Changes')}
                </Button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {showLogoutConfirm && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[120]"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] z-[121] rounded-[32px] p-8 shadow-2xl ${theme === 'dark' ? 'bg-[#161B28] border border-white/5 text-white' : 'bg-white text-slate-800'}`}
          >
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              <LogOut size={28} />
            </div>
            
            <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-center">
              {language === 'FIL' ? 'Mag-logout?' : 'Confirm Logout'}
            </h3>
            
            <p className={`text-[12px] font-bold leading-relaxed mb-6 text-center ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
              {language === 'FIL' 
                ? 'Sigurado ka bang gusto mong mag-logout sa iyong account? Maaari kang mag-log in muli anumang oras.' 
                : 'Are you sure you want to log out of your account? You can log back in anytime.'}
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                variant="danger"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest"
                theme={theme}
              >
                {t.logout || 'Logout'}
              </Button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className={`w-full h-13 rounded-2xl font-black uppercase text-xs tracking-widest border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
              >
                {t.cancel || 'Cancel'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
}
