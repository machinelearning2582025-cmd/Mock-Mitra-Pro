import { motion, AnimatePresence } from 'motion/react';
import { X, User, Target, Globe, BookOpen, Save, CheckCircle2, ShieldAlert, Sparkles, Loader2, Bell, Clock, Volume2, Check } from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';
import { useState, useEffect } from 'react';
import { usePersistence } from '../hooks/usePersistence';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  triggerTestNotification, 
  triggerHaptic 
} from '../services/nativeService';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  firebaseUser?: any;
  onLoginWithGoogle?: () => Promise<any>;
}

const PRESET_TIMES = [
  { label: 'Subah 8:00 AM', value: '08:00', icon: '🌅' },
  { label: 'Dopahar 2:00 PM', value: '14:00', icon: '☀️' },
  { label: 'Shaam 7:00 PM', value: '19:00', icon: '🌆' },
  { label: 'Raat 9:30 PM', value: '21:30', icon: '🌙' },
];

export default function AccountModal({ 
  isOpen, 
  onClose, 
  profile, 
  onUpdate,
  firebaseUser,
  onLoginWithGoogle
}: AccountModalProps) {
  const { logout } = usePersistence();
  const [formData, setFormData] = useState({
    name: profile.name,
    exam: profile.exam,
    language: profile.language,
    customExamDetails: profile.customExamDetails || ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    profile.notificationSettings || {
      enabled: true,
      time: '19:30',
      sound: true
    }
  );

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [testNotifSuccess, setTestNotifSuccess] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotifPermission(getNotificationPermission());
    }
  }, [isOpen]);

  const handleSave = () => {
    triggerHaptic('success');
    onUpdate({
      ...formData,
      notificationSettings
    });
    onClose();
  };

  const handleEnablePermission = async () => {
    triggerHaptic('light');
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setNotificationSettings(prev => ({ ...prev, enabled: true }));
      triggerHaptic('success');
    }
  };

  const handleTestNotification = async () => {
    triggerHaptic('medium');
    setIsTestingNotif(true);
    setTestNotifSuccess(false);
    try {
      const ok = await triggerTestNotification(formData.exam || 'Mock Test');
      if (ok) {
        setTestNotifSuccess(true);
        setTimeout(() => setTestNotifSuccess(false), 4000);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsTestingNotif(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!onLoginWithGoogle) return;
    setIsLinking(true);
    setLinkError('');
    try {
      await onLoginWithGoogle();
    } catch (err: any) {
      console.error("Link error:", err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes("auth/popup-closed-by-user") || errMsg.includes("popup-closed-by-user")) {
        setLinkError("Google Sign-In popup window aapne close kar di thi. Kripya process complete hone tak window open rakhein.");
      } else if (errMsg.includes("auth/cancelled-popup-request") || errMsg.includes("cancelled-popup-request")) {
        setLinkError("Request cancel ho gayi thi. Kripya fir se koshish karein.");
      } else if (errMsg.includes("auth/popup-blocked") || errMsg.includes("popup-blocked")) {
        setLinkError("Browser ne Google popup block kar diya. Browser settings me popup allow karein.");
      } else {
        setLinkError("Connection issue. Kripya dobara try karein.");
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bento-card bg-[#090c14] border-brand/25 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            {/* Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                  <div className="p-2 bg-brand/15 rounded-xl border border-brand/20">
                    <User className="text-brand w-5 h-5" />
                  </div>
                  Account & Reminders
                </h2>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Profile, study goals & notification schedule</p>
              </div>
              <button 
                onClick={() => { triggerHaptic('light'); onClose(); }}
                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-7">
              
              {/* Daily Reminder & Notification System */}
              <div className="space-y-4 rounded-2xl bg-white/[0.02] border border-brand/20 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Daily Study Reminder</h4>
                      <p className="text-[11px] text-slate-400">PWA Service Worker Notification</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setNotificationSettings(prev => ({ ...prev, enabled: !prev.enabled }));
                    }}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                      notificationSettings.enabled ? 'bg-brand' : 'bg-slate-800'
                    }`}
                  >
                    <motion.div 
                      layout
                      className={`w-5.5 h-5.5 rounded-full bg-white shadow-md ${
                        notificationSettings.enabled ? 'ml-auto' : 'mr-auto'
                      }`}
                    />
                  </button>
                </div>

                {notificationSettings.enabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-white/5"
                  >
                    {/* Time Picker */}
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                        <Clock className="w-3.5 h-3.5 text-brand" /> Reminder Time Set Karein
                      </label>
                      <input 
                        type="time" 
                        value={notificationSettings.time}
                        onChange={(e) => {
                          triggerHaptic('light');
                          setNotificationSettings(prev => ({ ...prev, time: e.target.value }));
                        }}
                        className="w-full bg-slate-900 border border-brand/30 rounded-xl px-4 py-3 text-white font-mono text-base font-bold outline-none focus:border-brand transition-all cursor-pointer"
                      />
                    </div>

                    {/* Quick Preset Time Chips */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Quick Presets:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_TIMES.map((preset) => {
                          const isSelected = notificationSettings.time === preset.value;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setNotificationSettings(prev => ({ ...prev, time: preset.value }));
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? 'bg-brand/20 border-brand text-white shadow-sm' 
                                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              <span>{preset.icon} {preset.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Permission & Test Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {notifPermission !== 'granted' ? (
                        <button
                          type="button"
                          onClick={handleEnablePermission}
                          className="flex-1 py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-black rounded-xl text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" /> Enable Permission
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Permission Active
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleTestNotification}
                        disabled={isTestingNotif}
                        className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-[11px] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isTestingNotif ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                          </>
                        ) : testNotifSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Alert Sent!
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Test Notification
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Personal Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-2 border-brand/50 pl-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity & Goals</span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-brand" /> Full Name
                  </label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand focus:bg-slate-900 outline-none transition-all font-semibold text-base"
                    placeholder="Apna name daalein"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-brand" /> Targeted Exam
                    </label>
                    <input 
                      type="text" 
                      value={formData.exam}
                      onChange={(e) => setFormData(prev => ({ ...prev, exam: e.target.value }))}
                      placeholder="Ex: SSC CGL, JEE, NEET..."
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand focus:bg-slate-900 outline-none transition-all font-semibold text-base placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-brand" /> Language
                    </label>
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand focus:bg-slate-900 outline-none transition-all font-semibold text-base appearance-none cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-brand" /> Study Preferences & Custom Syllabus
                  </label>
                  <textarea 
                    value={formData.customExamDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, customExamDetails: e.target.value }))}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand focus:bg-slate-900 outline-none transition-all text-sm font-medium placeholder:text-slate-600 h-24 resize-none"
                    placeholder="Ex: Focus on high-yield formulas, recent year questions, and conceptual clarity."
                  />
                </div>
              </div>

              {/* Google Sync Status Banner */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cloud Sync & Protection</span>
                </div>

                {firebaseUser ? (
                  <div className="flex items-center p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Google Connected</p>
                        <p className="text-xs font-black text-white truncate mt-1.5">{firebaseUser.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 animate-ping opacity-75" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Guest / Offline Mode</p>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">Tests are stored offline in this device.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLinkGoogle}
                        disabled={isLinking}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        {isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Link Google"}
                      </button>
                    </div>
                    {linkError && (
                      <p className="text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                        {linkError}
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 border-t border-white/5 grid grid-cols-2 gap-4 shrink-0 bg-[#070910]">
              <button 
                onClick={() => { triggerHaptic('light'); onClose(); }}
                className="py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all uppercase tracking-widest text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="py-3.5 bg-brand text-white font-black rounded-xl shadow-xl shadow-brand/25 hover:bg-brand-light transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
