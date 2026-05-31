import { motion, AnimatePresence } from 'motion/react';
import { X, User, Target, Globe, BookOpen, Save, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useState } from 'react';
import { usePersistence } from '../hooks/usePersistence';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  firebaseUser?: any;
  onLoginWithGoogle?: () => Promise<any>;
}

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
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const handleSave = () => {
    onUpdate(formData);
    onClose();
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
        setLinkError("Google Sign-In sheet window aapne bech me close kar di thi (पॉपअप बंद हो गया). Kripya complete hone tak window open rakhein!");
      } else if (errMsg.includes("auth/cancelled-popup-request") || errMsg.includes("cancelled-popup-request")) {
        setLinkError("Pichla request chalu thi ya cancel ho gayi. Kripya doobara link button dabaayein.");
      } else if (errMsg.includes("auth/popup-blocked") || errMsg.includes("popup-blocked")) {
        setLinkError("Browser ne Google popup block kar diya (पॉपअप ब्लॉक)! 🔒 URL bar me Settings/Popup perm allow karein ya pure experience ke liye top-right of the screen se 'Open in New Tab' karke try karein.");
      } else {
        setLinkError("Iframe sandbox restrictions ya cancel hone ke wajah se connection retry karna hoga.");
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bento-card bg-[#080a11] border-brand/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header / Top Bar */}
            <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    <User className="text-brand w-5 h-5" />
                  </div>
                  Account
                </h2>
                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Manage profile & goals</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 gap-8">
                
                {/* Google Sync Status Banner */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Protection</span>
                  </div>

                  {firebaseUser ? (
                    <div className="flex items-center p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/15">
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Guest Mode</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-bold">Data is stored only in this browser.</p>
                          </div>
                        </div>
                        <button
                          onClick={handleLinkGoogle}
                          disabled={isLinking}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {isLinking ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> ...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
                              </svg>
                              Link Google
                            </>
                          )}
                        </button>
                      </div>

                      {linkError && (
                        <p className="text-rose-500 text-[10px] font-bold bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10">
                          {linkError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Section: Personal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-2 border-brand/50 pl-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity & Personal</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-brand/40 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                {/* Section: Goal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-2 border-brand/50 pl-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam & Study Goals</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                        <Target className="w-3 h-3" /> Targeted Exam
                      </label>
                      <input 
                        type="text" 
                        value={formData.exam}
                        onChange={(e) => setFormData(prev => ({ ...prev, exam: e.target.value }))}
                        placeholder="Ex: JEE Advanced, Class 12, Python..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-brand/40 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Question Language
                      </label>
                      <select 
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-brand/40 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Hinglish">Hinglish</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" /> AI Instructions / Details (Optional)
                    </label>
                    <textarea 
                      value={formData.customExamDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, customExamDetails: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-brand/40 focus:bg-white/[0.05] outline-none transition-all text-xs font-bold placeholder:text-slate-600 h-24 resize-none"
                      placeholder="Ex: Focus on organic chemistry, include practical questions or conceptual facts."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 sm:p-8 border-t border-white/5 grid grid-cols-2 gap-4 shrink-0">
              <button 
                onClick={onClose}
                className="py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 font-black rounded-xl transition-all uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="py-3.5 bg-brand text-white font-black rounded-xl shadow-xl shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
              >
                <Save className="w-4 h-4" /> Save Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

