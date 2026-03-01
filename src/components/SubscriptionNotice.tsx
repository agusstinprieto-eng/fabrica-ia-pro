import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Calendar, BarChart3, ShieldCheck, Zap, X } from 'lucide-react';

interface SubscriptionNoticeProps {
    analysisCount: number;
    onClose: () => void;
}

export const SubscriptionNotice: React.FC<SubscriptionNoticeProps> = ({ analysisCount, onClose }) => {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
                >
                    {/* Background Highlight */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/50">
                            <Zap className="text-emerald-400" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Membresía Premium Activa</h2>
                            <p className="text-slate-400 text-sm font-medium tracking-wider">ESTADO DE CUENTA: PRO</p>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="space-y-6 relative z-10">
                        {/* Analysis Counter */}
                        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <BarChart3 className="text-blue-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Videos Analizados</p>
                                        <p className="text-white text-lg font-semibold">Este Mes</p>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white bg-slate-900/50 px-6 py-2 rounded-2xl border border-slate-700">
                                    {analysisCount}
                                </div>
                            </div>
                            {analysisCount === 0 && (
                                <p className="text-xs text-slate-500 italic mt-1 pl-1">
                                    ✨ El contador acaba de iniciarse — se irá actualizando con cada análisis que realices.
                                </p>
                            )}
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl">
                                <Calendar className="text-emerald-400 mb-2" size={20} />
                                <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest">Fecha de Corte</p>
                                <p className="text-white font-semibold">Día 22 / Mes</p>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl">
                                <CreditCard className="text-blue-400 mb-2" size={20} />
                                <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest">Inversión Mensual</p>
                                <p className="text-white font-semibold">$400 USD</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="text-emerald-400" size={18} />
                                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Info para Depósito</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-emerald-500/10 pb-2">
                                    <span className="text-slate-400">Banco</span>
                                    <span className="text-white font-medium italic">BBVA</span>
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <span className="text-slate-400 text-xs uppercase tracking-widest">Número de Tarjeta</span>
                                    <span className="text-xl font-mono text-white tracking-widest block py-1">
                                        4152 3144 4294 6987
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="text-slate-400">Titular</span>
                                    <span className="text-white font-medium uppercase text-xs">Agustín Prieto Huerta</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group"
                        >
                            ENTENDIDO
                            <Zap size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
