import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, Calendar, ArrowRight, Play, Sparkles, BookOpen, Menu, Trash2 } from 'lucide-react';
import { UserProfile, Topic } from '../types';
import { getExamConfig } from '../data/examsConfig';
import AILearningDesk from './AILearningDesk';

interface DashboardProps {
  profile: UserProfile;
  onStartTest: () => void;
  onStartTopicTest: (topic: Topic | Topic[]) => void;
  onViewResult: (result: any) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onStartCustomDrill: (prompt: string) => void;
  onClearTestHistory?: () => void;
  onClearChatHistory?: () => void;
  onInstallClick?: () => void;
  showInstallButton?: boolean;
  onMenuClick: () => void;
}

export default function Dashboard({ 
  profile, 
  onStartTest, 
  onStartTopicTest, 
  onViewResult, 
  onUpdateProfile,
  onStartCustomDrill,
  onClearTestHistory,
  onClearChatHistory,
  onMenuClick
}: DashboardProps) {
  const history = profile.performance.testHistory;
  const examConfig = getExamConfig(profile.exam);
  
  const lastScore = history.length > 0 
    ? Math.round(history.reduce((acc, h) => acc + (h.score / h.total * 100), 0) / history.length)
    : 0;

  const allDefaultTopics = examConfig?.defaultTopics || [];
  const trackedTopics = Object.keys(profile.performance.knowledgeProfile);
  const combinedTopics = Array.from(new Set([...allDefaultTopics, ...trackedTopics]));

  const topicAnalysis = combinedTopics.map(topic => ({
    name: topic,
    score: profile.performance.knowledgeProfile[topic as Topic] || 0,
    hasData: trackedTopics.includes(topic)
  })).sort((a, b) => b.score - a.score);

  const gaps = combinedTopics
    .map(topic => {
      const score = profile.performance.knowledgeProfile[topic as Topic] || 0;
      const status = !trackedTopics.includes(topic) ? 'Unexplored' : score < 60 ? 'Needs Practice' : null;
      return { name: topic, score, status };
    })
    .filter(g => g.status !== null)
    .sort((a, b) => (a.status === 'Needs Practice' ? -1 : 1));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Clean Minimal Header */}
      <header className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {profile.name}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            <BookOpen className="w-3.5 h-3.5 text-brand" />
            <span>{profile.exam}</span>
            {profile.customExamDetails && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">({profile.customExamDetails})</span>
            )}
          </div>
        </div>

        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm dark:shadow-none"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Primary Action Button */}
      <div className="mb-5">
        <button
          id="start-practice-btn"
          onClick={onStartTest}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 bg-brand hover:bg-brand-light text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-brand/20 transition-all active:scale-[0.99] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Practice Test</span>
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        
        {/* Performance Overview */}
        <div className="md:col-span-12 lg:col-span-7 bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Score</span>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mt-1 mb-2">
              {lastScore}<span className="text-brand text-2xl ml-1">%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {history.length > 0 
                ? `${history.length} test${history.length > 1 ? 's' : ''} completed`
                : 'Take your first test to track performance'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Coverage</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {Math.round((trackedTopics.length / Math.max(1, combinedTopics.length)) * 100)}%
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Topics Tracked</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {trackedTopics.length} / {combinedTopics.length}
              </div>
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        <div className="md:col-span-12 lg:col-span-5 bento-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Topics
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{topicAnalysis.length} Total</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1 custom-scrollbar">
            {topicAnalysis.length > 0 ? (
              topicAnalysis.map((topic, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span className="truncate pr-2">{topic.name}</span>
                    <span className={`font-mono text-[11px] ${topic.hasData ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
                      {topic.hasData ? `${topic.score}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${topic.score >= 75 ? 'bg-emerald-500' : topic.score >= 50 ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700'}`}
                      style={{ width: `${topic.score}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-600">No topics available</div>
            )}
          </div>
        </div>

        {/* AI Learning Desk Component */}
        <div className="md:col-span-12">
          <AILearningDesk 
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onStartCustomDrill={onStartCustomDrill}
            onClearChatHistory={onClearChatHistory}
          />
        </div>

        {/* Gap Analysis */}
        {gaps.length > 0 && (
          <div className="md:col-span-12 lg:col-span-5 bento-card p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="text-amber-500 dark:text-amber-400 w-4 h-4" /> Focus Areas
              </span>
              <button
                onClick={() => onStartTopicTest(gaps.map(g => g.name))}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-bold cursor-pointer"
              >
                Test All ({gaps.length})
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
              {gaps.map((gap, i) => (
                <div 
                  key={i} 
                  onClick={() => onStartTopicTest(gap.name)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-500/40 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{gap.name}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400/90 font-semibold">{gap.status}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test History */}
        <div className={`md:col-span-12 ${gaps.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} bento-card p-5 sm:p-6 flex flex-col`}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand" /> History
            </span>

            {history.length > 0 && onClearTestHistory && (
              <button
                onClick={() => {
                  if (window.confirm("Clear all practice test history?")) {
                    onClearTestHistory();
                  }
                }}
                className="text-[11px] text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
            {history.length > 0 ? (
              history.slice().reverse().map((test, i) => (
                <div 
                  key={`${test.date}-${i}`} 
                  onClick={() => onViewResult(test)}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5 hover:border-brand/40 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{test.subject}</div>
                    <div className="text-[10px] text-slate-500">{new Date(test.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-brand">{test.score}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-600">/{test.total}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No test history yet</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
