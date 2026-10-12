import { ReactNode } from 'react';

export type Screen = 'LOADING' | 'LOBBY' | 'REGISTER' | 'HOME' | 'BENEFITS' | 'TRACKER' | 'HELP' | 'SETTINGS' | 'CATEGORY_DASHBOARD' | 'APPLYING_BENEFIT';
export type Category = 'solo-parent' | 'senior' | 'pwd' | null;
export type Language = 'EN' | 'FIL';
export type Theme = 'light' | 'dark';

export interface UserProfile {
  uid: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sex: string;
  civilStatus: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  mobile: string;
  email: string;
  address: string;
  category: Category;
  isAdmin?: boolean;
}

export interface Benefit {
  id?: string;
  title: string;
  category: string;
  amount: string;
  freq: string;
  icon: ReactNode;
  color: string;
  desc: string;
}

export interface FirestoreBenefit {
  id: string;
  category: string;
  titleEn: string;
  titleFil: string;
  descEn: string;
  descFil: string;
  amount: string;
  freqEn: string;
  freqFil: string;
  icon: string;
  color: string;
  order: number;
}

export interface Appointment {
  docId: string;
  benefitTitle: string;
  date: string;
  location: string;
  status: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  day?: string;
  createdAt: any;
  requirement?: string;
  requirements?: string;
  time?: string;
}

export interface SystemUpdate {
  title: string;
  message: string;
  date: string;
  day?: string;
  updatedAt: any;
  requirement?: string;
  requirements?: string;
  time?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment_approval' | 'appointment_rejection' | 'announcement' | 'benefit' | 'general';
  isRead: boolean;
  createdAt: any;
}
