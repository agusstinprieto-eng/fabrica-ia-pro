import React from 'react';
import { motion } from 'framer-motion';
import {
    Truck,
    Box,
    Navigation,
    Maximize2,
    Layers,
    Clock,
    Calendar,
    MapPin,
    ChevronRight,
    Search
} from 'lucide-react';

const LogisticsView: React.FC<{ language: 'es' | 'en' }> = ({ language }) => {
    return (
        <div className="h-full bg-industrial-bg overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Truck size={32} className="text-industrial-accent" />
                            {language === 'es' ? 'Logística IA: Optimización de Carga' : 'Logistics AI: Load Optimization'}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            {language === 'es' ? 'Acomodo volumétrico y planificación de rutas para muebles voluminosos' : 'Volumetric loading and route planning for bulky furniture'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder={language === 'es' ? 'ID de Pedido...' : 'Order ID...'}
                                className="bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-industrial-accent transition-all w-48"
                            />
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-industrial-accent text-black text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2">
                            <Navigation size={16} />
                            {language === 'es' ? 'Calcular Rutas' : 'Calculate Routes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Volumetric Simulation (Placeholder) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-black/60 border border-white/10 rounded-[3rem] p-4 min-h-[500px] flex items-center justify-center relative overflow-hidden group">
                            {/* Loading Tray */}
                            <div className="relative w-[80%] h-[350px] bg-black/40 border-2 border-industrial-accent/20 rounded-xl preserve-3d rotate-x-12 relative">
                                {/* Grid Mesh */}
                                <div className="absolute inset-0 opacity-5"
                                    style={{ backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                                {/* 3D-like Boxes Simulation */}
                                <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-4 left-4 w-48 h-32 bg-industrial-accent/30 border border-industrial-accent/50 rounded flex items-center justify-center group/box">
                                    <span className="text-[10px] font-black text-white/50 group-hover/box:text-white transition-colors">SOFA-A1</span>
                                </motion.div>
                                <motion.div initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="absolute bottom-4 left-56 w-32 h-64 bg-blue-500/30 border border-blue-500/50 rounded flex items-center justify-center group/box">
                                    <span className="text-[10px] font-black text-white/50 group-hover/box:text-white transition-colors">TABLE-X</span>
                                </motion.div>
                                <motion.div initial={{ y: -300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="absolute bottom-36 left-4 w-48 h-24 bg-emerald-500/30 border border-emerald-500/50 rounded flex items-center justify-center group/box">
                                    <span className="text-[10px] font-black text-white/50 group-hover/box:text-white transition-colors">CHAIR-S</span>
                                </motion.div>
                            </div>

                            <div className="absolute top-10 right-10 flex flex-col gap-2">
                                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Load Efficiency</p>
                                    <p className="text-2xl font-black text-emerald-500 leading-none">92.4%</p>
                                </div>
                                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Volume</p>
                                    <p className="text-2xl font-black text-white leading-none">14.2 m³</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-industrial-accent" />
                                {language === 'es' ? 'Programados para Hoy' : "Today's Deliveries"}
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { id: '#TR-4592', client: 'G. Arciniega', area: 'Zona Norte', status: 'Loading' },
                                    { id: '#TR-4593', client: 'L. Mendivil', area: 'Downtown', status: 'In Transit' },
                                    { id: '#TR-4594', client: 'Hotel Regency', area: 'Coastal', status: 'Pending' }
                                ].map((item) => (
                                    <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-industrial-accent/30 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-industrial-accent uppercase">{item.id}</span>
                                            <span className={`text-[8px] font-bold px-2 py-1 rounded bg-white/5 border border-white/10 ${item.status === 'In Transit' ? 'text-blue-400' : 'text-zinc-500'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-white mb-1">{item.client}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                            <MapPin size={10} />
                                            {item.area}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                {language === 'es' ? 'Ver Mapa Completo' : 'View Full Map'}
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsView;
