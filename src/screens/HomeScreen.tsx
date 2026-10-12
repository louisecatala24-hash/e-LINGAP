import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dswdLogo from '@/images/DSWD.png';
import dswdWebImage from '@/images/dswd.web.png';
import fbLogo from '@/images/FB.logo.png';
import igLogo from '@/images/IG.logo.png';
import { 
  Shield, 
  Settings, 
  Search, 
  Bell,
  Heart,
  User,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Star,
  ChevronRight,
  Phone,
  X,
  CheckCircle2,
  Clock,
  ClipboardList,
  Globe,
  Facebook,
  Instagram
} from 'lucide-react';
import { Screen, UserProfile, Theme, Category, Notification, News } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { WordRotate } from '../components/WordRotate';
import { getNewsData } from '../constants';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';

interface HomeScreenProps {
  key?: string;
  profile: UserProfile | null;
  category: Category;
  navigate: (s: Screen) => void;
  onCategorySelect: (c: Category) => void;
  onApplyClick: () => void;
  onLanguageToggle: () => void;
  t: any;
  theme: Theme;
}

import { NotificationDropdown } from '../components/NotificationDropdown';
import { subscribeToNotifications, markNotificationsAsRead } from '../lib/notificationService';

export function HomeScreen({ profile, category, navigate, onCategorySelect, onApplyClick, onLanguageToggle, t, theme }: HomeScreenProps) {
  const staticNews = getNewsData(t.langCode || 'EN');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [realNews, setRealNews] = useState<News[]>([]);
  const [systemUpdate, setSystemUpdate] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [openedFromAllUpdates, setOpenedFromAllUpdates] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToNotifications(profile.uid, setNotifications);
    return () => unsubscribe();
  }, [profile?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const updateConstraints = () => {
      if (carouselRef.current) {
        const scrollWidth = carouselRef.current.scrollWidth;
        const offsetWidth = carouselRef.current.offsetWidth;
        const maxDrag = Math.max(0, scrollWidth - offsetWidth);
        setConstraints({ left: -maxDrag - 32, right: 0 });
      }
    };
    const timer = setTimeout(updateConstraints, 100);
    window.addEventListener('resize', updateConstraints);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConstraints);
    };
  }, [realNews, systemUpdate]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'latest_update'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemUpdate({ id: 'system-announcement', ...docSnap.data(), isSystem: true });
      } else {
        setSystemUpdate(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = collection(db, 'News for users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setRealNews(docs);
    }, (error) => {
      console.error("News fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedUpdate) {
      const allNews = [...(systemUpdate ? [systemUpdate] : []), ...realNews];
      const stillExists = allNews.some(n => n.id === selectedUpdate.id);
      if (!stillExists && selectedUpdate.id === 'system-announcement' && !systemUpdate) {
        setSelectedUpdate(null);
      } else if (!stillExists && selectedUpdate.id !== 'system-announcement') {
        setSelectedUpdate(null);
      }
    }
  }, [realNews, systemUpdate, selectedUpdate]);

  const handleToggleNotifications = () => {
    const newShow = !showNotifications;
    setShowNotifications(newShow);
    if (newShow && unreadCount > 0) {
      // Mark all as read when opening - this clears the badge
      setTimeout(() => {
        markNotificationsAsRead(notifications);
      }, 500); // Small delay so count doesn't jump instantly before they see it
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    markNotificationsAsRead(notifications);
  };

  return (
    <ScreenWrapper hasNav theme={theme}>
      <div className={`flex flex-col h-full transition-colors duration-300 relative overflow-hidden ${theme === 'dark' ? 'bg-[#001F54]' : 'bg-[#001F54]'}`}>
        
        {/* Notifications Modal */}
        <AnimatePresence>
          {showNotifications && (
            <NotificationDropdown 
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              t={t}
              theme={theme}
            />
          )}
        </AnimatePresence>

        {/* Update Detail Modal */}
        <AnimatePresence>
          {selectedUpdate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedUpdate(null)}
            >
                <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative ${
                  theme === 'dark'
                    ? selectedUpdate.isSystem 
                      ? 'bg-[#131d35] border border-amber-500/30 text-slate-100 shadow-sm shadow-amber-500/5' 
                      : 'bg-[#131d35] border border-blue-900/40 text-slate-100 shadow-sm' 
                    : selectedUpdate.isSystem 
                      ? 'bg-yellow-400 text-[#001F54]' 
                      : 'bg-yellow-50 text-slate-800'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <div className={`p-8 ${
                  theme === 'dark'
                    ? 'bg-black/20 border-b border-white/5'
                    : selectedUpdate.isSystem 
                      ? 'bg-black/5 border-b border-black/5' 
                      : 'bg-yellow-100/50 border-b border-black/5'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      theme === 'dark'
                        ? selectedUpdate.isSystem
                          ? 'text-amber-400'
                          : 'text-blue-400'
                        : selectedUpdate.isSystem
                          ? 'text-[#001F54]/40'
                          : 'text-primary'
                    }`}>
                      {selectedUpdate.isSystem ? 'System Update' : 'Portal Announcement'}
                    </p>
                    <button 
                      onClick={() => {
                        setSelectedUpdate(null);
                        if (openedFromAllUpdates) {
                          setShowAllUpdates(true);
                          setOpenedFromAllUpdates(false);
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        theme === 'dark'
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : selectedUpdate.isSystem
                            ? 'bg-black/10 text-black hover:bg-black/20'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${
                    theme === 'dark'
                      ? selectedUpdate.isSystem
                        ? 'text-amber-450'
                        : 'text-white'
                      : selectedUpdate.isSystem
                        ? 'text-[#001F54]'
                        : 'text-[#001F54]'
                  }`}>
                    {selectedUpdate.title || 'Update Detail'}
                  </h2>
                </div>

                <div className="p-8 flex-1 overflow-y-auto scrollbar-none">
                  <p className={`text-base font-bold leading-relaxed mb-8 ${
                    theme === 'dark'
                      ? 'text-slate-300'
                      : selectedUpdate.isSystem
                        ? 'text-[#001F54]/80'
                        : 'text-slate-600'
                  }`}>
                    {selectedUpdate.message || selectedUpdate.content || ''}
                  </p>
                  
                  {(() => {
                    const req = selectedUpdate.requirements || selectedUpdate.requirement;
                    if (!req || req.trim() === '') return null;
                    
                    return (
                      <div className="flex flex-col gap-3 mb-8">
                        <div className={`p-4 rounded-[24px] flex items-start gap-4 ${
                          theme === 'dark'
                            ? selectedUpdate.isSystem
                              ? 'bg-amber-500/5 border border-amber-500/10'
                              : 'bg-blue-500/5 border border-blue-500/10'
                            : selectedUpdate.isSystem
                              ? 'bg-black/5 border border-black/5'
                              : 'bg-emerald-50/50 border border-emerald-100/50'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            theme === 'dark'
                              ? selectedUpdate.isSystem
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                              : selectedUpdate.isSystem
                                ? 'bg-black/10 text-black'
                                : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            <ClipboardList size={20} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                              theme === 'dark'
                                ? selectedUpdate.isSystem
                                  ? 'text-amber-400/80'
                                  : 'text-blue-400/80'
                                : selectedUpdate.isSystem
                                  ? 'text-[#001F54]/30'
                                  : 'text-emerald-600/70'
                            }`}>
                              Requirements
                            </p>
                            <p className={`text-[13px] font-bold leading-snug whitespace-pre-wrap ${
                              theme === 'dark'
                                ? 'text-slate-400'
                                : selectedUpdate.isSystem
                                  ? 'text-[#001F54]/70'
                                  : 'text-slate-600'
                            }`}>
                              {req}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className={`flex flex-row items-end justify-between pt-5 border-t mt-6 ${
                    theme === 'dark' ? 'border-white/10' : 'border-black/10'
                  }`}>
                    {selectedUpdate.isSystem ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        theme === 'dark' ? 'bg-amber-500/20' : 'bg-black/10'
                      }`}>
                        <Star size={16} className={theme === 'dark' ? 'text-amber-405' : 'text-black'} />
                      </div>
                    ) : (
                      <div />
                    )}
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                          theme === 'dark'
                            ? selectedUpdate.isSystem
                              ? 'text-amber-400/60'
                              : 'text-blue-400/60'
                            : selectedUpdate.isSystem
                              ? 'text-[#001F54]/40'
                              : 'text-slate-400'
                        }`}>
                          {selectedUpdate.date || 'Recently'}
                        </p>
                        {selectedUpdate.time && (
                          <>
                            <span className={`text-[9px] opacity-20 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>•</span>
                            <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                              theme === 'dark'
                                ? selectedUpdate.isSystem
                                  ? 'text-amber-400/55'
                                  : 'text-blue-400/55'
                                : selectedUpdate.isSystem
                                  ? 'text-[#001F54]/30'
                                  : 'text-slate-300'
                            }`}>
                              {selectedUpdate.time}
                            </p>
                          </>
                        )}
                      </div>
                      {selectedUpdate.day && (
                        <p className={`text-[8.5px] font-black uppercase tracking-[0.15em] leading-none ${
                          theme === 'dark'
                            ? selectedUpdate.isSystem
                              ? 'text-amber-400/40'
                              : 'text-blue-400/40'
                            : selectedUpdate.isSystem
                              ? 'text-[#001F54]/20'
                              : 'text-slate-300'
                        }`}>
                          {selectedUpdate.day}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button 
                    onClick={() => {
                      setSelectedUpdate(null);
                      if (openedFromAllUpdates) {
                        setShowAllUpdates(true);
                        setOpenedFromAllUpdates(false);
                      }
                    }}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                      theme === 'dark'
                        ? selectedUpdate.isSystem
                          ? 'bg-amber-500 text-black hover:bg-amber-400 font-black'
                          : 'bg-blue-600 text-white hover:bg-blue-500 font-black'
                        : selectedUpdate.isSystem
                          ? 'bg-[#001F54] text-yellow-405 font-black hover:bg-[#001F54]/90' 
                          : 'bg-primary text-white shadow-lg shadow-primary/20 font-black'
                    }`}
                  >
                    Close Update
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All Updates Modal */}
        <AnimatePresence>
          {showAllUpdates && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAllUpdates(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative ${
                  theme === 'dark' ? 'bg-[#161B28]' : 'bg-white'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${
                      theme === 'dark' ? 'text-white' : 'text-[#001F54]'
                    }`}>
                      {t.latestUpdates || 'All Updates'}
                    </h2>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      {(systemUpdate ? 1 : 0) + realNews.length} announcements
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAllUpdates(false)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-none flex flex-col gap-3">
                  {(() => {
                     // Deduplicate logic (same as in horizontal view)
                     const rawCombined = [...(systemUpdate ? [systemUpdate] : []), ...realNews];
                     const uniqueMap = new Map();
                     
                     rawCombined.forEach(item => {
                       const titleKey = (item.title || '').trim().toLowerCase();
                       const msgKey = (item.message || item.content || '').trim().toLowerCase();
                       const key = `${titleKey}_${msgKey}`;
                       if (!uniqueMap.has(key)) uniqueMap.set(key, item);
                       else if (item.isSystem && !uniqueMap.get(key).isSystem) uniqueMap.set(key, item);
                     });

                     const combined = Array.from(uniqueMap.values());
                     const getTime = (item: any) => {
                       const val = item.updatedAt || item.createdAt || item.date;
                       if (!val) return 0;
                       if (typeof val.toMillis === 'function') return val.toMillis();
                       if (val.seconds !== undefined) return val.seconds * 1000;
                       const d = new Date(val);
                       return isNaN(d.getTime()) ? 0 : d.getTime();
                     };

                     const sorted = combined.sort((a, b) => getTime(b) - getTime(a));

                     return sorted.map((item: any, idx) => {
                       const isSystem = item.isSystem === true;
                       return (
                         <div 
                           key={item.id || `all-upd-${idx}`}
                           onClick={() => {
                             setSelectedUpdate(item);
                             setShowAllUpdates(false);
                           }}
                           className={`p-5 rounded-[28px] border cursor-pointer transition-all active:scale-[0.98] ${
                             isSystem 
                               ? theme === 'dark'
                                  ? 'bg-[#131d35]/90 border-amber-500/30 text-slate-101 shadow-sm shadow-amber-500/5'
                                  : 'bg-yellow-400 border-yellow-500 shadow-sm' 
                               : theme === 'dark' 
                                 ? 'bg-[#131d35]/90 border-blue-900/40 text-slate-101 shadow-sm shadow-blue-500/5' 
                                 : 'bg-yellow-50 border-yellow-100 shadow-sm'
                           }`}
                         >
                           <div className="flex items-center justify-between mb-2">
                             <p className={`text-[8px] font-black uppercase tracking-widest ${isSystem ? (theme === 'dark' ? 'text-amber-300' : 'text-black/40') : theme === 'dark' ? 'text-blue-300' : 'text-primary/60'}`}>
                               {isSystem ? 'Important' : 'Announcement'}
                             </p>
                             <div className="flex items-center gap-1.5 overflow-hidden">
                               <p className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${isSystem ? (theme === 'dark' ? 'text-amber-400/60' : 'text-black/40') : theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                                 {item.date}
                               </p>
                               {item.time && (
                                 <>
                                   <span className={`text-[8px] opacity-20 ${isSystem ? (theme === 'dark' ? 'text-amber-400/50' : 'text-black') : theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>•</span>
                                   <p className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${isSystem ? (theme === 'dark' ? 'text-amber-400/40' : 'text-black/30') : theme === 'dark' ? 'text-white/30' : 'text-slate-300'}`}>
                                     {item.time}
                                   </p>
                                 </>
                               )}
                             </div>
                           </div>
                           <h4 className={`text-sm font-black uppercase leading-tight mb-2 ${isSystem ? (theme === 'dark' ? 'text-amber-400' : 'text-[#001F54]') : theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
                             {item.title || 'Update'}
                           </h4>
                           <p className={`text-[11px] font-bold line-clamp-2 leading-relaxed ${isSystem ? (theme === 'dark' ? 'text-slate-300' : 'text-black/70') : theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                             {item.message || item.content || ''}
                           </p>
                         </div>
                       );
                     });
                  })()}
                </div>

                <div className="p-6">
                  <button 
                    onClick={() => setShowAllUpdates(false)}
                    className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative elements for the brand look */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32" />

        <div className="pt-5 px-8 mb-2 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-0.5 overflow-hidden">
              <img src={dswdLogo} alt="DSWD Logo" className="w-9 h-9 object-contain scale-[1.25]" referrerPolicy="no-referrer" />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={onLanguageToggle}
                className="bg-white/10 active:bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95"
              >
                {t.langName}
              </button>
              <button 
                onClick={handleToggleNotifications}
                className="w-9 h-9 bg-white/10 active:bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-[#001F54] shadow-lg z-20"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1 leading-none">
              {profile ? `${t.welcomeBack}, ${profile.firstName}` : t.guestUser}
            </p>
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
          </motion.div>
        </div>

        <div className={`flex-1 bg-${theme === 'dark' ? '[#0B101B]' : 'white'} rounded-t-[48px] p-8 shadow-2xl relative z-10 transition-colors duration-500 overflow-y-auto pb-32 scrollbar-none`}>
          
          {/* Bento Section 1: Announcements */}
          <div className="mb-10" id="latest-updates-section">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.latestUpdates || 'Latest Updates'}</p>
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary" 
                />
              </div>
              <button 
                onClick={() => setShowAllUpdates(true)}
                className="text-primary text-[10px] font-black uppercase tracking-widest active:underline"
              >
                {t.viewAll || 'View All'}
              </button>
            </div>
            <div className="relative -mx-8 px-8 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory">
              <div className="flex flex-row flex-nowrap gap-4">
                {(() => {
                  // Merge sources and deduplicate by content (Title + Message) to handle overlaps
                  const rawCombined = [...(systemUpdate ? [systemUpdate] : []), ...realNews];
                  const uniqueMap = new Map();
                  
                  rawCombined.forEach(item => {
                    const titleKey = (item.title || '').trim().toLowerCase();
                    const msgKey = (item.message || item.content || '').trim().toLowerCase();
                    const key = `${titleKey}_${msgKey}`;
                    
                    if (!uniqueMap.has(key)) {
                      uniqueMap.set(key, item);
                    } else {
                      const existing = uniqueMap.get(key);
                      if (item.isSystem && !existing.isSystem) {
                        uniqueMap.set(key, item);
                      }
                    }
                  });

                  const combined = Array.from(uniqueMap.values());
                  
                  const getTime = (item: any) => {
                    // Check multiple possible timestamp fields
                    const val = item.updatedAt || item.createdAt || item.date;
                    if (!val) return 0;
                    
                    if (typeof val.toMillis === 'function') return val.toMillis();
                    if (val.seconds !== undefined) return val.seconds * 1000;
                    
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                  };

                  const sorted = combined
                    .sort((a, b) => getTime(b) - getTime(a))
                    .slice(0, 5);

                  if (sorted.length === 0) return null;

                  return sorted.map((item: any, idx) => {
                    const isSystem = item.isSystem === true;
                    return (
                      <motion.div 
                        key={item.id || `upd-${idx}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileTap={{ scale: 0.95, y: 1 }}
                        onClick={() => setSelectedUpdate(item)}
                        className={`w-[290px] min-w-[290px] py-3 px-4 rounded-[20px] border flex-none snap-start flex flex-col justify-between gap-1.5 relative overflow-hidden cursor-pointer ${
                          isSystem 
                            ? theme === 'dark'
                              ? 'bg-[#131d35]/90 border-amber-500/30 text-slate-100 shadow-sm shadow-amber-500/5'
                              : 'bg-gradient-to-br from-yellow-400 to-amber-300 text-[#001F54] border-yellow-300 shadow-lg shadow-yellow-400/15'
                            : theme === 'dark' 
                              ? 'bg-[#131d35]/90 border-blue-900/40 text-slate-100 shadow-sm' 
                              : 'bg-slate-50 border-slate-200 text-slate-800 shadow-md'
                        }`}
                      >
                        {/* Header: Badge & Date */}
                        <div className="flex items-center justify-between w-full">
                          <span className={`px-2 py-0.5 rounded-full text-[8.1px] font-black uppercase tracking-wider ${
                            isSystem
                              ? theme === 'dark'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-black/10 text-[#001F54]'
                              : theme === 'dark'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-[#001F54]'
                          }`}>
                            {isSystem ? 'System' : 'Update'}
                          </span>
                          <span className={`text-[8.5px] font-bold ${
                            isSystem
                              ? theme === 'dark'
                                ? 'text-white/40'
                                : 'text-black/50'
                              : theme === 'dark'
                                ? 'text-white/40'
                                : 'text-slate-500'
                          }`}>
                            {item.date || 'Today'}
                          </span>
                        </div>

                        {/* Middle: Title & Content */}
                        <div className="space-y-0.5">
                          <h3 className={`text-[12.5px] font-black leading-tight tracking-tight line-clamp-1 ${
                            isSystem
                              ? theme === 'dark'
                                ? 'text-amber-400'
                                : 'text-[#001F54]'
                              : theme === 'dark'
                                ? 'text-white'
                                : 'text-[#001F54]'
                          }`}>
                            {item.title || 'Update'}
                          </h3>
                          <p className={`text-[10px] font-medium leading-normal line-clamp-1 ${
                            isSystem
                              ? theme === 'dark'
                                ? 'text-white/60'
                                : 'text-black/70'
                              : theme === 'dark'
                                ? 'text-white/60'
                                : 'text-slate-600'
                          }`}>
                            {isSystem ? (item.message || '') : (item.content || item.message || '')}
                          </p>
                        </div>

                        {/* Footer: Action hint */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-current/10">
                          <span className={`text-[8.5px] font-semibold uppercase tracking-wider leading-none ${
                            isSystem
                              ? theme === 'dark'
                                ? 'text-amber-400'
                                : 'text-[#001F54]/60'
                              : theme === 'dark'
                                ? 'text-blue-400'
                                : 'text-[#001F54]/60'
                          }`}>
                            {t.langCode === 'FIL' ? 'Basahin ang detalye' : 'Read announcement'}
                          </span>
                          <motion.div 
                            className="text-current opacity-60 transition-transform duration-200"
                          >
                            <ChevronRight size={12} />
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Bento Section 2: Quick Links Grid */}
          <div className="mb-10">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-6 px-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>{t.exploreServices || 'Explore Services'}</p>
            <div className="grid grid-cols-2 gap-4">
               {/* Large Action Card */}
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.4 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={onApplyClick}
                 className="col-span-2 p-8 rounded-[40px] bg-primary relative overflow-hidden group shadow-xl shadow-primary/30 cursor-pointer"
               >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 transition-transform duration-500" />
                 <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 backdrop-blur-md">
                       <Heart size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white leading-none uppercase mb-2">{t.apply}</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{t.browse || 'Browse All Programs'}</p>
                 </div>
                 <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center transition-transform">
                   <ChevronRight size={24} />
                 </div>
                </motion.div>

                {/* Smaller Action Cards */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('TRACKER')}
                  className={`p-6 rounded-[32px] flex flex-col gap-4 border cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-[#161B28] border-white/15 shadow-lg shadow-black/20 hover:border-white/25' : 'bg-white border-slate-100/80 shadow-md'}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-auto">
                     <LayoutDashboard size={24} />
                  </div>
                  <div>
                     <h4 className={`text-sm font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.tracker}</h4>
                     <p className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>Status Checker</p>
                  </div>
                </motion.div>
 
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.6 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => navigate('HELP')}
                 className={`p-6 rounded-[32px] flex flex-col gap-4 border cursor-pointer ${theme === 'dark' ? 'bg-[#161B28] border-white/15 shadow-lg shadow-black/20 hover:border-white/25' : 'bg-white border-slate-100/80 shadow-md'}`}
               >
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-auto">
                    <MessageSquare size={24} />
                 </div>
                 <div>
                    <h4 className={`text-sm font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.helpCenter || 'Help'}</h4>
                    <p className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Support & FAQs</p>
                 </div>
               </motion.div>
            </div>
          </div>

          {/* Business Hours Section - Restyled */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className={`mb-10 p-6 rounded-[32px] border flex items-center justify-between ${theme === 'dark' ? 'bg-[#161B28] border-white/15 shadow-lg shadow-black/20' : 'bg-blue-50/50 border-blue-100'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-primary/15 text-blue-400' : 'bg-blue-500/10 text-primary'}`}>
                <Calendar size={24} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.businessHoursTitle}</p>
                <h4 className={`text-[13px] font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.businessHours}</h4>
                <p className={`text-[10px] font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.businessDays}</p>
              </div>
            </div>
          </motion.div>

          {/* DSWD Official Portals/Links Section */}
          <div className="mb-10 px-1" id="dswd-portals-section">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
              {t.langCode === 'FIL' ? 'Opisyal na Link' : 'Official Portals'}
            </p>
            <div className="flex flex-col gap-4">
              {/* Website */}
              <motion.a 
                href="https://www.dswd.gov.ph"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="relative w-full h-44 rounded-[28px] overflow-hidden shadow-md flex flex-col justify-end p-6 text-white group border border-[#001F54]/10 dark:border-white/5 bg-[#0c101b]"
                id="portal-link-website"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 opacity-50"
                  style={{
                    backgroundImage: `url(${dswdWebImage})`,
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none text-white">DSWD WEBSITE</h3>
                    <p className="text-[10px] font-medium text-white/70 max-w-[200px] mt-1">
                      www.dswd.gov.ph
                    </p>
                  </div>

                  <div className="bg-white active:bg-white/90 text-[#001F54] font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl transition-all shadow-md">
                    visit
                  </div>
                </div>
              </motion.a>

              {/* Facebook */}
              <motion.a 
                href="https://www.facebook.com/dswdserves"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="relative w-full h-44 rounded-[28px] overflow-hidden shadow-md flex flex-col justify-end p-6 text-white group border border-[#001F54]/10 dark:border-white/5 bg-[#0c101b]"
                id="portal-link-facebook"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 opacity-50"
                  style={{
                    backgroundImage: `url(${fbLogo})`,
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none text-white">DSWD FACEBOOK</h3>
                    <p className="text-[10px] font-medium text-white/70 max-w-[200px] mt-1">
                      @dswdserves
                    </p>
                  </div>

                  <div className="bg-white active:bg-white/90 text-[#001F54] font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl transition-all shadow-md">
                    visit
                  </div>
                </div>
              </motion.a>

              {/* Instagram */}
              <motion.a 
                href="https://www.instagram.com/dswdserves"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="relative w-full h-44 rounded-[28px] overflow-hidden shadow-md flex flex-col justify-end p-6 text-white group border border-[#001F54]/10 dark:border-white/5 bg-[#0c101b]"
                id="portal-link-instagram"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 opacity-50"
                  style={{
                    backgroundImage: `url(${igLogo})`,
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none text-white">DSWD INSTAGRAM</h3>
                    <p className="text-[10px] font-medium text-white/70 max-w-[200px] mt-1">
                      @dswdserves
                    </p>
                  </div>

                  <div className="bg-white active:bg-white/90 text-[#001F54] font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl transition-all shadow-md">
                    visit
                  </div>
                </div>
              </motion.a>
            </div>
          </div>

        </div>
      </div>
    </ScreenWrapper>
  );
}
