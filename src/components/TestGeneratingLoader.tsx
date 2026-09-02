import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Clock, Target } from 'lucide-react';

interface TestGeneratingLoaderProps {
  topic?: string;
  count?: number;
  exam?: string;
}

export default function TestGeneratingLoader({ topic, count = 5, exam }: TestGeneratingLoaderProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds as mm:ss
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Progressive generation stages based on elapsed seconds
  const getStageText = () => {
    if (seconds < 3) return "Analyzing exam syllabus & question patterns...";
    if (seconds < 7) return "Synthesizing targeted practice questions...";
    if (seconds < 11) return "Formulating detailed step-by-step solutions...";
    return "Finalizing test papers, almost ready...";
  };

  // Smooth progress calculation (reaches ~94% over ~12s)
  const progressPercent = Math.min(94, Math.round(18 + Math.min(seconds * 7, 76)));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-[#080a10]/85 backdrop-blur-sm p-4"
      id="test-generating-overlay"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-sm bg-white dark:bg-[#0d101a] border border-slate-200/90 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 text-center relative overflow-hidden"
      >
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-brand transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>

        {/* Center icon & timer badge */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 dark:bg-brand/20 border border-brand/25 flex items-center justify-center text-brand">
              <Sparkles className="w-6 h-6 animate-pulse text-brand" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand"></span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold mt-1">
            <Clock className="w-3 h-3 text-brand" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Title & Stage text */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Generating Practice Test
          </h3>
          <p className="text-xs text-brand dark:text-brand-light font-semibold min-h-[20px] transition-all">
            {getStageText()}
          </p>
        </div>

        {/* Progress Bar & percentage */}
        <div className="space-y-1.5 pt-1">
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-0.5">
            <span>AI Question Synthesis</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Target Info (Topic / Exam) if available */}
        {(topic || exam) && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Target className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="truncate max-w-[190px]">
              {topic ? topic : exam}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 shrink-0">{count} Questions</span>
          </div>
        )}

        {/* Reassurance text */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          Creating high-yield exam questions. Please hold on a moment.
        </p>
      </motion.div>
    </motion.div>
  );
}
