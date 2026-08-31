import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, Upload, ImageIcon, FileText, Target } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { DrillSetup, DrillFile } from '../types';

interface DrillSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (setup: DrillSetup) => void;
  exam: string;
  initialTopic?: string;
}

export default function DrillSetupModal({ isOpen, onClose, onStart, exam, initialTopic = '' }: DrillSetupModalProps) {
  const [customTopic, setCustomTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [studyScheme, setStudyScheme] = useState<'PYQ & Important based' | 'Study based Imp' | 'Pure System'>('Pure System');
  const [files, setFiles] = useState<DrillFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setCustomTopic(initialTopic);
    }
  }, [isOpen, initialTopic]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          base64: base64String
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onStart({ 
      customTopic,
      customPrompt, 
      files, 
      difficulty,
      studyScheme
    });
    setCustomTopic('');
    setCustomPrompt('');
    setDifficulty('Medium');
    setStudyScheme('Pure System');
    setFiles([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bento-card bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-brand/20 p-6 sm:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            
            <header className="flex justify-between items-center mb-8 relative z-10 shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-brand tracking-[0.2em] mb-1 block">Practice Settings</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Daily Practice Setup</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-6 relative z-10 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {/* Specific Chapter / Topic Target Input */}
              <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-brand/30 hover:border-brand/50 rounded-2xl transition-all shadow-sm dark:shadow-inner relative">
                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest pl-1 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-brand" strokeWidth={3} /> Topic / Chapter / Concept
                </label>
                <input 
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="E.g., Trigonometry, Biology Plant Cell, ancient history, etc."
                  className="w-full px-4 py-3 bg-white dark:bg-[#0a0d14] border border-slate-300 dark:border-white/10 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700"
                />
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1 flex items-center gap-2">
                  <Target className="w-3 h-3 text-brand" /> Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-2 cursor-pointer ${
                        difficulty === level 
                          ? 'bg-brand/20 border-brand text-brand shadow-lg shadow-brand/10' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Scheme / Practice Pattern Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-brand" /> Study Scheme & Pattern
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: 'PYQ & Important based', label: 'PQY & Important Based', desc: 'Previous Papers & High-Yield' },
                    { id: 'Study based Imp', label: 'Study Based Imp', desc: 'Core academic notes & facts' },
                    { id: 'Pure System', label: 'Pure System', desc: 'Mock blueprint with strict system' }
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStudyScheme(item.id)}
                      className={`p-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center justify-center text-center gap-1 cursor-pointer ${
                        studyScheme === item.id 
                          ? 'bg-brand/20 border-brand text-brand shadow-lg shadow-brand/10' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                      <span className="text-[8px] font-medium opacity-60 leading-tight block">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Prompt Area */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-brand" /> Practice Instructions
                </label>
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Example: focus more on geometry, or add questions about Indian festivals..."
                  className="w-full h-18 sm:h-24 px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-brand/50 outline-none transition-all text-sm text-slate-800 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-700 resize-none"
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">
                  Add Study Material (PDF, Image)
                </label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer p-6 border-2 border-dashed border-slate-300 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.03] hover:border-brand/30 rounded-2xl transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-10 h-10 bg-slate-200/60 dark:bg-white/5 rounded-xl flex items-center justify-center border border-slate-300 dark:border-white/10 group-hover:border-brand/30 transition-all">
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-brand transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Select or drop photos/PDFs</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase mt-1">Files (Max 5)</p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*,application/pdf,text/plain"
                  />
                </div>

                {/* Selected Files List */}
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-xl">
                        {file.type.startsWith('image') ? <ImageIcon className="w-3 h-3 text-brand" /> : <FileText className="w-3 h-3 text-brand" />}
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row gap-4 relative z-10 shrink-0">
              <button 
                onClick={handleSubmit}
                className="flex-grow py-4 bg-gradient-to-r from-brand to-brand-light hover:brightness-110 text-white font-black rounded-2xl shadow-xl shadow-brand/30 hover:shadow-brand/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs border border-white/5 cursor-pointer"
              >
                Start Practice <Send className="w-4 h-4 animate-bounce" />
              </button>
              <button 
                onClick={() => onStart({})}
                className="py-4 px-8 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:border-white/5 dark:text-slate-400 dark:hover:text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Direct Start
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
