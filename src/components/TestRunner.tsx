import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronRight, ChevronLeft, Zap, CheckCircle2, Award } from 'lucide-react';
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

  const currentQuestion = questions[currentIndex] || questions[0];

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
      timeSpent: Math.max(1, Math.floor((Date.now() - startTime) / 1000)),
      topicPerformance: topicPerf,
      userAnswers: answers
    });
  };

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-32">
      
      {/* Sleek Top Header & Question Navigation Strip */}
      <div className="mb-4 sm:mb-6 bg-white dark:bg-[#0c0f18] border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-brand tracking-widest">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                {answeredCount}/{questions.length} Done
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {currentQuestion.subject} • <span className="text-slate-500 dark:text-slate-400 font-normal">{currentQuestion.topic}</span>
            </p>
          </div>

          {/* Countdown Timer */}
          <div className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border flex items-center gap-1.5 font-mono text-sm sm:text-base font-black shrink-0 transition-all ${
            timeLeft < 60 
              ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
          }`}>
            <Clock className="w-4 h-4 text-brand shrink-0" />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Compact Horizontal Sliding Question Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {questions.map((q, idx) => {
            const isCurrent = currentIndex === idx;
            const isAnswered = answers[q.id] !== undefined;
            return (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCurrentIndex(idx);
                }}
                className={`min-w-[34px] h-[34px] sm:min-w-[38px] sm:h-[38px] rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer relative shrink-0 ${
                  isCurrent
                    ? 'bg-brand text-white shadow-md shadow-brand/30 ring-2 ring-brand/30 scale-105'
                    : isAnswered
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {idx + 1}
                {isAnswered && !isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question & Options Card */}
      <div className="bg-white dark:bg-[#0c0f18] border border-slate-200 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-lg relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col"
          >
            {/* Question Text */}
            <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed mb-4 sm:mb-6">
              {currentQuestion.question}
            </h2>

            {/* Compact, Ergonomic Options List */}
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    key={idx}
                    type="button"
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-3 sm:gap-4 group relative cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-blue-50/80 dark:bg-brand/15 shadow-sm'
                        : 'border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    {/* Option Letter Badge */}
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-black border transition-all shrink-0 ${
                      isSelected
                        ? 'bg-brand border-brand text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>

                    {/* Option Content Text */}
                    <span className={`text-xs sm:text-sm lg:text-base font-semibold transition-colors flex-1 leading-snug ${
                      isSelected ? 'text-brand dark:text-white font-bold' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {option}
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-brand shrink-0 animate-in fade-in" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky / Fixed Bottom Navigation Bar (No more manual scrolling needed) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090b12]/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setCurrentIndex(prev => Math.max(0, prev - 1));
            }}
            disabled={currentIndex === 0}
            className="py-3 px-4 sm:px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/25 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Award className="w-4 h-4" />
              <span>Submit Test ({answeredCount}/{questions.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
              }}
              className="flex-1 py-3 px-5 bg-brand hover:bg-brand-light text-white font-black rounded-xl shadow-lg shadow-brand/25 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
