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
                The 20-Minute Study Revolution ⚡
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight text-pretty">
                Your Exam. <br/>Our Strategy. <br/>Only 20 Mins.
              </h1>
              <p className="text-slate-400 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
                Crack any exam with Mock-Mitra-Pro's daily high-yield active recall simulator. No tech-larping, pure focus. Optimized for Indian competitive exams (SSC, Banking, Railways) and custom topics.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {onStartGoogle && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full sm:w-auto shrink-0 relative group"
                  >
                    {/* Glowing highlight pulsing in the background */}
                    <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand via-[#3B82F6] to-indigo-600 opacity-75 blur-md animate-pulse group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></span>

                    <motion.button
                      id="hero-google-btn"
                      onClick={onStartGoogle}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-full sm:w-auto px-8 py-5 bg-gradient-to-r from-[#2563EB] to-indigo-600 hover:from-brand-light hover:to-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-brand/50 hover:shadow-brand/80 transition-all cursor-pointer text-xs flex items-center justify-center gap-3.5 uppercase tracking-[0.12em] shrink-0 border border-white/20 hover:border-white/40"
                    >
                      {/* Active pulsing notification dot to pull focus */}
                      <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                      </span>
                      <svg className="w-4.5 h-4.5 mr-0.5 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
                      </svg>
                      <span>Continue with Google</span>
                    </motion.button>
                  </motion.div>
                )}
                
                <button
                  onClick={onStart}
                  className="w-full sm:w-auto px-8 py-5 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/5 font-black rounded-2xl transform transition-all active:scale-95 text-xs flex items-center justify-center gap-3 uppercase tracking-[0.12em] cursor-pointer"
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

          {/* Bottom PWA Install Banner */}
          {onInstallClick && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="md:col-span-12 mt-4 p-5 sm:p-6 bento-card bg-gradient-to-r from-[#11131c] via-[#0D1017] to-brand/5 border-brand/20 flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_4px_30px_rgba(37,99,235,0.08)]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 shadow-inner">
                  <Smartphone className="w-6 h-6 flex animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black text-white uppercase tracking-wider">Install Mock-Mitra-Pro App ⚡</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Apne smartphone ki home-screen se direct quick login, dynamic mock tests aur smart AI updates access karein. Low storage use!</p>
                </div>
              </div>
              <button
                onClick={onInstallClick}
                className="w-full md:w-auto px-6 py-3 bg-brand hover:bg-brand-light text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center whitespace-nowrap"
              >
                Install App 📱
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
