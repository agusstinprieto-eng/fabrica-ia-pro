import React from 'react';
import { motion } from 'framer-motion';
import {
    Maximize2,
    Layers,
    Box,
    Zap,
    Trash2,
    Download,
    Settings,
    Scissors,
    Save,
    RefreshCcw,
    TrendingDown,
    Activity
} from 'lucide-react';

const NestingView: React.FC<{ language: 'es' | 'en' }> = ({ language }) => {
    const wastePercentage = 4.2;
    const itemsProcessed = 142;
    const boardsSaved = 28;

    return (
        <div className="h-full bg-industrial-bg overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fas fa-object-group text-industrial-accent"></i>
                            {language === 'es' ? 'Nesting IA: Optimización de Corte' : 'Nesting AI: Cut Optimization'}
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/30">ACTIVE ENGINE 2.0</span>
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            {language === 'es' ? 'Algoritmos de empaquetado 2D para máximo aprovechamiento de tableros' : '2D packing algorithms for maximum board utilization'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:border-white/30 transition-all flex items-center gap-2">
                            <Download size={16} />
                            {language === 'es' ? 'DXF Export' : 'Export DXF'}
                        </button>
                        <button className="px-6 py-3 rounded-xl bg-industrial-accent text-black text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2">
                            <Scissors size={16} />
                            {language === 'es' ? 'Ejecutar Nesting' : 'Run Nesting'}
                        </button>
                    </div>
                </div>

                {/* KPI Ribbon */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <TrendingDown size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{language === 'es' ? 'Desperdicio Total' : 'Total Waste'}</p>
                            <p className="text-3xl font-black text-emerald-500 leading-none">{wastePercentage}%</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">-15% {language === 'es' ? 'vs mes anterior' : 'vs last month'}</p>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-industrial-accent/10 border border-industrial-accent/20 flex items-center justify-center text-industrial-accent">
                            <Box size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{language === 'es' ? 'Piezas Nesteadas' : 'Nested Parts'}</p>
                            <p className="text-3xl font-black text-white leading-none">{itemsProcessed}</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Batch #4820</p>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                            <Save size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{language === 'es' ? 'Tableros Ahorrados' : 'Boards Saved'}</p>
                            <p className="text-3xl font-black text-blue-500 leading-none">{boardsSaved}</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Est. Value: $5,600</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visualizer (The Canvas Simulation) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-industrial-dark border border-white/10 rounded-[3rem] p-4 relative min-h-[500px] group overflow-hidden">
                            {/* Grid Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />

                            {/* Simulation Area */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Large Board Simulation */}
                                <div className="w-[90%] h-[400px] border border-industrial-accent/30 bg-black/50 rounded-lg relative overflow-hidden backdrop-blur-sm">
                                    {/* Nested Rectangles (Simulated Cuts) */}
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 left-4 w-40 h-24 bg-industrial-accent/20 border border-industrial-accent/50 rounded flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-industrial-accent">S-102</span>
                                    </motion.div>
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="absolute top-4 left-48 w-64 h-32 bg-blue-500/20 border border-blue-500/50 rounded flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-blue-400">T-TOP-01</span>
                                    </motion.div>
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="absolute top-32 left-4 w-40 h-64 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-emerald-400">L-SIDE-L</span>
                                    </motion.div>
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="absolute top-40 left-48 w-40 h-64 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-emerald-400">L-SIDE-R</span>
                                    </motion.div>

                                    {/* Empty Waste Areas */}
                                    <div className="absolute bottom-4 right-4 w-24 h-24 border border-dashed border-red-500/30 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-red-500/50 uppercase">Waste</span>
                                    </div>
                                </div>
                            </div>

                            {/* Controls Overlay */}
                            <div className="absolute top-10 left-10 flex flex-col gap-2">
                                <button className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-industrial-accent hover:text-black transition-all">
                                    <Maximize2 size={16} />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-industrial-accent hover:text-black transition-all">
                                    <RefreshCcw size={16} />
                                </button>
                            </div>

                            <div className="absolute bottom-10 right-10 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] text-zinc-500 uppercase font-black">Machine Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-white uppercase">CNC-ROUTER-04 ONLINE</span>
                                    </div>
                                </div>
                                <div className="w-[1px] h-8 bg-white/10" />
                                <div className="space-y-1">
                                    <p className="text-[8px] text-zinc-500 uppercase font-black">Current File</p>
                                    <span className="text-[10px] font-bold text-white uppercase">BATCH_FURN_SALAS_A1.DXF</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Settings size={14} className="text-industrial-accent" />
                                {language === 'es' ? 'Parámetros de Corte' : 'Cut Parameters'}
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-black">{language === 'es' ? 'Tipo de Tablero' : 'Board Type'}</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-industrial-accent transition-all">
                                        <option>MDF 18mm (1.22 x 2.44)</option>
                                        <option>Triplay Pino 15mm</option>
                                        <option>Melamina Texturizada</option>
                                        <option>Aglomerado Crudo</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-black">{language === 'es' ? 'Distancia entre piezas (mm)' : 'Gap between parts (mm)'}</label>
                                    <input type="number" defaultValue={6} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-industrial-accent transition-all" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-black">{language === 'es' ? 'Margen (mm)' : 'Edge Margin'}</label>
                                        <input type="number" defaultValue={10} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-industrial-accent transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-black">{language === 'es' ? 'Rotación' : 'Rotation'}</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-industrial-accent transition-all">
                                            <option>90° / 180°</option>
                                            <option>Any Degree</option>
                                            <option>Static (Grain Dir)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <button className="w-full flex items-center justify-between p-4 bg-industrial-accent/10 border border-industrial-accent/30 rounded-2xl group hover:bg-industrial-accent/20 transition-all">
                                    <div className="text-left">
                                        <p className="text-[10px] text-industrial-accent font-black uppercase tracking-widest">{language === 'es' ? 'Algoritmo de IA' : 'AI Algorithm'}</p>
                                        <p className="text-xs font-bold text-white">Heuristic Gravity 4.0</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-industrial-accent/20 flex items-center justify-center text-industrial-accent group-hover:scale-110 transition-transform">
                                        <Zap size={18} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Efficiency Comparison */}
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={14} />
                                {language === 'es' ? 'Simulación de Eficiencia' : 'Efficiency Simulation'}
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-zinc-500">MANUAL NESTING</span>
                                        <span className="text-red-500">65% Yield</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500/50 w-[65%]" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-zinc-500">IA.AGUS ENGINE</span>
                                        <span className="text-emerald-500">95.8% Yield</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[95.8%] shadow-[0_0_10px_#10b981]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NestingView;
