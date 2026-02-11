import React, { useState, useEffect } from 'react';
import { exportCostingToPDF } from '../../services/pdfService';
import { exportCostingToExcel } from '../../services/excelService';
import { IndustrialMode, CostInputs } from '../../types';
import { useSimulation } from '../../contexts/SimulationContext';

/* ── Tooltip Component ───────────────────────────────────────────── */
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <span className="relative inline-flex items-center gap-1 group/tip cursor-help">
        {children}
        <i className="fas fa-info-circle text-[9px] opacity-30 group-hover/tip:opacity-80 transition-opacity" />
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-lg bg-black/95 border border-cyber-blue/30 text-[10px] leading-relaxed text-zinc-300 font-normal normal-case tracking-normal opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-200 z-50 shadow-[0_0_20px_rgba(0,251,255,0.15)] backdrop-blur-sm">
            {text}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-black/95" />
        </span>
    </span>
);

interface CostingViewProps {
    mode?: IndustrialMode;
    setMode?: (mode: IndustrialMode) => void;
}

const CostingView: React.FC<CostingViewProps> = ({ mode = 'textile', setMode }) => {
    const { costInputs, updateCostInput, setCostInputs, calculateCosts } = useSimulation();

    // Mode reset handled by Context

    // Calculate results on the fly based on current context state
    const results = calculateCosts();

    const handleInputChange = (field: keyof CostInputs, value: number) => {
        updateCostInput(field, value);
    };

    // Helper to get time label based on mode
    const getTimeLabel = () => {
        switch (mode) {
            case 'automotive': return 'Cycle Time (sec/min)';
            case 'aerospace': return 'Standard Time (min)';
            case 'electronics': return 'Takt Time (sec)';
            case 'footwear': return 'Standard Time (SATRA)';
            case 'pharmaceutical': return 'Cycle Time (ppm/bottles per min)';
            case 'food': return 'Line Speed (units/min)';
            case 'metalworking': return 'Process Time (min/cut)';
            case 'medical_devices': return 'Cycle Time (sec/precision check)';
            case 'energy': return 'Battery Charge Time/Assembly (sec)';
            default: return 'SAM (Standard Allowed Minutes)';
        }
    };

    const getModeIcon = () => {
        switch (mode) {
            case 'automotive': return 'fa-car';
            case 'aerospace': return 'fa-plane';
            case 'electronics': return 'fa-microchip';
            case 'footwear': return 'fa-shoe-prints';
            case 'pharmaceutical': return 'fa-pills';
            case 'food': return 'fa-utensils';
            case 'metalworking': return 'fa-cogs';
            case 'medical_devices': return 'fa-heartbeat';
            case 'energy': return 'fa-bolt';
            default: return 'fa-tshirt';
        }
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            <i className={`fas ${getModeIcon()} mr-3 text-cyber-blue`}></i>
                            {mode} <span className="text-cyber-blue">Costing</span>
                        </h2>
                        <p className="text-zinc-500 text-sm">
                            Calculate labor and overhead costs for <span className="font-bold text-cyber-blue uppercase">{mode}</span> manufacturing
                        </p>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {setMode && (
                            <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-3 flex items-center gap-3">
                                <i className="fas fa-industry text-cyber-blue"></i>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as IndustrialMode)}
                                    className="bg-gray-900 text-cyber-blue font-bold text-sm rounded-lg px-2 sm:px-4 py-2 border border-cyber-blue outline-none cursor-pointer uppercase transition-all"
                                >
                                    <option value="automotive" className="bg-gray-900 text-white">🚗 Automotive</option>
                                    <option value="aerospace" className="bg-gray-900 text-white">✈️ Aerospace</option>
                                    <option value="electronics" className="bg-gray-900 text-white">⚡ Electronics</option>
                                    <option value="textile" className="bg-gray-900 text-white">🧵 Textile</option>
                                    <option value="footwear" className="bg-gray-900 text-white">👟 Footwear</option>
                                    <option value="pharmaceutical" className="bg-gray-900 text-white">💊 Pharma</option>
                                    <option value="food" className="bg-gray-900 text-white">🥗 Food</option>
                                    <option value="metalworking" className="bg-gray-900 text-white">⚙️ Metalworking</option>
                                    <option value="medical_devices" className="bg-gray-900 text-white">🩺 Medical Devices</option>
                                    <option value="energy" className="bg-gray-900 text-white">🔋 Energy</option>
                                </select>
                            </div>
                        )}

                        <button
                            onClick={() => exportCostingToPDF(costInputs.sam, costInputs.hourlyWage, costInputs.efficiency, costInputs.overhead)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold"
                        >
                            <i className="fas fa-file-pdf"></i>
                            PDF
                        </button>

                        <button
                            onClick={() => exportCostingToExcel(costInputs.sam, costInputs.hourlyWage, costInputs.efficiency, costInputs.overhead)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold"
                        >
                            <i className="fas fa-file-excel"></i>
                            Excel
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                    {/* Input Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-sliders-h text-cyber-blue"></i>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Input Parameters</h3>
                        </div>

                        {/* SAM / Time Input */}
                        <div className="bg-cyber-dark border border-cyber-blue/30 p-5 rounded-2xl">
                            <label className="block text-[10px] font-black text-cyber-blue uppercase tracking-widest mb-3">
                                {getTimeLabel()}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max={mode === 'aerospace' ? 500 : 120}
                                    step="0.5"
                                    value={costInputs.sam}
                                    onChange={(e) => handleInputChange('sam', parseFloat(e.target.value))}
                                    className="flex-1 accent-cyber-blue"
                                />
                                <input
                                    type="number"
                                    value={costInputs.sam}
                                    onChange={(e) => handleInputChange('sam', parseFloat(e.target.value))}
                                    className="w-20 bg-black/50 border border-cyber-blue/30 rounded-lg px-3 py-2 text-white font-black text-center"
                                />
                            </div>
                        </div>

                        {/* Efficiency */}
                        <div className="bg-cyber-dark border border-cyber-blue/30 p-5 rounded-2xl">
                            <label className="block text-[10px] font-black text-cyber-blue uppercase tracking-widest mb-3">
                                Line Efficiency (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="1"
                                    value={costInputs.efficiency}
                                    onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value))}
                                    className="flex-1 accent-cyber-blue"
                                />
                                <input
                                    type="number"
                                    value={costInputs.efficiency || ''}
                                    onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value))}
                                    className="w-20 bg-black/50 border border-cyber-blue/30 rounded-lg px-3 py-2 text-white font-black text-center"
                                />
                            </div>
                        </div>

                        {/* Hourly Wage */}
                        <div className="bg-cyber-dark border border-emerald-500/30 p-5 rounded-2xl">
                            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">
                                Hourly Wage (USD)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="0.1"
                                    value={costInputs.hourlyWage}
                                    onChange={(e) => handleInputChange('hourlyWage', parseFloat(e.target.value))}
                                    className="flex-1 accent-emerald-500"
                                />
                                <input
                                    type="number"
                                    value={costInputs.hourlyWage || ''}
                                    onChange={(e) => handleInputChange('hourlyWage', parseFloat(e.target.value))}
                                    className="w-20 bg-black/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-white font-black text-center"
                                />
                            </div>
                        </div>

                        {/* Overhead */}
                        <div className="bg-cyber-dark border border-yellow-500/30 p-5 rounded-2xl">
                            <label className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">
                                Overhead (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    step="5"
                                    value={costInputs.overhead}
                                    onChange={(e) => handleInputChange('overhead', parseFloat(e.target.value))}
                                    className="flex-1 accent-yellow-500"
                                />
                                <input
                                    type="number"
                                    value={costInputs.overhead || ''}
                                    onChange={(e) => handleInputChange('overhead', parseFloat(e.target.value))}
                                    className="w-20 bg-black/50 border border-yellow-500/30 rounded-lg px-3 py-2 text-white font-black text-center"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-cyber-dark border border-white/5 p-4 rounded-xl">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Target Units/Day</label>
                                <input
                                    type="number"
                                    value={costInputs.targetProduction || ''}
                                    onChange={(e) => handleInputChange('targetProduction', parseFloat(e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-black"
                                />
                            </div>
                            <div className="bg-cyber-dark border border-white/5 p-4 rounded-xl">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Hours/Day</label>
                                <input
                                    type="number"
                                    value={costInputs.workingHours || ''}
                                    onChange={(e) => handleInputChange('workingHours', parseFloat(e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-black"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-cyber-blue/20 to-cyber-blue/5 border border-cyber-blue p-6 rounded-2xl shadow-[0_0_20px_rgba(0,251,255,0.2)]">
                                <p className="text-xs font-black text-cyber-blue uppercase tracking-wider mb-2">
                                    <Tooltip text="Cost per minute of effective labor. Calculated as Hourly Wage ÷ (60 × Efficiency%). This is the base unit for all cost calculations.">
                                        <i className="fas fa-clock mr-1"></i>Minute Cost
                                    </Tooltip>
                                </p>
                                <p className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-1">
                                    ${results.minuteCost.toFixed(4)}
                                </p>
                                <p className="text-[10px] text-zinc-500 uppercase font-black">per effective minute</p>
                            </div>

                            <div className="bg-gradient-to-br from-cyber-blue/20 to-cyber-blue/5 border border-cyber-blue p-6 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                                <p className="text-xs font-black text-cyber-blue uppercase tracking-wider mb-2">
                                    <Tooltip text="Total labor cost per unit including overhead. Formula: (SAM × Minute Cost) × (1 + Overhead%). This is the price you should charge per piece.">
                                        <i className="fas fa-tag mr-1"></i>Piece Cost
                                    </Tooltip>
                                </p>
                                <p className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-1">
                                    ${results.pieceCost.toFixed(3)}
                                </p>
                                <p className="text-[10px] text-zinc-500 uppercase font-black">labor + {costInputs.overhead}% overhead</p>
                            </div>
                        </div>

                        <div className="bg-cyber-dark border border-white/10 p-6 rounded-2xl">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <i className="fas fa-chart-line text-cyber-blue"></i>
                                Detailed Financials
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <Tooltip text="Raw direct labor cost per piece without overhead. SAM × Minute Cost. This is purely what you pay workers per unit.">
                                        <span className="text-xs text-zinc-500">Base Labor Component</span>
                                    </Tooltip>
                                    <span className="text-sm font-black text-white">${(costInputs.sam * results.minuteCost).toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <Tooltip text="Indirect costs added to each piece: electricity, rent, supervision, maintenance, depreciation. Calculated as Base Labor × Overhead%.">
                                        <span className="text-xs text-zinc-500">Operational Overhead ({costInputs.overhead}%)</span>
                                    </Tooltip>
                                    <span className="text-sm font-black text-yellow-400">${(costInputs.sam * results.minuteCost * (costInputs.overhead / 100)).toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Tooltip text="Total cost to produce one unit, ready for pricing. Base Labor + Overhead = FOB Labor Value. Use this as a floor for your selling price.">
                                        <span className="text-xs font-black text-cyber-blue uppercase">Final FOB Labor Value</span>
                                    </Tooltip>
                                    <span className="text-xl font-black text-cyber-blue">${results.pieceCost.toFixed(3)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-cyber-dark border border-white/10 p-6 rounded-2xl">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <i className="fas fa-industry text-cyber-blue"></i>
                                Efficiency & Planning
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-white/5 rounded-2xl">
                                    <Tooltip text="Number of operators needed to meet your target production. Formula: Target Units ÷ (Available Minutes ÷ SAM × Efficiency).">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">Required Staff</p>
                                    </Tooltip>
                                    <p className="text-3xl font-black text-white">{results.requiredOperators}</p>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-2xl">
                                    <Tooltip text="How many units a single operator can produce in one shift. Based on available minutes, SAM, and line efficiency.">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">Output/Op/Day</p>
                                    </Tooltip>
                                    <p className="text-3xl font-black text-cyber-blue">{results.actualProduction}</p>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-2xl">
                                    <Tooltip text="Total daily labor cost for all required staff. Formula: Required Staff × Hourly Wage × Working Hours/Day.">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">Daily Payroll</p>
                                    </Tooltip>
                                    <p className="text-3xl font-black text-emerald-400">${results.dailyLabor.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-cyber-blue/10 to-cyber-blue/20 border border-white/10 p-6 rounded-2xl">
                            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Market Projection</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Tooltip text="Projected monthly labor cost assuming 22 working days. Formula: Daily Payroll × 22. Does not include material or logistics costs.">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Monthly Cost</p>
                                    </Tooltip>
                                    <p className="text-xl font-black text-white">${(results.dailyLabor * 22).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Tooltip text="Estimated revenue potential based on total production capacity × piece cost × 3 month projection. Use this to evaluate contract viability.">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Potential Value</p>
                                    </Tooltip>
                                    <p className="text-xl font-black text-cyber-blue">${(results.actualProduction * results.requiredOperators * results.pieceCost * 3).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostingView;

