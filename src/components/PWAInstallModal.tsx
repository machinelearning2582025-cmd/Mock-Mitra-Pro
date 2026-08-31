import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Smartphone, Download, Share2, Info } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalledSuccess?: () => void;
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalledSuccess
}: PWAInstallModalProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const safari = /safari/.test(ua) && !/crios|fxios|chrome|opera|edge/.test(ua);
    setIsIOS(ios);
    setIsSafari(safari);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User installation response outcome: ${outcome}`);
        if (outcome === 'accepted') {
          if (onInstalledSuccess) onInstalledSuccess();
          onClose();
        }
      } catch (err) {
        console.error('Triggering PWA prompt failed:', err);
      }
    } else {
      // Prompt not yet ready or unsupported, guide manual install
      alert("Direct installation is not supported by your current browser settings. Please use the Share/Browser menu to 'Add to Home Screen'.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-[#0A0C10]/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bento-card bg-white dark:bg-[#0F1117] border border-slate-200 dark:border-brand/30 p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col rounded-3xl"
      >
        {/* Aesthetic Glow Accents */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-brand/10 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-600/10 blur-[80px] rounded-full -ml-16 -mb-16 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Smartphone className="w-5 h-5 flex animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Install App 📱</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">MockMitra Quick Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <p className="text-slate-600 dark:text-slate-400 leading-normal font-sans text-center sm:text-left">
            MockMitra-Pro ko direct apne phone me local application (APK/App) ki tarah install karein. Super-fast startup, zero loading times, direct shortcut, aur complete performance tracking!
          </p>

          <div className="space-y-3.5 mt-2">
            {/* Conditional install path directions */}
            {deferredPrompt ? (
              <div className="p-3.5 bg-blue-50 dark:bg-brand/5 border border-blue-200 dark:border-brand/20 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  Aapke browser me <span className="text-slate-900 dark:text-white font-bold">direct quick installation</span> support available hai. Neeche diye gaye <span className="text-brand-light font-bold">"Install Now"</span> button par click karein.
                </p>
              </div>
            ) : isIOS ? (
              <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-wide text-[10px] mb-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /> iOS Safari Browser Instructions
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-3.5 font-sans font-medium">
                  Safari browser me bottom bar par <span className="text-slate-900 dark:text-white font-bold">Share Button (<Share2 className="inline-block w-3.5 h-3.5 mx-1" />)</span> par touch karein, phir neeche scroll karke <span className="text-brand-light font-bold">"Add to Home Screen"</span> touch karein.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-wide text-[10px] mb-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" /> Standard Browser Instructions
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-3.5 font-sans font-medium">
                  Chrome/Edge/Firefox menu <span className="text-slate-900 dark:text-white font-bold">(⋮ teen dots)</span> me click karke <span className="text-brand-light font-bold">"Install App"</span> ya <span className="text-brand-light font-bold">"Add to Home screen"</span> select karein.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={onClose}
              className="w-full sm:w-1/2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
            >
              Later
            </button>
            
            <button
              onClick={deferredPrompt ? handleInstallClick : onClose}
              className="w-full sm:w-1/2 py-3 bg-brand hover:bg-brand-light text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              {deferredPrompt ? "Install Now ⚡" : "I Understand"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
