import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronRight, ChevronLeft, Zap, CheckCircle2 } from 'lucide-react';
import { Question, Topic } from '../types';
import { triggerHaptic } from '../services/nativeService';

interface TestRunnerProps {
  questions: Question[];
  onComplete: (results: {
    score: number;
    total: number;
    timeSpent: number;
    topicPerformance: Partial<Record<Topic, { correct: number; total: number }>>;
    userAnswers: Record<string, number>;
  }) => void;
}

export default function TestRunner({ questions, onComplete }: TestRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(questions.length * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          if (!isSubmitted) handleSubmit();
          return 0;
        }
        if (prev === 30) {
          triggerHaptic('warning');
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (optionIndex: number) => {
    triggerHaptic('light');
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    triggerHaptic('success');
    setIsSubmitted(true);
    
    let score = 0;
    const topicPerf: Partial<Record<Topic, { correct: number; total: number }>> = {};

    questions.forEach(q => {
      if (!topicPerf[q.topic]) {
        topicPerf[q.topic] = { correct: 0, total: 0 };
      }
      topicPerf[q.topic].total += 1;
      if (answers[q.id] === q.correctAnswer) {
        score += 1;
        topicPerf[q.topic].correct += 1;
      }
    });

    onComplete({
      score,
      total: questions.length,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
      topicPerformance: topicPerf,
      userAnswers: answers
    });
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 min-h-[580px]">
        
        {/* Main Question & Option Area */}
        <div className="lg:col-span-8 flex flex-col gap-4 order-2 lg:order-1">
          <div className="bento-card border-brand/25 p-5 sm:p-8 bg-[#0b0e17] relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 blur-3xl rounded-full pointer-events-none"></div>
            
            {/* Question Header & Live Timer */}
            <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8 relative z-10 border-b border-white/5 pb-4">
              <div>
                <span className="text-xs font-black uppercase text-brand tracking-[0.2em] mb-1 block">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-white font-black">{currentQuestion.subject}</span>
                  <span className="w-1 h-1 bg-slate-600 rounded-full"></span> 
                  <span>{currentQuestion.topic}</span>
                </p>
              </div>

              {/* High Contrast Live Countdown */}
              <div className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 font-mono text-xl sm:text-2xl font-black ${
                timeLeft < 60 
                  ? 'bg-rose-500/15 border-rose-500 text-rose-400 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.25)]' 
                  : 'bg-slate-900 border-white/10 text-white shadow-lg'
              }`}>
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex-grow flex flex-col justify-center w-full"
              >
                {/* Scaled-Up Question Title */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug sm:leading-relaxed mb-6 sm:mb-8 text-pretty">
                  {currentQuestion.question}
                </h2>

                {/* Options List with Scaled-Up Typography & Haptics */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = answers[currentQuestion.id] === idx;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 sm:gap-5 group relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? 'border-brand bg-brand/15 shadow-[0_0_25px_rgba(37,99,235,0.2)]'
                            : 'border-white/5 bg-slate-900/80 hover:border-brand/40 hover:bg-slate-900'
                        }`}
                      >
                        {isSelected && (
                          <motion.div layoutId="active-pill" className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand" />
                        )}
                        
                        {/* Option Letter Badge */}
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-black border-2 transition-all shrink-0 ${
                          isSelected
                            ? 'bg-brand border-brand text-white shadow-md'
                            : 'border-slate-700 bg-slate-950 text-slate-400 group-hover:text-white group-hover:border-slate-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>

                        {/* Option Text */}
                        <span className={`text-base sm:text-lg lg:text-xl font-bold transition-colors leading-normal flex-1 ${
                          isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}>
                          {option}
                        </span>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-brand shrink-0 animate-in fade-in" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-3">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setCurrentIndex(prev => Math.max(0, prev - 1));
                    }}
                    disabled={currentIndex === 0}
                    className="py-4 px-5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl transition-all uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  {currentIndex === questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 transition-all uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Final Submit</span>
                      <Zap className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
                      }}
                      className="flex-1 py-4 bg-brand hover:bg-brand-light text-white font-black rounded-2xl shadow-xl shadow-brand/25 transition-all uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Question Palette & Progress */}
        <div className="lg:col-span-4 flex flex-col gap-4 order-1 lg:order-2">
          <div className="bento-card bg-[#0e121d] border-brand/15 p-5">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-4">Progress Monitor</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400">Answered:</span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {Object.keys(answers).length} / {questions.length}
                </span>
              </div>
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} 
                  className="h-full bg-gradient-to-r from-brand to-emerald-500 rounded-full" 
                />
              </div>
            </div>
          </div>
          
          <div className="bento-card border-white/5 p-5 flex-grow bg-[#0e121d]">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-4">Question Matrix</h4>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {questions.map((_, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = answers[questions[idx].id] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      triggerHaptic('light');
                      setCurrentIndex(idx);
                    }}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-brand border-brand text-white shadow-lg shadow-brand/40 scale-105 z-10' 
                        : isAnswered
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
