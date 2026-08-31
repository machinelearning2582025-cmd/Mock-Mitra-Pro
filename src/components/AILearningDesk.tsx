import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, CheckCircle2, Circle, Loader2, MessageSquare, Target, User, WifiOff, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { generateLearningStrategyAPI, chatWithMitraAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from './MarkdownRenderer';
import { triggerHaptic, useOnlineStatus } from '../services/nativeService';

interface AILearningDeskProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onStartCustomDrill: (prompt: string) => void;
  onClearChatHistory?: () => void;
}

export default function AILearningDesk({ 
  profile, 
  onUpdateProfile, 
  onStartCustomDrill,
  onClearChatHistory
}: AILearningDeskProps) {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<'strategy' | 'mentor'>('strategy');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [chatIn, setChatIn] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const defaultInitialMessage = {
    role: 'model' as const,
    text: `Namaste **${profile.name}**! Koi bhi topic ya concept puchiye, main tailored explanation aur practice guidance dunga.`,
    date: new Date().toISOString()
  };

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string; date: string }[]>(
    profile.chatHistory && profile.chatHistory.length > 0
      ? profile.chatHistory
      : [defaultInitialMessage]
  );

  useEffect(() => {
    if (profile.chatHistory && profile.chatHistory.length > 0) {
      setChatMessages(profile.chatHistory);
    } else {
      setChatMessages([defaultInitialMessage]);
    }
  }, [profile.chatHistory, profile.name]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleGenerateStrategy = async () => {
    if (!isOnline) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('medium');
    setIsGeneratingStrategy(true);
    try {
      const res = await generateLearningStrategyAPI(profile, profile.language || 'Hinglish');

      if (res) {
        await onUpdateProfile({
          aiMentorPlan: {
            summary: res.summary,
            suggestedAction: res.suggestedAction,
            milestones: res.milestones,
            lastStructuredDate: new Date().toLocaleDateString()
          }
        });
        triggerHaptic('success');
      }
    } catch (err) {
      console.error("Failed to generate strategy:", err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleToggleMilestone = async (index: number) => {
    if (!profile.aiMentorPlan?.milestones) return;
    triggerHaptic('light');

    const updatedMilestones = profile.aiMentorPlan.milestones.map((m, i) => {
      if (i === index) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    await onUpdateProfile({
      aiMentorPlan: {
        ...profile.aiMentorPlan,
        milestones: updatedMilestones
      }
    });
  };

  const handleSendChat = async (overrideMsg?: string) => {
    if (!isOnline) {
      triggerHaptic('warning');
      return;
    }
    const textToSend = (overrideMsg || chatIn).trim();
    if (!textToSend) return;

    triggerHaptic('light');
    if (!overrideMsg) {
      setChatIn('');
    }

    const newUserMsg = {
      role: 'user' as const,
      text: textToSend,
      date: new Date().toISOString()
    };

    const updatedChats = [...chatMessages, newUserMsg];
    setChatMessages(updatedChats);
    setIsChatting(true);

    try {
      const aiReply = await chatWithMitraAPI(
        textToSend,
        updatedChats.map(c => ({ role: c.role, text: c.text })),
        profile,
        profile.language || 'Hinglish'
      );

      const newAiMsg = {
        role: 'model' as const,
        text: aiReply,
        date: new Date().toISOString()
      };

      const finalChats = [...updatedChats, newAiMsg];
      setChatMessages(finalChats);
      triggerHaptic('success');
      await onUpdateProfile({ chatHistory: finalChats });
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'model' as const,
          text: 'Internet connection check karein aur dobara try karein.',
          date: new Date().toISOString()
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const promptSuggestions = [
    "Revision plan",
    "Formula sheet",
    "Weak topics drill",
    "Exam tips"
  ];

  return (
    <div id="ai-personalised-hub" className="bento-card border border-slate-200/80 dark:border-brand/20 bg-white dark:bg-[#0d101a] my-4 p-4 sm:p-6 shadow-sm dark:shadow-premium">
      
      {/* Offline Alert */}
      {!isOnline && (
        <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-300 text-xs font-semibold">
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Offline mode: AI Mentor requires internet connection.</span>
        </div>
      )}

      {/* Header Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-light" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">AI Mentor</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-white/10 rounded-xl shrink-0">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('strategy'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'strategy' 
                ? 'bg-brand text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Strategy
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('mentor'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mentor' 
                ? 'bg-brand text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
        </div>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' ? (
            <motion.div
              key="strategy-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {profile.aiMentorPlan?.lastStructuredDate ? `Updated: ${profile.aiMentorPlan.lastStructuredDate}` : 'Milestones'}
                </span>

                <button
                  onClick={handleGenerateStrategy}
                  disabled={isGeneratingStrategy || !isOnline}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand dark:text-brand-light text-xs font-bold rounded-lg transition-all cursor-pointer border border-brand/20 disabled:opacity-50"
                >
                  {isGeneratingStrategy ? (
                    <>Updating <Loader2 className="w-3.5 h-3.5 animate-spin" /></>
                  ) : (
                    <>Refresh <RefreshCw className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              {profile.aiMentorPlan && profile.aiMentorPlan.milestones?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {profile.aiMentorPlan.milestones.map((milestone, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleToggleMilestone(idx)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        milestone.completed 
                          ? 'border-brand/30 bg-blue-50/50 dark:bg-brand/5 text-slate-400 dark:text-slate-500 line-through' 
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 hover:border-brand/40 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {milestone.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-brand" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium leading-tight">
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Click 'Refresh' to build your personalized milestones.</p>
                </div>
              )}

              {/* Action Button */}
              {profile.aiMentorPlan && (() => {
                const completedMilestones = profile.aiMentorPlan.milestones?.filter(m => m.completed) || [];
                const hasCompletedMilestones = completedMilestones.length > 0;
                return (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        triggerHaptic('success');
                        if (hasCompletedMilestones) {
                          const milestoneTitles = completedMilestones.map(m => m.title).join(', ');
                          onStartCustomDrill(`10 questions mock test focused on: ${milestoneTitles} for ${profile.exam}.`);
                        } else {
                          const weakTopicsStr = profile.performance.weakTopics.join(', ') || 'core chapters';
                          onStartCustomDrill(`10 questions test on: ${weakTopicsStr} for ${profile.exam}.`);
                        }
                      }}
                      className="w-full py-3 bg-brand hover:bg-brand-light text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{hasCompletedMilestones ? 'Test Completed Milestones' : 'Practice Target Topics'}</span>
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          ) : (
            // Chat View
            <motion.div
              key="mentor-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Chat Header Actions */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mitra Tutor</span>
                {chatMessages.length > 1 && onClearChatHistory && (
                  <button
                    onClick={() => {
                      triggerHaptic('warning');
                      if (window.confirm("Clear chat history?")) {
                        onClearChatHistory();
                      }
                    }}
                    className="text-[11px] text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* Chat Message Stream */}
              <div 
                ref={scrollRef}
                className="overflow-y-auto max-h-[380px] min-h-[220px] pr-1 space-y-3 mb-3 custom-scrollbar"
              >
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex gap-2 max-w-full ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 rounded-full shrink-0 bg-blue-50 dark:bg-brand/20 border border-blue-200 dark:border-brand/30 text-brand dark:text-brand-light flex items-center justify-center mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    <div className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                      msg.role === 'user' 
                        ? 'bg-brand text-white rounded-tr-none shadow-sm' 
                        : 'bg-slate-100 dark:bg-[#121624] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 rounded-tl-none'
                    }`}>
                      <MarkdownRenderer text={msg.text} isUser={msg.role === 'user'} />
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full shrink-0 bg-indigo-50 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {isChatting && (
                  <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400 italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                    <span>Mitra AI is typing...</span>
                  </div>
                )}
              </div>

              {/* Quick suggestions */}
              {chatMessages.length <= 2 && !isChatting && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {promptSuggestions.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(prompt)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-medium transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Bar - Embedded rock-solid send button inside input container */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="relative flex items-center w-full pt-2 border-t border-slate-100 dark:border-white/5"
              >
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-brand text-slate-900 dark:text-white pl-4 pr-12 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-slate-400 dark:placeholder-slate-500"
                    placeholder={isOnline ? "Ask question or topic..." : "Connect internet to chat..."}
                    value={chatIn}
                    onChange={(e) => setChatIn(e.target.value)}
                    disabled={isChatting || !isOnline}
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !isOnline || !chatIn.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand hover:bg-brand-light text-white rounded-lg flex items-center justify-center shadow-sm active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
