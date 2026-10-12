import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, auth } from './firebase';
import { Benefit, Category, FirestoreBenefit, Language } from '../types';
import React from 'react';
import { 
  CreditCard, FileText, UploadCloud, Calendar, Clock, FolderCheck, 
  Activity, MessageSquare, Bell, DollarSign, GraduationCap, Building2, Home, Smile, Heart, Shield
} from 'lucide-react';

const ICON_MAP: { [key: string]: React.ReactNode } = {
  CreditCard: React.createElement(CreditCard, { size: 20 }),
  FileText: React.createElement(FileText, { size: 20 }),
  UploadCloud: React.createElement(UploadCloud, { size: 20 }),
  Calendar: React.createElement(Calendar, { size: 20 }),
  Clock: React.createElement(Clock, { size: 20 }),
  FolderCheck: React.createElement(FolderCheck, { size: 20 }),
  Activity: React.createElement(Activity, { size: 20 }),
  MessageSquare: React.createElement(MessageSquare, { size: 20 }),
  Bell: React.createElement(Bell, { size: 20 }),
  DollarSign: React.createElement(DollarSign, { size: 20 }),
  GraduationCap: React.createElement(GraduationCap, { size: 20 }),
  Building2: React.createElement(Building2, { size: 20 }),
  Home: React.createElement(Home, { size: 20 }),
  Smile: React.createElement(Smile, { size: 20 }),
  Heart: React.createElement(Heart, { size: 20 }),
  Shield: React.createElement(Shield, { size: 18 })
};

function mapFirestoreToBenefit(data: FirestoreBenefit, lang: Language): Benefit {
  const isFil = lang === 'FIL';
  
  // Normalize category for internal app use
  let normalizedCategory = data.category;
  const catLower = (data.category || '').toLowerCase();
  if (catLower.includes('senior')) {
    normalizedCategory = 'senior';
  } else if (catLower.includes('solo') || catLower.includes('parent')) {
    normalizedCategory = 'solo-parent';
  } else if (catLower.includes('pwd') || catLower.includes('disability')) {
    normalizedCategory = 'pwd';
  }

  return {
    id: data.id,
    title: isFil ? data.titleFil : data.titleEn,
    category: normalizedCategory,
    amount: data.amount,
    freq: isFil ? (data.freqFil || '') : (data.freqEn || ''),
    icon: ICON_MAP[data.icon] || React.createElement(Activity, { size: 20 }),
    color: data.color,
    desc: isFil ? data.descFil : data.descEn
  };
}

export function subscribeToBenefits(lang: Language, category: Category | undefined, callback: (benefits: Benefit[]) => void) {
  const benefitsRef = collection(db, 'services');
  let q;
  if (category) {
    // Handle variations in category names from Firestore
    let categorySearchValues: string[] = [category as string];
    if (category === 'senior') {
      categorySearchValues = ['senior', 'Senior Citizen', 'Senior citizen', 'senior citizen', 'senior-citizen', 'Senior Citizens', 'senior-citizens'];
    } else if (category === 'solo-parent') {
      categorySearchValues = ['solo-parent', 'Solo Parent', 'Solo parent', 'solo parent', 'solo-parents', 'Solo Parents'];
    } else if (category === 'pwd') {
      categorySearchValues = ['pwd', 'PWD', 'person with disability', 'Person with Disability', 'pwd-citizen'];
    }

    // Using 'in' operator to match any of the variations
    q = query(benefitsRef, where('category', 'in', categorySearchValues));
  } else {
    q = query(benefitsRef);
  }

  return (onSnapshot as any)(q, (snapshot: any) => {
    // Map data and then sort locally since composite indexes might be missing for all variations
    const data = snapshot.docs.map((doc: any) => mapFirestoreToBenefit(doc.data() as FirestoreBenefit, lang));
    const sortedData = data.sort((a: any, b: any) => (a.order || 99) - (b.order || 99));
    callback(sortedData);
  }, (error: any) => {
    handleFirestoreError(error, 'list', 'services');
  });
}

export async function seedBenefits() {
  const currentUser = auth.currentUser;
  if (!currentUser || (await currentUser.getIdTokenResult()).claims.admin !== true) return;
  const benefits = [
    // Solo Parent
    { 
      id: 'sp-new-id', category: 'solo-parent', titleEn: "New ID Registration", titleFil: "Bagong Rehistro ng ID", 
      descEn: "Apply for a new ID online.", descFil: "Mag-apply para sa bagong ID online.",
      amount: "FREE", freqEn: "New ID", freqFil: "Bagong ID", icon: "FileText", color: "indigo", order: 1 
    },
    { 
      id: 'sp-renewal', category: 'solo-parent', titleEn: "ID Renewal", titleFil: "Pag-renew ng ID", 
      descEn: "Renew expired IDs.", descFil: "I-renew ang mga expired na ID.",
      amount: "FREE", freqEn: "Once", freqFil: "Isang beses", icon: "CreditCard", color: "rose", order: 2 
    },
    { 
      id: 'sp-replacement', category: 'solo-parent', titleEn: "Replacement of Lost/Damaged ID", titleFil: "Pagpapalit ng Nawala/Nasirang ID", 
      descEn: "Request replacement ID.", descFil: "Humiling ng kapalit na ID.",
      amount: "FREE", freqEn: "Replace", freqFil: "Palitan", icon: "Shield", color: "amber", order: 3 
    },
    { 
      id: 'sp-form', category: 'solo-parent', titleEn: "Application Form", titleFil: "Form ng Aplikasyon", 
      descEn: "Fill up digital forms.", descFil: "Punan ang mga digital na form.",
      amount: "Digital", freqEn: "Forms", freqFil: "Mga Form", icon: "FileText", color: "cyan", order: 4 
    },
    { 
      id: 'sp-requirements', category: 'solo-parent', titleEn: "Document Submission", titleFil: "Pagsusumite ng Dokumento", 
      descEn: "Upload requirements.", descFil: "I-upload ang mga kinakailangan.",
      amount: "Online", freqEn: "Upload", freqFil: "I-upload", icon: "UploadCloud", color: "emerald", order: 5 
    },
    
    // Senior
    { 
      id: 'sc-new-id', category: 'senior', titleEn: "New ID Registration", titleFil: "Bagong Rehistro ng ID", 
      descEn: "Apply for a new ID online.", descFil: "Mag-apply para sa bagong ID online.",
      amount: "FREE", freqEn: "New ID", freqFil: "Bagong ID", icon: "FileText", color: "indigo", order: 1 
    },
    { 
      id: 'sc-renewal', category: 'senior', titleEn: "ID Renewal", titleFil: "Pag-renew ng ID", 
      descEn: "Renew expired IDs.", descFil: "I-renew ang mga expired na ID.",
      amount: "FREE", freqEn: "Once", freqFil: "Isang beses", icon: "CreditCard", color: "rose", order: 2 
    },
    { 
      id: 'sc-replacement', category: 'senior', titleEn: "Replacement of Lost/Damaged ID", titleFil: "Pagpapalit ng Nawala/Nasirang ID", 
      descEn: "Request replacement ID.", descFil: "Humiling ng kapalit na ID.",
      amount: "FREE", freqEn: "Replace", freqFil: "Palitan", icon: "Shield", color: "amber", order: 3 
    },
    { 
      id: 'sc-form', category: 'senior', titleEn: "Application Form", titleFil: "Form ng Aplikasyon", 
      descEn: "Fill up digital forms.", descFil: "Punan ang mga digital na form.",
      amount: "Digital", freqEn: "Forms", freqFil: "Mga Form", icon: "FileText", color: "cyan", order: 4 
    },
    { 
      id: 'sc-requirements', category: 'senior', titleEn: "Document Submission", titleFil: "Pagsusumite ng Dokumento", 
      descEn: "Upload requirements.", descFil: "I-upload ang mga kinakailangan.",
      amount: "Online", freqEn: "Upload", freqFil: "I-upload", icon: "UploadCloud", color: "emerald", order: 5 
    },

    // PWD
    { 
      id: 'pwd-new-id', category: 'pwd', titleEn: "New ID Registration", titleFil: "Bagong Rehistro ng ID", 
      descEn: "Apply for a new ID online.", descFil: "Mag-apply para sa bagong ID online.",
      amount: "FREE", freqEn: "New ID", freqFil: "Bagong ID", icon: "FileText", color: "indigo", order: 1 
    },
    { 
      id: 'pwd-renewal', category: 'pwd', titleEn: "ID Renewal", titleFil: "Pag-renew ng ID", 
      descEn: "Renew expired IDs.", descFil: "I-renew ang mga expired na ID.",
      amount: "FREE", freqEn: "Once", freqFil: "Isang beses", icon: "CreditCard", color: "rose", order: 2 
    },
    { 
      id: 'pwd-replacement', category: 'pwd', titleEn: "Replacement of Lost/Damaged ID", titleFil: "Pagpapalit ng Nawala/Nasirang ID", 
      descEn: "Request replacement ID.", descFil: "Humiling ng kapalit na ID.",
      amount: "FREE", freqEn: "Replace", freqFil: "Palitan", icon: "Shield", color: "amber", order: 3 
    },
    { 
      id: 'pwd-form', category: 'pwd', titleEn: "Application Form", titleFil: "Form ng Aplikasyon", 
      descEn: "Fill up digital forms.", descFil: "Punan ang mga digital na form.",
      amount: "Digital", freqEn: "Forms", freqFil: "Mga Form", icon: "FileText", color: "cyan", order: 4 
    },
    { 
      id: 'pwd-requirements', category: 'pwd', titleEn: "Document Submission", titleFil: "Pagsusumite ng Dokumento", 
      descEn: "Upload requirements.", descFil: "I-upload ang mga kinakailangan.",
      amount: "Online", freqEn: "Upload", freqFil: "I-upload", icon: "UploadCloud", color: "emerald", order: 5 
    }
  ];

  const requirementsList = [
    {
      category: 'solo-parent',
      requirementsEn: [
        "Solo Parent ID application",
        "Birth certificate(s) of child/children",
        "Proof of income (or certificate of indigency)",
        "Supporting documents (death certificate, separation papers, etc.)"
      ],
      requirementsFil: [
        "Aplikasyon para sa Solo Parent ID",
        "Birth certificate ng mga anak",
        "Katibayan ng kita (o certificate of indigency)",
        "Mga pansuportang dokumento (death certificate, separation papers, atbp.)"
      ]
    },
    {
      category: 'senior',
      requirementsEn: [
        "Senior Citizen ID or any valid government ID",
        "Proof of age (birth certificate, etc.)",
        "Must be assessed as indigent"
      ],
      requirementsFil: [
        "Senior Citizen ID o anumang valid government ID",
        "Katibayan ng edad (birth certificate, atbp.)",
        "Dapat ma-assess bilang indigent"
      ]
    },
    {
      category: 'pwd',
      requirementsEn: [
        "PWD ID",
        "Medical certificate (proof of disability)",
        "Barangay certificate"
      ],
      requirementsFil: [
        "PWD ID",
        "Medical certificate (katibayan ng kapansanan)",
        "Barangay certificate"
      ]
    }
  ];

  try {
    // Delete existing benefits first
    console.log('Clearing existing benefits and services from Firestore...');
    const benefitsSnapshot = await getDocs(collection(db, 'benefits'));
    for (const docSnap of benefitsSnapshot.docs) {
      await deleteDoc(doc(db, 'benefits', docSnap.id));
    }
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    for (const docSnap of servicesSnapshot.docs) {
      await deleteDoc(doc(db, 'services', docSnap.id));
    }
    console.log('Cleared existing data successfully');

    // Seed Benefits as Services
    for (const benefit of benefits) {
      await setDoc(doc(db, 'services', benefit.id), benefit);
    }

    // Seed Requirements
    for (const req of requirementsList) {
      await setDoc(doc(db, 'benefit-requirements', req.category), req);
    }

    // Seed News
    const newsItems = [
      {
        id: 'news-1',
        title: "New Monthly Allowance",
        content: "Starting next month, all verified beneficiaries will receive an additional ₱500 allowance.",
        date: "May 2025",
        updatedAt: serverTimestamp()
      },
      {
        id: 'news-2',
        title: "DHSUD Partnership",
        content: "New housing programs are now available for solo parents and seniors through our DHSUD partnership.",
        date: "May 2025",
        updatedAt: serverTimestamp()
      }
    ];

    for (const item of newsItems) {
      await setDoc(doc(db, 'News for users', item.id), item);
    }

    // Seed DSWD Contacts
    const dswdContacts = [
      { id: 'LANDLINE', value: '(632) 8-93181 - 01 to 07' },
      { id: 'GLOBE', value: '09171105686, 09178272543' },
      { id: 'SMART', value: '09199116200' },
      { id: 'EMAIL ADDRESS', value: 'inquiry@dswd.gov.ph' }
    ];

    for (const contact of dswdContacts) {
      await setDoc(doc(db, 'DSWD CONTACTS', contact.id), contact);
    }

    // Seed DSWD Portal Images
    const initialImages = [
      {
        id: 'dswd-logo',
        url: '/images/DSWD.png',
        name: 'DSWD Official Logo',
        uploadedBy: 'system',
        createdAt: new Date().toISOString()
      }
    ];

    for (const img of initialImages) {
      await setDoc(doc(db, 'images', img.id), img);
    }
    
    console.log('Benefits, news, requirements, contacts, and images seeded successfully');
  } catch (error) {
    handleFirestoreError(error, 'write', 'seeding');
  }
}

export async function fetchBenefits(lang: Language, category?: Category): Promise<Benefit[]> {
  try {
    const benefitsRef = collection(db, 'services');
    let q;
    if (category) {
      let categorySearchValues: string[] = [category as string];
      if (category === 'senior') {
        categorySearchValues = ['senior', 'Senior Citizen', 'Senior citizen', 'senior citizen', 'senior-citizen', 'Senior Citizens', 'senior-citizens'];
      } else if (category === 'solo-parent') {
        categorySearchValues = ['solo-parent', 'Solo Parent', 'Solo parent', 'solo parent', 'solo-parents', 'Solo Parents'];
      } else if (category === 'pwd') {
        categorySearchValues = ['pwd', 'PWD', 'person with disability', 'Person with Disability', 'pwd-citizen'];
      }
      q = query(benefitsRef, where('category', 'in', categorySearchValues));
    } else {
      q = query(benefitsRef);
    }
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapFirestoreToBenefit(doc.data() as FirestoreBenefit, lang));
    return data.sort((a: any, b: any) => (a.order || 99) - (b.order || 99));
  } catch (error) {
    handleFirestoreError(error, 'list', 'services');
  }
}

export async function fetchRequirements(lang: Language, category: Category): Promise<string[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'benefit-requirements'), where('category', '==', category)));
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return lang === 'FIL' ? data.requirementsFil : data.requirementsEn;
    }
    return [];
  } catch (error) {
    handleFirestoreError(error, 'get', `benefit-requirements/${category}`);
  }
}

export interface DswdContact {
  id: string;
  value: string;
}

export async function fetchDswdContacts(): Promise<DswdContact[]> {
  try {
    const contactsRef = collection(db, 'DSWD CONTACTS');
    const snapshot = await getDocs(contactsRef);
    
    if (snapshot.empty) {
      console.log('DSWD CONTACTS collection is empty. Seeding right now...');
      const dswdContacts = [
        { id: 'LANDLINE', value: '(632) 8-93181 - 01 to 07' },
        { id: 'GLOBE', value: '09171105686, 09178272543' },
        { id: 'SMART', value: '09199116200' },
        { id: 'EMAIL ADDRESS', value: 'inquiry@dswd.gov.ph' }
      ];

      // Return display defaults without modifying the database.
      
      return dswdContacts;
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      value: doc.data().value || ''
    }));
  } catch (error) {
    handleFirestoreError(error, 'list', 'DSWD CONTACTS');
    return [];
  }
}

export async function seedImagesIfMissing() {
  try {
    const user = auth.currentUser;
    const isAuthorized = user ? (await user.getIdTokenResult()).claims.admin === true : false;

    if (!isAuthorized) {
      // Regular or unauthenticated users should not trigger any checks or seeding
      return;
    }

    const docRef = doc(db, 'images', 'dswd-logo');
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      console.log('DSWD logo image missing from Firebase. Seeding now...');
      await setDoc(docRef, {
        id: 'dswd-logo',
        url: '/images/DSWD.png',
        name: 'DSWD Official Logo',
        uploadedBy: 'system',
        createdAt: new Date().toISOString()
      });
      console.log('DSWD logo image seeded successfully');
    }
  } catch (error) {
    console.error('Failed to check/seed image:', error);
  }
}
