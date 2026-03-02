import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    Camera,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ZoomIn,
    History,
    Settings,
    Eye
} from 'lucide-react';

const QualityControlView: React.FC<{ language: 'es' | 'en' }> = ({ language }) => {
    const [isScanning, setIsScanning] = useState(false);

    return (
        <div className="h-full bg-industrial-bg overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <ShieldCheck size={32} className="text-industrial-accent" />
                            {language === 'es' ? 'Control de Calidad: Acabados' : 'Quality Control: Finishes'}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            {language === 'es' ? 'Visión artificial para detección de nudos, grietas y rayones en madera' : 'Computer vision for detecting knots, cracks, and scratches in wood'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setIsScanning(true);
                            setTimeout(() => setIsScanning(false), 5000);
                        }}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-industrial-accent to-orange-600 text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
                    >
                        <Camera size={20} />
                        {language === 'es' ? 'Escanear Pieza' : 'Scan Part'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visual Inspection Area */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="relative aspect-video bg-black/60 rounded-[3rem] border border-white/10 overflow-hidden group">
                            {/* Scanning Animation */}
                            {isScanning && (
                                <motion.div
                                    initial={{ top: -20 }}
                                    animate={{ top: '100%' }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-industrial-accent shadow-[0_0_20px_#f59e0b] z-20 pointer-events-none"
                                />
                            )}

                            {/* Dummy Camera Feed */}
                            <img
                                src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=1200"
                                className="w-full h-full object-cover opacity-50 contrast-125"
                                alt="Inspection Feed"
                            />

                            {/* HUD Overlays */}
                            <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none">
                                <div className="flex justify-between items-start">
                                    <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Live Feed</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-xs font-bold text-white">QC-CAM-01-BORDES</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 p-4 rounded-2xl">
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <CheckCircle2 size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Structural Integrity: OK</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/60 backdrop-blur-md border border-industrial-accent/30 p-4 rounded-2xl">
                                            <div className="flex items-center gap-2 text-industrial-accent">
                                                <AlertTriangle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Wood Knot Detected</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-6 rounded-full flex items-center gap-8 px-12">
                                        <div className="text-center">
                                            <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Exposure</p>
                                            <p className="text-sm font-bold text-white">AUTO</p>
                                        </div>
                                        <div className="w-[1px] h-8 bg-white/10" />
                                        <div className="text-center">
                                            <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Focus Mode</p>
                                            <p className="text-sm font-bold text-white">AI-FOLLOW</p>
                                        </div>
                                        <div className="w-[1px] h-8 bg-white/10" />
                                        <div className="text-center">
                                            <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">FPS</p>
                                            <p className="text-sm font-bold text-emerald-500">60.2</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detection Box Placeholder */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-industrial-accent rounded-lg flex flex-col items-center justify-center p-2 backdrop-blur-sm bg-industrial-accent/5 pointer-events-none"
                            >
                                <span className="text-[8px] font-black text-industrial-accent uppercase bg-black px-1 absolute -top-2 left-2">Defect #01</span>
                                <AlertTriangle className="text-industrial-accent" size={24} />
                                <span className="text-[9px] font-bold text-white mt-1">Minor Chip</span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Stats & History */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <History size={14} className="text-industrial-accent" />
                                {language === 'es' ? 'Recientes' : 'Recent Scans'}
                            </h3>

                            <div className="space-y-3">
                                {[
                                    { id: 'FP-420', status: 'Approved', time: '10:45 AM' },
                                    { id: 'FP-421', status: 'Warning', time: '11:02 AM' },
                                    { id: 'FP-422', status: 'Rejected', time: '11:15 AM' },
                                    { id: 'FP-423', status: 'Approved', time: '11:30 AM' }
                                ].map((scan) => (
                                    <div key={scan.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${scan.status === 'Approved' ? 'bg-emerald-500' : scan.status === 'Warning' ? 'bg-industrial-accent' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase">{scan.id}</p>
                                                <p className="text-[8px] text-zinc-500 font-bold uppercase">{scan.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors">
                                            {scan.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Defect Analysis */}
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Settings size={14} />
                                {language === 'es' ? 'Umbral de Tolerancia' : 'Tolerance Threshold'}
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-zinc-500 uppercase">Surface Scratches</span>
                                        <span className="text-industrial-accent">2.0mm</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-industrial-accent w-[40%]" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-zinc-500 uppercase">Structural Knots</span>
                                        <span className="text-red-500">REJECTED</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[100%]" />
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

export default QualityControlView;
