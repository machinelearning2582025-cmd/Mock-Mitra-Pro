import { useState, useCallback, useEffect } from 'react';
import Hero from './components/Hero';
import ExamSelector from './components/ExamSelector';
import Dashboard from './components/Dashboard';
import TestRunner from './components/TestRunner';
import ResultView from './components/ResultView';
import DrillSetupModal from './components/DrillSetupModal';
import SettingsView from './components/SettingsView';
import PWAInstallModal from './components/PWAInstallModal';
import SidebarDrawer from './components/SidebarDrawer';
import TestGeneratingLoader from './components/TestGeneratingLoader';
import { usePersistence } from './hooks/usePersistence';
import { useTheme } from './hooks/useTheme';
import { QUESTIONS } from './data/questions';
import { generateQuestionsAPI, analyzePerformanceAPI, updatePersonalisedProfileBackgroundAPI } from './services/api';
import { Topic, Question, DrillSetup } from './types';
import { Loader2, Zap, WifiOff, LayoutDashboard, Play, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getExamConfig } from './data/examsConfig';
import { 
  useOnlineStatus, 
  checkReminderDue, 
  sendNativeNotification, 
  triggerHaptic 
} from './services/nativeService';

type AppState = 'landing' | 'onboarding' | 'dashboard' | 'testing' | 'results' | 'settings';

export default function App() {
  const isOnline = useOnlineStatus();
  const { 
    profile, 
    firebaseUser, 
    authLoading, 
    updateProfile, 
    addTestResult, 
    updateTestResultWithAnalysis,
    loginWithGoogle,
    logout,
    clearChatHistory,
    clearTestHistory,
    resetAccountData
  } = usePersistence();
  
  const [appState, setAppState] = useState<AppState>('landing');
  const [authError, setAuthError] = useState<{ type: 'popup-blocked' | 'closed' | 'other'; message: string } | null>(null);

  const handleLoginWithGoogle = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await loginWithGoogle();
      return res;
    } catch (err: any) {
      console.error("Google login failed globally:", err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes("popup-blocked") || errMsg.includes("auth/popup-blocked")) {
        setAuthError({
          type: 'popup-blocked',
          message: "Aapka browser Google login popup block kar raha hai: Address bar (URL bar) me settings 🔒 click karke Popups allow karein!"
        });
      } else if (errMsg.includes("popup-closed-by-user") || errMsg.includes("auth/closed-by-user") || errMsg.includes("closed-by-user")) {
        setAuthError({
          type: 'closed',
          message: "Sign-In window band ho gayi thi. Link karne ke liye wapas click karein."
        });
      } else {
        setAuthError({
          type: 'other',
          message: `Account link error: ${err?.message || "Google Connection Issue"}`
        });
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Keep appState in sync with onboarding status
  useEffect(() => {
    if (authLoading) return;
    
    if (profile.onboarded) {
      if (appState === 'landing' || appState === 'onboarding') {
        setAppState('dashboard');
      }
    } else {
      if (firebaseUser) {
        if (appState !== 'onboarding') {
          setAppState('onboarding');
        }
      } else {
        if (appState !== 'onboarding' && appState !== 'testing' && appState !== 'results') {
          setAppState('landing');
        }
      }
    }
  }, [profile.onboarded, authLoading, firebaseUser, appState]);

  // Periodic Reminder Notification Checker (Native Service Worker)
  useEffect(() => {
    const checkNotificationSchedule = async () => {
      if (!profile.notificationSettings?.enabled) return;

      const isDue = checkReminderDue(profile.notificationSettings);
      if (isDue) {
        const todayStr = new Date().toDateString();
        const examName = profile.exam || 'Target Exam';
        
        await sendNativeNotification(`MockMitra Study Time! 🎯`, {
          body: `Namaste ${profile.name}! Aapke ${examName} ke practice test ka waqt ho gaya hai. Abhi 10 questions ka quick mock attempt karein!`,
          tag: 'mockmitra-daily-reminder'
        });

        // Update last notified date
        updateProfile({
          notificationSettings: {
            ...profile.notificationSettings,
            lastNotifiedDate: todayStr
          }
        });
      }
    };

    const intervalId = setInterval(checkNotificationSchedule, 30000);
    return () => clearInterval(intervalId);
  }, [profile.notificationSettings, profile.name, profile.exam, updateProfile]);

  const [currentTestQuestions, setCurrentTestQuestions] = useState<Question[]>([]);
  const [lastResults, setLastResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [generatingTestMeta, setGeneratingTestMeta] = useState<{ topic?: string; count?: number; exam?: string }>({});
  const [isDrillSetupOpen, setIsDrillSetupOpen] = useState(false);
  const [drillInitialTopic, setDrillInitialTopic] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // PWA Prompting States & Event Handlers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    const checkIsPWA = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true ||
                         localStorage.getItem('pwa_installed_mockmitra') === 'true';
      setIsPWAInstalled(standalone);
    };
    checkIsPWA();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const runningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      const alreadyPrompted = localStorage.getItem('mockmitra_pwa_prompted') === 'true';
      if (!runningStandalone && !alreadyPrompted && !isPWAInstalled) {
        setIsPWAInstallModalOpen(true);
        localStorage.setItem('mockmitra_pwa_prompted', 'true');
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsPWAInstalled(true);
      localStorage.setItem('pwa_installed_mockmitra', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const runningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const alreadyPrompted = localStorage.getItem('mockmitra_pwa_prompted') === 'true';
    let timer: any = null;
    if (!runningStandalone && !alreadyPrompted && !isPWAInstalled) {
      timer = setTimeout(() => {
        setIsPWAInstallModalOpen(true);
        localStorage.setItem('mockmitra_pwa_prompted', 'true');
      }, 3000);
    }

    const interval = setInterval(checkIsPWA, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (timer) clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isPWAInstalled]);

  const viewTestResult = async (result: any) => {
    setLastResults(result);
    setAppState('results');
    
    if (result.aiAnalysis) {
      setAiAnalysis(result.aiAnalysis);
    } else {
      setAiAnalysis(null);
      if (isOnline) {
        try {
          const analysis = await analyzePerformanceAPI(result.score, result.total, result.topicPerformance, profile.exam, profile.language);
          if (analysis) {
            setAiAnalysis(analysis);
            setLastResults((prev: any) => prev && prev.date === result.date ? { ...prev, aiAnalysis: analysis } : prev);
            await updateTestResultWithAnalysis(result.date, analysis);
          }
        } catch (err) {
          console.error("Failed to generate missing history analysis:", err);
        }
      }
    }
  };

  const startNewTest = useCallback(async (setup?: DrillSetup, specificTopics?: Topic[]) => {
    setIsDrillSetupOpen(false);
    const chosenCount = setup?.questionCount && [3, 5, 8, 10].includes(setup.questionCount) ? setup.questionCount : 5;
    const chosenTopic = setup?.customTopic || (specificTopics && specificTopics.length > 0 ? specificTopics[0] : undefined);
    
    setGeneratingTestMeta({
      topic: chosenTopic,
      count: chosenCount,
      exam: profile.exam
    });
    setIsGeneratingTest(true);
    setIsLoading(true);
    triggerHaptic('medium');

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
      
      const isCustomDrill = !!(
        setup && (
          (setup.customTopic && setup.customTopic.trim() !== '') || 
          (setup.customPrompt && setup.customPrompt.trim() !== '') || 
          (setup.files && setup.files.length > 0)
        )
      );
      
      const topics: Topic[] = isCustomDrill
        ? [setup?.customTopic || 'Custom Uploads / Specific Instructions']
        : (specificTopics && specificTopics.length > 0 
          ? specificTopics 
          : (weak.length > 0 ? Array.from(new Set([...weak, ...defaultTopics])).slice(0, 5) : defaultTopics));
      
      const isExplicitTopic = !!(specificTopics && specificTopics.length > 0) || !!(setup?.customTopic && setup.customTopic.trim() !== '');
      
      const count = setup?.questionCount && [3, 5, 8, 10].includes(setup.questionCount) ? setup.questionCount : 5;

      // If online, attempt AI question generation; otherwise use local offline question bank
      let generatedQuestions: Question[] = [];
      if (isOnline) {
        generatedQuestions = await generateQuestionsAPI(
          topics, 
          setup?.difficulty || 'Medium', 
          count, 
          profile.exam || "SSC CGL",
          seenIds,
          profile.performance,
          setup,
          profile.customExamDetails,
          profile.language,
          profile.aiMentorPlan?.milestones,
          isExplicitTopic
        );
      }

      if (generatedQuestions && generatedQuestions.length > 0) {
        const seenCurrent = new Set<string>();
        const uniqueQuestions = generatedQuestions.map((q, idx) => {
          let id = q.id || `q_${idx}`;
          if (seenCurrent.has(id)) {
            id = `${id}_${idx}_${Date.now()}`;
          }
          seenCurrent.add(id);
          return { ...q, id };
        });
        const newSeen = [...new Set([...seenIds, ...uniqueQuestions.map(q => q.id)])].slice(-100);
        localStorage.setItem('seen_questions', JSON.stringify(newSeen));
        setCurrentTestQuestions(uniqueQuestions.slice(0, count));
      } else {
        // Offline Fallback from local question database
        const filtered = QUESTIONS.filter(q => 
          topics.some(t => q.topic.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(q.topic.toLowerCase()))
        );
        const fallbackRaw = filtered.length >= count ? filtered.slice(0, count) : QUESTIONS.slice(0, count);
        const fallbackSet = fallbackRaw.map((q, idx) => ({
          ...q,
          id: `${q.id}_off_${idx}_${Date.now()}`
        }));
        setCurrentTestQuestions(fallbackSet);
      }
      
      setAppState('testing');
      setAiAnalysis(null);
    } catch (error) {
      console.error("Failed to start test:", error);
      const fallbackCount = setup?.questionCount || 5;
      setCurrentTestQuestions(QUESTIONS.slice(0, fallbackCount));
      setAppState('testing');
    } finally {
      setIsLoading(false);
      setIsGeneratingTest(false);
    }
  }, [profile, isOnline]);

  const handleLogout = () => {
    logout();
    setAppState('landing');
  };

  const handleStartPractice = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In failed or was cancelled:", err);
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
    const initialTestData = {
      ...results,
      questions: currentTestQuestions,
      date: new Date().toISOString(),
      subject: 'Full Mock' as const,
    };
    
    setLastResults(initialTestData);
    setAppState('results');

    // Trigger AI analysis if online
    let analysis = null;
    if (isOnline) {
      analysis = await analyzePerformanceAPI(results.score, results.total, results.topicPerformance, profile.exam, profile.language);
      setAiAnalysis(analysis);
    }
    
    const finalTestData = {
      ...initialTestData,
      aiAnalysis: analysis
    };
    setLastResults(finalTestData);
    
    await addTestResult(finalTestData, analysis);

    if (isOnline) {
      setTimeout(async () => {
        try {
          const latestProfile = {
            ...profile,
            performance: {
              ...profile.performance,
              testHistory: [...profile.performance.testHistory, finalTestData],
            }
          };
          const updatedPlan = await updatePersonalisedProfileBackgroundAPI(latestProfile, profile.language);
          if (updatedPlan) {
            updateProfile({
              aiMentorPlan: {
                summary: updatedPlan.summary,
                suggestedAction: updatedPlan.suggestedAction,
                milestones: updatedPlan.milestones,
                lastStructuredDate: new Date().toLocaleDateString()
              }
            });
          }
        } catch (err) {
          console.error("Failed to background personalize after test completion:", err);
        }
      }, 1200);
    }
  };

  const handleOnboardingComplete = async (name: string, exam: string, language: string, customExamDetails?: string) => {
    setIsLoading(true);
    try {
      const initialProfile = {
        name,
        exam,
        language,
        customExamDetails,
        onboarded: true,
        notificationSettings: {
          enabled: true,
          time: '19:30',
          sound: true
        }
      };
      await updateProfile(initialProfile);

      const tempProfile = {
        name,
        exam,
        language,
        customExamDetails,
        performance: {
          weakTopics: [],
          strongTopics: [],
          testHistory: [],
          knowledgeProfile: {},
          streak: 0
        },
        customStudyNotes: ""
      };

      if (isOnline) {
        const initialPlan = await updatePersonalisedProfileBackgroundAPI(tempProfile, language);
        if (initialPlan) {
          await updateProfile({
            aiMentorPlan: {
              summary: initialPlan.summary,
              suggestedAction: initialPlan.suggestedAction,
              milestones: initialPlan.milestones,
              lastStructuredDate: new Date().toLocaleDateString()
            }
          });
        }
      }
    } catch (err) {
      console.error("Auto roadmap initialization error:", err);
    } finally {
      setIsLoading(false);
      setAppState('dashboard');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-slate-200 animate-pulse">
        <div className="text-center p-8">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Connecting to MockMitra...</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Initializing hybrid offline-first environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080a10] text-slate-900 dark:text-slate-100 pb-20 sm:pb-0 transition-colors duration-200">
      
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-amber-600/90 backdrop-blur text-white px-4 py-2 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode Active: Practice tests & saved history work 100% offline!</span>
        </div>
      )}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {isGeneratingTest ? (
            <TestGeneratingLoader 
              topic={generatingTestMeta.topic} 
              count={generatingTestMeta.count} 
              exam={generatingTestMeta.exam} 
            />
          ) : isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-[#080a10]/85 backdrop-blur-sm p-4"
              id="loading-overlay"
            >
              <div className="text-center p-6 bento-card border-slate-200 dark:border-brand/40 bg-white dark:bg-[#0d101a] shadow-2xl max-w-sm w-full">
                <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto mb-3" />
                <h3 className="text-lg font-black mb-1.5 text-slate-900 dark:text-white">Please Wait...</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Synchronizing your progress.</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {appState === 'landing' && (
          <Hero 
            onStart={() => setAppState('onboarding')} 
            onStartGoogle={handleStartPractice}
            onInstallClick={!isPWAInstalled ? () => setIsPWAInstallModalOpen(true) : undefined}
          />
        )}
        
        {appState === 'onboarding' && (
          <ExamSelector 
            onComplete={handleOnboardingComplete} 
            initialName={profile.name}
          />
        )}

        {appState === 'dashboard' && (
          <Dashboard 
            profile={profile} 
            onStartTest={() => {
              setDrillInitialTopic('');
              setIsDrillSetupOpen(true);
            }} 
            onStartTopicTest={(topic) => {
              const topicName = Array.isArray(topic) ? topic.join(', ') : topic;
              setDrillInitialTopic(topicName);
              setIsDrillSetupOpen(true);
            }}
            onViewResult={viewTestResult}
            onUpdateProfile={updateProfile}
            onStartCustomDrill={(prompt) => startNewTest({ customPrompt: prompt, difficulty: 'Medium' })}
            onClearTestHistory={clearTestHistory}
            onClearChatHistory={clearChatHistory}
            onInstallClick={() => setIsPWAInstallModalOpen(true)}
            showInstallButton={!isPWAInstalled}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        )}

        <DrillSetupModal 
          isOpen={isDrillSetupOpen} 
          onClose={() => setIsDrillSetupOpen(false)} 
          onStart={startNewTest} 
          exam={profile.exam}
          initialTopic={drillInitialTopic}
        />

        {appState === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdate={updateProfile}
            firebaseUser={firebaseUser}
            onLoginWithGoogle={handleLoginWithGoogle}
            onBack={() => setAppState('dashboard')}
            onClearTestHistory={clearTestHistory}
            onClearChatHistory={clearChatHistory}
            onLogout={handleLogout}
          />
        )}

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
            profile={profile}
            onUpdateProfile={updateProfile}
            onStartCustomDrill={(prompt) => startNewTest({ customPrompt: prompt, difficulty: 'Medium' })}
            onDashboard={() => setAppState('dashboard')}
            onNextTest={() => startNewTest()}
          />
        )}

        {/* PWA Automatic Installation Alert Prompt */}
        <AnimatePresence>
          {isPWAInstallModalOpen && (
            <PWAInstallModal
              isOpen={isPWAInstallModalOpen}
              onClose={() => setIsPWAInstallModalOpen(false)}
              deferredPrompt={deferredPrompt}
              onInstalledSuccess={() => {
                const runningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
                if (runningStandalone) {
                  setIsPWAInstallModalOpen(false);
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Custom Sidebar Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <SidebarDrawer
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              userName={profile.name}
              onNavigate={(state) => setAppState(state)}
              onOpenSettings={() => setAppState('settings')}
              onInstallApp={() => setIsPWAInstallModalOpen(true)}
              onLogout={handleLogout}
              showInstallButton={!isPWAInstalled}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Native App Bottom Dock for Mobile Screens (when onboarded and not in active test) */}
      {profile.onboarded && appState !== 'testing' && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0e17]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-4 py-2 safe-bottom-dock shadow-lg dark:shadow-none transition-colors duration-200">
          <div className="flex items-center justify-around">
            <button
              onClick={() => {
                triggerHaptic('light');
                setAppState('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                appState === 'dashboard' ? 'text-brand font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setDrillInitialTopic('');
                setIsDrillSetupOpen(true);
              }}
              className="flex flex-col items-center gap-1 py-1 px-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center -mt-3 shadow-lg shadow-brand/40">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-900 dark:text-white">Practice</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                if (appState !== 'dashboard') {
                  setAppState('dashboard');
                }
                setTimeout(() => {
                  const hub = document.getElementById('ai-personalised-hub');
                  if (hub) hub.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="flex flex-col items-center gap-1 py-1 px-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-[10px]">AI Mentor</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setAppState('settings');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                appState === 'settings' ? 'text-brand font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-[10px]">Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
