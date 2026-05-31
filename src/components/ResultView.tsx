import { motion } from 'motion/react';
import { Trophy, ArrowRight, Share2, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { Topic, Question } from '../types';
import QuestionReview from './QuestionReview';

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
  onDashboard,
  onNextTest
}: ResultViewProps) {
  const percentage = Math.round((score / total) * 100);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Main Hero Result Card */}
        <div className="lg:col-span-12 xl:col-span-8 bento-card relative overflow-hidden bg-gradient-to-br from-[#0c0f17] to-black border-brand/20 p-6 sm:p-12">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-brand/10 blur-[80px] sm:blur-[100px] rounded-full -mr-20 -mt-20"></div>
          
          <div className="z-10 flex flex-col md:flex-row items-center gap-8 sm:gap-12 w-full">
            <div className="relative shrink-0 scale-75 sm:scale-100">
               <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-[10px] border-slate-900 flex items-center justify-center bg-black/20">
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter">{percentage}%</div>
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
               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight">Test Completed.</h1>
               <div className="grid grid-cols-2 gap-4 sm:gap-8">
                 <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Score</div>
                   <div className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{score} <span className="text-slate-700">/</span> {total}</div>
                 </div>
                 <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Time Taken</div>
                   <div className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="lg:col-span-4 bento-card border-brand/30 bg-[#12151C] relative">
          <Zap className="absolute top-6 right-6 w-5 h-5 text-brand animate-pulse" />
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" /> Smart Mentor Advice
          </h3>
          {aiAnalysis ? (
            <div className="space-y-8">
              <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-brand/50 pl-4 font-medium">"{aiAnalysis.summary}"</p>
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Preparation Plan</h4>
                <div className="space-y-2">
                  {aiAnalysis.suggestions.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl text-xs font-semibold text-slate-300 border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-24 bg-white/5 rounded w-full animate-pulse mt-8" />
            </div>
          )}
        </div>

        {/* Topic Breakdown Bento Section */}
        <div className="lg:col-span-4 bento-card bg-[#12151C]">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Subject Wise Report</h3>
          <div className="space-y-6">
            {Object.entries(topicPerformance).map(([topic, data], i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest">
                  <span>{topic}</span>
                  <span>{Math.round((data.correct / data.total) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${(data.correct / data.total) >= 0.7 ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${(data.correct / data.total) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Protocol Action */}
        <div className="lg:col-span-12 xl:col-span-8 bento-card bg-brand border-none text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-white/10" />
          <div className="flex items-center gap-6 sm:gap-8 relative z-10 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl shrink-0">
               <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-100 tracking-[0.2em] mb-2 block">Your Next Step</span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">{aiAnalysis?.predictedBrief || 'Analyzing Your Preparation...'}</h3>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
            <button 
              onClick={onDashboard}
              className="w-full md:w-auto px-10 py-5 bg-white/10 text-white font-black rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transform transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-3 relative z-10"
            >
              Dashboard <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onNextTest}
              className="w-full md:w-auto px-10 py-5 bg-white text-brand font-black rounded-2xl shadow-2xl hover:bg-slate-100 transform transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-3 relative z-10"
            >
              Next Test <Zap className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Detailed Question Review Section */}
        <div className="lg:col-span-12">
          <QuestionReview questions={questions} userAnswers={userAnswers} onNextTest={onNextTest} />
        </div>

      </div>
    </div>
  );
}

