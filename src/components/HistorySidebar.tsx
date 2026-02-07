
import React from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
    language?: 'es' | 'en';
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
    isOpen, onClose, history, onSelect, onDelete, onClear, language = 'es'
}) => {
    return (
        <div className={`fixed inset-y-0 right-0 w-96 bg-cyber-dark shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-transform duration-300 z-50 flex flex-col border-l border-cyber-blue/30 backdrop-blur-xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-cyber-blue/20 flex justify-between items-center bg-cyber-black/50">
                <div className="flex items-center gap-3">
                    <i className="fas fa-history text-cyber-blue animate-pulse"></i>
                    <h3 className="font-black text-white text-lg uppercase tracking-tight drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                        {language === 'es' ? 'Historial' : 'History'}
                    </h3>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 flex items-center justify-center hover:bg-cyber-blue hover:text-black transition-all group">
                    <i className="fas fa-times text-cyber-blue group-hover:text-black"></i>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cyber-dark custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-cyber-text/30">
                        <i className="fas fa-microchip text-4xl mb-3 opacity-20 animate-bounce"></i>
                        <p className="text-xs font-bold uppercase tracking-widest font-mono">
                            {language === 'es' ? 'MEMORIA VACÍA' : 'MEMORY EMPTY'}
                        </p>
                    </div>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="bg-cyber-black/50 p-4 rounded-xl border border-cyber-gray shadow-lg hover:border-cyber-blue/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all group relative">
                            <div
                                onClick={() => onSelect(item)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-start gap-4 mb-2">
                                    {item.previewImage ? (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-cyber-blue/20">
                                            <img src={item.previewImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 bg-cyber-blue/10 mix-blend-overlay"></div>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-cyber-gray/30 flex items-center justify-center border border-cyber-gray">
                                            <i className="fas fa-file-code text-cyber-text/20"></i>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-sm truncate leading-tight mb-1 group-hover:text-cyber-blue transition-colors">{item.title}</h4>
                                        <p className="text-[10px] text-cyber-blue/60 font-mono flex items-center gap-2">
                                            <i className="fas fa-clock text-[8px]"></i>
                                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                className="absolute top-2 right-2 p-2 text-cyber-gray hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <i className="fas fa-trash-alt text-xs shadow-[0_0_10px_rgba(255,0,0,0.5)]"></i>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {history.length > 0 && (
                <div className="p-4 border-t border-cyber-blue/20 bg-cyber-black/80 backdrop-blur-md">
                    <button
                        onClick={() => { if (confirm(language === 'es' ? '¿Borrar todo?' : 'Clear all?')) onClear(); }}
                        className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-biohazard"></i>
                        {language === 'es' ? 'PURGAR SISTEMA' : 'PURGE SYSTEM'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HistorySidebar;
