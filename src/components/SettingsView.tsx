import { useState, useEffect } from 'react';
import { 
  User, Target, Globe, Save, CheckCircle2, 
  Sparkles, Loader2, Bell, Clock, Volume2, 
  ArrowLeft, Shield, Trash2, LogOut,
  Moon, Sun, Monitor
} from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';
import { useTheme } from '../hooks/useTheme';
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
  { label: '8 AM', value: '08:00' },
  { label: '2 PM', value: '14:00' },
  { label: '7 PM', value: '19:00' },
  { label: '9:30 PM', value: '21:30' },
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
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: profile.name || '',
    exam: profile.exam || '',
    language: profile.language || 'Hinglish',
    customExamDetails: profile.customExamDetails || '',
    theme: profile.theme || theme
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
      setTimeout(() => setSaveSuccess(false), 2000);
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
        setTimeout(() => setTestNotifSuccess(false), 3000);
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
      setLinkError("Google sign-in could not be completed.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 pb-24 sm:pb-12 pt-2.5 px-3 sm:px-5 transition-colors duration-200">
      <div className="max-w-lg mx-auto space-y-3">
        
        {/* Compact Navigation Bar */}
        <div className="flex items-center justify-between py-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            className="flex items-center gap-1 py-1 px-2 -ml-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-all cursor-pointer font-bold text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Settings</span>
        </div>

        {/* Header Title */}
        <div className="pb-1">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Personalize your exam goals, daily study alerts, and app theme.
          </p>
        </div>

        {/* Save Toast Notification */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Settings updated successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Appearance */}
        <div className="bg-white dark:bg-[#0c0f18] border border-slate-200/70 dark:border-white/5 rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Theme</span>
            <span className="text-[10px] text-slate-400 font-medium capitalize">{theme}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {([
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Monitor }
            ] as const).map(({ id, label, icon: Icon }) => {
              const isSelected = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setTheme(id);
                    setFormData(prev => ({ ...prev, theme: id }));
                  }}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white dark:bg-[#151926] text-brand dark:text-white shadow-xs border border-slate-200 dark:border-white/10' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Study Reminder */}
        <div className="bg-white dark:bg-[#0c0f18] border border-slate-200/70 dark:border-white/5 rounded-xl p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                <Bell className="w-3 h-3" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Study Reminder</span>
                <span className="text-[10px] text-slate-400">Offline practice alerts</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setNotificationSettings(prev => ({ ...prev, enabled: !prev.enabled }));
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                notificationSettings.enabled ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-800'
              }`}
            >
              <motion.div 
                layout
                className={`w-4 h-4 rounded-full bg-white shadow-xs ${
                  notificationSettings.enabled ? 'ml-auto' : 'mr-auto'
                }`}
              />
            </button>
          </div>

          {notificationSettings.enabled && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand" /> Time
                </label>
                <input 
                  type="time" 
                  value={notificationSettings.time}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setNotificationSettings(prev => ({ ...prev, time: e.target.value }));
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand rounded-md px-2 py-1 text-slate-900 dark:text-white font-mono text-[11px] font-bold outline-none cursor-pointer"
                />
              </div>

              {/* Compact Preset Chips */}
              <div className="grid grid-cols-4 gap-1">
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
                      className={`py-1 px-1.5 rounded-md text-[10px] font-bold border transition-all text-center cursor-pointer ${
                        isSelected 
                          ? 'bg-brand/10 border-brand text-brand dark:text-white' 
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Status / Test Notification */}
              <div className="flex items-center justify-between pt-0.5 text-[10px]">
                {notifPermission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleEnablePermission}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Bell className="w-2.5 h-2.5" /> Enable Permission
                  </button>
                ) : (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Allowed
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={isTestingNotif}
                  className="font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Volume2 className="w-2.5 h-2.5" />
                  <span>{isTestingNotif ? "Sending..." : testNotifSuccess ? "Sent ✓" : "Test Alert"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Profile & Target Exam */}
        <div className="bg-white dark:bg-[#0c0f18] border border-slate-200/70 dark:border-white/5 rounded-xl p-3 shadow-xs space-y-2.5">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">Exam & Profile</span>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Full Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs font-semibold outline-none transition-all"
                placeholder="Your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Target Exam</label>
                <input 
                  type="text" 
                  value={formData.exam}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam: e.target.value }))}
                  placeholder="e.g. Class 9th, SSC..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs font-semibold outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Language</label>
                <select 
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-xs font-semibold outline-none transition-all cursor-pointer"
                >
                  <option value="Hinglish">Hinglish</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                Focus Notes / Syllabus
              </label>
              <textarea 
                value={formData.customExamDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, customExamDetails: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-[11px] outline-none transition-all h-14 resize-none placeholder-slate-400"
                placeholder="Specific focus topics or syllabus details..."
              />
            </div>
          </div>
        </div>

        {/* Section 4: Account & Cloud Sync */}
        <div className="bg-white dark:bg-[#0c0f18] border border-slate-200/70 dark:border-white/5 rounded-xl p-3 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">Account & Sync</span>

          {firebaseUser ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{firebaseUser.email}</div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400">Google Sync Active</div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-2.5 h-2.5" /> Logout
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Local Device Storage</div>
                <div className="text-[9px] text-slate-400">Sign in to sync across devices</div>
              </div>

              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="py-1 px-2.5 bg-brand hover:bg-brand-light text-white font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {isLinking ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "Connect Google"}
              </button>
            </div>
          )}

          {linkError && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 text-[10px]">
              {linkError}
            </div>
          )}
        </div>

        {/* Section 5: Data Actions */}
        <div className="bg-white dark:bg-[#0c0f18] border border-slate-200/70 dark:border-white/5 rounded-xl p-3 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">Data Management</span>

          <div className="grid grid-cols-2 gap-1.5">
            {onClearChatHistory && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  if (window.confirm("Clear all AI mentor chat history?")) {
                    onClearChatHistory();
                  }
                }}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 className="w-2.5 h-2.5 text-rose-500" />
                <span className="truncate">Clear AI Chat</span>
              </button>
            )}

            {onClearTestHistory && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  if (window.confirm("Clear all practice test records?")) {
                    onClearTestHistory();
                  }
                }}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 className="w-2.5 h-2.5 text-rose-500" />
                <span className="truncate">Clear Tests</span>
              </button>
            )}
          </div>
        </div>

        {/* Slim Sticky Bottom Action */}
        <div className="sticky bottom-0 z-30 pt-1.5 pb-2 bg-slate-50/95 dark:bg-[#07090e]/95 backdrop-blur-md border-t border-slate-200/70 dark:border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            className="py-1.5 px-3 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-1.5 px-3 bg-brand hover:bg-brand-light text-white font-bold rounded-lg text-xs shadow-sm shadow-brand/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3" /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
