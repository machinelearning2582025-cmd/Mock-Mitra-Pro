import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import Logo from './Logo';

interface ExamSelectorProps {
  onComplete: (name: string, exam: string, language: string, customDetails?: string) => void;
  initialName?: string;
}

export default function ExamSelector({ onComplete, initialName = '' }: ExamSelectorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish');
  const [customDetails, setCustomDetails] = useState('');

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2 && selectedExam.trim()) {
      onComplete(name.trim(), selectedExam.trim(), selectedLanguage, customDetails.trim());
    }
  };

  const languages = ['English', 'Hindi', 'Hinglish'];

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bento-card shadow-2xl shadow-brand/5 border border-slate-800 p-6 sm:p-8"
      >
        <div className="flex justify-center mb-8">
          <Logo className="w-24 h-24 sm:w-28 sm:h-28 hover:scale-105 transition-transform" />
        </div>

        {step === 1 ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight uppercase tracking-tight">Enter Your Name</h2>
              <p className="text-slate-500 font-medium text-sm">Let's set up your profile.</p>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block pl-1">Your Name</label>
              <input 
                id="user-name-input"
                autoFocus
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alan Turing"
                className="w-full px-6 py-4 sm:py-5 bg-slate-900 border-2 border-slate-800 rounded-2xl focus:border-brand focus:bg-slate-800 shadow-[0_0_20px_rgba(37,99,235,0.05)] outline-none transition-all text-lg font-bold text-white placeholder:text-slate-700"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight uppercase tracking-tight">Setup Learning Map</h2>
              <p className="text-slate-500 font-medium text-sm">Tell us what you are preparing or learning.</p>
            </div>

            <div className="space-y-5">
              {/* Section 1: Target Exam Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block pl-1">
                  What exam / subject are you learning? (Required)
                </label>
                <input 
                  type="text" 
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  placeholder="Ex: JEE Advanced, Class 12, Python..."
                  className="w-full px-5 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl focus:border-brand outline-none transition-all text-sm font-bold text-white placeholder:text-slate-600 shadow-[0_0_15px_rgba(37,99,235,0.02)]"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
              </div>

              {/* Section 2: Instructions (Optional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block pl-1">
                  AI Instructions / Details (Optional)
                </label>
                <textarea 
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="Ex: Focus on organic chemistry, include practical questions or conceptual facts."
                  className="w-full px-5 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl focus:border-brand outline-none transition-all text-xs font-bold text-white placeholder:text-slate-600 h-24 resize-none shadow-[0_0_15px_rgba(37,99,235,0.02)]"
                />
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block pl-1">Preferred Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        selectedLanguage === lang
                          ? 'border-brand bg-brand text-white'
                          : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          id="onboarding-next"
          disabled={(step === 1 && !name.trim()) || (step === 2 && !selectedExam.trim())}
          className="w-full mt-6 py-5 bg-brand text-white font-bold rounded-2xl shadow-xl shadow-brand/20 hover:bg-brand-light transform transition-all active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2 group uppercase tracking-widest text-sm"
        >
          {step === 1 ? 'Next' : 'Start Preparation'} 
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
}
