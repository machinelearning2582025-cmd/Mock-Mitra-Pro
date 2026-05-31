import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, ChevronDown, ChevronUp, Zap, Sparkles, Send, User, RotateCcw } from 'lucide-react';
import { Question, UserProfile } from '../types';
import { chatWithMitraAPI } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

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

    if (!customText) setInputText('');

    const newMsgs = [
      ...messages,
      { role: 'user' as const, text: textToSend, date: new Date().toISOString() }
    ];
    setMessages(newMsgs);
    setIsTyping(true);

    try {
      // Build a specific context for the LLM review
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
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'model' as const, text: "Koshish badiya thi par reply fetch karne me error aya. Dobara click karein ya type kijiye!", date: new Date().toISOString() }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const cleanHistory = () => {
    setMessages([
      {
        role: 'model',
        text: `Naye siray se discussion start karte hain! Kripya is concept ke baare me apna doubt puchiye.`,
        date: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="bg-slate-950/40 border border-brand/20 p-4 rounded-xl mt-4 relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand animate-pulse" />
          <div>
            <span className="text-[10px] font-black uppercase text-brand tracking-widest block">Mitra AI Instant Review</span>
            <span className="text-[8px] text-slate-500 font-bold">Concept clarity with your AI Coach</span>
          </div>
        </div>
        <button 
          type="button"
          onClick={cleanHistory}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded hover:bg-white/5"
          title="Clear Chat Room"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="space-y-3 max-h-[240px] overflow-y-auto pr-1 mb-3 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent custom-scrollbar"
      >
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex gap-2 max-w-[95%] text-[11px] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-indigo-600/15 border-indigo-500/25 text-indigo-400' : 'bg-brand/10 border-brand/25 text-brand'}`}>
              {m.role === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            </div>
            <div className={`p-2.5 rounded-xl leading-relaxed ${m.role === 'user' ? 'bg-indigo-600/10 text-slate-200 border border-indigo-500/10 rounded-tr-none' : 'bg-[#161a24] text-slate-300 border border-white/5 rounded-tl-none font-sans'}`}>
              <div className="markdown-body select-text">
                <MarkdownRenderer text={m.text} />
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 max-w-[95%] text-[11px]">
            <div className="w-6 h-6 rounded-full shrink-0 bg-brand/10 border border-brand/25 text-brand flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin" />
            </div>
            <div className="p-2.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl rounded-tl-none italic font-medium animate-pulse">
              Analyzing subject, crafting response...
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-white/5 pt-2.5">
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
          placeholder="Ask why user option was wrong, formula derivation..."
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-brand/30 text-white placeholder-slate-500 text-[11px] px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/20 disabled:opacity-50 font-medium"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isTyping || !inputText.trim()}
          className="bg-brand text-white hover:bg-brand-light p-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand/20 cursor-pointer"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function QuestionReview({ questions, userAnswers, onNextTest, profile }: QuestionReviewProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);

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
              onClick={() => {
                setExpandedId(isExpanded ? null : q.id);
                // Reset active chat when collapsing
                if (isExpanded) {
                  setActiveChatId(null);
                }
              }}
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
                <div className="text-slate-500 mt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 pt-6 border-t border-white/5 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
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
                  
                  <div className="bg-brand/10 border border-brand/20 p-4 rounded-xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-widest">
                         <Zap className="w-3 h-3" /> Explanation
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChatId(activeChatId === q.id ? null : q.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all hover:scale-105 ${
                          activeChatId === q.id
                            ? 'bg-slate-800 border-white/10 text-slate-300'
                            : 'bg-brand/20 border-brand/30 hover:bg-brand/30 text-white shadow-md shadow-brand/10'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {activeChatId === q.id ? 'Close AI Help' : 'Ask with AI'}
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
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
