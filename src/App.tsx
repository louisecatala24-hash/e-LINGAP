import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, handleFirestoreError } from './lib/firebase';
import { subscribeToNotifications, createNotification } from './lib/notificationService';
import { Screen, Category, Language, Theme, UserProfile } from './types';
import { TRANSLATIONS } from './constants';

// Screen Imports
import { LoadingScreen } from './screens/LoadingScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ApplyingBenefitScreen } from './screens/ApplyingBenefitScreen';
import { BenefitsScreen } from './screens/BenefitsScreen';
import { TrackerScreen } from './screens/TrackerScreen';
import { HelpScreen } from './screens/HelpScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CategoryDashboardScreen } from './screens/CategoryDashboardScreen';

// Component Imports
import { BottomNav } from './components/BottomNav';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [category, setCategory] = useState<Category>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOADING');
  const [authReady, setAuthReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [isSocialRegistration, setIsSocialRegistration] = useState(false);
  const [isQuickRegistration, setIsQuickRegistration] = useState(false);

  // Global Settings with Persistence
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('portal_lang') as Language) || 'EN');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('portal_theme') as Theme) || 'dark');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('portal_notifs') !== 'false');

  useEffect(() => {
    localStorage.setItem('portal_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('portal_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('portal_notifs', String(notifications));
  }, [notifications]);

  const t = TRANSLATIONS[language];

  const fetchProfile = useCallback(async (firebaseUser: FirebaseUser, fromRegister: boolean = false) => {
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      // Strict guard only if currentUser actually loaded another different user
      if (auth.currentUser?.uid !== firebaseUser.uid) return;

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setCategory(data.category);
        setIsSocialRegistration(false);
        setIsQuickRegistration(false);

        if (fromRegister) {
          setCurrentScreen('HOME');
        } else {
          setCurrentScreen(prev => prev === 'REGISTER' || prev === 'LOADING' ? 'HOME' : prev === 'LOBBY' ? 'HOME' : prev);
        }
      } else {
        setCurrentScreen('REGISTER');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setCurrentScreen(prev => (prev === 'REGISTER' || prev === 'BENEFITS') ? prev : 'LOBBY');
    } finally {
      setAuthReady(true);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const sessionType = localStorage.getItem('portal_session_type');

      if (firebaseUser) {
        localStorage.setItem('portal_session_type', 'firebase');
        setUser(firebaseUser);
        await fetchProfile(firebaseUser, false);
      } else {
        // Standard logout/reloading without fallback
        setUser(null);
        setProfile(null);
        setCategory(null);
        setIsSocialRegistration(false);
        localStorage.removeItem('portal_user');
        localStorage.removeItem('portal_profile');
        localStorage.removeItem('portal_session_type');
        setCurrentScreen(prev => (prev === 'REGISTER' || prev === 'LOADING') ? prev : 'LOBBY');
        setAuthReady(true);
        setIsInitializing(false);
      }
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (authReady && currentScreen === 'LOADING') {
      const timer = setTimeout(() => {
        if (!user) setCurrentScreen('LOBBY');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, authReady, user]);

  const navigate = (screen: Screen) => {
    const restrictedScreens: Screen[] = ['HOME', 'TRACKER', 'SETTINGS', 'CATEGORY_DASHBOARD', 'APPLYING_BENEFIT'];
    if (restrictedScreens.includes(screen) && !user) {
      setCurrentScreen('LOBBY');
      return;
    }
    if (screen === 'REGISTER') {
      setIsSocialRegistration(false);
    }
    if (screen === 'BENEFITS') {
      setCategory(null);
    }
    setCurrentScreen(screen);
  };

  const handleGoogleAuth = async () => {
    setIsSocialRegistration(true);
    setIsQuickRegistration(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
    }
  };

  const handleFacebookAuth = async () => {
    setIsSocialRegistration(true);
    setIsQuickRegistration(true);
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error: any) {
      console.error("Facebook Auth Error:", error);
    }
  };

  const handleEmailAuth = async (email: string, pass: string, isLogin: boolean) => {
    setIsSocialRegistration(!isLogin);
    setIsQuickRegistration(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_profile');
    localStorage.removeItem('portal_session_type');
    setUser(null);
    setProfile(null);
    setCategory(null);
    await signOut(auth);
    setCurrentScreen('LOBBY');
  };

  // Notification Observers
  const prevStatuses = useRef<Record<string, string>>({});
  const isFirstLoadNews = useRef(true);
  const isFirstLoadBenefits = useRef(true);

  useEffect(() => {
    if (!user || !profile) return;

    // 1. Observer for Appointment changes
    const appointmentsQ = query(collection(db, 'appointments'), where('userId', '==', user.uid));
    const unsubAppointments = onSnapshot(appointmentsQ, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const docId = change.doc.id;
        const currentStatus = data.status;

        if (change.type === 'added') {
          // Initialize tracking
          prevStatuses.current[docId] = currentStatus;
        } else if (change.type === 'modified') {
          const oldStatus = prevStatuses.current[docId];
          if (oldStatus && oldStatus !== currentStatus) {
            // Status actually changed!
            if (currentStatus === 'Approved' || currentStatus === 'Inaprubahan') {
              createNotification({
                userId: user.uid,
                title: language === 'FIL' ? 'Inaprubahan ang Appointment' : 'Appointment Approved',
                message: language === 'FIL' ? `Ang iyong appointment para sa ${data.benefitTitle} ay inaprubahan na!` : `Your appointment for ${data.benefitTitle} has been approved!`,
                type: 'appointment_approval',
                isRead: false,
                createdAt: serverTimestamp()
              });
            } else if (currentStatus === 'Rejected' || currentStatus === 'Tinanggihan' || currentStatus === 'Declined') {
              createNotification({
                userId: user.uid,
                title: language === 'FIL' ? 'Tinanggihan ang Appointment' : 'Appointment Rejected',
                message: language === 'FIL' ? `Paumanhin, ang iyong appointment para sa ${data.benefitTitle} ay tinanggihan.` : `Sorry, your appointment for ${data.benefitTitle} was rejected.`,
                type: 'appointment_rejection',
                isRead: false,
                createdAt: serverTimestamp()
              });
            }
          }
          prevStatuses.current[docId] = currentStatus;
        }
      });
    });

    // 2. Observer for News/Announcements
    const newsQ = query(collection(db, 'News for users'), orderBy('createdAt', 'desc'), limit(1));
    const unsubNews = onSnapshot(newsQ, (snapshot) => {
      if (isFirstLoadNews.current) {
        if (!snapshot.empty) {
          localStorage.setItem(`last_news_${user.uid}`, snapshot.docs[0].id);
        }
        isFirstLoadNews.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const lastId = localStorage.getItem(`last_news_${user.uid}`);
          
          if (change.doc.id !== lastId) {
            createNotification({
              userId: user.uid,
              title: language === 'FIL' ? 'Bagong Anunsyo' : 'New Announcement',
              message: data.title || (language === 'FIL' ? 'May bagong anunsyo sa portal.' : 'A new announcement has been posted.'),
              type: 'announcement',
              isRead: false,
              createdAt: serverTimestamp()
            });
            localStorage.setItem(`last_news_${user.uid}`, change.doc.id);
          }
        }
      });
    });

    // 3. Observer for Services
    const benefitsQ = query(collection(db, 'services'));
    const unsubBenefits = onSnapshot(benefitsQ, (snapshot) => {
      if (isFirstLoadBenefits.current) {
        localStorage.setItem(`last_ben_count_${user.uid}`, String(snapshot.docs.length));
        isFirstLoadBenefits.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const lastCount = parseInt(localStorage.getItem(`last_ben_count_${user.uid}`) || '0');
          if (snapshot.docs.length > lastCount) {
             createNotification({
              userId: user.uid,
              title: language === 'FIL' ? 'Bagong Serbisyo' : 'New Service Added',
              message: language === 'FIL' ? 'Isang bagong programa ang idinagdag sa portal.' : 'A new service program has been added to the portal.',
              type: 'benefit',
              isRead: false,
              createdAt: serverTimestamp()
            });
            localStorage.setItem(`last_ben_count_${user.uid}`, String(snapshot.docs.length));
          }
        }
      });
    });

    return () => { 
      unsubAppointments(); 
      unsubNews(); 
      unsubBenefits(); 
    };
  }, [user?.uid, profile, language]);

  if (isInitializing || !authReady) return <LoadingScreen t={t} />;
  const showNav = !!user && ['HOME', 'BENEFITS', 'TRACKER', 'HELP', 'SETTINGS', 'CATEGORY_DASHBOARD'].includes(currentScreen);

  return (
    <div className={`w-full h-[100dvh] overflow-hidden flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#050811]' : 'bg-[#E2E8F0]'}`}>
      <div className={`w-full md:max-w-[768px] h-full relative overflow-hidden flex flex-col md:shadow-2xl transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F7FF]'}`}>
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentScreen === 'LOADING' && <LoadingScreen key="loading" t={t} />}
            {currentScreen === 'LOBBY' && (
              <LobbyScreen 
                key="lobby" navigate={navigate}
                onCategorySelect={(cat) => { setCategory(cat); if (user && profile) setCurrentScreen('CATEGORY_DASHBOARD'); else setCurrentScreen('BENEFITS'); }} 
                onGoogleAuth={handleGoogleAuth} onFacebookAuth={handleFacebookAuth} onEmailAuth={handleEmailAuth}
                language={language} onLanguageToggle={() => setLanguage(language === 'EN' ? 'FIL' : 'EN')} t={t} theme={theme}
              />
            )}
            {currentScreen === 'REGISTER' && (
              <RegisterScreen 
                key="register" initialCategory={category} isSocialAuth={isSocialRegistration || isQuickRegistration || !!user}
                onBack={() => { if (profile) setCurrentScreen('HOME'); else handleLogout(); }} 
                onSuccess={() => { if (auth.currentUser) fetchProfile(auth.currentUser, true); }} t={t} theme={theme}
              />
            )}
            {currentScreen === 'HOME' && (
              <HomeScreen 
                key="home" profile={profile} category={category} navigate={navigate} 
                onCategorySelect={(cat) => { setCategory(cat); setCurrentScreen('APPLYING_BENEFIT'); }}
                onApplyClick={() => { setCategory(null); setCurrentScreen('APPLYING_BENEFIT'); }}
                onLanguageToggle={() => setLanguage(language === 'EN' ? 'FIL' : 'EN')} t={t} theme={theme} 
              />
            )}
            {currentScreen === 'APPLYING_BENEFIT' && (
              <ApplyingBenefitScreen 
                key="applying_benefit" profile={profile} category={category} onCategorySelect={setCategory}
                navigate={navigate} language={language} t={t} theme={theme} 
              />
            )}
            {currentScreen === 'CATEGORY_DASHBOARD' && (
              <CategoryDashboardScreen 
                key="category_dashboard" profile={profile} category={category} navigate={navigate} language={language} t={t} theme={theme}
              />
            )}
            {currentScreen === 'BENEFITS' && (
              <BenefitsScreen 
                key="benefits" category={category} navigate={navigate} onGoogleAuth={handleGoogleAuth} onFacebookAuth={handleFacebookAuth}
                onEmailAuth={handleEmailAuth} hasProfile={!!profile} language={language} t={t} theme={theme}
              />
            )}
            {currentScreen === 'TRACKER' && <TrackerScreen key="tracker" profile={profile} navigate={navigate} t={t} theme={theme} />}
            {currentScreen === 'HELP' && <HelpScreen key="help" navigate={navigate} profile={profile} t={t} theme={theme} />}
            {currentScreen === 'SETTINGS' && (
              <SettingsScreen 
                key="settings" profile={profile} category={category} language={language} theme={theme} notifications={notifications}
                onLogout={handleLogout} onCategoryChange={() => { setCategory(null); setCurrentScreen('LOBBY'); }} 
                navigate={navigate} setLanguage={setLanguage} setTheme={setTheme} setNotifications={setNotifications} t={t}
                onProfileUpdate={() => user && fetchProfile(user)}
              />
            )}
          </AnimatePresence>
        </div>
        {showNav && <BottomNav activeScreen={currentScreen} onNavigate={navigate} t={t} theme={theme} />}
      </div>
    </div>
  );
}
