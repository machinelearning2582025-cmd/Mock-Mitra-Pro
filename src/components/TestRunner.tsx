import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { Question, Topic } from '../types';

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
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
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
    <div className="w-full px-4 sm:px-6 py-6 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px]">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
          <div className="bento-card border-brand/20 p-6 sm:p-10 bg-[#0c0f17] relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl rounded-full"></div>
            
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12 relative z-10">
              <div className="order-2 sm:order-1">
                <span className="text-[10px] font-black uppercase text-brand tracking-[0.2em] mb-1 block">Question {currentIndex + 1} / {questions.length}</span>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none flex items-center gap-2">
                  {currentQuestion.subject} <span className="w-1 h-1 bg-slate-700 rounded-full"></span> {currentQuestion.topic}
                </p>
              </div>
              <div className={`order-1 sm:order-2 self-end sm:self-auto p-4 rounded-2xl border ${timeLeft < 60 ? 'bg-danger/10 border-danger text-danger animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'bg-slate-800/50 border-white/5 text-white shadow-premium'} flex items-center gap-3 font-mono text-2xl sm:text-3xl font-black`}>
                <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="flex-grow flex flex-col justify-center max-w-3xl mx-auto w-full"
              >
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-[1.3] sm:leading-relaxed mb-10 text-pretty">
                  {currentQuestion.question}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left p-4 sm:p-6 rounded-2xl border-2 transition-all flex items-center gap-4 sm:gap-6 group relative overflow-hidden ${
                        answers[currentQuestion.id] === idx
                          ? 'border-brand bg-brand/10 shadow-[0_0_30px_rgba(37,99,235,0.1)]'
                          : 'border-white/[0.03] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                      }`}
                    >
                      {answers[currentQuestion.id] === idx && (
                        <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-1/2 bg-brand rounded-r-full" />
                      )}
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black border-2 transition-all shrink-0 ${
                        answers[currentQuestion.id] === idx
                          ? 'bg-brand border-brand text-white'
                          : 'border-slate-800 text-slate-600 group-hover:text-white group-hover:border-slate-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-sm sm:text-lg font-bold transition-colors leading-snug sm:leading-normal ${
                        answers[currentQuestion.id] === idx ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                      }`}>
                        {option}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-full sm:w-auto px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center sm:justify-start gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <div className="flex w-full sm:w-auto gap-3">
                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                  >
                    Final Submit <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="w-full sm:w-auto px-10 py-4 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/30 hover:bg-brand-light transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                  >
                    Next Question <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>

        {/* Sidebar Monitor */}
        <div className="lg:col-span-4 flex flex-col gap-4 order-1 lg:order-2">
          <div className="bento-card bg-[#12151C] border-brand/10 p-5">
            <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-8">My Progress</h4>
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test Completion</span>
                <span className="text-3xl font-black text-white leading-none tracking-tighter">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-[2px] border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }} 
                  className="h-full bg-gradient-to-r from-brand/50 to-brand rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                />
              </div>
            </div>
          </div>
          
          <div className="bento-card border-white/5 p-5 flex-grow">
            <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-8">Question List</h4>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center text-[11px] font-black border-2 transition-all group ${
                    currentIndex === idx 
                      ? 'bg-brand border-brand text-white shadow-brand scale-110 z-10' 
                      : answers[questions[idx].id] !== undefined
                        ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-500'
                        : 'bg-slate-900/50 border-white/5 text-slate-700 hover:text-slate-400 hover:border-white/10'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
