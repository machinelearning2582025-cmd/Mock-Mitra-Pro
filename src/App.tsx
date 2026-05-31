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
import { generateQuestionsAPI, analyzePerformanceAPI, updatePersonalisedProfileBackgroundAPI } from './services/api';
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
    
    if (profile.onboarded) {
      // If they are on a starting page, move them to dashboard
      if (appState === 'landing' || appState === 'onboarding') {
        setAppState('dashboard');
      }
    } else {
      // Not onboarded yet
      if (firebaseUser) {
        // If logged in via Google but not onboarded, we must ask for details
        if (appState !== 'onboarding') {
          setAppState('onboarding');
        }
      } else {
        // Guest mode (not logged in, not onboarded)
        // Only set back to landing if they are not currently in the process of onboarding, testing, or reviewing a result
        if (appState !== 'onboarding' && appState !== 'testing' && appState !== 'results') {
          setAppState('landing');
        }
      }
    }
  }, [profile.onboarded, authLoading, firebaseUser, appState]);

  const [currentTestQuestions, setCurrentTestQuestions] = useState<Question[]>([]);
  const [lastResults, setLastResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrillSetupOpen, setIsDrillSetupOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

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
        profile.language,
        profile.aiMentorPlan?.milestones
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
    await addTestResult(testData, analysis);

    // Run lightning-fast background distillation after mock completes
    setTimeout(async () => {
      try {
        const latestProfile = {
          ...profile,
          performance: {
            ...profile.performance,
            testHistory: [...profile.performance.testHistory, testData],
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
  };



  const handleOnboardingComplete = async (name: string, exam: string, language: string, customExamDetails?: string) => {
    setIsLoading(true);
    try {
      const initialProfile = {
        name,
        exam,
        language,
        customExamDetails,
        onboarded: true
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

      // Instantly generate and fill structured milestones roadmap upon onboarding
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
    } catch (err) {
      console.error("Auto roadmap initialization error:", err);
    } finally {
      setIsLoading(false);
      setAppState('dashboard');
    }
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
          <ExamSelector 
            onComplete={handleOnboardingComplete} 
            initialName={profile.name}
          />
        )}

        {appState === 'dashboard' && (
          <Dashboard 
            profile={profile} 
            onStartTest={() => setIsDrillSetupOpen(true)} 
            onStartTopicTest={(topic) => startNewTest(undefined, [topic])}
            onViewResult={viewTestResult}
            onUpdateProfile={updateProfile}
            onStartCustomDrill={(prompt) => startNewTest({ customPrompt: prompt, difficulty: 'Medium' })}
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
      </main>
    </div>
  );
}

