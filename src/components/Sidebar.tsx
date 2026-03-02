import React from 'react';

type ViewType = 'dashboard' | 'analysis' | 'balancing' | 'costing' | 'maintenance' | 'regional' | 'global-intelligence' | 'library' | 'gallery' | 'quoter' | 'support' | 'settings' | 'digital-twin';

interface SidebarProps {
    currentView: ViewType;
    onNavigate: (view: ViewType) => void;
    language: 'es' | 'en';
    onLogout?: () => void;
    user?: { name: string; role: string; company: string } | null;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, language, onLogout, user, isOpen, onClose }) => {
    const [isFactoryMode, setIsFactoryMode] = React.useState(false);


    React.useEffect(() => {
        setIsFactoryMode(document.body.classList.contains('factory-floor'));
    }, []);

    const menuItems: { id: ViewType; icon: string; labelEn: string; labelEs: string }[] = [
        { id: 'dashboard', icon: 'fa-tachometer-alt', labelEn: 'Hub Fabrica', labelEs: 'Hub Fábrica' },
        { id: 'analysis', icon: 'fa-pencil-ruler', labelEn: 'Generative Design', labelEs: 'Diseño Generativo' },
        { id: 'digital-twin', icon: 'fa-project-diagram', labelEn: 'Nesting AI', labelEs: 'Nesting IA' },
        { id: 'balancing', icon: 'fa-users-cog', labelEn: 'CRM Furniture', labelEs: 'CRM Muebles' },
        { id: 'maintenance', icon: 'fa-shield-check', labelEn: 'Quality Control', labelEs: 'Control de Calidad' },
        { id: 'quoter', icon: 'fa-truck-loading', labelEn: 'Logistics AI', labelEs: 'Logística IA' },
        { id: 'settings', icon: 'fa-cog', labelEn: 'Config Pro', labelEs: 'Config Pro' },
    ];

    const handleNavigate = (view: ViewType) => {
        onNavigate(view);
        // onClose override handled by parent, but safe to call if provided specially
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed left-0 top-0 bottom-0 w-64 bg-industrial-bg border-r border-industrial-accent/20 flex flex-col z-50 transition-all duration-300 print:hidden
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isOpen ? 'shadow-[0_0_30px_rgba(0,0,0,0.5)]' : ''}
            `}>
                {/* Branding */}
                <a
                    href="#"
                    className="p-6 flex items-center gap-3 border-b border-industrial-accent/10 hover:bg-industrial-accent/5 transition-all group cursor-pointer"
                >
                    <div className="w-8 h-8 rounded-lg bg-industrial-accent/20 border border-industrial-accent flex items-center justify-center shrink-0 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all">
                        <i className="fas fa-boxes text-industrial-accent text-xs group-hover:scale-110 transition-transform"></i>
                    </div>
                    <span className="font-black text-industrial-accent drop-shadow-[0_0_5px_rgba(245,158,11,0.5)] uppercase tracking-tighter transition-colors">
                        FABRICA IA <span className="text-white drop-shadow-none">PRO</span>
                    </span>
                </a>

                {/* Mobile User Profile Summary */}
                <div className="md:hidden px-4 py-4 border-b border-cyber-blue/10">
                    {user && (
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-industrial-accent/20 border border-industrial-accent flex items-center justify-center">
                                <i className="fas fa-user text-industrial-accent text-xs"></i>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">{user.name}</p>
                                <p className="text-[10px] text-zinc-500">{user.company}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                id={`sidebar-${item.id}`}
                                onClick={() => handleNavigate(item.id)}
                                className={`w-full flex items-center justify-start text-left gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <i className={`fas ${item.icon} text-lg w-6 text-center transition-transform group-hover:scale-110 ${isActive ? 'animate-pulse' : ''}`}></i>
                                <span className={`font-bold uppercase tracking-wider text-xs ${isActive ? 'text-white' : ''}`}>
                                    {language === 'es' ? item.labelEs : item.labelEn}
                                </span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-industrial-accent shadow-[0_0_5px_currentColor]"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Settings */}
                <div className="p-4 border-t border-industrial-accent/10 space-y-2 flex-shrink-0 bg-industrial-bg">
                    {/* Factory Floor (High Contrast) Toggle */}
                    <button
                        onClick={() => {
                            const newState = !isFactoryMode;
                            document.body.classList.toggle('factory-floor', newState);
                            localStorage.setItem('factory-mode', newState ? 'true' : 'false');
                            setIsFactoryMode(newState);
                        }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-industrial-dark border border-white/5 hover:border-[var(--status-success)] transition-all group group-hover:shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    >
                        <div className="flex items-center gap-3">
                            <i className="fas fa-industry text-[var(--status-success)] text-xs"></i>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                {language === 'es' ? 'Modo Planta' : 'Factory Mode'}
                            </span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isFactoryMode ? 'bg-[var(--status-success)]' : 'bg-zinc-800'}`}>
                            <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${isFactoryMode ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </button>

                    {/* Recommend App Link */}
                    <a
                        href="#"
                        className="block px-4 py-3 rounded-xl bg-gradient-to-r from-industrial-accent/10 to-industrial-accent/20 border border-industrial-accent/30 hover:border-industrial-accent/60 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <i className="fas fa-heart text-industrial-accent text-xs group-hover:scale-110 transition-transform"></i>
                            <p className="text-[10px] text-industrial-accent font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                {language === 'es' ? 'Recomendar App' : 'Recommend App'}
                            </p>
                        </div>
                    </a>

                    {/* Logout Button (Mobile Visible / Always Visible) */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 transition-all group mt-2"
                        >
                            <i className="fas fa-sign-out-alt text-red-500 group-hover:text-red-400"></i>
                            <span className="text-xs font-bold text-red-500 group-hover:text-red-400 uppercase tracking-wider">
                                {language === 'es' ? 'Cerrar Sesión' : 'Logout'}
                            </span>
                        </button>
                    )}

                    {/* Developer Branding */}
                    <div className="pt-4 mt-2 border-t border-cyber-blue/5 text-center">
                        <a
                            href="https://www.linkedin.com/in/agusstinprieto/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-zinc-500 hover:text-industrial-accent transition-colors font-mono tracking-tighter uppercase"
                        >
                            By Agustín Prieto
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
