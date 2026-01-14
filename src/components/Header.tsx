
import React from 'react';

interface HeaderProps {
  onToggleHistory?: () => void;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  user?: { name: string; role: string; company: string } | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleHistory, language, setLanguage, user, onLogout }) => {
  return (
    <header className="bg-cyber-black/90 backdrop-blur-md border-b border-cyber-blue/20 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* LEFT: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-industry text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white leading-none">
                MANUFACTURA <span className="text-cyber-blue">IA PRO</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyber-text/50 tracking-[0.2em] uppercase">Industrial Hub</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
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
                <div className="w-10 h-10 rounded-full bg-cyber-blue/20 border border-cyber-blue flex items-center justify-center">
                  <i className="fas fa-user text-cyber-blue text-sm"></i>
                </div>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex bg-cyber-dark p-1 rounded-lg gap-1 border border-cyber-blue/20">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-[10px] font-black rounded transition-all ${language === 'en' ? 'bg-cyber-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-cyber-text/50 hover:text-cyber-blue'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 text-[10px] font-black rounded transition-all ${language === 'es' ? 'bg-cyber-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-cyber-text/50 hover:text-cyber-blue'}`}
              >
                ES
              </button>
            </div>

            <button
              onClick={onToggleHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-dark hover:bg-cyber-blue/10 border border-cyber-blue/20 hover:border-cyber-blue hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all group"
            >
              <i className="fas fa-history text-cyber-text group-hover:text-cyber-blue transition-colors"></i>
              <span className="text-xs font-bold text-cyber-text group-hover:text-white uppercase tracking-wider transition-colors">{language === 'es' ? 'Historial' : 'History'}</span>
            </button>

            {/* Logout Button */}
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
      </div>
    </header>
  );
};

export default Header;
