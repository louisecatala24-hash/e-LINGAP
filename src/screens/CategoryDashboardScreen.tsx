import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, CreditCard, Star, Shield, CheckCircle2, ChevronRight,
  FileText, UploadCloud, Calendar, Clock, FolderCheck, MessageSquare, 
  Bell, Activity, Send, Trash2, Info, Plus
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { UserProfile, Screen, Theme, Language, Category, Benefit } from '../types';
import { subscribeToBenefits, fetchRequirements } from '../lib/benefitService';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface CategoryDashboardScreenProps {
  key?: string;
  profile: UserProfile | null;
  category: Category;
  navigate: (s: Screen) => void;
  language: Language;
  t: any;
  theme: Theme;
}

export function CategoryDashboardScreen({ profile, category, navigate, language, t, theme }: CategoryDashboardScreenProps) {
  const [applyingFor, setApplyingFor] = useState<Benefit | null>(null);
  const [appStep, setAppStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ID Renewal States
  const [renewalIdType, setRenewalIdType] = useState<'Digital ID' | 'Physical Card' | 'Booklet'>('Physical Card');
  const [renewalReason, setRenewalReason] = useState<'Expired' | 'Damaged' | 'Lost'>('Expired');
  const [renewalDelivery, setRenewalDelivery] = useState<'Pickup' | 'Courier Delivery'>('Pickup');
  const [renewalUploadName, setRenewalUploadName] = useState<string>('');
  const [renewalUploadProgress, setRenewalUploadProgress] = useState<number>(0);
  const [renewalUploading, setRenewalUploading] = useState<boolean>(false);

  // ID Application States
  const [appFormName, setAppFormName] = useState('');
  const [appFormBirth, setAppFormBirth] = useState('');
  const [appFormAddress, setAppFormAddress] = useState('');
  const [appDependents, setAppDependents] = useState('1');
  const [appIncome, setAppIncome] = useState('₱5,000 - ₱10,000');
  const [appPensioner, setAppPensioner] = useState('No');
  const [appDisability, setAppDisability] = useState('Physical');
  const [appUploadName, setAppUploadName] = useState('');
  const [appUploadProgress, setAppUploadProgress] = useState(0);
  const [appUploading, setAppUploading] = useState(false);

  // Requirements Submission States
  const [uploadedReqs, setUploadedReqs] = useState<Record<number, { name: string; progress: number; done: boolean }>>({});
  const [uploadingReqIdx, setUploadingReqIdx] = useState<number | null>(null);

  // Appointment States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00 AM');
  const [selectedBranch, setSelectedBranch] = useState<string>('Main Welfare Center');
  const [appointmentPurpose, setAppointmentPurpose] = useState<string>('ID Application Validation');
  const [dateError, setDateError] = useState(false);

  // Replacement States
  const [replaceType, setReplaceType] = useState<'Lost' | 'Damaged'>('Lost');
  const [replaceIdNum, setReplaceIdNum] = useState('');
  const [replaceDelivery, setReplaceDelivery] = useState<'Pickup' | 'Courier Delivery'>('Pickup');
  const [replaceUploadName, setReplaceUploadName] = useState('');
  const [replaceUploadProgress, setReplaceUploadProgress] = useState(0);
  const [replaceUploading, setReplaceUploading] = useState(false);

  // Application Form (Digital) States
  const [formFullName, setFormFullName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formCivilStatus, setFormCivilStatus] = useState('Single');
  const [formContact, setFormContact] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDigitalSignature, setFormDigitalSignature] = useState(false);

  // Track Appointment States
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  // Chatbot States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; date: Date }>>([
    { sender: 'bot', text: 'Mabuhay! I am your local LGU Assistant chatbot. Feel free to pick a quick question below or ask me anything.', date: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatBotTyping, setChatBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Notifications read state
  const [readNotifs, setReadNotifs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    
    // Subscribe to benefits (rendered as all 9 available services)
    const unsubscribeBenefits = subscribeToBenefits(language, category, (data) => {
      setBenefits(data);
    });

    // Fetch requirements for this category
    async function getReqs() {
      try {
        const reqData = await fetchRequirements(language, category);
        setRequirements(reqData);
      } catch (err) {
        console.error("Failed to load requirements:", err);
      } finally {
        setLoading(false);
      }
    }
    getReqs();

    return () => unsubscribeBenefits();
  }, [category, language]);

  // Subscribe to real-time appointments for the logged-in user
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'appointments'), where('userId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort appointments by date descending or created time
      appointmentsList.sort((a: any, b: any) => {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setMyAppointments(appointmentsList);
    }, (error) => {
      console.error("Error subscribing to appointments:", error);
    });
    return () => unsubscribe();
  }, [profile]);

  // Auto-fill forms with user profile when they change
  useEffect(() => {
    if (profile) {
      setAppFormName(`${profile.firstName} ${profile.lastName}`);
      const birth = (profile.birthYear && profile.birthMonth && profile.birthDay)
        ? `${profile.birthYear}-${String(profile.birthMonth).padStart(2, '0')}-${String(profile.birthDay).padStart(2, '0')}`
        : '';
      setAppFormBirth(birth);
      setAppFormAddress(profile.address || '');

      setFormFullName(`${profile.firstName} ${profile.lastName}`);
      setFormBirthDate(birth);
      setFormContact(profile.mobile || '');
      setFormAddress(profile.address || '');
      setFormCivilStatus(profile.civilStatus || 'Single');
    }
  }, [profile]);

  // Auto scroll chatbot to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatBotTyping]);

  // Helper simulated upload progress
  const runSimulatedUpload = (onProgress: (p: number) => void, onComplete: () => void) => {
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      onProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        onComplete();
      }
    }, 150);
  };

  const handleIdRenewalUpload = () => {
    setRenewalUploading(true);
    setRenewalUploadProgress(0);
    setRenewalUploadName('expired_id_front.jpg');
    runSimulatedUpload(
      (p) => setRenewalUploadProgress(p),
      () => setRenewalUploading(false)
    );
  };

  const handleIdApplicationPhotoUpload = () => {
    setAppUploading(true);
    setAppUploadProgress(0);
    setAppUploadName('formal_2x2_photo.png');
    runSimulatedUpload(
      (p) => setAppUploadProgress(p),
      () => setAppUploading(false)
    );
  };

  const handleReplacementUpload = () => {
    setReplaceUploading(true);
    setReplaceUploadProgress(0);
    setReplaceUploadName('affidavit_of_loss.pdf');
    runSimulatedUpload(
      (p) => setReplaceUploadProgress(p),
      () => setReplaceUploading(false)
    );
  };

  const handleRequirementUpload = (idx: number, reqName: string) => {
    setUploadingReqIdx(idx);
    setUploadedReqs(prev => ({
      ...prev,
      [idx]: { name: `${reqName.toLowerCase().replace(/ /g, '_')}_verified.pdf`, progress: 0, done: false }
    }));

    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      setUploadedReqs(prev => {
        const item = prev[idx];
        if (!item) return prev;
        return {
          ...prev,
          [idx]: { ...item, progress: current, done: current >= 100 }
        };
      });

      if (current >= 100) {
        clearInterval(interval);
        setUploadingReqIdx(null);
      }
    }, 200);
  };

  const closeModal = () => {
    setApplyingFor(null);
    setAppStep('form');
    // Reset file upload states
    setRenewalUploadName('');
    setRenewalUploadProgress(0);
    setRenewalUploading(false);
    setAppUploadName('');
    setAppUploadProgress(0);
    setAppUploading(false);
    setReplaceUploadName('');
    setReplaceUploadProgress(0);
    setReplaceUploading(false);
    setFormDigitalSignature(false);
    setUploadedReqs({});
    setUploadingReqIdx(null);
  };

  const handleGenericSubmit = async (serviceType: string, eventDetails: any) => {
    if (!profile) {
      alert(t.signInRequired);
      return;
    }
    setIsSubmitting(true);
    try {
      if (serviceType === 'renewal') {
        await addDoc(collection(db, 'id_renewals'), {
          userId: profile.uid,
          userName: `${profile.firstName} ${profile.lastName}`,
          idType: renewalIdType,
          reason: renewalReason,
          delivery: renewalDelivery,
          fileName: renewalUploadName || 'auto_extracted_record.pdf',
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      } else if (serviceType === 'apply') {
        await addDoc(collection(db, 'id_applications'), {
          userId: profile.uid,
          userName: appFormName,
          birthDate: appFormBirth,
          address: appFormAddress,
          category,
          dependents: appDependents,
          income: appIncome,
          pensioner: appPensioner,
          disability: appDisability,
          photoFile: appUploadName || 'system_captured_face.jpg',
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      } else if (serviceType === 'requirements') {
        await addDoc(collection(db, 'requirements_submissions'), {
          userId: profile.uid,
          userName: `${profile.firstName} ${profile.lastName}`,
          category,
          documents: Object.keys(uploadedReqs).map(key => uploadedReqs[Number(key)].name),
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      } else if (serviceType === 'replacement') {
        await addDoc(collection(db, 'id_replacements'), {
          userId: profile.uid,
          userName: `${profile.firstName} ${profile.lastName}`,
          replaceType,
          idNum: replaceIdNum,
          delivery: replaceDelivery,
          fileName: replaceUploadName || 'affidavit_of_loss.pdf',
          status: 'Pending',
          category,
          createdAt: serverTimestamp()
        });
      } else if (serviceType === 'form') {
        await addDoc(collection(db, 'digital_applications'), {
          userId: profile.uid,
          fullName: formFullName,
          birthDate: formBirthDate,
          civilStatus: formCivilStatus,
          contact: formContact,
          address: formAddress,
          signature: formDigitalSignature,
          category,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      } else if (serviceType === 'appointment') {
        if (!selectedDate) {
          setDateError(true);
          setIsSubmitting(false);
          return;
        }
        await addDoc(collection(db, 'appointments'), {
          userId: profile.uid,
          userName: `${profile.firstName} ${profile.lastName}`,
          benefitTitle: `${category.replace('-', ' ').toUpperCase()} Office Visit`,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          branch: selectedBranch,
          purpose: appointmentPurpose,
          status: 'Pending',
          location: selectedBranch,
          createdAt: serverTimestamp()
        });
        setDateError(false);
      }
      setAppStep('success');
    } catch (e) {
      console.error("Submission failed:", e);
      handleFirestoreError(e, 'create', serviceType);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        status: 'Cancelled'
      });
    } catch (e) {
      console.error("Failed to cancel appointment:", e);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, date: new Date() }]);
    setChatBotTyping(true);

    setTimeout(() => {
      let response = "I'm sorry, I have limited information on that. If you need complex support, please call our LGU Hotline: (632) 8-931-8101 or email dswd@gov.ph.";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('hi') || lower.includes('hello')) {
        response = "Hello! Let me know if you want information on 'ID Requirements', 'How to Renew', or if you need our direct 'LGU Hotline' fallback.";
      } else if (lower.includes('require') || lower.includes('document')) {
        response = `To complete your application, please go back to the dashboard and open the "Submission of Requirements" panel. The standard documents are: DSWD Application form, Proof of Residence, Barangay Clearance, and age/category validation.`;
      } else if (lower.includes('renew') || lower.includes('expired')) {
        response = `ID cards can be renewed instantly through the portal! Simply click on "Renewal of ID" on your category dashboard, select your renewal reason (Expired/Lost/Damaged), upload a clearance document, and choose pickup or courier delivery.`;
      } else if (lower.includes('hotline') || lower.includes('call') || lower.includes('phone') || lower.includes('number')) {
        response = `Our automated chatbot is on limited support. For direct inquiries, please call the official LGU DSWD Social Welfare Desk Hotline at **(632) 8-931-8101** (Mon-Fri 8:00 AM - 5:00 PM) or email support@lgu.gov.ph.`;
      }

      setChatBotTyping(false);
      setChatMessages(prev => [...prev, { sender: 'bot', text: response, date: new Date() }]);
    }, 800);
  };

  const handleQuickChatOption = (topic: string) => {
    setChatMessages(prev => [...prev, { sender: 'user', text: topic, date: new Date() }]);
    setChatBotTyping(true);
    setTimeout(() => {
      let response = "";
      if (topic === 'ID Requirements') {
        response = "The main requirements for registration are: Barangay Certificate of Indigency, Valid Birth Certificate, and Category validation documents (e.g. Solo Parent certification, medical proof for PWD, or valid ID with birth date for Seniors).";
      } else if (topic === 'How to Renew') {
        response = "Select 'Renewal of ID' from your dashboard. Choose your Card type, declare the reason (expired/damaged/lost), and complete the online upload. You can pick it up or have it delivered via courier!";
      } else {
        response = "Our chatbot is configured with limited info. If your case is complex, please fallback to our DSWD LGU Hotline: **(632) 8-931-8101** or visit the physical Social Welfare Hub.";
      }
      setChatBotTyping(false);
      setChatMessages(prev => [...prev, { sender: 'bot', text: response, date: new Date() }]);
    }, 600);
  };

  const getServiceType = (id: string): string => {
    if (id.includes('new-id')) return 'apply';
    if (id.includes('renewal')) return 'renewal';
    if (id.includes('replacement')) return 'replacement';
    if (id.includes('form')) return 'form';
    if (id.includes('requirements')) return 'requirements';
    if (id.includes('appointment') && !id.includes('track')) return 'appointment';
    if (id.includes('track-appointment')) return 'track-appointment';
    if (id.includes('track-docs')) return 'track-docs';
    if (id.includes('status-overall')) return 'status-overall';
    if (id.includes('chatbot')) return 'chatbot';
    if (id.includes('notifications')) return 'notifications';
    return 'unknown';
  };

  const categoryConfigs: { [key: string]: { color: string, bg: string, text: string } } = {
    'solo-parent': { color: '#E11D48', bg: 'bg-rose-50', text: 'text-rose-600' },
    'senior': { color: '#7C3AED', bg: 'bg-violet-50', text: 'text-violet-600' },
    'pwd': { color: '#0891B2', bg: 'bg-cyan-50', text: 'text-cyan-600' }
  };

  const config = categoryConfigs[category || 'solo-parent'];

  // Announcements mock specific to category
  const getAnnouncements = () => {
    if (category === 'solo-parent') {
      return [
        { id: 1, title: 'Solo Parent Cash Subsidy Distribution', desc: 'The local government will release the monthly ₱1,000 cash subsidy starting May 24, 2025. Please proceed to the sports complex based on your alphabet letter schedule.', date: 'May 18, 2025' },
        { id: 2, title: 'Free Livelihood baking & Pastry Seminar', desc: 'In partnership with TESDA, we are offering free certified baking courses for single parents starting next Monday. Livelihood starter kits will be provided.', date: 'May 15, 2025' },
        { id: 3, title: 'National Solo Parents Week Celebration', desc: 'Join us for local discount activities and free health check-ups at the main social service gym on May 30.', date: 'May 10, 2025' }
      ];
    }
    if (category === 'senior') {
      return [
        { id: 1, title: 'Universal Pension Cash Distribution (Q2)', desc: 'Senior Pension distribution schedule is now active. Claimants from Barangay Central can collect at the civic gym on May 22, 2025. Remember to bring your Senior ID.', date: 'May 19, 2025' },
        { id: 2, title: 'Free Flu and Pneumonia Vaccine Drive', desc: 'Free immunizations for citizens aged 60 and above will be held at District Health Centers this Tuesday.', date: 'May 14, 2025' },
        { id: 3, title: 'Senior Wellness & Yoga Morning Sessions', desc: 'Join the community wellness stretch and health lectures every Friday at 6:00 AM in City Park.', date: 'May 08, 2025' }
      ];
    }
    return [
      { id: 1, title: 'Wheelchair & Prosthetics Support Applications', desc: 'Applications are now open for the distribution of free custom mobility assistive tools and wheelchair supplies at the social services hub.', date: 'May 17, 2025' },
      { id: 2, title: 'Inclusive IT & Computer Literacy Training', desc: 'Free specialized computer operations and web design courses for verified PWD applicants. Classes start next week.', date: 'May 12, 2025' },
      { id: 3, title: 'Special Olympics Local Qualifier Registrations', desc: 'Registrations are open for the annual inclusive games. Inquire at your barangay coordinator.', date: 'May 05, 2025' }
    ];
  };

  const currentServiceType = applyingFor ? getServiceType(applyingFor.id) : 'unknown';

  return (
    <ScreenWrapper theme={theme}>
      <div className={`h-full flex flex-col overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-[#F4F9FF]'}`}>
        
        {/* Category Header */}
        <div style={{ backgroundColor: theme === 'dark' ? '#161B28' : config.color }} className={`px-6 py-4 rounded-b-[24px] relative overflow-hidden shrink-0 shadow-sm ${theme === 'dark' ? 'border-b border-white/5' : ''}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="flex items-center gap-3 relative z-10">
            <button 
              onClick={() => navigate('HOME')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white/20 backdrop-blur-md text-white'}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-white/50'}`}>{t.portalDash}</p>
              <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase">
                {category?.replace('-', ' ')}
              </h1>
            </div>
          </div>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-28">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
               <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Loading Dashboard...</p>
            </div>
          ) : (
            <>
              {/* Reference ID and Availability Card */}
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
                   <span className={`${theme === 'dark' ? 'text-white/60' : 'text-slate-500'} text-xs tracking-tight`}>{t.benefitPrev || "Available Services"}</span>
                   <span className="text-primary text-xl font-black">{benefits.length}</span>
                </div>
              </div>

              {/* Badges Quick Stats */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                 <div className={`${config.bg} ${config.text} px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 border border-current border-opacity-10`}>
                    <CreditCard size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.next || "Next release"}: Jun 2025</span>
                 </div>
                 <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                    <Star size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.benefits || "Services"}: {benefits.length}</span>
                 </div>
                 <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 ${theme === 'dark' ? 'bg-[#001F54] text-white overflow-hidden relative shadow-inner' : 'bg-slate-900 text-white'}`}>
                    <Shield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t.validUntil || "Expiration"}: Dec 2025</span>
                 </div>
              </div>

              {/* 9 Services Menu Grid */}
              <div className="mb-6">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Official Category Services</p>
                <div className="grid gap-3">
                  {benefits.map((b, i) => (
                    <motion.button 
                      key={i} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setApplyingFor(b)}
                      className={`p-4 rounded-[24px] border shadow-sm flex items-center justify-between transition-all text-left w-full group ${
                        theme === 'dark' ? 'bg-[#161B28] border-white/5' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-400'}`}>
                          {b.icon}
                        </div>
                        <div>
                          <h4 className={`text-[13px] font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{b.title}</h4>
                          <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{b.amount} • {b.freq}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Unified Slide-up Dialog for 9 services */}
        <AnimatePresence>
          {applyingFor && (
            <>
              {/* Back backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
              />
              
              {/* Bottom interactive sheet */}
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className={`absolute inset-x-0 bottom-0 z-[101] rounded-t-[40px] px-6 pt-5 pb-8 shadow-2xl flex flex-col max-h-[85vh] h-[85vh] ${theme === 'dark' ? 'bg-[#121826]' : 'bg-white'}`}
              >
                {/* Drag pill handle */}
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-5 shrink-0 cursor-pointer" onClick={closeModal} />
                
                {/* Title */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">DSWD Service Portal</span>
                    <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{applyingFor.title}</h3>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                    {applyingFor.icon}
                  </div>
                </div>

                {/* Dynamic Service Container */}
                <div className="flex-1 overflow-y-auto pr-1 mb-4">
                  {appStep === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={36} />
                      </div>
                      <div>
                        <h4 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.allSet || "Transaction Completed"}</h4>
                        <p className={`text-xs mt-2 font-bold max-w-sm mx-auto leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                          Your application details have been submitted and registered successfully in the official Firestore database. Status checks are available real-time.
                        </p>
                      </div>
                      <Button onClick={closeModal} className="px-8 mt-4" theme={theme}>Back to Dashboard</Button>
                    </div>
                  ) : (
                    <>
                      {/* SERVICE 1: ID RENEWAL */}
                      {currentServiceType === 'renewal' && (
                        <div className="space-y-5">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Specify card details to request DSWD ID renewal. Standard processing takes 2-4 working days.
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>ID Document Type</label>
                              <div className="flex gap-2">
                                {['Digital ID', 'Physical Card', 'Booklet'].map((type: any) => (
                                  <button
                                    key={type}
                                    onClick={() => setRenewalIdType(type)}
                                    className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                                      renewalIdType === type 
                                        ? 'bg-primary border-primary text-white' 
                                        : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                                    }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Reason for Renewal</label>
                              <div className="flex gap-2">
                                {['Expired', 'Damaged', 'Lost'].map((reason: any) => (
                                  <button
                                    key={reason}
                                    onClick={() => setRenewalReason(reason)}
                                    className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                                      renewalReason === reason 
                                        ? 'bg-primary border-primary text-white' 
                                        : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                                    }`}
                                  >
                                    {reason}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Card Delivery Method</label>
                              <div className="flex gap-2">
                                {['Pickup', 'Courier Delivery'].map((del: any) => (
                                  <button
                                    key={del}
                                    onClick={() => setRenewalDelivery(del)}
                                    className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                                      renewalDelivery === del 
                                        ? 'bg-primary border-primary text-white' 
                                        : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                                    }`}
                                  >
                                    {del}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Proof of loss or damage (optional)</label>
                              {renewalUploadName ? (
                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}>
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    <div className="text-left">
                                      <p className="text-[11px] font-extrabold">{renewalUploadName}</p>
                                      <p className="text-[9px] text-slate-400">
                                        {renewalUploading ? `Uploading ${renewalUploadProgress}%` : 'Uploaded successfully ✅'}
                                      </p>
                                    </div>
                                  </div>
                                  {!renewalUploading && (
                                    <button onClick={() => setRenewalUploadName('')} className="text-rose-500 active:scale-90">
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  onClick={handleIdRenewalUpload}
                                  className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 active:bg-slate-50 border-slate-200 transition-all ${theme === 'dark' ? 'hover:bg-white/5 border-white/10 text-white/60' : ''}`}
                                >
                                  <UploadCloud size={24} className="text-primary" />
                                  <span className="text-[11px] font-black uppercase tracking-wider">Upload ID Picture or Affidavits</span>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full mt-6 py-4"
                            onClick={() => handleGenericSubmit('renewal', null)}
                            theme={theme}
                            disabled={renewalUploading}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Renewal Application'}
                          </Button>
                        </div>
                      )}

                      {/* SERVICE 2: ID APPLICATION */}
                      {currentServiceType === 'apply' && (
                        <div className="space-y-4">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Provide details to apply for a verified registration card.
                          </p>
                          <div className="space-y-3">
                            <Input label="Full Applicant Name" value={appFormName} onChange={e => setAppFormName(e.target.value)} theme={theme} />
                            <Input label="Birth Date" type="date" value={appFormBirth} onChange={e => setAppFormBirth(e.target.value)} theme={theme} />
                            <Input label="Residence Address" value={appFormAddress} onChange={e => setAppFormAddress(e.target.value)} theme={theme} />

                            {category === 'solo-parent' && (
                              <div className="grid grid-cols-2 gap-3">
                                <Input label="No. of Dependents" type="number" value={appDependents} onChange={e => setAppDependents(e.target.value)} theme={theme} />
                                <Input label="Monthly Income Bracket" value={appIncome} onChange={e => setAppIncome(e.target.value)} theme={theme} />
                              </div>
                            )}

                            {category === 'senior' && (
                              <div>
                                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Receive Social Pension?</label>
                                <select 
                                  value={appPensioner}
                                  onChange={e => setAppPensioner(e.target.value)}
                                  className={`w-full p-3 rounded-xl border text-xs font-bold leading-none ${theme === 'dark' ? 'bg-[#1a202c] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}
                                >
                                  <option value="No">No (Hindi pa pensionado)</option>
                                  <option value="Yes">Yes (Pensionado na)</option>
                                </select>
                              </div>
                            )}

                            {category === 'pwd' && (
                              <div>
                                <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Disability Category Type</label>
                                <select 
                                  value={appDisability}
                                  onChange={e => setAppDisability(e.target.value)}
                                  className={`w-full p-3 rounded-xl border text-xs font-bold leading-none ${theme === 'dark' ? 'bg-[#1a202c] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}
                                >
                                  <option value="Physical">Orthopedic / Physical Disability</option>
                                  <option value="Visual">Visual Impairment (Kabulagan)</option>
                                  <option value="Hearing">Hearing / Speech Impairment</option>
                                  <option value="Intellectual">Intellectual or Learning Disability</option>
                                  <option value="Psychosocial">Psychosocial Disability</option>
                                </select>
                              </div>
                            )}

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Formal 2x2 Photo ID</label>
                              {appUploadName ? (
                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}>
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    <div className="text-left">
                                      <p className="text-[11px] font-extrabold">{appUploadName}</p>
                                      <p className="text-[9px] text-slate-400">
                                        {appUploading ? `Uploading ${appUploadProgress}%` : 'Uploaded successfully ✅'}
                                      </p>
                                    </div>
                                  </div>
                                  {!appUploading && (
                                    <button onClick={() => setAppUploadName('')} className="text-rose-500 active:scale-90">
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  onClick={handleIdApplicationPhotoUpload}
                                  className={`w-full py-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 active:bg-slate-50 border-slate-200 transition-all ${theme === 'dark' ? 'hover:bg-white/5 border-white/10 text-white/60' : ''}`}
                                >
                                  <UploadCloud size={20} className="text-primary" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Upload High-res 2x2 Portrait Face Picture</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <Button 
                            className="w-full mt-4" 
                            onClick={() => handleGenericSubmit('apply', null)}
                            disabled={appUploading}
                            theme={theme}
                          >
                            {isSubmitting ? 'Submitting Application...' : 'Register Category ID'}
                          </Button>
                        </div>
                      )}

                      {/* SERVICE: REPLACEMENT OF LOST/DAMAGED ID */}
                      {currentServiceType === 'replacement' && (
                        <div className="space-y-5">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Submit a replacement request for lost or damaged physical category ID cards. Standard processing takes 2-4 working days.
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Replacement Reason</label>
                              <div className="flex gap-2">
                                {['Lost', 'Damaged'].map((reason: any) => (
                                  <button
                                    key={reason}
                                    onClick={() => setReplaceType(reason)}
                                    className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                                      replaceType === reason 
                                        ? 'bg-primary border-primary text-white' 
                                        : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                                    }`}
                                  >
                                    {reason} ID
                                  </button>
                                ))}
                              </div>
                            </div>

                            <Input 
                              label="Original ID Number (If known)" 
                              placeholder="e.g. SP-2025-0819" 
                              value={replaceIdNum} 
                              onChange={e => setReplaceIdNum(e.target.value)} 
                              theme={theme} 
                            />

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Card Delivery Method</label>
                              <div className="flex gap-2">
                                {['Pickup', 'Courier Delivery'].map((del: any) => (
                                  <button
                                    key={del}
                                    onClick={() => setReplaceDelivery(del)}
                                    className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                                      replaceDelivery === del 
                                        ? 'bg-primary border-primary text-white' 
                                        : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                                    }`}
                                  >
                                    {del}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                                {replaceType === 'Lost' ? 'Affidavit of Loss (PDF/Image)' : 'Photo of Damaged ID'}
                              </label>
                              {replaceUploadName ? (
                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}>
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    <div className="text-left">
                                      <p className="text-[11px] font-extrabold">{replaceUploadName}</p>
                                      <p className="text-[9px] text-slate-400">
                                        {replaceUploading ? `Uploading ${replaceUploadProgress}%` : 'Uploaded successfully ✅'}
                                      </p>
                                    </div>
                                  </div>
                                  {!replaceUploading && (
                                    <button onClick={() => setReplaceUploadName('')} className="text-rose-500 active:scale-90">
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={handleReplacementUpload}
                                  className={`w-full py-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 active:bg-slate-50 border-slate-200 transition-all ${theme === 'dark' ? 'hover:bg-white/5 border-white/10 text-white/60' : ''}`}
                                >
                                  <UploadCloud size={20} className="text-primary" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">
                                    {replaceType === 'Lost' ? 'Upload notarized Affidavit of Loss' : 'Upload photo of physical card'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          <Button 
                            className="w-full mt-4" 
                            onClick={() => handleGenericSubmit('replacement', null)}
                            disabled={replaceUploading}
                            theme={theme}
                          >
                            {isSubmitting ? 'Requesting replacement...' : 'Request Replacement ID'}
                          </Button>
                        </div>
                      )}

                      {/* SERVICE: APPLICATION FORM (DIGITAL) */}
                      {currentServiceType === 'form' && (
                        <div className="space-y-5">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Complete the digital registration form. Form details are transmitted securely to local social welfare database records.
                          </p>
                          <div className="space-y-4">
                            <Input 
                              label="Full Applicant Name" 
                              value={formFullName} 
                              onChange={e => setFormFullName(e.target.value)} 
                              theme={theme} 
                            />
                            
                            <div className="grid grid-cols-2 gap-3">
                              <Input 
                                label="Birth Date" 
                                type="date" 
                                value={formBirthDate} 
                                onChange={e => setFormBirthDate(e.target.value)} 
                                theme={theme} 
                              />
                              <Input 
                                label="Contact Number" 
                                value={formContact} 
                                onChange={e => setFormContact(e.target.value)} 
                                theme={theme} 
                              />
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Civil Status</label>
                              <select 
                                value={formCivilStatus}
                                onChange={e => setFormCivilStatus(e.target.value)}
                                className={`w-full p-3 rounded-xl border text-xs font-bold leading-none ${theme === 'dark' ? 'bg-[#1a202c] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}
                              >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Separated">Separated</option>
                                <option value="Solo Parent">Solo Parent</option>
                              </select>
                            </div>

                            <Input 
                              label="Permanent Residence Address" 
                              value={formAddress} 
                              onChange={e => setFormAddress(e.target.value)} 
                              theme={theme} 
                            />

                            <div 
                              onClick={() => setFormDigitalSignature(!formDigitalSignature)}
                              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer select-none transition-all ${
                                formDigitalSignature 
                                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' 
                                  : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                formDigitalSignature ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                              }`}>
                                {formDigitalSignature && <CheckCircle2 size={12} className="stroke-[3]" />}
                              </div>
                              <div className="text-left leading-tight">
                                <p className="text-[10px] font-black uppercase tracking-widest text-inherit">Digital Certify & Signature</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">I certify that all details above are accurate and true.</p>
                              </div>
                            </div>
                          </div>

                          <Button 
                            className="w-full mt-4" 
                            onClick={() => handleGenericSubmit('form', null)}
                            disabled={!formDigitalSignature}
                            theme={theme}
                          >
                            {isSubmitting ? 'Submitting Form...' : 'Submit Digital Application Form'}
                          </Button>
                        </div>
                      )}

                      {/* SERVICE 3: SUBMISSION OF REQUIREMENTS */}
                      {currentServiceType === 'requirements' && (
                        <div className="space-y-4">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Upload essential certificates to verify eligibility. All uploaded records are fully secured.
                          </p>
                          <div className="space-y-3">
                            {requirements.map((req, idx) => {
                              const up = uploadedReqs[idx];
                              return (
                                <div 
                                  key={idx}
                                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                    theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-[#001F54]'
                                  }`}
                                >
                                  <div className="flex-1 text-left mr-3">
                                    <p className="text-[11px] font-extrabold leading-snug">{req}</p>
                                    {up && (
                                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                        {up.done ? up.name : `Uploading... ${up.progress}%`}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    {up?.done ? (
                                      <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                        <CheckCircle2 size={12} />
                                        <span>Done</span>
                                      </div>
                                    ) : (
                                      <button
                                        disabled={uploadingReqIdx !== null}
                                        onClick={() => handleRequirementUpload(idx, req)}
                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all bg-primary ${
                                          uploadingReqIdx !== null ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                                        }`}
                                      >
                                        Upload
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <Button
                            className="w-full mt-4"
                            disabled={Object.keys(uploadedReqs).length === 0}
                            onClick={() => handleGenericSubmit('requirements', null)}
                            theme={theme}
                          >
                            {isSubmitting ? 'Submitting documents...' : `Submit ${Object.keys(uploadedReqs).length} Verified Documents`}
                          </Button>
                        </div>
                      )}

                      {/* SERVICE 4: APPOINTMENT SCHEDULING */}
                      {currentServiceType === 'appointment' && (
                        <div className="space-y-4">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Set an office appointment slot for in-person document validation or booklet pickup.
                          </p>
                          <div className="space-y-3">
                            <Input 
                              label="Choose Appointment Date"
                              type="date"
                              value={selectedDate}
                              onChange={e => setSelectedDate(e.target.value)}
                              error={dateError ? t.dateError : ''}
                              theme={theme}
                            />

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Preferred Time Slot</label>
                              <div className="grid grid-cols-2 gap-2">
                                {['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedTimeSlot(slot)}
                                    className={`py-2.5 rounded-xl border text-[11px] font-black tracking-tight uppercase transition-all ${
                                      selectedTimeSlot === slot 
                                        ? 'bg-primary border-primary text-white' 
                                        : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/55' : 'bg-slate-50 border-slate-100 text-[#001F54]'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Select Social Services Office Branch</label>
                              <select
                                value={selectedBranch}
                                onChange={e => setSelectedBranch(e.target.value)}
                                className={`w-full p-3 rounded-xl border text-xs font-bold leading-none ${theme === 'dark' ? 'bg-[#1a202c] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}
                              >
                                <option value="Main Welfare Center">Main Social Welfare Center (City Hall)</option>
                                <option value="District 1 Social Center">District 1 Social Center (North)</option>
                                <option value="District 2 Social Center">District 2 Health & Welfare Hub</option>
                              </select>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Purpose of Visit</label>
                              <select
                                value={appointmentPurpose}
                                onChange={e => setAppointmentPurpose(e.target.value)}
                                className={`w-full p-3 rounded-xl border text-xs font-bold leading-none ${theme === 'dark' ? 'bg-[#1a202c] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-[#001F54]'}`}
                              >
                                <option value="ID Application Validation">ID Registration & Photo Capture</option>
                                <option value="ID Booklet Pickup">Physical ID Card & Booklet Pickup</option>
                                <option value="Social Pension Claim Support">Welfare Grant / Pension Registration</option>
                                <option value="Social Case Interview">Social Worker General Consultation</option>
                              </select>
                            </div>
                          </div>

                          <Button 
                            className="w-full mt-4"
                            onClick={() => handleGenericSubmit('appointment', null)}
                            theme={theme}
                          >
                            {isSubmitting ? 'Finalizing appointment...' : 'Schedule DSWD Office Appointment'}
                          </Button>
                        </div>
                      )}

                      {/* SERVICE 5: TRACKING OF APPOINTMENT */}
                      {currentServiceType === 'track-appointment' && (
                        <div className="space-y-4">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Live tracking of DSWD appointments registered to your profile.
                          </p>
                          {myAppointments.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center gap-3">
                              <Calendar size={32} className="text-slate-300" />
                              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>No active appointments booked yet.</p>
                              <Button variant="outline" className="px-6 text-[10px]" onClick={() => {
                                const sched = benefits.find(b => b.id.includes('appointment') && !b.id.includes('track'));
                                if (sched) setApplyingFor(sched);
                              }} theme={theme}>Book Appointment Now</Button>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                              {myAppointments.map((appt, idx) => (
                                <div 
                                  key={idx}
                                  className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                                    theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-[#001F54]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono font-black text-primary uppercase">REF-{appt.id.slice(0, 6)}</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                      appt.status?.toLowerCase().includes('cancel') 
                                        ? 'bg-slate-100 text-slate-400 dark:bg-white/5' 
                                        : appt.status?.toLowerCase().includes('approv') || appt.status?.toLowerCase().includes('inaprub') || appt.status?.toLowerCase().includes('accept')
                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                        : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                      {appt.status}
                                    </span>
                                  </div>
                                  <h5 className="text-[12px] font-extrabold mb-1">{appt.purpose || appt.benefitTitle}</h5>
                                  <p className="text-[11px] font-bold text-slate-400">{appt.branch || 'City Social Office'}</p>
                                  <div className={`h-[1px] w-full my-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`} />
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {appt.date}</span>
                                    {appt.timeSlot && <span className="flex items-center gap-1"><Clock size={12} /> {appt.timeSlot}</span>}
                                  </div>

                                  {!appt.status?.toLowerCase().includes('cancel') && (
                                    <button
                                      onClick={() => handleCancelAppointment(appt.id)}
                                      className="absolute right-4 top-10 text-[9px] font-black uppercase tracking-wider text-rose-500 border border-rose-500/10 hover:bg-rose-500/5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SERVICE 6: TRACKING OF DOCUMENTS */}
                      {currentServiceType === 'track-docs' && (
                        <div className="space-y-5">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            Check verification checkpoints of your category files:
                          </p>
                          
                          <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-white/5">
                            {[
                              { title: 'Documents Uploaded', desc: 'Requirements received in cloud servers.', status: 'completed' },
                              { title: 'LGU Case Review', desc: 'Assigned verifier is reviewing birth records.', status: 'active' },
                              { title: 'Social Desk Certification', desc: 'Welfare supervisor authorizes official stamp.', status: 'pending' },
                              { title: 'Physical Release Code', desc: 'ID Booklet printing and barcode release.', status: 'pending' }
                            ].map((step, sIdx) => (
                              <div key={sIdx} className="relative text-left">
                                <div className={`absolute -left-6 top-1 w-4.5 h-4.5 rounded-full border-4 flex items-center justify-center ${
                                  step.status === 'completed' 
                                    ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900/40 text-white' 
                                    : step.status === 'active' 
                                    ? 'bg-amber-500 border-amber-100 dark:border-amber-900/40 text-white' 
                                    : 'bg-slate-200 border-slate-50 dark:bg-white/5 dark:border-white/5 text-slate-400'
                                }`}>
                                  {step.status === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  {step.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </div>
                                <h5 className={`text-[12px] font-extrabold ${step.status === 'active' ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{step.title}</h5>
                                <p className="text-[10px] font-bold text-slate-400 leading-snug mt-0.5">{step.desc}</p>
                              </div>
                            ))}
                          </div>

                          <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#181F30] border-white/5' : 'bg-[#EBF3FC] border-blue-50'}`}>
                            <div className="flex gap-2.5">
                              <Info size={16} className="text-primary shrink-0 mt-0.5" />
                              <div className="text-left text-[11px] font-extrabold leading-snug text-primary">
                                Document Checklist:
                                <ul className="mt-1 space-y-0.5 font-bold text-slate-500 dark:text-slate-400">
                                  <li>• Barangay Indigency Form: <span className="text-emerald-500">Verified ✅</span></li>
                                  <li>• Valid Birth Certification: <span className="text-emerald-500">Verified ✅</span></li>
                                  <li>• 2x2 Picture Portrait: <span className="text-amber-500">In Review ⏳</span></li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SERVICE 7: OVERALL APPLICATION STATUS */}
                      {currentServiceType === 'status-overall' && (
                        <div className="space-y-4">
                          <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                            LGU Administrative Status Board:
                          </p>
                          
                          <div className="space-y-3">
                            <div className={`p-4 rounded-[24px] border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-[#001F54]'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary ID Registration</span>
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">APPROVED ✅</span>
                              </div>
                              <p className="text-xs font-extrabold leading-relaxed text-left">
                                Your main registration claims are fully approved and authorized by welfare administrators. You are qualified for standard monthly releases.
                              </p>
                            </div>

                            <div className={`p-4 rounded-[24px] border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-[#001F54]'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ID Renewal (Damaged/Lost Claim)</span>
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500">PENDING VALIDATION ⏳</span>
                              </div>
                              <p className="text-xs font-extrabold leading-relaxed text-left">
                                Standard checklist validation of replacement justification documents is currently ongoing.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SERVICE 8: CHATBOT */}
                      {currentServiceType === 'chatbot' && (
                        <div className="flex flex-col h-[52vh]">
                          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 text-[10px] font-extrabold leading-snug text-left mb-3 shrink-0">
                            <Info size={14} className="shrink-0" />
                            <span>This local bot is on limited support mode. Hotlines fallback is available below.</span>
                          </div>

                          {/* Chat logs */}
                          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 scrollbar-none">
                            {chatMessages.map((msg, mIdx) => (
                              <div 
                                key={mIdx}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`p-3.5 rounded-2xl max-w-[85%] text-left text-xs font-bold ${
                                  msg.sender === 'user' 
                                    ? 'bg-primary text-white rounded-br-none' 
                                    : theme === 'dark' ? 'bg-[#1e2533] text-white rounded-bl-none' : 'bg-slate-100 text-[#001F54] rounded-bl-none'
                                }`}>
                                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                            ))}

                            {chatBotTyping && (
                              <div className="flex justify-start">
                                <div className={`p-3 rounded-2xl text-slate-400 text-xs font-bold bg-slate-100 dark:bg-white/5`}>
                                  Typing...
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>

                          {/* Quick answers selection */}
                          <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-none">
                            {['ID Requirements', 'How to Renew', 'LGU Hotline'].map((topic) => (
                              <button
                                key={topic}
                                onClick={() => handleQuickChatOption(topic)}
                                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shrink-0 transition-all active:scale-95 ${
                                  theme === 'dark' ? 'bg-white/5 border-white/5 text-white/60 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                              >
                                {topic}
                              </button>
                            ))}
                          </div>

                          {/* Text entry field */}
                          <div className="flex gap-2 pt-2 border-t dark:border-white/5 shrink-0">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              placeholder="Type a query..."
                              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                              className={`flex-1 p-3 rounded-xl border text-xs font-bold leading-none ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:outline-none' : 'bg-slate-50 border-slate-100 focus:outline-none'}`}
                            />
                            <button 
                              onClick={handleSendChat}
                              className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center active:scale-95 transition-all"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SERVICE 9: NOTIFICATIONS / ANNOUNCEMENTS */}
                      {currentServiceType === 'notifications' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                              Latest LGU News announcements:
                            </p>
                            <button
                              onClick={() => {
                                const newRead: Record<number, boolean> = {};
                                getAnnouncements().forEach(a => { newRead[a.id] = true; });
                                setReadNotifs(newRead);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                              Mark all as read
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                            {getAnnouncements().map((ann) => {
                              const isRead = readNotifs[ann.id] === true;
                              return (
                                <button
                                  key={ann.id}
                                  onClick={() => setReadNotifs(prev => ({ ...prev, [ann.id]: !prev[ann.id] }))}
                                  className={`p-4 rounded-2xl border text-left w-full transition-all relative overflow-hidden block ${
                                    theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-[#001F54]'
                                  } ${!isRead ? 'border-l-4 border-l-primary' : ''}`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <h5 className="text-[12px] font-extrabold pr-4">{ann.title}</h5>
                                    {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-400 leading-normal mb-2">{ann.desc}</p>
                                  <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">{ann.date}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer close button */}
                {appStep !== 'success' && currentServiceType !== 'chatbot' && (
                  <div className="shrink-0 pt-2 border-t dark:border-white/5">
                    <Button variant="outline" className="w-full" onClick={closeModal} theme={theme}>
                      Cancel / Close
                    </Button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  );
}
