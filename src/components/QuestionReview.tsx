import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, ChevronDown, ChevronUp, Zap, Sparkles, Send, User, RotateCcw } from 'lucide-react';
import { Question, UserProfile } from '../types';
import { chatWithMitraAPI } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';
import { triggerHaptic } from '../services/nativeService';

interface QuestionReviewProps {
  questions: Question[];
  userAnswers: Record<string, number>;
  onNextTest: () => void;
  profile: UserProfile;
}

interface QuestionChatHelperProps {
  question: Question;
  userSelectedOption: number;
  profile: UserProfile;
}

function QuestionChatHelper({ question, userSelectedOption, profile }: QuestionChatHelperProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; date: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const letterOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
  const userOptionLetter = letterOptions[userSelectedOption] !== undefined ? letterOptions[userSelectedOption] : `Option ${userSelectedOption + 1}`;
  const correctOptionLetter = letterOptions[question.correctAnswer] !== undefined ? letterOptions[question.correctAnswer] : `Option ${question.correctAnswer + 1}`;
  const wasCorrect = userSelectedOption === question.correctAnswer;

  // Initial welcome message setup
  useEffect(() => {
    const greetingText = `Hello! Is question ke topic \`${question.topic}\` ke doubts clear karne ke liye main ready hoon.
    
* **Aapka response:** ${userOptionLetter} ${wasCorrect ? '(Sahi!) 🎉' : '(Galat) ❌'}
* **Correct Option:** ${correctOptionLetter}

Aap jo bhi puchna chahte hain, kripya direct type karein!`;

    setMessages([
      {
        role: 'model',
        text: greetingText,
        date: new Date().toISOString()
      }
    ]);
  }, [question, userSelectedOption]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    triggerHaptic('light');
    if (!customText) setInputText('');

    const newMsgs = [
      ...messages,
      { role: 'user' as const, text: textToSend, date: new Date().toISOString() }
    ];
    setMessages(newMsgs);
    setIsTyping(true);

    try {
      const contextPrompt = `
Context parameters for specified review:
- Question Text: "${question.question}"
- Possible Options:
${question.options.map((opt, i) => `  * ${letterOptions[i] || i + 1}: ${opt}`).join('\n')}
- Correct Solution/Answer: ${correctOptionLetter} ("${question.options[question.correctAnswer]}")
- User selected Option: ${userOptionLetter} ("${question.options[userSelectedOption]}")
- Pre-set explanation notes: "${question.explanation}"
---
User doubt prompt is: "${textToSend}"

Provide a very short, crisp, precise, and direct clarification. STRICTLY keep the response extremely brief (only 2 to 3 short sentences or clear bullet points max). Do not write any long paragraphs or repeated summaries. Always reply in simple day-to-day Hinglish (Hindi + English mix) as a friendly tutor.
`;

      const apiHistory = messages.slice(1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const reply = await chatWithMitraAPI(contextPrompt, apiHistory, profile, profile.language || "Hinglish");
      
      setMessages(prev => [
        ...prev,
        { role: 'model' as const, text: reply, date: new Date().toISOString() }
      ]);
      triggerHaptic('light');
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'model' as const, text: "Koshish badiya thi par reply fetch karne me error aya. Dobara try karein ya internet check karein!", date: new Date().toISOString() }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const cleanHistory = () => {
    triggerHaptic('light');
    setMessages([
      {
        role: 'model',
        text: `Naye siray se discussion start karte hain! Kripya is concept ke baare me apna doubt puchiye.`,
        date: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-brand/25 p-4 sm:p-5 rounded-2xl mt-4 relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand animate-pulse" />
          <div>
            <span className="text-xs font-black uppercase text-brand tracking-widest block">Mitra AI Instant Review</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Concept clarity with your AI Coach</span>
          </div>
        </div>
        <button 
          type="button"
          onClick={cleanHistory}
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer"
          title="Clear Chat Room"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="space-y-3 max-h-[260px] overflow-y-auto pr-1 mb-3 custom-scrollbar"
      >
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex gap-2 max-w-[95%] text-xs sm:text-sm ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-600/20 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-blue-50 border-blue-200 text-brand dark:bg-brand/15 dark:border-brand/30 dark:text-brand'}`}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`p-3 rounded-2xl leading-relaxed ${m.role === 'user' ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 dark:bg-indigo-600/20 dark:text-white dark:border-indigo-500/20 rounded-tr-none' : 'bg-white dark:bg-[#151926] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-tl-none shadow-sm'}`}>
              <div className="markdown-body select-text">
                <MarkdownRenderer text={m.text} />
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 max-w-[95%] text-xs">
            <div className="w-7 h-7 rounded-full shrink-0 bg-blue-50 dark:bg-brand/15 border border-blue-200 dark:border-brand/30 text-brand flex items-center justify-center animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 rounded-2xl rounded-tl-none italic font-medium animate-pulse">
              Analyzing topic concept, preparing quick explanation...
            </div>
          </div>
        )}
      </div>

      <div className="relative flex items-center w-full border-t border-slate-200 dark:border-white/5 pt-3">
        <div className="relative w-full flex items-center">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            disabled={isTyping}
            placeholder="Doubt puchiye (e.g. why is this formula used?)..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 focus:border-brand text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm pl-4 pr-12 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand/30 disabled:opacity-50 font-medium"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isTyping || !inputText.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand text-white hover:bg-brand-light rounded-lg flex items-center justify-center text-xs font-bold transition-all disabled:opacity-30 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionReview({ questions, userAnswers, onNextTest, profile }: QuestionReviewProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);

  return (
    <div className="mt-10 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Info className="w-6 h-6 text-brand" /> Detailed Question Analysis
        </h3>
        <button 
          onClick={() => {
            triggerHaptic('success');
            onNextTest();
          }}
          className="flex items-center gap-2 px-6 py-3 bg-brand text-white font-black rounded-xl shadow-lg shadow-brand/25 hover:bg-brand-light transition-all active:scale-95 uppercase tracking-widest text-xs cursor-pointer"
        >
          Start Next Test <Zap className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isCorrect = userAnswers[q.id] === q.correctAnswer;
          const isExpanded = expandedId === q.id;

          return (
            <motion.div 
              key={`${q.id || 'q'}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`bento-card border transition-all cursor-pointer ${
                isCorrect 
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/50' 
                  : 'bg-rose-50/60 dark:bg-rose-950/15 border-rose-500/30 dark:border-rose-500/20 hover:border-rose-500/50'
              }`}
              onClick={() => {
                triggerHaptic('light');
                setExpandedId(isExpanded ? null : q.id);
                if (isExpanded) {
                  setActiveChatId(null);
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`mt-1 shrink-0 ${isCorrect ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                      Question {idx + 1} • <span className="text-brand dark:text-brand-light">{q.topic}</span>
                    </span>
                    {/* Scaled-up Question statement font */}
                    <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug sm:leading-relaxed">
                      {q.question}
                    </p>
                  </div>
                </div>
                <div className="text-slate-400 mt-1 shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4"
                >
                  {/* Options List with Scaled font and distinct colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                    {q.options.map((opt, optIdx) => {
                      const isUserSelected = userAnswers[q.id] === optIdx;
                      const isRight = q.correctAnswer === optIdx;
                      
                      let appearance = 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-white/5 dark:text-slate-300';
                      if (isRight) appearance = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-900 dark:text-white font-bold shadow-sm';
                      if (isUserSelected && !isRight) appearance = 'bg-rose-500/20 border-rose-500/60 text-rose-900 dark:text-white font-bold shadow-sm';

                      return (
                        <div key={optIdx} className={`p-4 rounded-xl border text-sm sm:text-base leading-relaxed flex items-center gap-3 ${appearance}`}>
                          <span className="w-7 h-7 rounded-lg bg-black/10 dark:bg-black/40 flex items-center justify-center text-xs font-black shrink-0 text-slate-800 dark:text-white">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isRight && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />}
                          {isUserSelected && !isRight && <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Explanation Block with Scaled font */}
                  <div className="bg-blue-50/80 dark:bg-brand/10 border border-blue-200 dark:border-brand/25 p-4 sm:p-5 rounded-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-4 mb-2.5">
                      <div className="flex items-center gap-2 text-brand text-xs font-black uppercase tracking-wider">
                         <Zap className="w-4 h-4" /> Solution & Explanation
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setActiveChatId(activeChatId === q.id ? null : q.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all cursor-pointer ${
                          activeChatId === q.id
                            ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300'
                            : 'bg-gradient-to-r from-brand to-indigo-600 border-brand/40 text-white shadow-md'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {activeChatId === q.id ? 'Close AI Doubt' : 'Ask AI Doubt'}
                      </button>
                    </div>
                    
                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>

                  {activeChatId === q.id && (
                    <QuestionChatHelper 
                      question={q}
                      userSelectedOption={userAnswers[q.id]}
                      profile={profile}
                    />
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
