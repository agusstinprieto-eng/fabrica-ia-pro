import React from 'react';
import { IndustrialAnalysis, CycleElement, TimeCalculation, QualityAudit, ProcessImprovement } from '../types';
import { Tooltip } from './common/Tooltip';
import { alignTimestamps } from '../services/motionAnalyzer';

interface DashboardProps {
    data: IndustrialAnalysis;
    videoFile?: File;
}

export const EngineeringDashboard: React.FC<DashboardProps> = ({ data: initialData, videoFile }) => {
    // Local state for data (allows for corrections)
    const [data, setData] = React.useState<IndustrialAnalysis>(initialData);

    // Sync with props
    React.useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // State for motion analysis
    const [motionPoints, setMotionPoints] = React.useState<any[]>([]);
    const [isMotionAnalyzing, setIsMotionAnalyzing] = React.useState(false);
    const [corrections, setCorrections] = React.useState<string[]>([]);

    // Run motion analysis when video changes
    React.useEffect(() => {
        if (videoFile) {
            setIsMotionAnalyzing(true);
            setCorrections([]);
            import('../services/motionAnalyzer').then(({ analyzeMotion }) => {
                analyzeMotion(videoFile, 5) // 5fps is enough for visualization
                    .then(points => {
                        setMotionPoints(points);
                        setIsMotionAnalyzing(false);

                        // AUTO-CORRECT TIMESTAMPS (Option B)
                        if (data && data.cycle_analysis) {
                            const { alignedElements, corrections: newCorrections } = alignTimestamps(data.cycle_analysis, points);

                            if (newCorrections.length > 0) {
                                console.log("Applying Motion Corrections:", newCorrections);
                                setCorrections(newCorrections);

                                // Recalculate Totals
                                const newObservedTime = alignedElements.reduce((sum: number, el: any) => sum + (el.time_seconds || 0), 0);
                                const rating = data.time_calculation?.rating_factor || 1.0;
                                const allowances = data.time_calculation?.allowances_pfd || 0.12;
                                const newNormalTime = newObservedTime * rating;
                                const newStandardTime = newNormalTime * (1 + allowances);
                                const newUPH = newStandardTime > 0 ? 3600 / newStandardTime : 0;

                                setData(prev => ({
                                    ...prev,
                                    cycle_analysis: alignedElements,
                                    time_calculation: {
                                        ...prev.time_calculation,
                                        observed_time: newObservedTime,
                                        normal_time: newNormalTime,
                                        standard_time: newStandardTime,
                                        units_per_hour: newUPH,
                                        units_per_shift: newUPH * 8
                                    }
                                }));
                            }
                        }
                    })
                    .catch(err => {
                        console.error("Motion analysis failed", err);
                        setIsMotionAnalyzing(false);
                    });
            });
        }
    }, [videoFile, initialData]); // Depend on initialData to re-run if data changes? Maybe just trigger once.

    const renderMarkdown = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <span key={pIdx} className="text-blue-400 print:text-indigo-600 font-bold">
                        {part.slice(2, -2)}
                    </span>
                );
            }
            return part;
        });
    };

    if (!data || !data.technical_specs || !data.time_calculation) {
        return (
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-center">
                <h3 className="text-red-500 font-bold uppercase tracking-widest mb-2">Analysis Data Incomplete</h3>
                <p className="text-sm text-red-300">The engineering data could not be fully parsed. Please try again or check the input.</p>
                <div className="mt-4 text-xs font-mono text-slate-500 text-left bg-black/50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(data, null, 2)}
                </div>
            </div>
        );
    }

    // Helper for generating tooltip content
    const KPITooltipContent = (title: string, formula: string, example: string) => (
        <div className="space-y-2">
            <h4 className="font-bold text-amber-500 uppercase tracking-wider border-b border-amber-500/30 pb-1">{title}</h4>
            <div>
                <span className="text-slate-400 font-bold block mb-1">Formula:</span>
                <code className="bg-black/50 px-2 py-1 rounded block text-cyan-400 font-mono text-[10px]">{formula}</code>
            </div>
            <div>
                <span className="text-slate-400 font-bold block mb-1">Example:</span>
                <p className="text-slate-300 italic text-[10px] leading-relaxed">{example}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-mono">

            {/* 1. EXECUTIVE SUMMARY & SPECS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Executive Summary</h3>
                    <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-blue-500 pl-4">{renderMarkdown(data.summary_text)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">Technical Specs</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">Operation</span>
                            <span className="text-white font-bold">{data.operation_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">Machine</span>
                            <span className="text-white font-bold">{data.technical_specs.machine}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">Material</span>
                            <span className="text-white font-bold">{data.technical_specs.material}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CYCLE TIME ANALYSIS (VISUAL BAR) */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-purple-400 text-xs font-black uppercase tracking-widest">Cycle Analysis (Methods Breakdown)</h3>
                    <Tooltip content={KPITooltipContent(
                        "Observed Time",
                        "Sum(Element Times) or Avg(Cycles)",
                        "The actual time measured from video without any adjustments. E.g., Sum of 5 steps: 3s + 2s + 4s + 1s + 2s = 12s."
                    )}>
                        <div className="cursor-help border-b border-dashed border-slate-500 pb-0.5">
                            <span className="text-white font-bold text-lg">{data.time_calculation.observed_time.toFixed(2)}s <span className="text-xs text-slate-500 font-normal">Observed</span></span>
                        </div>
                    </Tooltip>
                </div>

                {/* Visual Bar Chart */}
                <div className="flex w-full h-8 rounded-full overflow-hidden mb-6 bg-slate-800">
                    {data.cycle_analysis?.map((step, idx) => {
                        const widthPct = (step.time_seconds / data.time_calculation.observed_time) * 100;
                        return (
                            <Tooltip
                                key={idx}
                                className="h-full"
                                style={{ width: `${widthPct}%` }}
                                content={
                                    <div className="w-48">
                                        <div className="font-bold text-white mb-1">{step.element}</div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Time:</span>
                                            <span className="text-cyan-400">{step.time_seconds}s</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Type:</span>
                                            <span className={step.value_added ? "text-emerald-400" : "text-red-400"}>
                                                {step.value_added ? "Value Added" : "Non-Value Added"}
                                            </span>
                                        </div>
                                    </div>
                                }
                            >
                                <div
                                    className={`h-full border-r border-slate-900 flex items-center justify-center text-[9px] font-bold text-black/70 truncate px-1 transition-all hover:opacity-80 relative w-full
                                    ${step.value_added ? 'bg-emerald-500' : 'bg-red-400'}
                                    `}
                                >
                                    {step.time_seconds > 0.5 && step.element.substring(0, 5)}
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>

                {/* Motion Analysis Graph (Option B - Scientific Validation) */}
                {motionPoints.length > 0 && (
                    <div className="mb-6 bg-black/40 p-4 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-cyan-500">
                                <i className="fas fa-wave-square mr-2"></i>
                                Motion Analysis (Pixel Intensity)
                            </h4>
                            <span className="text-[9px] text-slate-500 uppercase">Scientific Validation</span>
                        </div>
                        <div className="relative h-16 w-full flex items-end gap-[1px] bg-slate-900/50 rounded overflow-hidden">
                            {motionPoints.map((point, idx) => {
                                // Normalize height (max intensity ~ 100)
                                const heightPct = Math.min(100, point.intensity);
                                // Color Map based on intensity
                                const colorClass = heightPct > 50 ? 'bg-cyan-400' : heightPct > 20 ? 'bg-cyan-600' : 'bg-slate-700';

                                return (
                                    <div
                                        key={idx}
                                        className={`flex-1 ${colorClass} transition-all hover:bg-white`}
                                        style={{ height: `${heightPct}%` }}
                                        title={`Time: ${point.time.toFixed(1)}s | Motion: ${point.intensity}%`}
                                    />
                                );
                            })}

                            {/* Overlay Time Markers (Simple Grid) */}
                            <div className="absolute inset-0 pointer-events-none flex justify-between px-1">
                                <div className="h-full w-px bg-white/10"></div>
                                <div className="h-full w-px bg-white/10"></div>
                                <div className="h-full w-px bg-white/10"></div>
                                <div className="h-full w-px bg-white/10"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 mt-1 font-mono">
                            <span>0s</span>
                            <span>{(motionPoints[motionPoints.length - 1]?.time || 0).toFixed(1)}s</span>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="flex gap-4 justify-center text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-6">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Value Added</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full"></div> Non-Value Added (Waste)</div>
                </div>

                {/* Breakdown Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-slate-500 border-b border-slate-800">
                            <tr>
                                <th className="py-2">No.</th>
                                <th className="py-2">Element</th>
                                <th className="py-2">Code</th>
                                <th className="py-2 text-right">Time (s)</th>
                                <th className="py-2 text-right">Therblig</th>
                                <th className="py-2 text-right">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {data.cycle_analysis?.map((step, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50">
                                    <td className="py-2 text-slate-600">{idx + 1}</td>
                                    <td className="py-2 font-bold text-white">{step.element}</td>
                                    <td className="py-2 text-slate-500 font-mono">{step.code || '-'}</td>
                                    <td className="py-2 text-right font-mono text-cyan-400">{step.time_seconds?.toFixed(2) || '0.00'}</td>
                                    <td className="py-2 text-right">
                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-blue-400 border border-blue-500/20">{step.therblig || '-'}</span>
                                    </td>
                                    <td className={`py-2 text-right font-bold ${step.value_added ? 'text-emerald-500' : 'text-red-400'}`}>
                                        {step.value_added ? 'VA' : 'NVA'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2.5 MTM-1 STANDARD ANALYSIS (NEW) */}
            {data.mtm_analysis && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <i className="fas fa-stopwatch text-6xl text-cyan-500"></i>
                    </div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-cyan-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-drafting-compass"></i> MTM-1 Standard Analysis
                        </h3>
                        <div className="bg-cyan-500/10 border border-cyan-500/50 px-3 py-1 rounded-lg">
                            <span className="text-cyan-400 font-black text-lg">{data.mtm_analysis.total_tmu} TMU</span>
                            <span className="text-[10px] text-slate-500 ml-2 uppercase font-bold tracking-wider">
                                (≈ {(data.mtm_analysis.total_tmu * 0.036).toFixed(2)}s)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="py-2">Therblig</th>
                                    <th className="py-2">Code</th>
                                    <th className="py-2">Hand</th>
                                    <th className="py-2">Description</th>
                                    <th className="py-2 text-right">TMU</th>
                                    <th className="py-2 text-right">Time (s)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {data.mtm_analysis.codes?.map((code: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-800/50">
                                        <td className="py-2 font-mono text-blue-400">{code.code?.substring(0, 1) || '-'}</td>
                                        <td className="py-2 font-black text-white">{code.code}</td>
                                        <td className="py-2 text-slate-400">{code.hand || '-'}</td>
                                        <td className="py-2 text-slate-400 italic">{code.description}</td>
                                        <td className="py-2 text-right font-mono text-cyan-400">{code.tmu}</td>
                                        <td className="py-2 text-right text-slate-500">{(code.tmu * 0.036).toFixed(3)}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                        <span>* 1 TMU = 0.036 seconds = 0.00001 hours</span>
                        <span>Method: MTM-1 (Methods-Time Measurement)</span>
                    </div>
                </div>
            )}

            {/* 3. TIME CALCULATION & STANDARD TIME */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">Standard Time Calculation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <Tooltip content={KPITooltipContent(
                            "Observed Time (OT)",
                            "∑ Element Times",
                            "Raw time recorded from the operation. E.g., 25.5s"
                        )}>
                            <div className="bg-slate-800/50 p-4 rounded-lg cursor-help border border-transparent hover:border-slate-600 transition-colors">
                                <div className="text-slate-500 text-[10px] uppercase mb-1">Observed</div>
                                <div className="text-xl font-mono text-white">{data.time_calculation.observed_time.toFixed(2)}s</div>
                            </div>
                        </Tooltip>

                        <div className="flex flex-col justify-center items-center relative">
                            <span className="text-slate-600 text-xs">x Rating</span>
                            <Tooltip content={KPITooltipContent(
                                "Rating Factor (Westinghouse)",
                                "1.00 + Skill + Effort + Conditions + Consistency",
                                "Speed rating. 100% is normal. 110% means operator is 10% faster than standard. E.g., Good Skill (+0.05) + Excellent Effort (+0.05) = 1.10"
                            )}>
                                <span className="text-emerald-400 font-bold font-mono cursor-help border-b border-dashed border-emerald-500/50">{((data?.time_calculation?.rating_factor || 1) * 100).toFixed(0)}%</span>
                            </Tooltip>
                        </div>

                        <Tooltip content={KPITooltipContent(
                            "Normal Time (NT)",
                            "Observed Time × Rating Factor",
                            `Time required for a standard operator working at normal pace. E.g., 25.5s × 1.10 = ${28.05}s`
                        )}>
                            <div className="bg-slate-800/50 p-4 rounded-lg cursor-help border border-transparent hover:border-slate-600 transition-colors">
                                <div className="text-slate-500 text-[10px] uppercase mb-1">Normal Time</div>
                                <div className="text-xl font-mono text-white">{(data?.time_calculation?.normal_time || 0).toFixed(2)}s</div>
                            </div>
                        </Tooltip>

                        <div className="flex flex-col justify-center items-center relative">
                            <span className="text-slate-600 text-xs">+ Allowances</span>
                            <Tooltip content={KPITooltipContent(
                                "Allowances (PFD)",
                                "Personal + Fatigue + Delay",
                                "Adjustments for human needs. E.g., 5% Personal + 4% Fatigue + 3% Delay = 12% (1.12 multiplier)"
                            )}>
                                <span className="text-yellow-400 font-bold font-mono cursor-help border-b border-dashed border-yellow-500/50">{((data?.time_calculation?.allowances_pfd || 0) * 100).toFixed(0)}%</span>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="mt-6 bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl flex justify-between items-center group relative">
                        <div className="text-cyan-400 font-bold text-sm uppercase tracking-widest">Standard Time</div>
                        <Tooltip className="text-right" content={KPITooltipContent(
                            "Standard Time (ST)",
                            "Normal Time × (1 + Allowances)",
                            `Final output standard. E.g., ${(data?.time_calculation?.normal_time || 0).toFixed(2)}s × (1 + ${(data?.time_calculation?.allowances_pfd || 0).toFixed(2)}) = ${(data?.time_calculation?.standard_time || 0).toFixed(2)}s`
                        )}>
                            <div className="cursor-help">
                                <div className="text-4xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                                    {(data?.time_calculation?.standard_time || 0).toFixed(3)} <span className="text-sm text-cyan-600">sec</span>
                                </div>
                                <div className="text-sm font-mono text-cyan-400/80">
                                    ≈ {((data?.time_calculation?.standard_time || 0) / 60).toFixed(3)} <span className="text-xs">min</span>
                                </div>
                            </div>
                        </Tooltip>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                    <h3 className="text-orange-400 text-xs font-black uppercase tracking-widest mb-4">Capacity Planning</h3>
                    <div className="space-y-6">
                        <Tooltip content={KPITooltipContent(
                            "Units Per Hour (UPH)",
                            "3600 sec / Standard Time (sec)",
                            `Theoretical max output per hour. E.g., 3600 / ${(data?.time_calculation?.standard_time || 0).toFixed(1)} = ${Math.round(data?.time_calculation?.units_per_hour || 0)} units`
                        )}>
                            <div className="cursor-help">
                                <div className="text-slate-500 text-[10px] uppercase">Units Per Hour (UPH)</div>
                                <div className="text-3xl font-black text-white font-mono">{Math.round(data?.time_calculation?.units_per_hour || 0).toLocaleString()}</div>
                            </div>
                        </Tooltip>
                        <Tooltip content={KPITooltipContent(
                            "Units Per Shift",
                            "UPH × Shift Hours (8)",
                            `Output for a full 8-hour shift at 100% efficiency. E.g., ${Math.round(data?.time_calculation?.units_per_hour || 0)} × 8 = ${Math.round(data?.time_calculation?.units_per_shift || 0).toLocaleString()}`
                        )}>
                            <div className="cursor-help">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Units per Hour (UPH)</div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                        {Math.round(data.time_calculation.units_per_hour || 0).toLocaleString()}
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 mt-4">Units per Shift (8h)</div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-white font-mono">
                                        {Math.round(data.time_calculation.units_per_shift || (data.time_calculation.units_per_hour || 0 * 8)).toLocaleString()}
                                    </div>
                                    <div className="w-16 h-1 bg-cyan-500/50 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                                </div>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* 3.1 ERGOVITALS FALLBACK */}
            {data.ergo_vitals && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-purple-400 text-xs font-black uppercase tracking-widest mb-4">ErgoVitals™ Risk Audit</h3>
                    <div className="flex flex-wrap gap-8 items-center justify-between">
                        <div className="flex justify-center gap-4 mt-8">
                            <Tooltip content={KPITooltipContent(
                                "REBA/RULA Score",
                                "Posture + Force + Repetition + Coupling",
                                "Ergonomic risk index. 1-3: Low Risk, 4-7: Medium Risk, 8+: High Risk/Critical."
                            )}>
                                <div className="text-center bg-slate-800/50 p-3 rounded-xl border border-white/5 min-w-[80px] cursor-help">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Overall</div>
                                    <div className={`text-2xl font-black ${(data?.ergo_vitals?.overall_risk_score || 0) > 7 ? 'text-red-500' : 'text-emerald-400'}`}>{data?.ergo_vitals?.overall_risk_score || 0}</div>
                                </div>
                            </Tooltip>
                            <div className="text-center bg-slate-800/50 p-3 rounded-xl border border-white/5 min-w-[80px]">
                                <div className="text-[10px] text-slate-500 uppercase mb-1">Posture</div>
                                <div className="text-xl font-bold text-white">{data?.ergo_vitals?.posture_score || 0}</div>
                            </div>
                        </div>
                        <div className="flex-1 max-w-md">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1 flex items-center gap-2">
                                <i className="fas fa-exclamation-circle text-orange-500"></i>
                                Critical: {data?.ergo_vitals?.critical_body_part || 'N/A'}
                            </p>
                            <p className="text-white text-sm italic">"{data?.ergo_vitals?.recommendation || 'No specific ergonomic recommendations.'}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3.5 MATERIAL & WASTE ANALYSIS */}
            {data.material_calculation && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Material BOM Table */}
                    <div className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-pink-400 text-xs font-black uppercase tracking-widest mb-4">Material Bill of Materials (BOM)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 border-b border-slate-800">
                                    <tr>
                                        <th className="py-2">Material Name</th>
                                        <th className="py-2 text-right">Qty / Unit</th>
                                        <th className="py-2 text-right">Waste %</th>
                                        <th className="py-2 text-right">Cost Est.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {data.material_calculation.material_list?.map((mat, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/50">
                                            <td className="py-2 font-bold text-white flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                                {mat.name}
                                            </td>
                                            <td className="py-2 text-right font-mono text-cyan-400">{typeof mat.quantity_estimated === 'number' ? mat.quantity_estimated.toLocaleString() : mat.quantity_estimated}</td>
                                            <td className="py-2 text-right font-mono text-red-400">
                                                {mat.waste_factor_percent ? `${mat.waste_factor_percent}%` : '-'}
                                            </td>
                                            <td className="py-2 text-right text-slate-500">{mat.unit_cost_estimate || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {data.material_calculation.total_material_cost_estimate && (
                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                                <span className="text-slate-500 text-xs uppercase">Est. Total Cost / Unit</span>
                                <span className="text-pink-400 font-bold font-mono text-lg">{data.material_calculation.total_material_cost_estimate}</span>
                            </div>
                        )}
                    </div>

                    {/* Waste & Sustainability */}
                    {data.waste_analysis && (
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                            <div>
                                <h3 className="text-lime-400 text-xs font-black uppercase tracking-widest mb-4">Eco-Efficiency</h3>
                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 p-3 rounded-lg border-l-2 border-lime-500">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1">Primary Waste Stream</div>
                                        <div className="text-white font-bold text-sm">{data.waste_analysis.waste_type}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Tooltip content={KPITooltipContent(
                                            "Sustainability Score",
                                            "Weighted Avg (Recyclability, Toxicity, Carbon)",
                                            "10 is perfectly sustainable. <5 indicates high environmental impact requiring mitigation."
                                        )}>
                                            <span className="text-slate-400 text-xs cursor-help border-b border-dashed border-slate-600">Sustainability Score</span>
                                        </Tooltip>
                                        <div className="flex items-center gap-1">
                                            {[...Array(10)].map((_, i) => (
                                                <div key={i} className={`w-1 h-3 rounded-full ${i < (data.waste_analysis?.sustainability_score || 0) ? 'bg-lime-500' : 'bg-slate-700'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1">Impact</div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.waste_analysis.environmental_impact === 'High' ? 'bg-red-500/20 text-red-400' :
                                            data.waste_analysis.environmental_impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {data.waste_analysis.environmental_impact}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Disposal Action</div>
                                <div className="text-white text-xs italic">"{data.waste_analysis.disposal_recommendation}"</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. QUALITY & IMPROVEMENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quality Audit */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    {data.quality_audit ? (
                        <>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-red-400 text-xs font-black uppercase tracking-widest">Quality Audit</h3>
                                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase 
                       ${data.quality_audit.risk_level === 'Critical' ? 'bg-red-500 text-white animate-pulse' :
                                        data.quality_audit.risk_level === 'High' ? 'bg-orange-500 text-black' :
                                            'bg-emerald-500 text-black'}`}>
                                    Risk: {data.quality_audit.risk_level}
                                </span>
                            </div>
                            <ul className="space-y-2 mb-4">
                                {data.quality_audit.potential_defects?.map((defect, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                                        <span className="text-red-500">•</span> {defect}
                                    </li>
                                ))}
                            </ul>
                            {/* ISO Compliance Hidden by User Request */}
                            {/* <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">ISO Compliance</div>
                                <div className="text-white text-xs font-mono">{data.quality_audit.iso_compliance}</div>
                            </div> */}
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Poka-Yoke Opportunity</div>
                                <div className="text-yellow-400 text-xs italic">"{data.quality_audit.poka_yoke_opportunity}"</div>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-500 text-sm italic p-4 text-center">Quality audit data not available.</div>
                    )}
                </div>

                {/* Improvements Grid */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">Elite Improvements</h3>
                    <div className="space-y-4 h-64 overflow-y-auto custom-scrollbar pr-2">
                        {data.improvements?.map((imp, idx) => (
                            <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-emerald-500">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-emerald-400 font-bold text-sm">{imp.methodology}</span>
                                    <span className="text-[9px] text-slate-500 uppercase border border-slate-600 px-2 rounded">ROI: {imp.roi_potential}</span>
                                </div>
                                <p className="text-white text-sm font-bold mb-1">{renderMarkdown(imp.recommendation)}</p>
                                <p className="text-slate-400 text-xs">{renderMarkdown(imp.issue)} → <span className="text-emerald-300 font-bold">{renderMarkdown(imp.impact)}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 5. ENGINEERING INTELLIGENCE (Dynamic Restoration) */}
            {data.engineering_intelligence && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg animate-in fade-in duration-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-microchip"></i>
                            Engineering Intelligence
                        </h3>
                        <span className="text-[10px] text-amber-500/50 font-mono">Optimization v2.0</span>
                    </div>
                    <div className="text-slate-300 text-sm">
                        <p className="font-bold text-emerald-400 mb-2">Estimated Reduction: {data.engineering_intelligence?.method_improvement?.estimated_time_reduction || 'N/A'}</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4 text-xs">
                            {data.engineering_intelligence?.method_improvement?.key_changes?.map((change: string, i: number) => (
                                <li key={i}>{change}</li>
                            ))}
                        </ul>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                            <p className="text-xs text-slate-400 italic">"{data.engineering_intelligence?.method_improvement?.image_prompt}"</p>
                            <span className="text-[10px] text-blue-500 mt-2 font-bold uppercase">Blueprint Prompt Active</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SAFETY & 5S AUDIT (Restored) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 5S VISUAL AUDIT */}
                {data.lean_metrics?.five_s_audit && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-tasks"></i> 5S Visual Audit
                            </h3>
                            <div className="bg-blue-500/20 px-3 py-1 rounded border border-blue-500/40">
                                <span className="text-blue-400 font-bold text-xs">{data.lean_metrics.five_s_audit.overall}/10 Overall</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-2 text-center">
                                {Object.entries(data.lean_metrics.five_s_audit).filter(([k]) => k !== 'overall').map(([key, score]) => (
                                    <div key={key} className="bg-slate-800 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1">{key.substring(0, 3)}</div>
                                        <div className={`font-bold ${Number(score) >= 8 ? 'text-emerald-400' : Number(score) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{score}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-[10px] text-slate-400 italic">
                                    "Sort, Set in order, Shine, Standardize, Sustain scores based on visual clutter and organization."
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SAFETY COMPLIANCE */}
                {data.safety_audit && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-orange-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-shield-alt"></i> Safety Compliance
                            </h3>
                            <span className={`px-3 py-1 rounded text-[10px] font-black uppercase ${data.safety_audit.safety_score >= 9 ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white animate-pulse'}`}>
                                Score: {data.safety_audit.safety_score}/10
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">PPE Detected</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.safety_audit.ppe_detected.length > 0 ? data.safety_audit.ppe_detected.map((ppe, i) => (
                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded flex items-center gap-1">
                                            <i className="fas fa-check"></i> {ppe}
                                        </span>
                                    )) : <span className="text-slate-500 text-xs">No PPE detected</span>}
                                </div>
                            </div>

                            {data.safety_audit.ppe_missing.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Missing PPE (Critical)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.safety_audit.ppe_missing.map((ppe, i) => (
                                            <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] rounded flex items-center gap-1">
                                                <i className="fas fa-times"></i> {ppe}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between">
                                <span className="text-xs text-slate-400">Hazard Violations:</span>
                                <span className={`font-mono font-bold ${data.safety_audit.hazard_zones_violations > 0 ? 'text-red-500' : 'text-slate-200'}`}>
                                    {data.safety_audit.hazard_zones_violations}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI DISCLAIMER */}
            <div className="mt-12 p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex justify-center gap-4 mt-8 items-center">
                    <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
                    <div>
                        <h4 className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">Industrial Disclaimer</h4>
                        <p className="text-[11px] text-slate-400">
                            <span className="block mb-1">AUTOMATED STUDY. Validation by a Process Engineer is recommended before implementing operational changes or wage adjustments.</span>
                            <span className="block text-slate-500">ESTUDIO AUTOMATIZADO. Validación por un Ingeniero de Procesos recomendada para la implementación de cambios operativos o ajustes salariales.</span>
                        </p>
                    </div>
                </div>
            </div>
            {/* BILINGUAL DISCLAIMER */}
            <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                <div className="max-w-3xl mx-auto space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        Disclaimer / Aviso Legal
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[10px] text-slate-600 leading-relaxed text-justify">
                        <div>
                            <strong className="block text-slate-500 mb-1">ENGLISH</strong>
                            This generic report is generated by AI (Artificial Intelligence) and is intended for reference purposes only.
                            It should not be considered a certified engineering study or professional advice.
                            Users must validate all data, timings, and recommendations with a qualified engineer before implementation.
                            Manufactura IA Pro assumes no liability for decisions made based on this automated analysis.
                        </div>
                        <div>
                            <strong className="block text-slate-500 mb-1">ESPAÑOL</strong>
                            Este reporte genérico es generado por IA (Inteligencia Artificial) y tiene fines únicamente de referencia.
                            No debe considerarse un estudio de ingeniería certificado ni asesoramiento profesional.
                            Los usuarios deben validar todos los datos, tiempos y recomendaciones con un ingeniero calificado antes de su implementación.
                            Manufactura IA Pro no asume ninguna responsabilidad por las decisiones tomadas con base en este análisis automatizado.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
