import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, Download } from 'lucide-react';
import { isWrapperOrWebViewApp } from '../services/nativeService';

interface HeroProps {
  onStart: () => void;
  onStartGoogle?: () => void;
  onInstallClick?: () => void;
}

export default function Hero({ onStart, onStartGoogle }: HeroProps) {
  const [isWrapper, setIsWrapper] = useState(false);

  useEffect(() => {
    setIsWrapper(isWrapperOrWebViewApp());
  }, []);

  const handleOpenPWA = () => {
    try {
      window.open('https://mock-mitra-pro.vercel.app', '_blank');
    } catch {
      window.location.href = 'https://mock-mitra-pro.vercel.app';
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="max-w-xl w-full text-center">
        
        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand-light text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Active Recall Practice</span>
        </div>

        {/* Crisp Headline */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
          Master Your Exam in <span className="text-brand">20 Minutes</span> a Day
        </h1>

        {/* Clean Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          High-yield mock tests, instant doubt assistance, and topic mastery tracking tailored for your target exam.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mx-auto">
          {isWrapper ? (
            <>
              {/* In Wrapper: Guest Practice is Blue (Primary) */}
              <button
                id="hero-guest-btn"
                onClick={onStart}
                className="w-full py-3.5 px-6 bg-brand hover:bg-brand-light text-white font-bold rounded-xl shadow-lg shadow-brand/25 transition-all active:scale-98 cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <span>Guest Practice</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* In Wrapper: Download PWA for Better Performance is Normal (Secondary) */}
              <button
                id="hero-pwa-redirect-btn"
                onClick={handleOpenPWA}
                className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800 font-bold rounded-xl transition-all active:scale-98 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-none"
              >
                <Download className="w-4 h-4 shrink-0 text-brand" />
                <span>Download PWA for Better Performance</span>
              </button>
            </>
          ) : (
            <>
              {/* In Normal Browser: Continue with Google is Blue (Primary) */}
              {onStartGoogle && (
                <button
                  id="hero-google-btn"
                  onClick={onStartGoogle}
                  className="w-full py-3.5 px-6 bg-brand hover:bg-brand-light text-white font-bold rounded-xl shadow-lg shadow-brand/25 transition-all active:scale-98 cursor-pointer text-sm flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}

              {/* In Normal Browser: Guest Practice is Normal (Secondary) */}
              <button
                id="hero-guest-btn"
                onClick={onStart}
                className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800 font-bold rounded-xl transition-all active:scale-98 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-none"
              >
                <span>Guest Practice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Minimal Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 mt-12 pt-8 border-t border-slate-200 dark:border-white/5 max-w-md mx-auto text-center">
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">100%</div>
            <div className="text-[11px] text-slate-500 font-medium">Offline Ready</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Adaptive</div>
            <div className="text-[11px] text-slate-500 font-medium">Topic Drills</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Instant</div>
            <div className="text-[11px] text-slate-500 font-medium">AI Insights</div>
          </div>
        </div>

      </div>
    </div>
  );
}
