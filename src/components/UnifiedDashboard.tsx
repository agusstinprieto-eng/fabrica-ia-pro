
import React from 'react';
import {
    Gauge,
    Layers,
    Palette,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Box,
    LayoutGrid,
    Maximize2
} from 'lucide-react';

const StatCard = ({ title, value, unit, trend, icon: Icon, color }: any) => (
    <div className="bg-industrial-bg/50 border border-industrial-accent/10 p-6 rounded-[2rem] hover:border-industrial-accent/30 transition-all group relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <Icon className="w-16 h-16" />
        </div>
        <div className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</span>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white">{value}</span>
                <span className="text-xs font-bold text-slate-500 mb-1">{unit}</span>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500">+{trend}% vs ayer</span>
                </div>
            )}
        </div>
    </div>
);

const UnifiedDashboard: React.FC = () => {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Hub Fábrica <span className="text-industrial-accent">Inteligente</span></h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Monitoreo de Producción de Muebles en Tiempo Real</p>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                    <div className="flex flex-col items-end px-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Estado Global</span>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Óptimo</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center animate-pulse">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Eficiencia Nesting"
                    value="94.2"
                    unit="%"
                    trend="2.4"
                    icon={Layers}
                    color="amber"
                />
                <StatCard
                    title="Capacidad Carga"
                    value="88"
                    unit="%"
                    trend="1.1"
                    icon={Box}
                    color="blue"
                />
                <StatCard
                    title="Calidad / Pasado"
                    value="99.1"
                    unit="%"
                    trend="0.5"
                    icon={CheckCircle2}
                    color="emerald"
                />
                <StatCard
                    title="Tendencia Actual"
                    value="Japandi"
                    unit=""
                    icon={Palette}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Production Line */}
                <div className="lg:col-span-2 bg-industrial-bg/40 border border-white/5 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                        <Gauge className="w-64 h-64" />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Línea de Ensamblado A1</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Carga de trabajo actual: 85%</p>
                            </div>
                        </div>
                        <button className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white hover:bg-industrial-accent hover:text-black transition-all">Ver Detalles</button>
                    </div>

                    {/* Progress Track */}
                    <div className="grid grid-cols-4 gap-4">
                        {['Corte CNC', 'Barnizado', 'Ensamblado', 'Empaque'].map((step, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{step}</span>
                                    <span className="text-[10px] font-mono text-industrial-accent">{idx < 3 ? '100%' : '65%'}</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000`}
                                        style={{ width: idx < 3 ? '100%' : '65%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Jobs */}
                    <div className="bg-black/30 rounded-3xl p-6 border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Órdenes en Proceso</h4>
                        {[
                            { id: '#F-2045', name: 'Silla Eames (Madera)', status: 'Ensamblando', color: 'emerald' },
                            { id: '#F-2046', name: 'Mesa Industrial 2M', status: 'Barnizado', color: 'amber' },
                            { id: '#F-2047', name: 'Estantería Minimalista', status: 'Corte', color: 'blue' }
                        ].map((job, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-mono text-industrial-accent">{job.id}</span>
                                    <span className="text-[12px] font-bold text-white">{job.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{job.status}</span>
                                    <div className={`w-2 h-2 rounded-full bg-${job.color}-500 animate-pulse`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Design Trends */}
                <div className="bg-industrial-bg/40 border border-white/5 rounded-[3rem] p-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500">
                            <Palette className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Tendencias IA</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Análisis de Mercado Global</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[
                            { name: 'Japandi', score: 92, status: 'Rising' },
                            { name: 'Industrial', score: 78, status: 'Stable' },
                            { name: 'Mid Century', score: 65, status: 'Declining' }
                        ].map((trend, i) => (
                            <div key={i} className="p-5 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-black text-white uppercase tracking-tighter">{trend.name}</span>
                                    <span className={`text-[10px] font-bold ${trend.status === 'Rising' ? 'text-emerald-500' : 'text-slate-500'}`}>{trend.status}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${trend.score}%` }} />
                                    </div>
                                    <span className="text-xs font-mono text-purple-400">{trend.score}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-purple-500/20 transition-all">
                        Generar Nuevo Diseño Sugerido
                    </button>
                </div>
            </div>

            {/* Quality & Nesting Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                <div className="bg-industrial-bg/40 border border-white/5 rounded-[3rem] p-10 flex items-center justify-between group">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Layers className="w-5 h-5 text-industrial-accent" />
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Reporte Nesting Semanal</h4>
                        </div>
                        <p className="text-3xl font-black text-industrial-accent">240 m² <span className="text-xs text-white/50 uppercase">Madera Ahorrada</span></p>
                        <p className="text-[11px] text-slate-500">Equivalente a 12 planchas de roble premium.</p>
                    </div>
                    <div className="w-32 h-32 relative">
                        {/* Fake circular chart */}
                        <div className="absolute inset-0 rounded-full border-8 border-white/5" />
                        <div className="absolute inset-0 rounded-full border-8 border-industrial-accent border-l-transparent border-b-transparent animate-[spin_3s_linear_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-black text-white">94%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-industrial-bg/40 border border-white/5 rounded-[3rem] p-10 flex items-center justify-between group">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Control Calidad IA</h4>
                        </div>
                        <p className="text-3xl font-black text-white">0.9% <span className="text-xs text-slate-500 uppercase">Defectos Detectados</span></p>
                        <p className="text-[11px] text-slate-500">Último defecto: Nudo estructural en Orden #F-2042.</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-all">
                        <Maximize2 className="w-8 h-8 text-red-500 group-hover:text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedDashboard;
