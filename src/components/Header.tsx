
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
          <div className="flex items-center gap-4">
            <div className="bg-cyber-dark p-2.5 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-cyber-blue/30 relative group overflow-hidden">
              <div className="absolute inset-0 bg-cyber-blue/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <i className="fas fa-microchip text-cyber-blue text-2xl relative z-10 group-hover:scale-110 transition-transform"></i>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-black text-white tracking-tighter drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">IA.AGUS</h1>
              </div>
              <div className="flex flex-col">
                <a
                  href="https://www.ia-agus.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-cyber-blue/80 hover:text-white hover:shadow-neon-blue transition-all flex items-center gap-1 group"
                >
                  <span className="group-hover:tracking-widest transition-all">www.ia-agus.com</span>
                  <i className="fas fa-external-link-alt text-[8px] group-hover:rotate-45 transition-transform"></i>
                </a>
                <span className="text-[10px] text-cyber-text/50 font-medium italic">Agustín Prieto. Engineering Dept.</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
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

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-cyber-text/40 uppercase tracking-widest leading-none mb-1">Especialidad</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <i className="fas fa-check-circle text-cyber-green text-xs shadow-[0_0_10px_rgba(0,255,100,0.5)]"></i>
                <span className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Estándar MTM / GSD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
