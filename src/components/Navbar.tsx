import { motion } from 'motion/react';
import { Target, User, LogOut, Download } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onProfileClick?: () => void;
  onAccountClick?: () => void;
  userName?: string;
  onLogout?: () => void;
  firebaseUser?: any;
  onLoginWithGoogle?: () => Promise<any>;
  onInstallClick?: () => void;
  showInstallButton?: boolean;
}

export default function Navbar({ 
  onProfileClick, 
  onAccountClick, 
  userName, 
  onLogout, 
  firebaseUser,
  onLoginWithGoogle,
  onInstallClick,
  showInstallButton
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5 px-4 sm:px-6 py-4">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer" 
            onClick={() => onProfileClick?.()}
          >
            <Logo className="w-8 h-8 sm:w-10 sm:h-10 hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black font-display tracking-tight text-white uppercase leading-none">
                Mock-<span className="text-brand">Mitra</span>
              </span>
            </div>
          </div>

          {showInstallButton && onInstallClick && (
            <motion.button
              id="navbar-install-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: [1, 1.04, 1]
              }}
              transition={{
                scale: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }
              }}
              whileHover={{ scale: 1.1, translateY: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInstallClick}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-400 via-brand to-indigo-600 hover:from-amber-300 hover:to-indigo-500 text-white font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-brand/40 hover:shadow-brand/60 border-2 border-white/20 hover:border-white/40 shrink-0 ml-2 sm:ml-4 relative group"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-bounce group-hover:scale-110 transition-transform" />
              <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Install App ✨</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-6">

          {userName && (
            <div className="hidden lg:flex items-center space-x-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <button 
                onClick={onProfileClick}
                className="hover:text-white transition-colors relative group"
              >
                Dashboard
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-brand transition-all group-hover:w-full" />
              </button>
              <button 
                onClick={onAccountClick}
                className="hover:text-white transition-colors relative group"
              >
                Settings
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-brand transition-all group-hover:w-full" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3 sm:gap-4">
            {userName && (
              <>
                {!firebaseUser && onLoginWithGoogle && (
                  <button
                    onClick={onAccountClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/30 text-white font-black rounded-xl text-[9px] sm:text-[10px] uppercase tracking-wider transition-all scale-95 hover:scale-100 cursor-pointer animate-pulse shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
                    </svg>
                    <span>Link Google</span>
                  </button>
                )}

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                    {userName}
                  </span>
                  {!firebaseUser && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-1">
                      Guest Mode
                    </span>
                  )}
                </div>
                <div 
                  onClick={onAccountClick}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand to-indigo-600 border border-white/20 cursor-pointer flex items-center justify-center text-xs font-black text-white uppercase shadow-lg shadow-brand/20 active:scale-90 transition-all overflow-hidden"
                >
                  {userName[0]}
                </div>
                <button 
                  onClick={onLogout} 
                  className="p-2 sm:px-3 sm:py-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
