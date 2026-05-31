import { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ExamSelector from './components/ExamSelector';
import Dashboard from './components/Dashboard';
import TestRunner from './components/TestRunner';
import ResultView from './components/ResultView';
import DrillSetupModal from './components/DrillSetupModal';
import AccountModal from './components/AccountModal';
import { usePersistence } from './hooks/usePersistence';
import { QUESTIONS } from './data/questions';
import { generateQuestionsAPI, analyzePerformanceAPI } from './services/api';
import { Topic, Question, DrillSetup } from './types';
import { Loader2, Download, Smartphone, Share2, X, Sparkles, Zap, ShieldAlert, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getExamConfig } from './data/examsConfig';

type AppState = 'landing' | 'onboarding' | 'dashboard' | 'testing' | 'results';

export default function App() {
  const { 
    profile, 
    firebaseUser, 
    authLoading, 
    updateProfile, 
    addTestResult, 
    loginWithGoogle, 
    logout 
  } = usePersistence();
  
  const [appState, setAppState] = useState<AppState>('landing');
  const [authError, setAuthError] = useState<{ type: 'popup-blocked' | 'closed' | 'other'; message: string } | null>(null);

  const handleLoginWithGoogle = async () => {
    setAuthError(null);
    try {
      const res = await loginWithGoogle();
      return res;
    } catch (err: any) {
      console.error("Google login failed globally:", err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes("popup-blocked") || errMsg.includes("auth/popup-blocked")) {
        setAuthError({
          type: 'popup-blocked',
          message: "Aapka browser Google login popup block kar raha hai: Address bar (URL bar) me settings 🔒 click karke Popups allow karein! Ya phir screen ke right-top ke 'New Tab' button se open karein jo iframe block ko fully bypass karta hai."
        });
      } else if (errMsg.includes("popup-closed-by-user") || errMsg.includes("auth/closed-by-user") || errMsg.includes("closed-by-user")) {
        setAuthError({
          type: 'closed',
          message: "Sign-In window band ho gayi thi (Closed by user). Link karne ke liye wapas click karein, and window pure open rakhein!"
        });
      } else if (errMsg.includes("cancelled-popup-request") || errMsg.includes("auth/cancelled-popup-request")) {
        setAuthError({
          type: 'other',
          message: "Pichli popup process cancel ho gayi. Doobara try karein!"
        });
      } else {
        setAuthError({
          type: 'other',
          message: `Account link error: ${err?.message || "Google Connection Issue"}`
        });
      }
      throw err;
    }
  };

  // Automatically keep appState in sync with onboarding status
  useEffect(() => {
    if (authLoading) return;
    setAppState(profile.onboarded ? 'dashboard' : 'landing');
  }, [profile.onboarded, authLoading]);

  const [currentTestQuestions, setCurrentTestQuestions] = useState<Question[]>([]);
  const [lastResults, setLastResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrillSetupOpen, setIsDrillSetupOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  
  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  });
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    return sessionStorage.getItem('dismiss_pwa_banner') !== 'true';
  });
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Auto-detect beforeinstallprompt and check installation status
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt fired! PWA is installable.');
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissed = sessionStorage.getItem('dismiss_pwa_banner') === 'true';
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track real-time standalone media transitions
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Detect if app is installed successfully
    const handleAppInstalled = () => {
      console.log('App successfully installed!');
      setIsInstalled(true);
      setShowInstallBanner(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        console.log('Triggering browser install prompt...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User outcome: ${outcome}`);
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
        }
      } catch (err) {
        console.error('Error during installation choice:', err);
      }
    } else {
      // Show manual fallback guide if automatic trigger isn't available
      setShowGuideModal(true);
    }
  };


  const viewTestResult = (result: any) => {
    setLastResults(result);
    setAiAnalysis(result.aiAnalysis || null);
    setAppState('results');
  };

  const startNewTest = useCallback(async (setup?: DrillSetup, specificTopics?: Topic[]) => {
    setIsDrillSetupOpen(false);
    setIsLoading(true);

    try {
      let seenIds = [];
      try {
        seenIds = JSON.parse(localStorage.getItem('seen_questions') || '[]');
      } catch (e) {
        console.error('Error parsing seen_questions', e);
      }
      
      const examConfig = getExamConfig(profile.exam);
      const weak = profile.performance.weakTopics;
      const defaultTopics = examConfig?.defaultTopics || ['General Awareness', 'Quantitative Aptitude', 'English Language', 'Reasoning'];
      
      // If specific topics passed, use them. Otherwise use weak topics + defaults.
      const topics: Topic[] = specificTopics && specificTopics.length > 0 
        ? specificTopics 
        : (weak.length > 0 ? Array.from(new Set([...weak, ...defaultTopics])).slice(0, 5) : defaultTopics);
      
      const generatedQuestions = await generateQuestionsAPI(
        topics, 
        setup?.difficulty || 'Medium', 
        10, 
        profile.exam || "SSC CGL",
        seenIds,
        profile.performance,
        setup,
        profile.customExamDetails,
        profile.language
      );

      if (generatedQuestions.length > 0) {
        const newSeen = [...new Set([...seenIds, ...generatedQuestions.map(q => q.id)])].slice(-100);
        localStorage.setItem('seen_questions', JSON.stringify(newSeen));
        setCurrentTestQuestions(generatedQuestions);
      } else {
        setCurrentTestQuestions(QUESTIONS.slice(0, 10));
      }
      
      setAppState('testing');
      setAiAnalysis(null);
    } catch (error) {
      console.error("Failed to start test:", error);
      setCurrentTestQuestions(QUESTIONS.slice(0, 10));
      setAppState('testing');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const handleLogout = () => {
    logout();
    setAppState('landing');
  };

  const handleStartPractice = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("popup-closed-by-user") || errMsg.includes("auth/closed-by-user")) {
        console.warn("User closed the Google Sign-In sheet before completing registration.");
      } else {
        console.error("Google Sign-In failed or was cancelled:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestComplete = async (results: {
    score: number;
    total: number;
    timeSpent: number;
    topicPerformance: Record<Topic, { correct: number; total: number }>;
    userAnswers: Record<string, number>;
  }) => {
    const testData = {
      ...results,
      questions: currentTestQuestions,
      date: new Date().toISOString(),
      subject: 'Full Mock' as const,
    };
    
    setLastResults(testData);
    setAppState('results');

    // Trigger AI analysis via API
    const analysis = await analyzePerformanceAPI(results.score, results.total, results.topicPerformance, profile.exam, profile.language);
    setAiAnalysis(analysis);
    
    // Save test results with AI analysis to profile (only call this once)
    addTestResult(testData, analysis);
  };



  const handleOnboardingComplete = (name: string, exam: string, language: string, customExamDetails?: string) => {
    updateProfile({ name, exam, language, customExamDetails, onboarded: true });
    setAppState('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0C10] text-slate-200 animate-pulse">
        <div className="text-center p-8">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">Connecting to Mock Mitra...</h3>
          <p className="text-slate-400 text-sm">Validating secure Google connection vectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0C10] text-slate-200">
      {appState !== 'onboarding' && (
        <Navbar 
          userName={profile.name} 
          onProfileClick={() => setAppState('dashboard')} 
          onAccountClick={() => setIsAccountModalOpen(true)}
          onLogout={handleLogout}
          onInstallClick={isInstalled ? undefined : handleInstallClick}
          firebaseUser={firebaseUser}
          onLoginWithGoogle={handleLoginWithGoogle}
        />
      )}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/80 backdrop-blur-sm"
              id="loading-overlay"
            >
              <div className="text-center p-8 bento-card border-brand/30">
                <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Engaging Neural Mentor...</h3>
                <p className="text-slate-400 text-sm">Generating real-world exam vectors for you.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {appState === 'landing' && (
          <Hero 
            onStart={() => setAppState('onboarding')} 
            onStartGoogle={handleStartPractice}
          />
        )}
        
        {appState === 'onboarding' && (
          <ExamSelector onComplete={handleOnboardingComplete} />
        )}

        {appState === 'dashboard' && (
          <Dashboard 
            profile={profile} 
            onStartTest={() => setIsDrillSetupOpen(true)} 
            onStartTopicTest={(topic) => startNewTest(undefined, [topic])}
            onViewResult={viewTestResult}
            onInstallClick={isInstalled ? undefined : handleInstallClick}
          />
        )}

        <DrillSetupModal 
          isOpen={isDrillSetupOpen} 
          onClose={() => setIsDrillSetupOpen(false)} 
          onStart={startNewTest} 
          exam={profile.exam}
        />

        <AccountModal 
          isOpen={isAccountModalOpen} 
          onClose={() => setIsAccountModalOpen(false)} 
          profile={profile} 
          onUpdate={updateProfile}
          firebaseUser={firebaseUser}
          onLoginWithGoogle={handleLoginWithGoogle}
        />

        {appState === 'testing' && (
          <TestRunner 
            questions={currentTestQuestions} 
            onComplete={handleTestComplete} 
          />
        )}



        {appState === 'results' && lastResults && (
            <ResultView 
              {...lastResults} 
              aiAnalysis={aiAnalysis}
              onDashboard={() => setAppState('dashboard')}
              onNextTest={() => startNewTest()}
            />
        )}

        {/* Glowing PWA Install Popup Banner */}
        <AnimatePresence>
          {showInstallBanner && !isInstalled && (appState === 'landing' || appState === 'onboarding') && (
            <motion.div 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-40 pointer-events-auto"
            >
              <div className="relative overflow-hidden rounded-3xl bg-[#12151C] border border-brand/50 p-6 shadow-[0_0_35px_rgba(37,99,235,0.3)]">
                {/* Ambient glowing radial blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 blur-[30px] rounded-full -ml-8 -mb-8 pointer-events-none"></div>
                
                <button 
                  onClick={() => {
                    setShowInstallBanner(false);
                    sessionStorage.setItem('dismiss_pwa_banner', 'true');
                  }}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex gap-4">
                  <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand-light flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.15)] animate-pulse">
                    <Sparkles className="w-6 h-6 text-brand-light fill-current" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 bg-brand/25 border border-brand/40 rounded-full text-brand-light text-[8px] font-black uppercase tracking-wider mb-2">
                       CFO Recommended PWA
                    </span>
                    <h3 className="text-base font-black text-white leading-tight tracking-tight mb-1">
                      Install Mock-Mitra in 1-Click
                    </h3>
                    <h4 className="text-xs font-bold text-brand-light mb-2">
                      (Save Space & Internet)
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Access custom simulators instantly offline, lower battery drain, and practice anywhere on Android, iOS, or PC!
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleInstallClick}
                        className="px-4 py-2.5 bg-brand hover:bg-brand-light text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current animate-bounce" /> Install Now
                      </button>
                      <button
                        onClick={() => {
                          setShowInstallBanner(false);
                          sessionStorage.setItem('dismiss_pwa_banner', 'true');
                        }}
                        className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Maybe Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Install Guide Modal (Fallback) */}
        <AnimatePresence>
          {showGuideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="pwa-guide-modal">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#12151C] border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowGuideModal(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-brand/10 border border-brand/20 rounded-xl text-brand-light flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-brand-light" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Install Mock-Mitra</h3>
                    <p className="text-xs text-slate-400">Save Space • Sync Offline • Super Fast</p>
                  </div>
                </div>

                <div className="space-y-4 my-4 py-2 border-y border-white/5">
                  <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 mb-3">
                    <p className="text-xs font-bold text-brand-light flex items-center gap-1.5 uppercase tracking-wider mb-1">
                      💡 Pro Tip
                    </p>
                    <p className="text-xs text-slate-300">
                      Mock-Mitra runs as a lightweight Progressive Web App. It consumes zero extra disk space and works with limited internet!
                    </p>
                  </div>

                  {/* iOS Safari Guide Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">For Apple / Safari (iOS)</h4>
                    <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 pl-1">
                      <li>Tap the <span className="text-brand-light font-bold">Share</span> button (the square icon with arrow up <Share2 className="w-3.5 h-3.5 inline-block mx-1 leading-none text-brand-light" />) in the browser bottom bar.</li>
                      <li>Scroll up/down and choose <span className="text-brand-light font-bold">"Add to Home Screen"</span>.</li>
                      <li>Click <span className="text-brand-light font-bold">Add</span> in the top right corner.</li>
                    </ol>
                  </div>

                  {/* Android Chrome Guide Section */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">For Android & PC Chrome</h4>
                    <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 pl-1">
                      <li>Tap the browser context menu button (<span className="text-white font-bold">three vertical dots ...</span>) in the bar.</li>
                      <li>Select <span className="text-brand-light font-bold">"Install App"</span> or <span className="text-brand-light font-bold">"Add to Home Screen"</span>.</li>
                      <li>Confirm the installer confirmation modal.</li>
                    </ol>
                  </div>
                </div>

                <div className="mt-5">
                  <button 
                    onClick={() => setShowGuideModal(false)}
                    className="w-full py-3 bg-brand hover:bg-brand-light text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 transition-all cursor-pointer"
                  >
                    Got It, Let's Do It
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Google Auth Error Banner with Hinglish Instructions */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 pointer-events-auto"
            >
              <div className="relative overflow-hidden rounded-2xl bg-[#140b0f] border border-rose-500/30 p-5 shadow-[0_0_25px_rgba(244,63,94,0.15)] flex gap-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0 self-start">
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0 font-sans">
                  <h4 className="text-xs font-black uppercase text-rose-300 tracking-wider">
                    {authError.type === 'popup-blocked' ? 'Google Popup Blocked!' : 'Google Sync Alert'}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-medium select-none">
                    {authError.message}
                  </p>
                  
                  <div className="mt-3.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthError(null)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Bypass (Guest Mode Chalu Rakhein)
                    </button>
                    {authError.type === 'popup-blocked' && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Open In New Tab <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setAuthError(null)}
                  className="sm:absolute top-3 right-3 p-1 text-slate-500 hover:text-white rounded-md transition-colors cursor-pointer"
                  title="Close Alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

