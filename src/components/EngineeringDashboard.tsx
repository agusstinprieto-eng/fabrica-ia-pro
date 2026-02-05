import React from 'react';
import { IndustrialAnalysis, CycleElement, TimeCalculation, QualityAudit, ProcessImprovement } from '../types';
import { Tooltip } from './common/Tooltip';

interface DashboardProps {
    data: IndustrialAnalysis;
}

export const EngineeringDashboard: React.FC<DashboardProps> = ({ data }) => {
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
                                <span className="text-emerald-400 font-bold font-mono cursor-help border-b border-dashed border-emerald-500/50">{(data?.time_calculation?.rating_factor || 0 * 100).toFixed(0)}%</span>
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
                                <div className="text-slate-500 text-[10px] uppercase">Units Per Shift (8h)</div>
                                <div className="text-3xl font-black text-white font-mono">{Math.round(data?.time_calculation?.units_per_shift || 0).toLocaleString()}</div>
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
                        <div className="flex gap-4">
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
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">ISO Compliance</div>
                                <div className="text-white text-xs font-mono">{data.quality_audit.iso_compliance}</div>
                            </div>
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

            {/* AI DISCLAIMER */}
            <div className="mt-12 p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex gap-4 items-center">
                    <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
                    <div>
                        <h4 className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">Industrial Disclaimer</h4>
                        <p className="text-[11px] text-slate-400">
                            Estudio automatizado. <span className="text-slate-200 font-bold">Validación por un Ingeniero de Procesos recomendada</span> para la implementación de cambios operativos o ajustes salariales.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
