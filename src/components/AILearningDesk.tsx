import { useState, useRef, useEffect } from 'react';
import { Sparkles, Save, Send, RefreshCw, CheckCircle2, Circle, Loader2, BookOpen, MessageSquare, Target, User } from 'lucide-react';
import { UserProfile } from '../types';
import { generateLearningStrategyAPI, chatWithMitraAPI, updatePersonalisedProfileBackgroundAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface AILearningDeskProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onStartCustomDrill: (prompt: string) => void;
}

export default function AILearningDesk({ profile, onUpdateProfile, onStartCustomDrill }: AILearningDeskProps) {
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

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Generate Personalized Learning Strategy (Action Plan & Milestones)
  const handleGenerateStrategy = async () => {
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
      }
    } catch (err) {
      console.error("Failed to generate personalized guide:", err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Toggle milestone checkbox index and sync back to database
  const handleToggleMilestone = async (index: number) => {
    if (!profile.aiMentorPlan) return;
    const currentMilestones = [...profile.aiMentorPlan.milestones];
    const itemToggled = currentMilestones[index];
    currentMilestones[index] = {
      ...itemToggled,
      completed: !itemToggled.completed
    };

    // 1. Instantly update profile in client / firebase state so user has real-time ticking
    const updatedPlan = {
      ...profile.aiMentorPlan,
      milestones: currentMilestones
    };
    await onUpdateProfile({
      aiMentorPlan: updatedPlan
    });

    // 2. Trigger asynchronous, non-blocking background adjustment of the remaining milestones based on latest tick!
    setTimeout(async () => {
      try {
        const tempProfile = {
          ...profile,
          aiMentorPlan: updatedPlan
        };
        const latestPlan = await updatePersonalisedProfileBackgroundAPI(tempProfile, profile.language);
        if (latestPlan) {
          // Merge completed status properly
          const mergedMilestones = latestPlan.milestones.map(m => {
            const match = currentMilestones.find(cm => cm.title.toLowerCase() === m.title.toLowerCase());
            return {
              title: m.title,
              completed: match ? match.completed : m.completed
            };
          });
          
          await onUpdateProfile({
            aiMentorPlan: {
              summary: latestPlan.summary,
              suggestedAction: latestPlan.suggestedAction,
              milestones: mergedMilestones,
              lastStructuredDate: new Date().toLocaleDateString()
            }
          });
        }
      } catch (err) {
        console.error("Failed to update background personalization on tick:", err);
      }
    }, 1000);
  };

  // Chat conversation execution
  const handleSendChat = async (overrideMsg?: string) => {
    const textToSend = (overrideMsg || chatIn).trim();
    if (!textToSend) return;

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
      // Query our backend/Gemini function passing recent profile state config
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
      
      // Save full chat thread history directly into Firestore!
      await onUpdateProfile({ chatHistory: finalChats });
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  // Suggested prompt quick triggers
  const promptSuggestions = [
    "Mere performance goals design karo",
    "Formula revision cheat sheet",
    "Hinglish mock test strategy",
    "Weak subtopics high impact list"
  ];

  return (
    <div id="ai-personalised-hub" className="border border-brand/20 bg-gradient-to-b from-[#11131c] via-[#0E1017] to-[#0A0C10] rounded-3xl overflow-hidden shadow-[0_4px_30px_rgba(37,99,235,0.15)] my-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header with Tab Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <span className="flex items-center gap-1 text-[8px] sm:text-[10px] bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-full uppercase tracking-widest font-black leading-none mb-1 w-max">
            <Sparkles className="w-3 h-3 text-brand" /> Personalised AI Learning
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-900/80 p-0.5 sm:p-1 border border-white/5 rounded-xl shrink-0 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('strategy')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-bold leading-none rounded-lg transition-all cursor-pointer ${activeTab === 'strategy' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Strategy & Milestones
          </button>
          <button 
            onClick={() => setActiveTab('mentor')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-bold leading-none rounded-lg transition-all cursor-pointer ${activeTab === 'mentor' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Chat with Mitra AI
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col min-h-[380px] bg-white/[0.01] border border-white/5 rounded-2xl relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' ? (
            // STRATEGY HUB & MILESTONES WORKSPACE
            <motion.div
              key="strategy-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-full justify-between p-4 sm:p-5"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand" /> Dynamic Milestones & Strategy Board
                    </h3>
                    {profile.aiMentorPlan?.lastStructuredDate && (
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        Last Updated: {profile.aiMentorPlan.lastStructuredDate}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateStrategy}
                    disabled={isGeneratingStrategy}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm shadow-brand/25 hover:bg-brand-light active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0 w-full sm:w-auto"
                  >
                    {isGeneratingStrategy ? (
                      <>Rebuilding... <Loader2 className="w-3.5 h-3.5 animate-spin" /></>
                    ) : (
                      <>Ask AI to Program Roadmap <RefreshCw className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>

                {profile.aiMentorPlan ? (
                  <div className="space-y-4">
                    {/* Summary Section */}
                    <div className="p-3 sm:p-4 bg-brand/5 border border-brand/10 rounded-xl">
                      <h4 className="text-[11px] sm:text-xs font-black text-brand-light uppercase tracking-wider mb-1">
                        AI Executive Recommendation:
                      </h4>
                      <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed font-sans">
                        {profile.aiMentorPlan.summary}
                      </p>
                    </div>

                    {/* Milestones Section */}
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        Personal Study Milestones:
                      </h4>
                      <div className="space-y-2">
                        {profile.aiMentorPlan.milestones.map((milestone, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleToggleMilestone(idx)}
                            className={`flex items-start gap-2.5 p-2.5 sm:p-3 bg-white/[0.01] border hover:bg-white/[0.03] hover:border-white/10 rounded-xl cursor-pointer transition-all ${milestone.completed ? 'border-brand/20 bg-brand/5' : 'border-white/5'}`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {milestone.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand fill-current" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`text-[11px] sm:text-xs font-bold leading-normal block ${milestone.completed ? 'text-slate-500 line-through font-medium' : 'text-slate-200'}`}>
                                {milestone.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4">
                    <Sparkles className="w-8 h-8 text-brand mx-auto mb-2 animate-bounce" />
                    <h4 className="text-xs sm:text-sm font-black text-slate-300 mb-1">Roadmap Program Available</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Aapke current strong/weak topics ke according AI ek tailored preparation strategy formulate karega. Upar 'Program Roadmap' button par click karein!
                    </p>
                  </div>
                )}
              </div>

              {/* Instant Custom Goal Drill Launcher */}
              {profile.aiMentorPlan && (
                <div className="mt-5 border-t border-white/5 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                      <Sparkles className="w-3.5 h-3.5 text-brand" /> Launch Personalised Practice Drill
                    </h5>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 text-center sm:text-left mt-0.5">
                      AI instant practice test generate karega jo directly aapke target weak topics ko focus karega.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const weakTopicsStr = profile.performance.weakTopics.join(', ') || 'core chapters';
                      onStartCustomDrill(`Please generate a practice test focused on active recall of: ${weakTopicsStr}. Align difficulty with standard mock benchmarks for ${profile.exam}.`);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-brand to-indigo-600 hover:from-[#3a75e0] hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/25 transition-all active:scale-95 cursor-pointer shrink-0 text-center"
                  >
                    Practice Weak areas ⚡
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            // INTERACTIVE MENTOR CHAT DESK (MITRA AI)
            <motion.div
              key="mentor-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-full justify-between p-4 sm:p-5"
            >
              {/* Chat Display Box */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto max-h-[250px] sm:max-h-[310px] pr-2 mb-4 space-y-3.5 custom-scrollbar"
              >
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex gap-2.5 max-w-[94%] sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 flex items-center justify-center border h-max ${msg.role === 'user' ? 'bg-indigo-600/15 border-indigo-500/20 text-indigo-400' : 'bg-brand/10 border-brand/20 text-brand-light'}`}>
                      {msg.role === 'user' ? <User className="w-3 h-3 sm:w-3.5 h-3.5" /> : <Sparkles className="w-3 h-3 sm:w-3.5 h-3.5" />}
                    </div>
                    
                    <div className={`p-2.5 sm:p-3 rounded-2xl leading-relaxed whitespace-pre-wrap text-[11px] sm:text-xs ${msg.role === 'user' ? 'bg-indigo-600/10 text-slate-200 border border-indigo-500/10 rounded-tr-none' : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none font-sans'}`}>
                      {/* Render simple markdown styling bold / bullets safely */}
                      {msg.text.split('\n').map((para, pIdx) => {
                        let processed = para;
                        // Format bold elements **text** -> <strong>text</strong>
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const matches = processed.match(boldRegex);
                        if (matches) {
                          processed = processed.replace(boldRegex, '<strong>$1</strong>');
                        }
                        
                        return (
                          <p 
                            key={pIdx} 
                            className={`${pIdx !== 0 ? 'mt-1' : ''}`} 
                            dangerouslySetInnerHTML={{ __html: processed }} 
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {isChatting && (
                  <div className="flex gap-2.5 max-w-[94%] sm:max-w-[85%]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 bg-brand/10 border border-brand/20 text-brand-light flex items-center justify-center h-max animate-pulse">
                      <Sparkles className="w-3 h-3 sm:w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-2.5 bg-white/5 text-slate-500 border border-white/5 rounded-2xl rounded-tl-none text-[11px] sm:text-xs italic flex items-center gap-1.5 font-medium animate-pulse">
                      Mitra AI is formulating context reply...
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Quick Chips */}
              {chatMessages.length <= 2 && !isChatting && (
                <div className="mb-3.5">
                  <span className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Tap quick starters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {promptSuggestions.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendChat(prompt)}
                        className="px-2 py-1 bg-white/5 hover:bg-brand/10 hover:text-brand border border-white/5 rounded-lg text-[9px] sm:text-[10px] text-slate-400 font-bold transition-all cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat input form panel */}
              <div className="flex gap-2 border-t border-white/5 pt-3.5">
                <input
                  type="text"
                  className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-brand/40 text-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand/30 leading-none"
                  placeholder="Ask study plan questions, math tricks, weak areas tips..."
                  value={chatIn}
                  onChange={(e) => setChatIn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendChat();
                    }
                  }}
                  disabled={isChatting}
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isChatting}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-brand hover:bg-brand-light text-white rounded-xl shadow-lg shadow-brand/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
