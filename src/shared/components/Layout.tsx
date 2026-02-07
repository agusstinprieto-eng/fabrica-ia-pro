
import React from 'react';
import {
    LayoutDashboard,
    Microscope,
    Share2,
    Coins,
    Globe2,
    Globe,
    BookOpen,
    Image as ImageIcon,
    Calculator,
    Headset,
    Settings,
    Bell,
    User,
    LogOut
} from 'lucide-react';

type ViewType = 'dashboard' | 'analysis' | 'balancing' | 'costing' | 'regional' | 'global-intelligence' | 'library' | 'gallery' | 'quoter' | 'support' | 'settings';

interface LayoutProps {
    children: React.ReactNode;
    currentView: ViewType;
    onNavigate: (view: ViewType) => void;
    user?: { name: string; role: string; company: string } | null;
    onLogout?: () => void;
    language: 'es' | 'en';
    setLanguage: (lang: 'es' | 'en') => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    currentView,
    onNavigate,
    user,
    onLogout,
    language,
    setLanguage,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}) => {
    const menuItems: { id: ViewType; icon: React.ReactNode; labelEn: string; labelEs: string }[] = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, labelEn: 'Dashboard', labelEs: 'Tablero' },
        { id: 'analysis', icon: <Microscope size={20} />, labelEn: 'Video Lab', labelEs: 'Laboratorio' },
        { id: 'balancing', icon: <Share2 size={20} />, labelEn: 'Line Balance', labelEs: 'Balanceo' },
        { id: 'costing', icon: <Coins size={20} />, labelEn: 'Costing', labelEs: 'Costos' },
        { id: 'regional', icon: <Globe2 size={20} />, labelEn: 'Regional Costs', labelEs: 'Costos Regionales' },
        { id: 'global-intelligence', icon: <Globe size={20} />, labelEn: 'Global Intelligence', labelEs: 'Inteligencia Global' },
        { id: 'library', icon: <BookOpen size={20} />, labelEn: 'Knowledge Hub', labelEs: 'Biblioteca' },
        { id: 'gallery', icon: <ImageIcon size={20} />, labelEn: 'Photo Gallery', labelEs: 'Galería' },
        { id: 'quoter', icon: <Calculator size={20} />, labelEn: 'Visual Quoter', labelEs: 'Cotizador Visual' },
        { id: 'support', icon: <Headset size={20} />, labelEn: '24/7 Support', labelEs: 'Soporte 24/7' },
        { id: 'settings', icon: <Settings size={20} />, labelEn: 'Settings', labelEs: 'Configuración' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-cyber-black transition-colors duration-500 selection:bg-cyber-blue/30 selection:text-cyber-blue">
            {/* HUD Header */}
            <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-cyber-blue/20 glass-panel">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyber-blue/10 border border-cyber-blue rounded flex items-center justify-center font-bold text-cyber-blue italic glow-blue font-tech">IA</div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white shadow-neon-blue font-tech uppercase">
                            MANUFACTURA IA PRO
                        </h1>
                        <p className="text-[10px] text-cyber-blue/70 uppercase tracking-[0.3em] font-mono">Industrial Hub</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Language Selector */}
                    <div className="hidden md:flex bg-cyber-dark p-1 rounded-lg gap-1 border border-cyber-blue/20">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 text-[10px] font-black rounded transition-all ${language === 'en' ? 'bg-cyber-blue text-black shadow-neon-blue' : 'text-cyber-text/50 hover:text-cyber-blue'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage('es')}
                            className={`px-3 py-1 text-[10px] font-black rounded transition-all ${language === 'es' ? 'bg-cyber-blue text-black shadow-neon-blue' : 'text-cyber-text/50 hover:text-cyber-blue'}`}
                        >
                            ES
                        </button>
                    </div>

                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[10px] text-cyber-blue/50 uppercase font-mono">System Status</span>
                        <span className="text-cyber-blue font-mono text-xs uppercase tracking-widest glow-text-blue">Nominal // Active</span>
                    </div>

                    <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-cyber-blue transition-colors" />

                    <div className="flex items-center gap-2 bg-cyber-dark px-3 py-1.5 rounded-full border border-cyber-blue/30 hover:border-cyber-blue/50 transition-colors cursor-pointer group">
                        <div className="w-6 h-6 bg-cyber-blue rounded-full flex items-center justify-center text-[10px] text-black font-bold shadow-neon-blue">
                            {user?.name?.substring(0, 2).toUpperCase() || 'IA'}
                        </div>
                        <span className="text-xs font-medium text-cyber-blue group-hover:text-white transition-colors">
                            {user?.name || 'Operator'}
                        </span>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-cyber-blue border border-cyber-blue/30 rounded-lg"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <LayoutDashboard size={20} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Nav */}
                <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 md:relative md:w-64 border-r border-cyber-blue/30 glass-panel flex flex-col transition-all duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
                    <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 font-tech tracking-wide border ${currentView === item.id
                                    ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/30 shadow-[0_0_15px_rgba(0,251,255,0.1)]'
                                    : 'text-gray-400 hover:bg-cyber-dark/40 hover:text-cyber-blue hover:border-cyber-blue/20 border-transparent'
                                    }`}
                            >
                                <span className={currentView === item.id ? 'drop-shadow-[0_0_8px_rgba(0,251,255,0.5)]' : ''}>
                                    {item.icon}
                                </span>
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    {language === 'es' ? item.labelEs : item.labelEn}
                                </span>
                            </button>
                        ))}

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all w-full group rounded-lg border border-transparent hover:border-red-400/20 mt-2"
                        >
                            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                                {language === 'es' ? 'Cerrar Sesión' : 'Operator Exit'}
                            </span>
                        </button>
                    </nav>

                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative custom-scrollbar">
                    {children}
                </main>
            </div>

        </div>
    );
};

export default Layout;
