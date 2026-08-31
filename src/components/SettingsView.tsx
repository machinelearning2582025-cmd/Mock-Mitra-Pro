import { useState, useEffect } from 'react';
import { 
  User, Target, Globe, BookOpen, Save, CheckCircle2, 
  Sparkles, Loader2, Bell, Clock, Volume2, Check, 
  ArrowLeft, Shield, Trash2, LogOut, ChevronRight, AlertCircle
} from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';
import { usePersistence } from '../hooks/usePersistence';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  triggerTestNotification, 
  triggerHaptic 
} from '../services/nativeService';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
  firebaseUser?: any;
  onLoginWithGoogle?: () => Promise<any>;
  onBack: () => void;
  onClearTestHistory?: () => void;
  onClearChatHistory?: () => void;
  onLogout?: () => void;
}

const PRESET_TIMES = [
  { label: 'Subah 8:00 AM', value: '08:00', icon: '🌅' },
  { label: 'Dopahar 2:00 PM', value: '14:00', icon: '☀️' },
  { label: 'Shaam 7:00 PM', value: '19:00', icon: '🌆' },
  { label: 'Raat 9:30 PM', value: '21:30', icon: '🌙' },
];

export default function SettingsView({
  profile,
  onUpdate,
  firebaseUser,
  onLoginWithGoogle,
  onBack,
  onClearTestHistory,
  onClearChatHistory,
  onLogout
}: SettingsViewProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    exam: profile.exam,
    language: profile.language || 'Hinglish',
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleSave = async () => {
    triggerHaptic('success');
    setIsSaving(true);
    try {
      await onUpdate({
        ...formData,
        notificationSettings
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
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
        setLinkError("Google Sign-In window close kar di gayi thi.");
      } else if (errMsg.includes("auth/popup-blocked") || errMsg.includes("popup-blocked")) {
        setLinkError("Browser ne popup block kar diya. Settings me allow karein.");
      } else {
        setLinkError("Connection issue. Kripya dobara try karein.");
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a10] text-slate-100 pb-28 sm:pb-16 pt-3 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header with Back Navigation */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <button
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            className="flex items-center gap-2 py-2 px-3 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all cursor-pointer font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Settings</span>
          </div>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your study schedule, exam goals, notifications, and profile details.
          </p>
        </div>

        {/* Save Banner Toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Settings successfully updated!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Study Reminders & Notifications */}
        <div className="bento-card p-5 sm:p-6 bg-[#0d101a] border-white/5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Daily Study Reminder</h3>
                <p className="text-xs text-slate-400">Receive offline-compatible practice test prompts</p>
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
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-brand" /> Reminder Time
                </label>
                <input 
                  type="time" 
                  value={notificationSettings.time}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setNotificationSettings(prev => ({ ...prev, time: e.target.value }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand rounded-xl px-4 py-3 text-white font-mono text-base font-bold outline-none transition-all cursor-pointer"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Quick Presets:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-brand/15 border-brand text-white' 
                            : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{preset.icon} {preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permission & Notification Test */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {notifPermission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleEnablePermission}
                    className="py-2.5 px-3.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" /> Enable Browser Permission
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Notifications Enabled
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={isTestingNotif}
                  className="py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingNotif ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending Alert...
                    </>
                  ) : testNotifSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sent!
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Send Test Alert
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Profile & Exam Target */}
        <div className="bento-card p-5 sm:p-6 bg-[#0d101a] border-white/5 space-y-4">
          <div className="pb-3 border-b border-white/5 flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            <h3 className="text-sm sm:text-base font-bold text-white">Profile & Target Exam</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Targeted Exam</label>
                <input 
                  type="text" 
                  value={formData.exam}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam: e.target.value }))}
                  placeholder="e.g. SSC CGL, UPSC, JEE, Banking..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Language</label>
                <select 
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none transition-all cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Hinglish">Hinglish (Hindi + English)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Custom Syllabus / Focus Areas
              </label>
              <textarea 
                value={formData.customExamDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, customExamDetails: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand rounded-xl px-4 py-3 text-white text-sm outline-none transition-all h-24 resize-none placeholder-slate-600"
                placeholder="e.g. Prioritize Indian Polity, Trigonometry, and current affairs."
              />
            </div>
          </div>
        </div>

        {/* Section 3: Cloud Synchronization */}
        <div className="bento-card p-5 sm:p-6 bg-[#0d101a] border-white/5 space-y-4">
          <div className="pb-3 border-b border-white/5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Account & Cloud Sync</h3>
          </div>

          {firebaseUser ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{firebaseUser.email}</div>
                  <div className="text-[11px] text-emerald-400">Google Sync Active</div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-white/5 transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <div>
                <div className="text-xs font-bold text-white">Guest / Offline Storage</div>
                <div className="text-xs text-slate-400 mt-0.5">Link your Google account to sync tests across devices.</div>
              </div>

              <button
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-md"
              >
                {isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect Google"}
              </button>
            </div>
          )}

          {linkError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              {linkError}
            </div>
          )}
        </div>

        {/* Section 4: Data Management */}
        <div className="bento-card p-5 sm:p-6 bg-[#0d101a] border-white/5 space-y-3">
          <div className="pb-3 border-b border-white/5 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Data Management</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {onClearChatHistory && (
              <button
                onClick={() => {
                  triggerHaptic('warning');
                  if (window.confirm("Clear all AI mentor chat messages?")) {
                    onClearChatHistory();
                  }
                }}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear AI Chat History</span>
              </button>
            )}

            {onClearTestHistory && (
              <button
                onClick={() => {
                  triggerHaptic('warning');
                  if (window.confirm("Clear all completed test scores & records?")) {
                    onClearTestHistory();
                  }
                }}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Practice History</span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-30 pt-3 pb-4 bg-[#080a10]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs sm:text-sm border border-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 px-6 bg-brand hover:bg-brand-light text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Preferences
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
