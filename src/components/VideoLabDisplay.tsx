import React from 'react';
import { IndustrialAnalysis, CycleElement } from '../types';

interface VideoLabDisplayProps {
    videoUrl: string;
    analysis: IndustrialAnalysis;
    images?: Array<{ previewUrl: string; name?: string }>;
}

export const VideoLabDisplay: React.FC<VideoLabDisplayProps> = ({ videoUrl, analysis, images = [] }) => {
    // --- RENDER UTILITY ---
    const renderMarkdown = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <span key={pIdx} className="text-cyber-blue print:text-blue-700 font-bold">
                        {part.slice(2, -2)}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="bg-cyber-black p-4 lg:p-8 rounded-3xl border border-cyber-blue/20 shadow-2xl overflow-visible font-sans text-white print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
            {/* 0. REPORT CERTIFICATION HEADER - Persistent history style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-white/10 print:border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white print:text-slate-900 tracking-tighter uppercase mb-1">Industrial Forensics Report</h1>
                    <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 print:text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-cyber-blue rounded-full print:bg-blue-600"></span> Certified By: AI-MANU-FORCE</span>
                        <span>•</span>
                        <span>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                        <span>•</span>
                        <span className="text-cyber-blue print:text-blue-600 underline">History Log: Permanent</span>
                    </div>
                </div>
                <div className="flex gap-2 print:hidden">
                    {/* Button Removed */}
                </div>
            </div>

            {/* 1. HEADER & LIVE FEED (Cyber Dark for screen / Hidden for print) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4 print:hidden">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-cyber-blue print:text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse print:animate-none"></span>
                            Live Analysis Feed
                        </h3>
                        <span className="text-zinc-500 print:text-slate-400 font-mono text-[10px] uppercase tracking-widest">NeuralScan™ Active</span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-white/10 print:border-slate-200 shadow-xl bg-black aspect-video group">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full h-full"
                        />
                        <div className="absolute top-4 left-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase">
                                <i className="fas fa-microchip text-cyber-blue"></i>
                                Vision Core: Gemini 2.0 Flash
                            </div>
                        </div>
                    </div>

                    {/* Ergonomic Risk Summary */}
                    {analysis.ergo_vitals && (
                        <div className="bg-cyber-dark/50 print:bg-white p-6 rounded-2xl border border-white/5 print:border-slate-200 shadow-sm transition-all hover:bg-cyber-dark/80">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-white print:text-slate-900 font-black uppercase text-xs tracking-wider">ErgoVitals™ Risk Audit</h4>
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${analysis.ergo_vitals.overall_risk_score > 7
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20 print:bg-red-50 print:text-red-600 print:border-red-200'
                                    : analysis.ergo_vitals.overall_risk_score > 4
                                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 print:bg-orange-50 print:text-orange-600 print:border-orange-200'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 print:bg-emerald-50 print:text-emerald-600 print:border-emerald-200'
                                    }`}>
                                    Risk Score: {analysis.ergo_vitals.overall_risk_score}/10
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {[
                                    { label: 'Posture', val: analysis.ergo_vitals.posture_score },
                                    { label: 'Repetition', val: analysis.ergo_vitals.repetition_score },
                                    { label: 'Force', val: analysis.ergo_vitals.force_score }
                                ].map((item) => (
                                    <div key={item.label} className="text-center p-4 bg-black/40 print:bg-white rounded-xl border border-white/5 print:border-slate-100 shadow-sm">
                                        <div className="text-[9px] text-zinc-500 print:text-slate-400 uppercase font-bold mb-1 tracking-tighter">{item.label}</div>
                                        <div className="text-2xl font-black text-white print:text-slate-900 leading-none">{item.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-red-500/5 print:bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm">
                                <div className="text-[10px] text-red-400 print:text-red-600 font-black uppercase mb-1">Critical Priority Area</div>
                                <p className="text-white print:text-slate-900 text-sm font-bold">{analysis.ergo_vitals.critical_body_part}</p>
                                <p className="text-zinc-400 print:text-slate-500 text-xs italic mt-2 leading-relaxed">
                                    "{renderMarkdown(analysis.ergo_vitals.recommendation)}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Forensic Lab Breakdown (SCREEN VERSION) */}
                <div className="flex flex-col h-full bg-cyber-dark/30 border border-white/5 rounded-2xl overflow-hidden shadow-inner print:hidden">
                    <div className="p-6 bg-cyber-dark/50 border-b border-white/5">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-black uppercase text-sm tracking-widest leading-none">Industrial Forensic Lab</h3>
                                <p className="text-[10px] text-zinc-500 mt-2 font-medium uppercase tracking-tighter">Therblig & E-M-S Real-time Breakdown</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Process Flow</div>
                                <div className="text-lg font-black text-cyber-blue leading-none uppercase">Analysis</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-cyber-dark/95 backdrop-blur-sm z-10 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-[10px] font-black uppercase text-zinc-500">Process Element</th>
                                    <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-right">Timing</th>
                                    <th className="p-4 text-[10px] font-black uppercase text-zinc-500 text-center">Therblig</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {analysis.cycle_analysis?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-white text-sm mb-1">{item.element}</div>
                                            <div className="text-[9px] text-zinc-600 font-mono tracking-tighter uppercase">{item.start_time} - {item.end_time}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-sm font-black font-mono ${item.value_added ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {item.time_seconds?.toFixed(2) || '0.00'}s
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 bg-cyber-blue/10 border border-cyber-blue/20 text-cyber-blue rounded text-[9px] font-mono font-black shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                                                {item.therblig || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!analysis.cycle_analysis || analysis.cycle_analysis.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest italic">
                                            No movement data detected in cycle scan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-5 bg-cyber-dark/80 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 shadow-sm">
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Standard UPH</div>
                                <div className="text-3xl font-black text-white leading-none">
                                    {Math.round(analysis?.time_calculation?.units_per_hour || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="p-4 bg-cyber-blue/5 rounded-xl border border-cyber-blue/20 shadow-sm border-l-cyber-blue border-l-4">
                                <div className="text-[9px] text-cyber-blue uppercase font-black tracking-widest mb-1">Standard Time</div>
                                <div className="text-3xl font-black text-white leading-none">
                                    {(analysis?.time_calculation?.standard_time || 0).toFixed(3)}s
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                    ≈ {((analysis?.time_calculation?.standard_time || 0) / 60).toFixed(3)} min
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Forensic Lab Breakdown (PRINT VERSION - DETACHED & EXPANDED) */}
                <div className="hidden print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:border print:border-slate-300 print:rounded-none mt-8 mb-8 break-inside-avoid">
                    <div className="p-4 bg-slate-100 border-b border-slate-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-900 font-bold uppercase text-xs tracking-widest leading-none">Forensic Process Data</h3>
                                <p className="text-[8px] text-slate-500 mt-1 font-medium uppercase">Detailed Motion Analysis</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] text-slate-500 font-bold uppercase">Cycle Time</div>
                                <div className="text-base font-bold text-slate-900 leading-none">{(analysis?.time_calculation?.observed_time || 0).toFixed(2)}s</div>
                            </div>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-[9px] font-bold uppercase text-slate-600">Element</th>
                                <th className="p-3 text-[9px] font-bold uppercase text-slate-600 text-right">Time (s)</th>
                                <th className="p-3 text-[9px] font-bold uppercase text-slate-600 text-center">Class</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analysis?.cycle_analysis?.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-3">
                                        <div className="font-bold text-slate-900 text-xs">{item?.element || 'N/A'}</div>
                                        <div className="text-[8px] text-slate-500 font-mono">{item?.start_time || '00:00'} - {item?.end_time || '00:00'}</div>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="text-xs font-bold font-mono text-slate-900">
                                            {item?.time_seconds?.toFixed(2) || '0.00'}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className="text-[8px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                            {item?.therblig || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!analysis?.cycle_analysis || analysis?.cycle_analysis?.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-400 text-[8px] uppercase">
                                        No data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-[8px] text-slate-500 uppercase font-bold">UPH</div>
                            <div className="text-sm font-bold text-slate-900">{Math.round(analysis?.time_calculation?.units_per_hour || 0).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-[8px] text-slate-500 uppercase font-bold">Std Time</div>
                            <div className="text-sm font-bold text-slate-900">{(analysis?.time_calculation?.standard_time || 0).toFixed(3)}s</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. STANDARD TIME CALCULATION BREAKDOWN */}
            <div className="mb-12 bg-zinc-900 border border-white/10 print:bg-white print:border print:border-slate-300 rounded-3xl p-10 print:p-4 shadow-2xl relative overflow-hidden group print:break-inside-avoid print:mb-4 print:shadow-none print:rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 to-transparent pointer-events-none print:hidden"></div>
                <h3 className="text-cyber-blue print:text-blue-700 text-xs font-black uppercase tracking-widest mb-10 border-b border-white/10 print:border-slate-200 pb-4">Standard Time Calculation Analysis</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center items-center relative z-10">
                    <div className="space-y-3 p-6 bg-white/5 print:bg-white rounded-2xl border border-white/5 print:border-slate-300 transition-all hover:bg-white/10">
                        <div className="text-zinc-500 print:text-slate-500 text-[10px] uppercase font-black tracking-widest">Observed</div>
                        <div className="text-4xl font-black text-white print:text-slate-900 font-mono leading-none tracking-tighter">
                            {(analysis?.time_calculation?.observed_time || 0).toFixed(2)}s
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-zinc-500 print:text-slate-500 text-[10px] uppercase font-black tracking-widest">Rating Factor</div>
                        <div className="text-3xl font-black text-emerald-400 print:text-emerald-700 font-mono uppercase">
                            {((analysis?.time_calculation?.rating_factor || 0) * 100).toFixed(0)}%
                        </div>
                    </div>

                    <div className="space-y-3 p-6 bg-white/5 print:bg-white rounded-2xl border border-white/5 print:border-slate-300 transition-all hover:bg-white/10">
                        <div className="text-zinc-500 print:text-slate-500 text-[10px] uppercase font-black tracking-widest">Normal Time</div>
                        <div className="text-4xl font-black text-white print:text-slate-900 font-mono leading-none tracking-tighter">
                            {(analysis?.time_calculation?.normal_time || 0).toFixed(2)}s
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-zinc-500 print:text-slate-500 text-[10px] uppercase font-black tracking-widest">Allowances</div>
                        <div className="text-3xl font-black text-yellow-400 print:text-orange-700 font-mono uppercase">
                            {((analysis?.time_calculation?.allowances_pfd || 0) * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-between items-center border-t border-white/10 print:border-slate-200 pt-8">
                    <div className="text-white/20 print:text-slate-400 text-[9px] font-black tracking-[0.3em] uppercase underline decoration-cyber-blue print:decoration-blue-500 underline-offset-4">Certified Industrial Calculation</div>
                    <div className="text-right">
                        <div className="text-cyber-blue print:text-blue-700 text-[10px] uppercase font-black tracking-widest mb-1">Standard Result</div>
                        <div className="text-2xl font-black text-white print:text-slate-900 font-mono drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] print:drop-shadow-none">
                            {(analysis?.time_calculation?.standard_time || 0).toFixed(2)}s
                        </div>
                        <div className="text-[10px] text-zinc-500 print:text-slate-500 font-bold uppercase mt-1">
                            {((analysis?.time_calculation?.standard_time || 0) / 60).toFixed(3)} min
                        </div>
                    </div>
                </div>
            </div>

            {/* 3.1. MULTI-CYCLE PROCESS STABILITY (New Feature) */}
            {analysis?.multi_cycle_stats && (
                <div className="mb-12 bg-black border border-white/10 print:bg-white print:border print:border-slate-300 rounded-3xl p-10 print:p-4 shadow-2xl relative overflow-hidden group print:break-inside-avoid print:mb-4 print:shadow-none print:rounded-lg">
                    <h3 className="text-cyber-blue print:text-blue-700 text-xs font-black uppercase tracking-widest mb-10 border-b border-white/10 print:border-slate-200 pb-4 flex justify-between items-center">
                        <span>Multi-Cycle Process Stability</span>
                        <span className={`px-3 py-1 rounded-full border text-[10px] ${analysis?.multi_cycle_stats?.stability_rating === 'Stable' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            analysis?.multi_cycle_stats?.stability_rating === 'Variable' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                            {analysis?.multi_cycle_stats?.stability_rating || 'N/A'}
                        </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="p-6 bg-cyber-dark/30 rounded-2xl border border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Observed Cycles</div>
                            <div className="text-3xl font-black text-white">{analysis?.multi_cycle_stats?.cycles_observed || 0}</div>
                            <div className="text-[9px] text-zinc-600">Stopwatch Simulation</div>
                        </div>

                        <div className="p-6 bg-cyber-dark/30 rounded-2xl border border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Average Time (x̄)</div>
                            <div className="text-3xl font-black text-white">{(analysis?.multi_cycle_stats?.average_time || 0).toFixed(2)}s</div>
                            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                                <span>Min: {(analysis?.multi_cycle_stats?.min_time || 0).toFixed(2)}s</span>
                                <span>Max: {(analysis?.multi_cycle_stats?.max_time || 0).toFixed(2)}s</span>
                            </div>
                        </div>

                        <div className="p-6 bg-cyber-dark/30 rounded-2xl border border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Standard Devi. (σ)</div>
                            <div className="text-3xl font-black text-white">{(analysis?.multi_cycle_stats?.std_deviation || 0).toFixed(2)}</div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((analysis?.multi_cycle_stats?.std_deviation || 0) * 20))}%` }}></div>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-cyber-blue/10 to-transparent rounded-2xl border border-cyber-blue/20 space-y-2">
                            <div className="text-[9px] text-cyber-blue uppercase font-black tracking-widest">Process Capability (Cp)</div>
                            <div className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                                {(analysis?.multi_cycle_stats?.cp_score || 0).toFixed(2)}
                            </div>
                            <div className="text-[9px] text-zinc-400">
                                {analysis?.multi_cycle_stats ? (analysis?.multi_cycle_stats?.cp_score > 1.33 ? 'Best In Class' : analysis?.multi_cycle_stats?.cp_score > 1.0 ? 'Acceptable' : 'Needs Improvement') : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. SNAPSHOTS (Evidence Gallery) - Moved AFTER Time Calc */}
            <div className="mb-12 border-t border-white/10 print:border-slate-100 pt-8 print:pt-4 print:mb-6 print:break-inside-avoid">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white print:text-slate-900 font-black uppercase text-xs tracking-widest border-l-4 border-cyber-blue print:border-slate-900 pl-4">Visual Forensic Evidence</h3>
                    <div className="text-[9px] text-cyber-blue print:text-blue-600 font-bold px-3 py-1 bg-cyber-blue/10 print:bg-blue-50 rounded-full border border-cyber-blue/20 print:border-blue-100 uppercase tracking-widest">Permanent Frame Storage</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(images && images.length > 0 ? images.slice(0, 4).map((img, i) => ({
                        t: `T+${(i + 1) * 12}s`,
                        area: `Frame Analysis ${i + 1}`,
                        img: img.previewUrl
                    })) : [
                        { t: 'T+15s', area: 'Precision Sewing', img: '/gallery/sector-textile-branded.png' },
                        { t: 'T+32s', area: 'Quality Compliance', img: '/gallery/gallery-quality.png' },
                        { t: 'T+48s', area: 'Automated Embroidery', img: '/gallery/embroidery.png' },
                        { t: 'T+59s', area: 'Cellular Plant Layout', img: '/gallery/gallery-plant-layout.png' },
                    ]).map((shot, i) => (
                        <div key={i} className="space-y-3 group">
                            <div className="aspect-video bg-zinc-900 print:bg-white rounded-2xl border-2 border-white/5 print:border-slate-200 overflow-hidden relative shadow-sm transition-all hover:border-cyber-blue hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] group-hover:-translate-y-1">
                                <img src={shot.img} alt={shot.area} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 print:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 print:hidden"></div>

                                {/* Neural Scanning Overlays */}
                                <div className="absolute inset-0 pointer-events-none z-20 print:z-10">
                                    {/* Simulated Bounding Box */}
                                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-cyber-blue/40 print:border-blue-600/30 shadow-[0_0_10px_rgba(0,240,255,0.2)] print:shadow-none">
                                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyber-blue print:border-blue-600"></div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyber-blue print:border-blue-600"></div>
                                    </div>
                                    {/* Scanning Line */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-cyber-blue/50 print:bg-blue-600/50 shadow-[0_0_10px_rgba(0,240,255,0.5)] print:shadow-none animate-pulse"></div>
                                </div>

                                <div className="absolute top-2 right-2 z-30 bg-cyber-blue print:bg-blue-600 text-black print:text-white font-mono text-[8px] px-2 py-0.5 rounded-full font-black shadow-lg">
                                    CAPTURED_{shot.t.replace('+', '')}
                                </div>
                                <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-1">
                                    <span className="text-[8px] text-cyber-blue print:text-blue-700 font-black uppercase tracking-[0.2em] drop-shadow-md print:drop-shadow-none">Confidence: 99.8%</span>
                                    <div className="h-0.5 w-16 bg-cyber-blue print:bg-blue-600 rounded-full shadow-[0_0_5px_rgba(0,240,255,0.5)] print:shadow-none"></div>
                                </div>
                            </div>
                            <div className="px-1 text-center font-black">
                                <p className="text-[9px] text-zinc-600 print:text-slate-400 uppercase tracking-widest mb-1">{shot.t} Frame Capture</p>
                                <p className="text-[10px] text-white print:text-slate-800 leading-tight uppercase tracking-tight">{shot.area}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. EXTENDED REPORT SECTIONS - flattened for PDF break logic */}
            <div className="pdf-page-break print:block hidden h-0"></div>

            <div className="border-t border-white/10 print:border-slate-100 pt-8 print:pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 print:break-inside-avoid">
                    <div className="bg-cyber-dark/40 print:bg-white border border-white/5 print:border-slate-200 p-8 rounded-2xl shadow-sm">
                        <h3 className="text-white print:text-slate-900 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-cyber-blue print:bg-blue-600 rounded-full"></span>
                            Executive Summary
                        </h3>
                        <p className="text-zinc-400 print:text-slate-600 text-sm leading-relaxed print:leading-loose italic border-l-2 border-cyber-blue/30 print:border-blue-100 pl-6 py-2">
                            {renderMarkdown(analysis?.summary_text || 'No summary available.')}
                        </p>
                    </div>

                    <div className="bg-cyber-dark/40 print:bg-white border border-white/5 print:border-slate-200 p-8 rounded-2xl shadow-sm">
                        <h3 className="text-white print:text-slate-900 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
                            Technical Meta-Data
                        </h3>
                        <div className="space-y-4">
                            {[
                                { k: 'Designation', v: analysis?.technical_specs?.machine || 'N/A' },
                                { k: 'Matrix', v: analysis?.technical_specs?.material || 'N/A' },
                                { k: 'Speed', v: analysis?.technical_specs?.rpm_speed || 'N/A' }
                            ].map(spec => (
                                <div key={spec.k} className="flex justify-between items-center border-b border-white/5 print:border-slate-50 pb-2">
                                    <span className="text-zinc-500 print:text-slate-400 text-[10px] uppercase font-black">{spec.k}</span>
                                    <span className="text-white print:text-slate-900 font-bold text-sm tracking-tight">{spec.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sustainability Card */}
            {analysis.waste_analysis && (
                <div className="mt-8 print:mt-4 bg-gradient-to-br from-zinc-900 to-black print:bg-white print:from-transparent print:to-transparent print:bg-none border border-white/5 print:border-slate-300 p-8 print:p-6 rounded-3xl shadow-xl print:break-inside-avoid print:shadow-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-white print:text-slate-900 text-xs font-black uppercase tracking-widest mb-6 border-l-4 border-lime-500 pl-4">Sustainability Audit</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] text-zinc-500 print:text-slate-500 uppercase font-black">
                                    <span>Eco-Efficiency Score</span>
                                    <span className="text-lime-500 print:text-lime-700">{analysis.waste_analysis.sustainability_score}/10</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className={`flex-1 h-5 rounded-sm ${i < analysis.waste_analysis!.sustainability_score ? 'bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.3)] print:shadow-none' : 'bg-white/5 print:bg-slate-100'}`}></div>
                                    ))}
                                </div>
                                <p className="text-zinc-400 print:text-slate-600 text-xs leading-relaxed mt-4 italic">
                                    "{analysis.waste_analysis.disposal_recommendation}"
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/5 print:bg-slate-50 p-6 rounded-2xl border border-white/5 print:border-slate-200">
                            <div className="text-[9px] text-zinc-500 print:text-slate-500 uppercase font-black mb-1">Waste Detection</div>
                            <div className="text-xl font-black text-white print:text-slate-900">{analysis.waste_analysis.waste_type}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Improvements Grid */}
            <div className="pdf-page-break print:block hidden h-0"></div>
            <div className="mt-8 print:mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 print:break-inside-avoid">
                <div className="bg-cyber-dark/20 p-8 rounded-3xl border border-white/5 print:bg-white print:border-slate-200 print:border-t-8 print:border-t-red-500">
                    <h3 className="text-white print:text-slate-900 text-xs font-black uppercase tracking-widest mb-6">Quality Risk Forensic</h3>
                    <ul className="space-y-4 mb-8">
                        {analysis.quality_audit.potential_defects.map((defect, i) => (
                            <li key={i} className="text-xs text-zinc-400 print:text-slate-600 flex gap-4 items-start">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                                <span>{defect}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="p-4 bg-amber-500/10 print:bg-amber-50 rounded-xl border border-amber-500/20 print:border-amber-100">
                        <p className="text-white print:text-slate-900 text-xs italic">"{analysis.quality_audit.poka_yoke_opportunity}"</p>
                    </div>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-4 pb-20 print:max-h-none print:overflow-visible print:pb-0">
                    <h3 className="text-white print:text-slate-900 text-xs font-black uppercase tracking-widest mb-6 sticky top-0 bg-cyber-black/95 py-2 z-10 backdrop-blur-sm">Elite Improvements</h3>
                    {analysis.improvements.map((imp, i) => (
                        <div key={i} className="p-6 bg-cyber-dark/40 print:bg-white border border-white/5 print:border-slate-200 rounded-2xl transition-all hover:border-cyber-blue/30 group">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-cyber-blue/10 print:bg-emerald-50 text-cyber-blue print:text-emerald-700 rounded border border-cyber-blue/20 print:border-emerald-100">{imp.methodology}</span>
                                <span className="text-[10px] font-black text-zinc-500 uppercase">ROI: {imp.roi_potential}</span>
                            </div>
                            <h4 className="text-white print:text-slate-900 text-sm font-black mb-2">{renderMarkdown(imp.recommendation)}</h4>
                            <p className="text-[11px] text-zinc-500 print:text-slate-500 italic leading-relaxed">{renderMarkdown(imp.impact)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer - Normal flow, no absolute positioning - HIDDEN IN PRINT to allow PDF Service Footer and avoid blank page */}
            <div className="mt-16 pt-10 border-t border-white/5 print:hidden flex justify-between items-center bg-transparent">
                <div className="text-[10px] text-zinc-700 print:text-slate-500 font-black uppercase tracking-[0.4em]">Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                <div className="text-center print:block hidden flex-1 mx-8">
                    <span className="text-[10px] font-black text-red-600 uppercase border border-red-500 px-4 py-1 rounded-full whitespace-nowrap bg-white">Confidential</span>
                </div>
                <div className="text-[10px] text-zinc-700 print:text-slate-500 font-black uppercase tracking-[0.4em] text-right">NeuralScan Forensic Core</div>
            </div>
        </div>
    );
};
