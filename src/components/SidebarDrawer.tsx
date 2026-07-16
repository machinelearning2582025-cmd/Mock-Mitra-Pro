import { motion } from 'motion/react';
import { Home, LayoutGrid, Settings, Download, LogOut, X } from 'lucide-react';
import Logo from './Logo';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onNavigate: (state: 'landing' | 'dashboard') => void;
  onOpenSettings: () => void;
  onInstallApp: () => void;
  onLogout: () => void;
  showInstallButton?: boolean;
}

export default function SidebarDrawer({
  isOpen,
  onClose,
  userName,
  onNavigate,
  onOpenSettings,
  onInstallApp,
  onLogout,
  showInstallButton = true
}: SidebarDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-screen max-w-sm bg-[#0F1117] border-l border-white/5 p-6 flex flex-col justify-between shadow-2xl relative"
        >
          {/* Upper content */}
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <span className="text-lg font-black font-display tracking-wider text-white uppercase">
                  Mock<span className="text-brand">Mitra</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="space-y-3">
              {/* Home / Landing */}
              <button
                onClick={() => {
                  onNavigate('landing');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-brand" />
                <span>Home / Landing</span>
              </button>

              {/* Practice Dashboard */}
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                <span>Practice Dashboard</span>
              </button>

              {/* Exam Settings */}
              <button
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Exam Settings</span>
              </button>

              {/* Install App */}
              {showInstallButton && (
                <button
                  onClick={() => {
                    onInstallApp();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Install App</span>
                </button>
              )}
            </nav>
          </div>

          {/* Bottom section (User card and Logout) */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-indigo-600 border border-white/20 flex items-center justify-center font-black text-white text-sm uppercase">
                {userName[0]}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Logged In As
                </span>
                <span className="text-sm font-black text-white uppercase tracking-wider leading-tight">
                  {userName}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-950/20 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/15 hover:border-rose-500/30 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
