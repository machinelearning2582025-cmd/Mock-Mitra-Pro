import { motion } from 'motion/react';
import { Trophy, ArrowRight, Share2, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { Topic, Question, UserProfile } from '../types';
import QuestionReview from './QuestionReview';
import AILearningDesk from './AILearningDesk';

interface ResultViewProps {
  score: number;
  total: number;
  timeSpent: number;
  topicPerformance: Record<Topic, { correct: number; total: number }>;
  questions: Question[];
  userAnswers: Record<string, number>;
  aiAnalysis?: {
    summary: string;
    weakTopicAnalysis: string;
    suggestions: string[];
    predictedBrief: string;
  };
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onStartCustomDrill: (prompt: string) => void;
  onDashboard: () => void;
  onNextTest: () => void;
}

export default function ResultView({ 
  score, 
  total, 
  timeSpent, 
  topicPerformance, 
  questions, 
  userAnswers, 
  aiAnalysis, 
  profile,
  onUpdateProfile,
  onStartCustomDrill,
  onDashboard,
  onNextTest
}: ResultViewProps) {
  const percentage = Math.round((score / total) * 100);
  
  return (
    <div className="w-full px-4 sm:px-6 py-12">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Trophy className="text-brand w-6 h-6" /> Test Report
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={onDashboard}
            className="flex-1 sm:flex-initial px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-black uppercase rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm dark:shadow-none"
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onNextTest}
            className="flex-1 sm:flex-initial px-6 py-3 bg-brand text-white text-xs font-black uppercase rounded-xl hover:bg-brand-light transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20 cursor-pointer"
          >
            Start Next Test <Zap className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Main Hero Result Card */}
        <div className="lg:col-span-12 xl:col-span-8 bento-card relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-[#0c0f17] dark:to-black border-slate-200 dark:border-brand/20 p-6 sm:p-12 shadow-sm dark:shadow-none">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-brand/5 dark:bg-brand/10 blur-[80px] sm:blur-[100px] rounded-full -mr-20 -mt-20"></div>
          
          <div className="z-10 flex flex-col md:flex-row items-center gap-8 sm:gap-12 w-full">
            <div className="relative shrink-0 scale-75 sm:scale-100">
               <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-[10px] border-slate-100 dark:border-slate-900 flex items-center justify-center bg-slate-50/50 dark:bg-black/20">
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{percentage}%</div>
                    <div className="text-[10px] font-black uppercase text-brand tracking-widest mt-1">Accuracy</div>
                  </div>
               </div>
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle
                    cx="80" cy="80" r="70"
                    className="sm:hidden text-brand opacity-40"
                    strokeWidth="10" fill="none" stroke="currentColor"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * percentage / 100)}
                  />
                  <circle
                    cx="96" cy="96" r="88"
                    className="hidden sm:block text-brand opacity-40"
                    strokeWidth="10" fill="none" stroke="currentColor"
                    strokeDasharray={552}
                    strokeDashoffset={552 - (552 * percentage / 100)}
                  />
               </svg>
            </div>

            <div className="flex-grow text-center md:text-left">
               <span className="inline-block px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-[10px] font-black uppercase tracking-widest mb-6 leading-none">Your Result</span>
               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Test Completed.</h1>
               <div className="grid grid-cols-2 gap-4 sm:gap-8">
                 <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Score</div>
                   <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{score} <span className="text-slate-400 dark:text-slate-700">/</span> {total}</div>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Time Taken</div>
                   <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="lg:col-span-4 bento-card border-slate-200 dark:border-brand/30 bg-white dark:bg-[#12151C] relative shadow-sm dark:shadow-none">
          <Zap className="absolute top-6 right-6 w-5 h-5 text-brand animate-pulse" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" /> Smart Mentor Advice
          </h3>
          {aiAnalysis ? (
            <div className="space-y-8">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic border-l-2 border-brand/50 pl-4 font-medium">"{aiAnalysis.summary}"</p>
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Preparation Plan</h4>
                <div className="space-y-2">
                  {aiAnalysis.suggestions.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-full animate-pulse" />
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-24 bg-slate-100 dark:bg-white/5 rounded w-full animate-pulse mt-8" />
            </div>
          )}
        </div>

        {/* Personalized AI Roadmaps/Learning Desk replaces Next Step */}
        <div className="lg:col-span-12 xl:col-span-8 p-0">
          <AILearningDesk 
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onStartCustomDrill={onStartCustomDrill}
          />
        </div>

        {/* Topic Breakdown Bento Section */}
        <div className="lg:col-span-4 bento-card bg-white dark:bg-[#12151C] border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Subject Wise Report</h3>
          <div className="space-y-6">
            {Object.entries(topicPerformance).map(([topic, data], i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">
                  <span>{topic}</span>
                  <span>{Math.round((data.correct / data.total) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${(data.correct / data.total) >= 0.7 ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${(data.correct / data.total) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Question Review Section */}
        <div className="lg:col-span-12">
          <QuestionReview 
            questions={questions} 
            userAnswers={userAnswers} 
            onNextTest={onNextTest} 
            profile={profile}
          />
        </div>

      </div>
    </div>
  );
}

