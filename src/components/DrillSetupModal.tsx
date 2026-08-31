import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Upload, FileText, Image as ImageIcon, Send, Sparkles } from 'lucide-react';
import { DrillFile, DrillSetup } from '../types';
import { triggerHaptic } from '../services/nativeService';

interface DrillSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (setup: DrillSetup) => void;
  exam?: string;
  initialTopic?: string;
}

export default function DrillSetupModal({ 
  isOpen, 
  onClose, 
  onStart, 
  initialTopic 
}: DrillSetupModalProps) {
  const [customTopic, setCustomTopic] = useState(initialTopic || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<3 | 5 | 8 | 10>(5);
  const [studyScheme, setStudyScheme] = useState<'PYQ & Important based' | 'Study based Imp' | 'Pure System'>('Pure System');
  const [files, setFiles] = useState<DrillFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTopic) {
      setCustomTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const base64Data = (uploadEvent.target?.result as string) || '';
          setFiles(prev => [...prev, {
            name: file.name,
            type: file.type,
            base64: base64Data
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    triggerHaptic('light');
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    triggerHaptic('medium');
    onStart({ 
      customTopic, 
      customPrompt, 
      files, 
      difficulty,
      questionCount,
      studyScheme
    });
    setCustomTopic('');
    setCustomPrompt('');
    setDifficulty('Medium');
    setQuestionCount(5);
    setStudyScheme('Pure System');
    setFiles([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-white dark:bg-[#0c0f18] border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-brand tracking-widest block">Practice Settings</span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Daily Practice Setup</h2>
              </div>
              <button 
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="space-y-4 py-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
              
              {/* Topic Input */}
              <div className="space-y-1.5 p-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl">
                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-brand" /> Topic / Chapter / Concept
                </label>
                <input 
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="E.g., Trigonometry, Biology Plant Cell, History..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-white/10 rounded-lg focus:border-brand outline-none transition-all text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Number of Questions (3, 5, 8, 10) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-brand" /> Number of Questions
                  </label>
                  <span className="text-[10px] font-bold text-brand">{questionCount} Questions ({questionCount} min)</span>
                </div>
                
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-white/5">
                  {([
                    { count: 3, label: '3 Qs', desc: '3 min' },
                    { count: 5, label: '5 Qs', desc: '5 min' },
                    { count: 8, label: '8 Qs', desc: '8 min' },
                    { count: 10, label: '10 Qs', desc: '10 min' }
                  ] as const).map((item) => {
                    const isSelected = questionCount === item.count;
                    return (
                      <button
                        key={item.count}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setQuestionCount(item.count);
                        }}
                        className={`py-2 px-1 rounded-lg font-black text-xs transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          isSelected 
                            ? 'bg-brand text-white shadow-md shadow-brand/20 scale-[1.02]' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`text-[9px] font-normal ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider px-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand" /> Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-white/5">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => {
                    const isSelected = difficulty === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setDifficulty(level);
                        }}
                        className={`py-2 px-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-brand text-white shadow-md shadow-brand/20' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Study Pattern */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider px-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand" /> Study Scheme & Pattern
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'PYQ & Important based', label: 'PYQ & High-Yield' },
                    { id: 'Study based Imp', label: 'Study & Notes' },
                    { id: 'Pure System', label: 'Standard Mock' }
                  ] as const).map((item) => {
                    const isSelected = studyScheme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setStudyScheme(item.id);
                        }}
                        className={`p-2 rounded-xl font-bold transition-all border text-center cursor-pointer ${
                          isSelected 
                            ? 'bg-brand/10 border-brand text-brand dark:text-white shadow-xs' 
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider px-0.5">
                  Custom Instructions (Optional)
                </label>
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., focus more on numerical formulas, or add tricky questions..."
                  className="w-full h-14 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl focus:border-brand outline-none transition-all text-xs text-slate-800 dark:text-slate-300 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider px-0.5">
                  Attach Notes / Photos (Optional)
                </label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer p-3 border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] hover:border-brand rounded-xl transition-all flex items-center justify-center gap-2.5"
                >
                  <Upload className="w-4 h-4 text-slate-500 group-hover:text-brand transition-colors" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                    Upload image or PDF
                  </span>
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*,application/pdf,text/plain"
                  />
                </div>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-brand/5 border border-brand/20 rounded-lg">
                        {file.type.startsWith('image') ? <ImageIcon className="w-3 h-3 text-brand" /> : <FileText className="w-3 h-3 text-brand" />}
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 max-w-[90px] truncate">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onStart({});
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Direct Start
              </button>

              <button 
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2.5 px-4 bg-brand hover:bg-brand-light text-white font-bold rounded-xl shadow-md shadow-brand/25 transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span>Start Practice</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
