
import React from 'react';
import { Shield } from 'lucide-react';

interface HeaderProps {
  onToggleHistory?: () => void;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  user?: { name: string; role: string; company: string; email?: string } | null;
  onLogout?: () => void;
  isListening?: boolean;
  lastCommand?: string;
  onToggleSidebar?: () => void;
  onGoToAdmin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleHistory, language, setLanguage, user, onLogout, isListening, lastCommand, onToggleSidebar, onGoToAdmin }) => {
  return (
    <header className="bg-industrial-bg/90 backdrop-blur-md border-b border-industrial-accent/20 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* LEFT: Branding */}
          <div className="flex items-center gap-3 pl-0 md:pl-0">
            {/* Mobile Sidebar Toggle - Visible only on mobile */}
            <button
              onClick={onToggleSidebar}
              className="mr-2 p-2 rounded-lg bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/30 md:hidden hover:bg-industrial-accent hover:text-white transition-all"
            >
              <i className="fas fa-bars"></i>
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-industrial-accent to-amber-700 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-boxes text-white text-lg"></i>
            </div>
            <div className="text-white font-black tracking-widest uppercase">
              FABRICA IA <span className="text-industrial-accent drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">PRO</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-industrial-text/50 tracking-[0.2em] uppercase">Furniture Cloud</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
              {/* Voice Indicator Removed per User Request */}
              {/* 
                {isListening && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyber-blue/10 border border-cyber-blue/30 rounded-full animate-in fade-in slide-in-from-left-2">
                    <div className="flex gap-0.5 items-center h-3">
                      <span className="w-0.5 h-full bg-cyber-blue animate-[bounce_1s_infinite]"></span>
                      <span className="w-0.5 h-full bg-cyber-blue animate-[bounce_1.2s_infinite]"></span>
                      <span className="w-0.5 h-full bg-cyber-blue animate-[bounce_0.8s_infinite]"></span>
                    </div>
                    <span className="text-[9px] font-bold text-cyber-blue uppercase tracking-wider whitespace-nowrap">
                      {language === 'es' ? 'Escuchando...' : 'Listening...'}
                    </span>
                    {lastCommand && <span className="text-[9px] text-zinc-400 font-mono hidden xl:block">"{lastCommand}"</span>}
                  </div>
                )} 
                */}
            </div>
          </div>
        </div>

        {/* RIGHT: User Controls */}
        <div className="hidden md:flex items-center gap-6">
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-zinc-500">{user.company}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-industrial-accent/20 border border-industrial-accent flex items-center justify-center">
                <i className="fas fa-user text-industrial-accent text-sm"></i>
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="flex bg-industrial-dark p-1 rounded-lg gap-1 border border-industrial-accent/20">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-[10px] font-black rounded transition-all ${language === 'en' ? 'bg-industrial-accent text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-industrial-text/50 hover:text-industrial-accent'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`px-3 py-1 text-[10px] font-black rounded transition-all ${language === 'es' ? 'bg-industrial-accent text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-industrial-text/50 hover:text-industrial-accent'}`}
            >
              ES
            </button>
          </div>

          <button
            onClick={onToggleHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-industrial-dark hover:bg-industrial-accent/10 border border-industrial-accent/20 hover:border-industrial-accent hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all group"
          >
            <i className="fas fa-history text-industrial-text group-hover:text-industrial-accent transition-colors"></i>
            <span className="text-xs font-bold text-industrial-text group-hover:text-white uppercase tracking-wider transition-colors">{language === 'es' ? 'Historial' : 'History'}</span>
          </button>
          {/* GOD MODE LINK - Only visible for agus@ia-agus.com */}
          {user?.email === 'agus@ia-agus.com' && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all group"
              title="Panel GOD MODE"
            >
              <Shield className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
              <span className="text-xs font-black text-indigo-400 group-hover:text-indigo-300 uppercase tracking-wider">Admin</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 transition-all group"
            >
              <i className="fas fa-sign-out-alt text-red-500 group-hover:text-red-400"></i>
              <span className="text-xs font-bold text-red-500 group-hover:text-red-400 uppercase tracking-wider">{language === 'es' ? 'Salir' : 'Logout'}</span>
            </button>
          )}
        </div>
      </div>
    </header >
  );
};

export default Header;
