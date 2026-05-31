import { motion } from 'motion/react';
import { Target, Zap, Users, ArrowRight, Smartphone } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onStartGoogle?: () => void;
  onInstallClick?: () => void;
}

export default function Hero({ onStart, onStartGoogle, onInstallClick }: HeroProps) {
  return (
    <div className="relative overflow-hidden pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 bg-[#0A0C10]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
          
          {/* Main Hero Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-12 lg:col-span-8 bento-card min-h-[400px] sm:min-h-[500px] flex flex-col justify-end relative overflow-hidden bg-gradient-to-br from-[#0c0f17] to-black border-brand/10 p-6 sm:p-12"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-brand/10 blur-[100px] sm:blur-[120px] rounded-full -mr-40 -mt-40"></div>
            <div className="z-10">
              <span className="inline-block px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-[10px] font-black uppercase tracking-widest mb-6 leading-none">
                AI-Powered Adaptive Mock Tests
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight text-pretty">
                Master Any <br/> Exam Today.
              </h1>
              <p className="text-slate-400 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
                MockMitra is the ultimate practice engine for students, professionals, and lifelong learners. 
                Adaptive tests, deep analytics, and personalized feedback for any subject or certification.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {onStartGoogle && (
                  <button
                    onClick={onStartGoogle}
                    className="w-full sm:w-auto px-8 py-4.5 bg-brand text-white font-black rounded-2xl shadow-2xl shadow-brand/40 hover:bg-brand-light transform transition-all active:scale-95 text-xs flex items-center justify-center gap-3 uppercase tracking-[0.12em] cursor-pointer shrink-0"
                  >
                    <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
                    </svg>
                    Continue with Google
                  </button>
                )}
                
                <button
                  onClick={onStart}
                  className="w-full sm:w-auto px-8 py-4.5 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/5 font-black rounded-2xl transform transition-all active:scale-95 text-xs flex items-center justify-center gap-3 uppercase tracking-[0.12em] cursor-pointer"
                >
                  Practice as Guest <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Efficiency Side Card */}
          <div className="md:col-span-12 lg:col-span-4 bento-card flex flex-col justify-between bg-[#12151C] border-emerald-500/10 p-6 sm:p-8 min-h-[250px]">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter">98.2<span className="text-emerald-500 text-2xl">%</span></div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">Retention Rate</div>
              <p className="text-slate-500 text-sm mt-4 leading-relaxed max-w-xs">
                Our AI engine maximizes your memory retention with spaced iteration.
              </p>
            </div>
          </div>

          {[
            { label: 'Global Learners', value: '85K+', icon: Users, color: 'text-brand' },
            { label: 'Resource Keys', value: '4.2M', icon: Zap, color: 'text-warning' },
            { label: 'Daily Sessions', value: '12.5K', icon: Target, color: 'text-indigo-500' },
          ].map((stat, i) => (
            <div key={i} className="md:col-span-4 bento-card p-8 flex flex-col justify-center items-center text-center bg-[#12151C] border-white/5 hover:border-white/10 group transition-all">
              <stat.icon className={`w-8 h-8 ${stat.color} mb-5 group-hover:scale-110 transition-transform`} />
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">{stat.label}</div>
            </div>
          ))}

          {/* PWA App Install Banner Section */}
          <div className="md:col-span-12 mt-6 p-6 bento-card bg-gradient-to-r from-[#12151C]/80 to-brand/5 border-brand/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                <Smartphone className="w-5 h-5 flex animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Install MockMitra as App 📱</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Apne mobile par shortcut aur super-fast experience ke liye direct Add to Home Screen/Install karein!</p>
              </div>
            </div>
            <button
              onClick={onInstallClick}
              className="w-full md:w-auto px-5 py-2.5 bg-brand hover:bg-brand-light text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer text-center"
            >
              Install App ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
