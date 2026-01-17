import React from 'react';
import { IndustrialAnalysis, CycleElement, TimeCalculation, QualityAudit, ProcessImprovement } from '../types';

interface DashboardProps {
    data: IndustrialAnalysis;
}

export const EngineeringDashboard: React.FC<DashboardProps> = ({ data }) => {
    // Robust check for essential data structure
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-mono">

            {/* 1. EXECUTIVE SUMMARY & SPECS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Executive Summary</h3>
                    <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-blue-500 pl-4">{data.summary_text}</p>
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
                    <span className="text-white font-bold text-lg">{data.time_calculation.observed_time.toFixed(2)}s <span className="text-xs text-slate-500 font-normal">Observed</span></span>
                </div>

                {/* Visual Bar Chart */}
                <div className="flex w-full h-8 rounded-full overflow-hidden mb-6 bg-slate-800">
                    {data.cycle_analysis.map((step, idx) => {
                        const widthPct = (step.time_seconds / data.time_calculation.observed_time) * 100;
                        return (
                            <div
                                key={idx}
                                className={`h-full border-r border-slate-900 flex items-center justify-center text-[9px] font-bold text-black/70 truncate px-1 transition-all hover:opacity-80 relative group
                  ${step.value_added ? 'bg-emerald-500' : 'bg-red-400'}
                `}
                                style={{ width: `${widthPct}%` }}
                                title={`${step.element}: ${step.time_seconds}s`}
                            >
                                {step.time_seconds > 0.5 && step.element.substring(0, 5)}
                                {/* Tooltip */}
                                <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                    {step.element} ({step.time_seconds}s)
                                </span>
                            </div>
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
                                <th className="py-2 text-right">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {data.cycle_analysis.map((step, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50">
                                    <td className="py-2 text-slate-600">{idx + 1}</td>
                                    <td className="py-2 font-bold text-white">{step.element}</td>
                                    <td className="py-2 text-slate-500 font-mono">{step.code || '-'}</td>
                                    <td className="py-2 text-right font-mono text-cyan-400">{step.time_seconds.toFixed(2)}</td>
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
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-slate-500 text-[10px] uppercase mb-1">Observed</div>
                            <div className="text-xl font-mono text-white">{data.time_calculation.observed_time.toFixed(2)}s</div>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <span className="text-slate-600 text-xs">x Rating</span>
                            <span className="text-emerald-400 font-bold font-mono">{(data.time_calculation.rating_factor * 100).toFixed(0)}%</span>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-slate-500 text-[10px] uppercase mb-1">Normal Time</div>
                            <div className="text-xl font-mono text-white">{data.time_calculation.normal_time.toFixed(2)}s</div>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <span className="text-slate-600 text-xs">+ Allowances</span>
                            <span className="text-yellow-400 font-bold font-mono">{(data.time_calculation.allowances_pfd * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <div className="mt-6 bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div className="text-cyan-400 font-bold text-sm uppercase tracking-widest">Standard Time</div>
                        <div className="text-right">
                            <div className="text-4xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                                {data.time_calculation.standard_time.toFixed(3)} <span className="text-sm text-cyan-600">sec</span>
                            </div>
                            <div className="text-sm font-mono text-cyan-400/80">
                                ≈ {(data.time_calculation.standard_time / 60).toFixed(3)} <span className="text-xs">min</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                    <h3 className="text-orange-400 text-xs font-black uppercase tracking-widest mb-4">Capacity Planning</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="text-slate-500 text-[10px] uppercase">Units Per Hour (UPH)</div>
                            <div className="text-3xl font-black text-white font-mono">{Math.round(data.time_calculation.units_per_hour).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-slate-500 text-[10px] uppercase">Units Per Shift (8h)</div>
                            <div className="text-3xl font-black text-white font-mono">{Math.round(data.time_calculation.units_per_shift).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

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
                                    {data.material_calculation.material_list.map((mat, idx) => (
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
                                        <span className="text-slate-400 text-xs">Sustainability Score</span>
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
                        {data.quality_audit.potential_defects.map((defect, i) => (
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
                </div>

                {/* Improvements Grid */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">Elite Improvements</h3>
                    <div className="space-y-4 h-64 overflow-y-auto custom-scrollbar pr-2">
                        {data.improvements.map((imp, idx) => (
                            <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-emerald-500">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-emerald-400 font-bold text-sm">{imp.methodology}</span>
                                    <span className="text-[9px] text-slate-500 uppercase border border-slate-600 px-2 rounded">ROI: {imp.roi_potential}</span>
                                </div>
                                <p className="text-white text-sm font-bold mb-1">{imp.recommendation}</p>
                                <p className="text-slate-400 text-xs">{imp.issue} → <span className="text-emerald-300 font-bold">{imp.impact}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
