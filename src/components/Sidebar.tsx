import React from 'react';

type ViewType = 'dashboard' | 'analysis' | 'balancing' | 'costing' | 'regional' | 'library' | 'gallery' | 'settings';

interface SidebarProps {
    currentView: ViewType;
    onNavigate: (view: ViewType) => void;
    language: 'es' | 'en';
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, language }) => {
    const menuItems: { id: ViewType; icon: string; labelEn: string; labelEs: string }[] = [
        { id: 'dashboard', icon: 'fa-chart-pie', labelEn: 'Dashboard', labelEs: 'Tablero' },
        { id: 'analysis', icon: 'fa-microscope', labelEn: 'Video Lab', labelEs: 'Laboratorio' },
        { id: 'balancing', icon: 'fa-project-diagram', labelEn: 'Line Balance', labelEs: 'Balanceo' },
        { id: 'costing', icon: 'fa-coins', labelEn: 'Costing', labelEs: 'Costos' },
        { id: 'regional', icon: 'fa-globe-americas', labelEn: 'Regional Costs', labelEs: 'Costos Regionales' },
        { id: 'library', icon: 'fa-book-open', labelEn: 'Knowledge Hub', labelEs: 'Biblioteca' },
        { id: 'gallery', icon: 'fa-images', labelEn: 'Photo Gallery', labelEs: 'Galería' },
        { id: 'settings', icon: 'fa-cog', labelEn: 'Settings', labelEs: 'Configuración' },
    ];

    return (
        <div className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-cyber-black border-r border-cyber-blue/20 flex flex-col z-40 transition-all duration-300 print:hidden">
            {/* Branding */}
            <div className="p-6 flex items-center gap-3 border-b border-cyber-blue/10">
                <div className="w-8 h-8 rounded-lg bg-cyber-blue/20 border border-cyber-blue flex items-center justify-center shrink-0">
                    <i className="fas fa-industry text-cyber-blue text-xs"></i>
                </div>
                <span className="font-black text-white uppercase tracking-tighter hidden md:block">MANUFACTURA IA</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-3 space-y-2">
                {menuItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <i className={`fas ${item.icon} text-lg w-6 text-center transition-transform group-hover:scale-110 ${isActive ? 'animate-pulse' : ''}`}></i>
                            <span className={`font-bold uppercase tracking-wider text-xs hidden md:block ${isActive ? 'text-white' : ''}`}>
                                {language === 'es' ? item.labelEs : item.labelEn}
                            </span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-blue shadow-[0_0_5px_currentColor] hidden md:block"></div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Settings */}
            <div className="p-4 border-t border-cyber-blue/10">
                <div className="px-4 py-3 rounded-xl bg-cyber-dark border border-white/5 text-center">
                    <p className="text-[9px] text-zinc-600 font-mono uppercase">v3.0.1 Stable</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
