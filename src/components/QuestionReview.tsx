import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Info, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Question } from '../types';

interface QuestionReviewProps {
  questions: Question[];
  userAnswers: Record<string, number>;
  onNextTest: () => void;
}

export default function QuestionReview({ questions, userAnswers, onNextTest }: QuestionReviewProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <div className="mt-12 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="flex items-center gap-2"><Info className="w-5 h-5 text-brand" /> Check Correct Answers</span>
        </h3>
        <div className="flex items-center gap-4">
           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest hidden sm:block">Review Your Answers</span>
           <button 
            onClick={onNextTest}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white font-black rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 uppercase tracking-widest text-[10px]"
          >
            Start Next Test <Zap className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isCorrect = userAnswers[q.id] === q.correctAnswer;
          const isExpanded = expandedId === q.id;

          return (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bento-card border-none ${isCorrect ? 'bg-emerald-500/5' : 'bg-red-500/5'} cursor-pointer transition-colors hover:bg-white/[0.03]`}
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 shrink-0 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Question {idx + 1} • {q.topic}</span>
                    <p className="text-sm font-bold text-white leading-relaxed">{q.question}</p>
                  </div>
                </div>
                <div className="text-slate-500">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 pt-6 border-t border-white/5 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIdx) => {
                      const isUserSelected = userAnswers[q.id] === optIdx;
                      const isRight = q.correctAnswer === optIdx;
                      
                      let appearance = 'bg-white/5 border-transparent text-slate-400';
                      if (isRight) appearance = 'bg-emerald-500/20 border-emerald-500/50 text-white';
                      if (isUserSelected && !isRight) appearance = 'bg-red-500/20 border-red-500/50 text-white';

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border text-xs font-semibold ${appearance}`}>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="bg-brand/10 border border-brand/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-widest mb-2">
                       <Zap className="w-3 h-3" /> Explanation
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
