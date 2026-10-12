import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, Phone, Smartphone, Mail, X, Copy, Check } from 'lucide-react';
import { Screen, Theme, UserProfile } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { FAQ } from '../components/FAQ';
import { fetchDswdContacts, DswdContact } from '../lib/benefitService';

interface HelpScreenProps {
  key?: string;
  navigate: (s: Screen) => void;
  profile: UserProfile | null;
  t: any;
  theme: Theme;
}

export function HelpScreen({ navigate, profile, t, theme }: HelpScreenProps) {
  const faqs = t.faqs || [];
  const [contacts, setContacts] = useState<DswdContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState<DswdContact | null>(null);
  const [copied, setCopied] = useState(false);

  const isEnglish = t.faqTitle?.includes("Frequently") ?? true;

  useEffect(() => {
    async function loadContacts() {
      try {
        const fetched = await fetchDswdContacts();
        if (fetched && fetched.length > 0) {
          const orderMap: Record<string, number> = {
            'LANDLINE': 1,
            'GLOBE': 2,
            'SMART': 3,
            'EMAIL ADDRESS': 4,
            'EMAIL': 5
          };
          const sorted = [...fetched].sort((a, b) => {
            const aOrd = orderMap[a.id.toUpperCase()] || 99;
            const bOrd = orderMap[b.id.toUpperCase()] || 99;
            return aOrd - bOrd;
          });
          setContacts(sorted);
        } else {
          setContacts([
            { id: 'LANDLINE', value: '(632) 8-93181 - 01 to 07' },
            { id: 'GLOBE', value: '09171105686, 09178272543' },
            { id: 'SMART', value: '09199116200' },
            { id: 'EMAIL ADDRESS', value: 'inquiry@dswd.gov.ph' }
          ]);
        }
      } catch (err) {
        console.error("Error loading contacts from Firestore:", err);
        setContacts([
          { id: 'LANDLINE', value: '(632) 8-93181 - 01 to 07' },
          { id: 'GLOBE', value: '09171105686, 09178272543' },
          { id: 'SMART', value: '09199116200' },
          { id: 'EMAIL ADDRESS', value: 'inquiry@dswd.gov.ph' }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, []);

  const getContactIcon = (id: string, size: number = 36) => {
    const isDark = theme === 'dark';
    const colorClass = isDark ? 'text-[#818CF8]' : 'text-[#2F2C7F]';

    switch (id.toUpperCase()) {
      case 'LANDLINE':
        return <Phone className={colorClass} size={size} />;
      case 'GLOBE':
      case 'SMART':
        return <Smartphone className={colorClass} size={size} />;
      case 'EMAIL ADDRESS':
      case 'EMAIL':
        return <Mail className={colorClass} size={size} />;
      default:
        return <Phone className={colorClass} size={size} />;
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScreenWrapper hasNav theme={theme}>
      <div className={`h-full flex flex-col overflow-hidden relative pt-3 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B101B]' : 'bg-white'}`}>

        <div className="px-6 mb-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              id="back-to-home-btn"
              onClick={() => navigate('HOME')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className={`text-base font-black tracking-tight mb-0.5 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.faqTitle}</h1>
              <p className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.faqInstruction}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-28">
          {/* Normal Business Hours */}
          <div 
            id="business-hours-info-card"
            className={`p-6 rounded-[32px] border mb-6 flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{t.businessHoursTitle}</p>
              <h4 className={`text-sm font-black uppercase leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>{t.businessHours}</h4>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{t.businessDays}</p>
            </div>
          </div>

          <div className="mb-8" id="faqs-list-container">
            {faqs.map((faq: any, index: number) => (
              <FAQ key={index} title={faq.q} answer={faq.a} theme={theme} />
            ))}
          </div>

          {/* DSWD Contacts Direct Grid Layout */}
          <div className="mt-8 border-t border-dashed border-slate-200 dark:border-white/10 pt-6" id="dswd-contacts-direct-section">
            <h2 className={`text-xs font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
              {isEnglish ? "Contact Us Support" : "Makipag-ugnayan sa Amin"}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  id={`contact-card-${contact.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setActiveContact(contact)}
                  className={`p-4 rounded-3xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none shadow-sm h-32 hover:scale-[1.02] active:scale-[0.98] ${
                    theme === 'dark'
                      ? 'bg-slate-900/40 border-slate-700 text-white hover:bg-slate-800/40'
                      : 'bg-slate-50 border-[#F1F5F9] text-slate-800 hover:bg-slate-100/75 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-center p-1.5 rounded-full">
                    {getContactIcon(contact.id, 28)}
                  </div>
                  <div className={`text-[10px] font-bold tracking-widest uppercase mb-0.5 leading-none ${theme === 'dark' ? 'text-slate-300' : 'text-[#001F54]'}`}>
                    {contact.id}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Popover Centered Modal Overlay */}
      <AnimatePresence>
        {activeContact && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveContact(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            {/* Popover Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 text-center border shadow-2xl z-10 transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-[#121622] border-slate-800 text-white shadow-black/80'
                  : 'bg-white border-slate-100 text-[#001F54] shadow-slate-200'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveContact(null)}
                className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X size={16} />
              </button>

              {/* Content */}
              <div className="flex flex-col items-center mt-3">
                <div className={`p-4 rounded-full mb-4 ${
                  theme === 'dark' ? 'bg-indigo-950/40' : 'bg-[#F2E8FA]'
                }`}>
                  {getContactIcon(activeContact.id, 40)}
                </div>

                <h3 className={`text-md font-black tracking-widest uppercase mb-1 leading-none ${
                  theme === 'dark' ? 'text-white' : 'text-[#001F54]'
                }`}>
                  {activeContact.id}
                </h3>

                <p className={`text-[10px] font-bold uppercase tracking-wider mb-6 ${
                  theme === 'dark' ? 'text-white/40' : 'text-slate-400'
                }`}>
                  {isEnglish ? 'DSWD Official Contact' : 'Opisyal na Kontak ng DSWD'}
                </p>

                <div className={`w-full p-4 rounded-2xl border text-center transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-800 text-indigo-300'
                    : 'bg-slate-50 border-slate-100 text-[#2F2C7F]'
                }`}>
                  <span className="text-[14px] font-mono font-bold break-all block">
                    {activeContact.value}
                  </span>
                </div>

                <div className="mt-6 w-full">
                  <button
                    onClick={() => handleCopy(activeContact.value)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      copied 
                        ? 'bg-emerald-500 text-white' 
                        : theme === 'dark'
                          ? 'bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02] active:scale-95'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>{isEnglish ? 'Copied!' : 'Nakopya!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>{isEnglish ? 'Copy' : 'Kopyahin'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </ScreenWrapper>
  );
}
