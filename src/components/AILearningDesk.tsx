import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, CheckCircle2, Circle, Loader2, MessageSquare, Target, User, WifiOff } from 'lucide-react';
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
  
  // Local chat display list
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string; date: string }[]>(
    profile.chatHistory || [
      {
        role: 'model',
        text: `Namaste **${profile.name}**! Main aapka AI Mentor Mitra hoon. \n\nAap jis bhi topic ya concept me comfortable feel nahi kar rahe hain, mujhe batayein. Main aapki target performance aur dynamic weak areas ko focus karke revision tips, active recall strategies aur guidance provide karunga.`,
        date: new Date().toISOString()
      }
    ]
  );

  useEffect(() => {
    if (profile.chatHistory) {
      if (profile.chatHistory.length === 0) {
        setChatMessages([
          {
            role: 'model',
            text: `Namaste **${profile.name}**! Main aapka AI Mentor Mitra hoon. \n\nAap jis bhi topic ya concept me comfortable feel nahi kar rahe hain, mujhe batayein. Main aapki target performance aur dynamic weak areas ko focus karke revision tips, active recall strategies aur guidance provide karunga.`,
            date: new Date().toISOString()
          }
        ]);
      } else {
        setChatMessages(profile.chatHistory);
      }
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
      console.error("Failed to generate personalized guide:", err);
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
          text: 'Internet connectivity check karein ya thodi der baad dobara query karein.',
          date: new Date().toISOString()
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const promptSuggestions = [
    "Mere performance goals design karo",
    "Formula revision cheat sheet",
    "Hinglish mock test strategy",
    "Weak subtopics high impact list"
  ];

  return (
    <div id="ai-personalised-hub" className="bento-card border-brand/20 bg-[#0d101a] overflow-hidden my-4 p-4 sm:p-6 shadow-premium">
      
      {/* Offline Alert Banner if disconnected */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-amber-300 text-xs font-bold">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Offline Mode: AI Mentor Desk needs internet. All practice tests & question sets work 100% offline!</span>
        </div>
      )}

      {/* Top Header with Tab Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center justify-between sm:justify-start">
          <span className="flex items-center gap-1.5 text-xs bg-brand/10 border border-brand/20 text-brand-light px-3 py-1.5 rounded-full uppercase tracking-wider font-extrabold leading-none">
            <Sparkles className="w-3.5 h-3.5 text-brand-light" /> AI Learning & Strategy Desk
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-950/80 p-1 border border-white/10 rounded-2xl shrink-0 w-full sm:w-auto">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('strategy'); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold leading-none rounded-xl transition-all cursor-pointer ${
              activeTab === 'strategy' 
                ? 'bg-brand text-white shadow-md shadow-brand/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" /> Strategy & Goals
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('mentor'); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold leading-none rounded-xl transition-all cursor-pointer ${
              activeTab === 'mentor' 
                ? 'bg-brand text-white shadow-md shadow-brand/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 
            <span>Chat Mitra AI</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col min-h-[360px] relative">
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' ? (
            <motion.div
              key="strategy-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="flex flex-col h-full justify-between py-2"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5 mb-3.5">
                  <div>
                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand" /> Dynamic Milestones & Strategy
                    </h3>
                    {profile.aiMentorPlan?.lastStructuredDate && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Last Updated: {profile.aiMentorPlan.lastStructuredDate}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateStrategy}
                    disabled={isGeneratingStrategy || !isOnline}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand/10 border border-brand/20 hover:bg-brand/20 text-brand-light hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 w-full sm:w-auto disabled:opacity-50"
                  >
                    {isGeneratingStrategy ? (
                      <>Rebuilding... <Loader2 className="w-4 h-4 animate-spin" /></>
                    ) : (
                      <>Program AI Roadmap <RefreshCw className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                {profile.aiMentorPlan ? (
                  <div className="space-y-4 w-full">
                    <div className="w-full">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Active Study Milestones:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                        {profile.aiMentorPlan.milestones.map((milestone, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleToggleMilestone(idx)}
                            className={`flex items-start gap-3 p-4 bg-slate-900/90 border hover:border-brand/40 rounded-2xl cursor-pointer transition-all ${
                              milestone.completed ? 'border-brand/30 bg-brand/10' : 'border-white/5'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {milestone.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-brand fill-brand/20" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`text-xs sm:text-sm font-bold leading-normal block ${
                                milestone.completed ? 'text-slate-400 line-through font-medium' : 'text-slate-200'
                              }`}>
                                {milestone.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 bg-slate-900/40 rounded-2xl border border-white/5">
                    <Sparkles className="w-10 h-10 text-brand mx-auto mb-3 animate-bounce" />
                    <h4 className="text-base font-black text-white mb-1">Tailored Preparation Roadmap</h4>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
                      Aapke strong aur weak areas ke basis par AI exam syllabus ke liye smart strategy formulate karega. Upar 'Program AI Roadmap' button par click karein!
                    </p>
                  </div>
                )}
              </div>

              {/* Instant Custom Goal Drill Launcher */}
              {profile.aiMentorPlan && (() => {
                const completedMilestones = profile.aiMentorPlan.milestones?.filter(m => m.completed) || [];
                const hasCompletedMilestones = completedMilestones.length > 0;
                return (
                  <div className="mt-6 border-t border-white/5 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h5 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 justify-center sm:justify-start">
                        <Sparkles className={`w-4 h-4 ${hasCompletedMilestones ? 'text-emerald-400' : 'text-brand'}`} /> 
                        {hasCompletedMilestones ? 'Practice Completed Milestones' : 'Launch Focused Practice Test'}
                      </h5>
                      <p className="text-xs text-slate-400 text-center sm:text-left mt-0.5 leading-normal">
                        {hasCompletedMilestones 
                          ? `Milestone topics: "${completedMilestones.map(m => m.title).join(', ')}" par targeted practice test chalu hoga.`
                          : 'Target weak topics par customized active recall practice session chalu karein.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic('success');
                        if (hasCompletedMilestones) {
                          const milestoneTitles = completedMilestones.map(m => m.title).join(', ');
                          onStartCustomDrill(`Please generate a practice/mock test of 10 questions focused SPECIFICALLY on: ${milestoneTitles} for ${profile.exam}.`);
                        } else {
                          const weakTopicsStr = profile.performance.weakTopics.join(', ') || 'core chapters';
                          onStartCustomDrill(`Please generate a practice test focused on active recall of: ${weakTopicsStr} for ${profile.exam}.`);
                        }
                      }}
                      className={`w-full sm:w-auto px-6 py-3 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 text-center shadow-lg ${
                        hasCompletedMilestones 
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25' 
                          : 'bg-brand hover:bg-brand-light shadow-brand/25'
                      }`}
                    >
                      {hasCompletedMilestones ? 'Test Milestones 🎯' : 'Practice Weak Areas ⚡'}
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          ) : (
            // INTERACTIVE MENTOR CHAT DESK (MITRA AI)
            <motion.div
              key="mentor-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="flex flex-col h-full justify-between p-4 sm:p-5 bg-slate-950/60 border border-brand/25 rounded-2xl shadow-inner relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5 shrink-0">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Mitra AI Live Tutor ⚡
                </span>
                {chatMessages.length > 1 && onClearChatHistory && (
                  <button
                    onClick={() => {
                      triggerHaptic('warning');
                      if (window.confirm("Mitra AI chat history clear karein?")) {
                        onClearChatHistory();
                      }
                    }}
                    className="text-[10px] font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Clear Chat 🗑️
                  </button>
                )}
              </div>

              {/* Chat Display Box */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto h-[60vh] min-h-[350px] max-h-[70vh] md:h-[480px] pr-1.5 mb-3.5 space-y-3.5 custom-scrollbar"
              >
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex gap-3 max-w-full sm:max-w-[95%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border h-max ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' 
                        : 'bg-brand/20 border-brand/30 text-brand-light'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    
                    <div className={`p-3.5 rounded-2xl leading-relaxed text-xs sm:text-sm font-medium ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600/20 text-white border border-indigo-500/20 rounded-tr-none' 
                        : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-none'
                    }`}>
                      <MarkdownRenderer text={msg.text} />
                    </div>
                  </div>
                ))}

                {isChatting && (
                  <div className="flex gap-2.5 max-w-full sm:max-w-[95%]">
                    <div className="w-8 h-8 rounded-full shrink-0 bg-brand/20 border border-brand/30 text-brand-light flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="p-3 bg-slate-900/80 text-slate-400 border border-white/5 rounded-2xl rounded-tl-none text-xs italic flex items-center gap-1.5 font-medium animate-pulse">
                      Mitra AI is preparing your study guidance...
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Chips */}
              {chatMessages.length <= 2 && !isChatting && (
                <div className="mb-3">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Suggested questions:</span>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendChat(prompt)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-brand/20 hover:text-white border border-white/5 hover:border-brand/30 rounded-xl text-xs text-slate-300 font-bold transition-all cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat input form panel */}
              <div className="flex gap-2.5 border-t border-white/5 pt-3.5 items-center">
                <input
                  type="text"
                  className="flex-1 bg-slate-900 border border-brand/30 focus:border-brand text-white px-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-brand/40 shadow-inner"
                  placeholder={isOnline ? "Ask study plan, formula derivation, weak areas..." : "Connect internet to use AI chat..."}
                  value={chatIn}
                  onChange={(e) => setChatIn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendChat();
                    }
                  }}
                  disabled={isChatting || !isOnline}
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isChatting || !isOnline || !chatIn.trim()}
                  className="px-4 py-3 bg-brand hover:bg-brand-light text-white rounded-xl shadow-lg shadow-brand/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer font-bold"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
