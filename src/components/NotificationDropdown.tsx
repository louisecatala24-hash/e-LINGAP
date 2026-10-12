import React from 'react';
import { motion } from 'motion/react';
import { Bell, X, CheckCircle2, Info, Gift, ExternalLink } from 'lucide-react';
import { Notification, Theme } from '../types';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  t: any;
  theme: Theme;
}

export function NotificationDropdown({ notifications, onClose, onMarkRead, onMarkAllRead, t, theme }: NotificationDropdownProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`absolute top-16 right-0 w-[calc(100vw-32px)] max-w-sm z-[100] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border backdrop-blur-xl ${
        theme === 'dark' ? 'bg-[#161B28]/95 border-white/10' : 'bg-white/95 border-slate-200'
      }`}
    >
      <div className={`p-5 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-[#001F54]'}`}>
              {t.notificationsTitle || 'Notifications'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && notifications.length > 0 && (
             <span className="px-2 py-0.5 rounded-full bg-red-600 text-[8px] font-black text-white uppercase tracking-widest">
               {unreadCount} New
             </span>
          )}
          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400'}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-[min(400px,60vh)] overflow-y-auto scrollbar-none p-2 flex flex-col gap-1.5 font-sans">
        {notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-8">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-white/5 text-white/20' : 'bg-slate-50 text-slate-200'}`}>
              <Bell size={24} />
            </div>
            <p className={`text-xs font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
              {t.noNotifications || 'No notifications yet'}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`p-4 rounded-[20px] border transition-all relative cursor-pointer ${
                n.isRead 
                  ? (theme === 'dark' ? 'bg-white/5 border-white/5 opacity-60' : 'bg-slate-50 border-slate-50 opacity-60') 
                  : (n.type === 'appointment_approval' 
                      ? (theme === 'dark' ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]' : 'bg-emerald-100/80 border-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]')
                      : (theme === 'dark' ? 'bg-primary/20 border-primary/30 shadow-sm' : 'bg-blue-50 border-blue-100 shadow-sm'))
              }`}
            >
              {!n.isRead && <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ring-4 ${n.type === 'appointment_approval' ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-red-500 ring-red-500/20'}`} />}
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'appointment_approval' ? 'bg-emerald-600 text-white shadow-sm' : 
                  n.type === 'appointment_rejection' ? 'bg-red-500/10 text-red-500' :
                  n.type === 'benefit' ? 'bg-amber-500/10 text-amber-500' :
                  n.type === 'announcement' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-primary/10 text-primary'
                }`}>
                  {n.type === 'appointment_approval' ? <CheckCircle2 size={18} /> : 
                   n.type === 'appointment_rejection' ? <X size={18} /> :
                   n.type === 'benefit' ? <Gift size={18} /> :
                   n.type === 'announcement' ? <Info size={18} /> : 
                   <Bell size={18} />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-[13px] font-black uppercase leading-tight mb-0.5 ${
                    n.type === 'appointment_approval' && !n.isRead ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700') : 
                    theme === 'dark' ? 'text-white' : 'text-[#001F54]'
                  }`}>
                    {n.title}
                  </h4>
                  <p className={`text-[11px] font-bold leading-snug ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    {n.message}
                  </p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} 
                    {' • '}
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {unreadCount > 0 && (
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <button 
            onClick={onMarkAllRead}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {t.markAsRead || 'Mark All as Read'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
