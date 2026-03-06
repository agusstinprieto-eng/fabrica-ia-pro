
import React from 'react';
import { motion } from 'framer-motion';
import { Order, Tenant } from '../types';

interface ROIMetricsViewProps {
    orders: Order[];
    tenant: Tenant;
    activeColor: string;
}

const ROIMetricsView: React.FC<ROIMetricsViewProps> = ({ orders, tenant, activeColor }) => {
    if (!tenant) return <div className="p-10 text-white/20 italic">Cargando datos de estrategia...</div>;
    // Configurable constants for ROI (Agus Pro Standard)
    const AVG_HUMAN_SALARY_INTERNAL = 22500; // MXN/month - Increased for specialized high-tech profile
    const TIME_PER_CASE_MINUTES = 30; // More conservative but realistic Manual interaction time
    const HOURLY_COST = AVG_HUMAN_SALARY_INTERNAL / 160;

    // Calculations
    const totalOrders = orders.length;
    const hoursSaved = (totalOrders * TIME_PER_CASE_MINUTES) / 60;
    const deliveryRate = totalOrders > 0 ? (orders.filter(o => o.status === 'Entregado').length / totalOrders) * 100 : 0;

    // Value Generated: 
    // Direct hourly savings + lead recovery value (estimated at $450 per lead high-value)
    const directSavings = hoursSaved * HOURLY_COST;
    const leadValue = totalOrders * 450;
    const estimatedSavings = directSavings + leadValue;

    return (
        <div className="space-y-8 pb-12">
            {/* Header section with technical styling */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${activeColor} shadow-[0_0_20px_rgba(var(--theme-color),0.4)] text-white relative overflow-hidden group`}>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">ROI & ESTRATEGIA <span className="text-slate-500 opacity-50">AGUS PRO</span></h3>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Intelligence Asset Monitoring for {tenant.name}</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado del Sistema</p>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-tighter animate-pulse">ROI OPTIMIZED • ACTIVE</p>
                    </div>
                    <div className="w-2 h-12 bg-slate-800 rounded-full">
                        <div className="w-full h-3/4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric Cards with extra "WOW" factor */}
                {[
                    { title: 'Ahorro Proyectado', value: `$${estimatedSavings.toLocaleString('es-MX')}`, sub: 'Eficiencia Directa MXN', color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
                    { title: 'Optimización Operativa', value: `${hoursSaved.toFixed(1)}h`, sub: 'Human-Hours Recovered', color: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
                    { title: 'AI Throughput', value: totalOrders, sub: 'Managed Conversations', color: 'text-white', glow: 'shadow-white/10' },
                    { title: 'Business Escalability', value: '∞', sub: 'Non-Stop Multi-Thread', color: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/20' }
                ].map((m, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`bg-slate-900/30 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-3 shadow-2xl ${m.glow} group transition-all duration-500 overflow-hidden relative`}
                    >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{m.title}</span>
                        <span className={`text-4xl font-black ${m.color} font-mono tracking-tighter`}>{m.value}</span>
                        <span className="text-[10px] text-slate-600 uppercase font-black tracking-tighter">{m.sub}</span>
                    </motion.div>
                ))}
            </div>

            {/* Strategic Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-black p-10 rounded-[3rem] border border-white/5 shadow-3xl relative overflow-hidden group backdrop-blur-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-20 transition-opacity duration-700">
                        <svg className="w-48 h-48 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 3h-2v10h2V3zm4 8h-2v2h2v-2zm-8 0H7v2h2v-2zm3 9c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm7-9v-4c0-2.21-1.79-4-4-4h-2V1h-2v2H9c-2.21 0-4 1.79-4 4v4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2z" />
                        </svg>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                            <h4 className="text-lg font-black text-white uppercase tracking-widest">Payroll Impact & AI Replacement</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                    {tenant.name} ha optimizado exitosamente la gestión equivalente a la carga de <span className="text-white font-black">{(hoursSaved / 160).toFixed(2)} analistas</span> de tiempo completo.
                                    La arquitectura multi-hilo permite una velocidad de resolución <span className="text-emerald-400 font-bold">18x mayor</span> que los estándares SAM de la industria.
                                </p>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">System Efficiency Rate</span>
                                        <span className="text-xs font-black text-white font-mono">{deliveryRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(deliveryRate, 100)}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={`h-full ${activeColor} rounded-full shadow-[0_0_20px_rgba(var(--theme-color),0.6)]`}
                                        ></motion.div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-4 hover:bg-white/10 transition-colors group/inner">
                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sugerencia de Facturación Estratégica</h5>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Valor Generado Estimado</p>
                                    <div className="flex justify-between items-center bg-black/60 p-5 rounded-2xl border border-emerald-500/20 shadow-inner group-hover/inner:border-emerald-500/40 transition-colors">
                                        <span className="text-sm font-bold text-white uppercase tracking-tighter">AI Service Fee</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-emerald-400 font-mono">${((estimatedSavings * 0.3)).toLocaleString('es-MX')}</span>
                                            <p className="text-[8px] text-slate-500 font-black tracking-widest">/ MONTHLY</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-500 italic leading-relaxed">
                                    *Cálculo basado en captura del 30% del ahorro operativo (OpEx). Esta tarifa asegura un ROI masivo positivo para el cliente mientras escala tu SaaS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Status / Side Card */}
                <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] flex flex-col justify-between backdrop-blur-xl relative overflow-hidden group">
                    <div className="space-y-6">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Godmode Stats</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Nivel de Optimización en Tiempo Real</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            {[
                                { label: 'CPU IA LOAD', val: '12%', color: 'bg-emerald-500' },
                                { label: 'RESPONSE LATENCY', val: '840ms', color: 'bg-cyan-500' },
                                { label: 'TOKEN EFFICIENCY', val: '99.4%', color: 'bg-indigo-500' }
                            ].map((s, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{s.label}</span>
                                        <span className="text-white">{s.val}</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${s.color} w-3/4 opacity-40`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="w-full py-4 mt-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                        AUDIT LOGS • V3.3.0
                    </button>
                </div>
            </div>

            <div className="pt-12 mt-8 border-t border-white/5">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">PLANES E INVERSIÓN</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Escala tu negocio con Inteligencia Artificial Pro</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* PRICING CARDS - Enhanced with Agus Pro styling */}
                    {[
                        {
                            name: 'Plan PyME',
                            subtitle: 'La empleada que nunca falta',
                            setup: '$15,000 - $28,000 MXN',
                            monthly: '$3,000 - $6,000 MXN',
                            features: [
                                '1 Agente de IA Pro Dedicado',
                                'Web Widget (Burbuja de Chat en tu Web)',
                                'WhatsApp / Telegram Gateway (Opcional)',
                                '24/7 Sin Descanso (Uptime 99.9%)',
                                'IA Entrenada con tus Catálogos'
                            ],
                            mainColor: 'border-slate-800'
                        },
                        {
                            name: 'Plan Enterprise',
                            subtitle: 'Datos, Seguridad e Integración',
                            setup: '$95,000 - $280,000+ MXN',
                            monthly: '$19,000 - $65,000 MXN',
                            features: ['Integración ERP/CRM (SAP, Oracle)', 'Seguridad Nivel Bancario', 'Analítica de Sentimiento Real-time', 'SLA de Respuesta < 1s'],
                            mainColor: 'border-indigo-500/30 shadow-indigo-500/10'
                        }
                    ].map((plan, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className={`bg-slate-900/20 border ${plan.mainColor} p-10 rounded-[3rem] relative overflow-hidden group backdrop-blur-xl transition-all duration-700`}
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <span className="px-4 py-1.5 bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-white/5">
                                    {i === 0 ? 'Foco: Volumen' : 'Foco: Eficiencia'}
                                </span>
                            </div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{plan.name}</h4>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-8 italic">"{plan.subtitle}"</p>

                            <div className="space-y-5 mb-10">
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Setup One-Time</span>
                                    <span className="text-base font-black text-white font-mono">{plan.setup}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SaaS Monthly</span>
                                    <span className="text-lg font-black text-emerald-400 font-mono">{plan.monthly}</span>
                                </div>
                            </div>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase transition-all hover:text-white">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* DIFFERENTIATORS WITH NEW GRID STYLE */}
                <div className="p-16 bg-gradient-to-b from-slate-900/50 to-black/80 border border-white/5 rounded-[4rem] text-center space-y-12 relative overflow-hidden">
                    <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em] mb-4">Diferenciadores Elite AGUS PRO</h3>
                        <div className="flex justify-center gap-2">
                            <div className="w-12 h-1.5 bg-indigo-600 rounded-full"></div>
                            <div className="w-4 h-1.5 bg-indigo-600/30 rounded-full"></div>
                            <div className="w-2 h-1.5 bg-indigo-600/10 rounded-full"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 pt-4">
                        {[
                            { icon: 'M8 7h.01M12 7h.01M16 7h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', title: 'IA Transfer System', desc: 'Detección de sentimiento real-time con transferencia inteligente a humano.', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                            { icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 11.37 9.19 15.378 5 18.25', title: 'Global Multi-Engine', desc: 'Selección automática del modelo (Gemini, DeepSeek) para máxima rentabilidad.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'ROI Predictive Engine', desc: 'Análisis predictivo de ahorro operativo basado en volumen histórico de datos.', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' }
                        ].map((d, i) => (
                            <div key={i} className="group space-y-5 px-6">
                                <div className={`w-20 h-20 ${d.bg} rounded-[2rem] flex items-center justify-center mx-auto ${d.color} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border border-white/5 shadow-2xl`}>
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d.icon} /></svg>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{d.title}</h5>
                                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase opacity-80 group-hover:opacity-100 transition-opacity">{d.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 relative z-10 flex flex-col items-center gap-4">
                        <button className={`px-16 py-6 rounded-[2rem] ${activeColor} text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(var(--theme-color),0.3)] hover:scale-105 active:scale-95 transition-all relative overflow-hidden group`}>
                            <span className="relative z-10">GENERAR PROPUESTA ELITE PDF</span>
                            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                        </button>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Agus Pro Strategy Hub v3.3.1</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ROIMetricsView;
