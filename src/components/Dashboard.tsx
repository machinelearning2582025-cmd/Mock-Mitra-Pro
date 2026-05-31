import { motion } from 'motion/react';
import { Target, TrendingUp, AlertTriangle, Calendar, ArrowRight, Zap, Sparkles, BookOpen } from 'lucide-react';
import { UserProfile, Topic } from '../types';
import { getExamConfig } from '../data/examsConfig';
import AILearningDesk from './AILearningDesk';
import MarkdownRenderer from './MarkdownRenderer';

interface DashboardProps {
  profile: UserProfile;
  onStartTest: () => void;
  onStartTopicTest: (topic: Topic) => void;
  onViewResult: (result: any) => void;
  onInstallClick?: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onStartCustomDrill: (prompt: string) => void;
}

export default function Dashboard({ 
  profile, 
  onStartTest, 
  onStartTopicTest, 
  onViewResult, 
  onInstallClick,
  onUpdateProfile,
  onStartCustomDrill
}: DashboardProps) {
  const history = profile.performance.testHistory;
  const examConfig = getExamConfig(profile.exam);
  
  const lastScore = history.length > 0 
    ? Math.round(history.reduce((acc, h) => acc + (h.score / h.total * 100), 0) / history.length)
    : 0;

  // Smart estimation of percentile
  const estimatedPercentile = history.length > 0
    ? Math.min(100, Math.round((lastScore / 100) * 98))
    : 0;

  // Topic logic: Merging default topics from config with tracked topics
  const allDefaultTopics = examConfig?.defaultTopics || [];
  const trackedTopics = Object.keys(profile.performance.knowledgeProfile);
  const combinedTopics = Array.from(new Set([...allDefaultTopics, ...trackedTopics]));

  const topicAnalysis = combinedTopics.map(topic => ({
    name: topic,
    score: profile.performance.knowledgeProfile[topic as Topic] || 0,
    hasData: trackedTopics.includes(topic)
  })).sort((a, b) => b.score - a.score);

  // Gap Analysis: Topics with low score OR no data yet
  const gaps = combinedTopics
    .map(topic => {
      const score = profile.performance.knowledgeProfile[topic as Topic] || 0;
      const status = !trackedTopics.includes(topic) ? 'Unexplored' : score < 60 ? 'Critical Gap' : null;
      return { name: topic, score, status };
    })
    .filter(g => g.status !== null)
    .sort((a, b) => (a.status === 'Critical Gap' ? -1 : 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-12">
      <header className="mb-6 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-2 text-white leading-tight">Welcome, <span className="text-brand">{profile.name}</span></h1>
          <p className="text-slate-400 text-[10px] sm:text-base font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand" /> 
            Focus: <span className="text-brand-light font-bold">{profile.exam}</span> 
            {profile.customExamDetails && <span className="text-[10px] opacity-60 ml-2 italic">({profile.customExamDetails})</span>}
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0"
        >
          <button 
            onClick={onStartTest}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-brand text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-brand/30 hover:bg-brand-light transition-all active:scale-95 uppercase tracking-widest text-[10px] sm:text-sm"
          >
            Start Practice Session <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </motion.div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 auto-rows-min">
        
        {/* Section: Main Performance */}
        <div className="md:col-span-12 lg:col-span-8 bento-card relative overflow-hidden flex flex-col justify-between min-h-[250px] sm:min-h-[300px] border-brand/20 p-5 sm:p-8">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-brand/10 blur-[80px] sm:blur-[100px] rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32"></div>
          <div className="relative z-10">
            <span className="inline-block px-2 sm:px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-8">Average Mastery Level</span>
            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-4 sm:mb-6 leading-none tracking-tighter">
              {lastScore}<span className="text-brand text-xl sm:text-4xl ml-1 sm:ml-2">%</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-lg max-w-lg leading-relaxed">
              {history.length > 0 
                ? `You have covered ${trackedTopics.length} out of ${combinedTopics.length} topics. Keep going!`
                : "Your knowledge base is empty. Complete your first test to initialize your topic performance tracking."}
            </p>
          </div>
          <div className="flex items-center gap-6 sm:gap-12 mt-6 sm:mt-10 border-t border-white/5 pt-6 sm:pt-8">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-tighter opacity-70 mb-1">Success Prob.</span>
              <span className="text-white font-black text-lg sm:text-xl lg:text-2xl tracking-tight">
                {history.length > 0 ? `${estimatedPercentile}%` : 'N/A'}
              </span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-slate-800/50"></div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-tighter opacity-70 mb-1">Knowledge Coverage</span>
              <span className="text-white font-black text-lg sm:text-xl lg:text-2xl tracking-tight">
                {Math.round((trackedTopics.length / Math.max(1, combinedTopics.length)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Section: Topic Status */}
        <div className="md:col-span-6 lg:col-span-4 bento-card flex flex-col justify-between border-slate-700/50 p-5 sm:p-6 overflow-hidden">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-success/10">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
            <div className="text-right">
              <span className="block text-[8px] sm:text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Adaptive Stats</span>
              <div className="flex items-center justify-end gap-2 text-warning">
                <Sparkles className="w-3 h-3 fill-current" />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-tighter uppercase">Analyzing</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 sticky top-0 bg-[#0F1117]/80 backdrop-blur pb-2">
              Topic Analysis
            </h3>
            <div className="space-y-4">
              {topicAnalysis.length > 0 ? (
                topicAnalysis.map((topic, i) => (
                  <div key={i} className="space-y-1.5 group">
                    <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      <span className="truncate pr-2 group-hover:text-white transition-colors">{topic.name}</span>
                      <span className={`font-mono shrink-0 ${topic.hasData ? 'text-white' : 'text-slate-600'}`}>
                        {topic.hasData ? `${topic.score}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.score}%` }}
                        transition={{ delay: i * 0.05, duration: 1 }}
                        className={`h-full rounded-full ${topic.score >= 80 ? 'bg-success' : topic.score >= 50 ? 'bg-brand' : 'bg-slate-700'}`} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-20 text-[9px] uppercase tracking-widest">No Topics Found</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Expert Insight Card */}
        {profile.performance.lastAiAnalysis && (
          <div className="md:col-span-12 bento-card border-brand/30 bg-[#12151C] relative">
            <Zap className="absolute top-6 right-6 w-5 h-5 text-brand animate-pulse" />
            <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Sparkles className="w-4 h-4 text-brand" /> Smart Mentor Advice • Preparation Strategy
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Overall Performance Analysis</h4>
                  <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-brand/50 pl-4 font-medium">
                    "{profile.performance.lastAiAnalysis.summary}"
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recommended Milestones</h4>
                  <div className="space-y-2.5">
                    {profile.performance.lastAiAnalysis.suggestions?.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 bg-white/5 rounded-xl text-xs font-semibold text-slate-300 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personalized AI Learning Desk */}
        <div className="md:col-span-12">
          <AILearningDesk 
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onStartCustomDrill={onStartCustomDrill}
          />
        </div>

        {/* Section: Priority Matrix */}
        <div className="md:col-span-6 lg:col-span-4 lg:row-span-2 bento-card border-warning/10 p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="text-warning w-4 h-4 sm:w-5 sm:h-5" /> Gap Analysis
            </h3>
            <div className="text-[8px] font-black py-1 px-2 bg-warning/10 text-warning rounded-md border border-warning/20 uppercase tracking-widest">Focus Areas</div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            <div className="space-y-2 sm:space-y-3">
              {gaps.length > 0 ? (
                gaps.map((gap, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    onClick={() => onStartTopicTest(gap.name)}
                    className="group p-3 sm:p-4 bg-white/[0.03] rounded-xl sm:rounded-2xl border border-white/5 hover:border-warning/30 hover:bg-warning/[0.03] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{gap.name}</span>
                      <span className={`text-[8px] font-black tracking-widest mt-1 ${gap.status === 'Critical Gap' ? 'text-warning' : 'text-slate-500'} uppercase`}>
                        {gap.status}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-warning group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 opacity-30 text-[10px] font-bold uppercase tracking-[0.2em] leading-loose">
                  <span className="text-success text-2xl mb-2 block">✓</span>
                  No Major Gaps Found
                  <p className="text-[8px] lowercase font-normal">All topics are above threshold</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Log History */}
        <div className="md:col-span-12 lg:col-span-8 bento-card border-white/5 relative overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand" /> Practice History
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Timeline of saved mock sessions</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-white/5">Auto-Saved</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(-4).reverse().map((test, i) => (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                key={`${test.date}-${i}`} 
                onClick={() => onViewResult(test)}
                className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] hover:border-brand/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-black text-sm border border-white/5 group-hover:border-brand/20 transition-colors">
                    {new Date(test.date).getDate()}
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-brand transition-colors truncate max-w-[120px]">{test.subject}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{new Date(test.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-brand tracking-tighter">{test.score}<span className="text-slate-600 text-sm ml-1">/{test.total}</span></div>
                  <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none mt-1">Efficiency</div>
                </div>
              </motion.div>
            ))}
            {history.length === 0 && <div className="col-span-2 text-center py-12 text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] opacity-40">No records found • System idle</div>}
          </div>
        </div>

      </div>

    </div>
  );
}
