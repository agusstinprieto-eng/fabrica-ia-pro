import React, { useState, useEffect } from 'react';
import { exportCostingToPDF } from '../../services/pdfService';
import { exportCostingToExcel } from '../../services/excelService';

interface CostInputs {
    sam: number; // Standard Allowed Minutes
    efficiency: number; // Percentage
    hourlyWage: number; // USD per hour
    overhead: number; // Percentage
    targetProduction: number; // Units per day
    workingHours: number; // Hours per day
}

const CostingView: React.FC = () => {
    const [inputs, setInputs] = useState<CostInputs>({
        sam: 12.5,
        efficiency: 85,
        hourlyWage: 2.5,
        overhead: 45,
        targetProduction: 500,
        workingHours: 8
    });

    const [results, setResults] = useState({
        minuteCost: 0,
        pieceCost: 0,
        dailyLabor: 0,
        requiredOperators: 0,
        actualProduction: 0
    });

    useEffect(() => {
        calculateCosts();
    }, [inputs]);

    const calculateCosts = () => {
        const { sam, efficiency, hourlyWage, overhead, targetProduction, workingHours } = inputs;

        // Cost per minute (accounting for efficiency)
        const effectiveMinuteCost = (hourlyWage / 60) / (efficiency / 100);

        // Cost per piece (SAM * minute cost)
        const laborCostPerPiece = (sam * effectiveMinuteCost);

        // Total cost including overhead
        const totalPieceCost = laborCostPerPiece * (1 + overhead / 100);

        // Daily labor cost
        const dailyLaborCost = workingHours * hourlyWage;

        // Required operators (SAM * Target Production / Available Minutes)
        const availableMinutes = workingHours * 60 * (efficiency / 100);
        const requiredOperators = Math.ceil((sam * targetProduction) / availableMinutes);

        // Actual production capacity per operator
        const actualProductionPerOperator = Math.floor(availableMinutes / sam);

        setResults({
            minuteCost: effectiveMinuteCost,
            pieceCost: totalPieceCost,
            dailyLabor: dailyLaborCost * requiredOperators,
            requiredOperators,
            actualProduction: actualProductionPerOperator
        });
    };

    const handleInputChange = (field: keyof CostInputs, value: number) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        Minute <span className="text-cyber-purple">Costing</span>
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Calculate accurate labor costs based on SAM, efficiency, and overhead
                    </p>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            exportCostingToPDF(inputs.sam, inputs.hourlyWage, inputs.efficiency, inputs.overhead);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-pdf"></i>
                        PDF
                    </button>

                    <button
                        onClick={() => {
                            exportCostingToExcel(inputs.sam, inputs.hourlyWage, inputs.efficiency, inputs.overhead);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-excel"></i>
                        Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Input Section */}
                <div className="col-span-5 space-y-4">
                    <h3 className="text-sm font-black text-cyber-purple uppercase tracking-wider mb-4">
                        <i className="fas fa-sliders-h mr-2"></i>Input Parameters
                    </h3>

                    {/* SAM */}
                    <div className="bg-cyber-dark border border-cyber-purple/30 p-4 rounded-xl">
                        <label className="block text-xs font-black text-cyber-purple uppercase tracking-wider mb-2">
                            SAM (Standard Allowed Minutes)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="1"
                                max="60"
                                step="0.5"
                                value={inputs.sam}
                                onChange={(e) => handleInputChange('sam', parseFloat(e.target.value))}
                                className="flex-1 accent-cyber-purple"
                            />
                            <input
                                type="number"
                                value={inputs.sam}
                                onChange={(e) => handleInputChange('sam', parseFloat(e.target.value))}
                                className="w-20 bg-black/50 border border-cyber-purple/30 rounded-lg px-3 py-2 text-white text-sm font-black text-center"
                            />
                        </div>
                    </div>

                    {/* Efficiency */}
                    <div className="bg-cyber-dark border border-cyber-blue/30 p-4 rounded-xl">
                        <label className="block text-xs font-black text-cyber-blue uppercase tracking-wider mb-2">
                            Line Efficiency (%)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="50"
                                max="100"
                                step="1"
                                value={inputs.efficiency}
                                onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value))}
                                className="flex-1 accent-cyber-blue"
                            />
                            <input
                                type="number"
                                value={inputs.efficiency}
                                onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value))}
                                className="w-20 bg-black/50 border border-cyber-blue/30 rounded-lg px-3 py-2 text-white text-sm font-black text-center"
                            />
                        </div>
                    </div>

                    {/* Hourly Wage */}
                    <div className="bg-cyber-dark border border-emerald-500/30 p-4 rounded-xl">
                        <label className="block text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                            Hourly Wage (USD)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.1"
                                value={inputs.hourlyWage}
                                onChange={(e) => handleInputChange('hourlyWage', parseFloat(e.target.value))}
                                className="flex-1 accent-emerald-500"
                            />
                            <input
                                type="number"
                                value={inputs.hourlyWage}
                                onChange={(e) => handleInputChange('hourlyWage', parseFloat(e.target.value))}
                                className="w-20 bg-black/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-white text-sm font-black text-center"
                            />
                        </div>
                    </div>

                    {/* Overhead */}
                    <div className="bg-cyber-dark border border-yellow-500/30 p-4 rounded-xl">
                        <label className="block text-xs font-black text-yellow-400 uppercase tracking-wider mb-2">
                            Overhead (%)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={inputs.overhead}
                                onChange={(e) => handleInputChange('overhead', parseFloat(e.target.value))}
                                className="flex-1 accent-yellow-500"
                            />
                            <input
                                type="number"
                                value={inputs.overhead}
                                onChange={(e) => handleInputChange('overhead', parseFloat(e.target.value))}
                                className="w-20 bg-black/50 border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm font-black text-center"
                            />
                        </div>
                    </div>

                    {/* Production Target */}
                    <div className="bg-cyber-dark border border-white/10 p-4 rounded-xl">
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">
                            Target Production (Units/Day)
                        </label>
                        <input
                            type="number"
                            value={inputs.targetProduction}
                            onChange={(e) => handleInputChange('targetProduction', parseFloat(e.target.value))}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-black"
                        />
                    </div>

                    {/* Working Hours */}
                    <div className="bg-cyber-dark border border-white/10 p-4 rounded-xl">
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">
                            Working Hours/Day
                        </label>
                        <input
                            type="number"
                            value={inputs.workingHours}
                            onChange={(e) => handleInputChange('workingHours', parseFloat(e.target.value))}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-black"
                        />
                    </div>
                </div>

                {/* Results Section */}
                <div className="col-span-7 space-y-4">
                    <h3 className="text-sm font-black text-cyber-blue uppercase tracking-wider mb-4">
                        <i className="fas fa-calculator mr-2"></i>Cost Analysis
                    </h3>

                    {/* Primary Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-purple/5 border border-cyber-purple p-6 rounded-2xl shadow-[0_0_20px_rgba(112,0,255,0.2)]">
                            <p className="text-xs font-black text-cyber-purple uppercase tracking-wider mb-2">
                                <i className="fas fa-clock mr-1"></i>Minute Cost
                            </p>
                            <p className="text-4xl font-black text-white mb-1">
                                ${results.minuteCost.toFixed(4)}
                            </p>
                            <p className="text-xs text-zinc-500">per minute (effective)</p>
                        </div>

                        <div className="bg-gradient-to-br from-cyber-blue/20 to-cyber-blue/5 border border-cyber-blue p-6 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                            <p className="text-xs font-black text-cyber-blue uppercase tracking-wider mb-2">
                                <i className="fas fa-tag mr-1"></i>Piece Cost
                            </p>
                            <p className="text-4xl font-black text-white mb-1">
                                ${results.pieceCost.toFixed(3)}
                            </p>
                            <p className="text-xs text-zinc-500">labor + {inputs.overhead}% overhead</p>
                        </div>
                    </div>

                    {/* Breakdown Card */}
                    <div className="bg-cyber-dark border border-white/10 p-6 rounded-2xl">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i className="fas fa-chart-line text-cyber-blue"></i>
                            Cost Breakdown
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-xs text-zinc-400">Base Labor (SAM × Minute Cost)</span>
                                <span className="text-sm font-black text-white">
                                    ${(inputs.sam * results.minuteCost).toFixed(3)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-xs text-zinc-400">Overhead (+{inputs.overhead}%)</span>
                                <span className="text-sm font-black text-yellow-400">
                                    ${(inputs.sam * results.minuteCost * (inputs.overhead / 100)).toFixed(3)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs font-black text-cyber-purple uppercase">Total Piece Cost</span>
                                <span className="text-lg font-black text-cyber-purple">
                                    ${results.pieceCost.toFixed(3)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Production Metrics */}
                    <div className="bg-cyber-dark border border-white/10 p-6 rounded-2xl">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i className="fas fa-industry text-cyber-purple"></i>
                            Production Planning
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 mb-2">Required Operators</p>
                                <p className="text-3xl font-black text-white">{results.requiredOperators}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 mb-2">Output/Operator/Day</p>
                                <p className="text-3xl font-black text-cyber-blue">{results.actualProduction}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 mb-2">Daily Labor Cost</p>
                                <p className="text-3xl font-black text-emerald-400">${results.dailyLabor.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Impact */}
                    <div className="bg-gradient-to-r from-cyber-purple/10 to-cyber-blue/10 border border-cyber-purple/30 p-6 rounded-2xl">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3">
                            <i className="fas fa-dollar-sign text-emerald-400 mr-2"></i>Financial Impact
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Daily Revenue Potential</p>
                                <p className="text-xl font-black text-white">
                                    ${(results.actualProduction * results.requiredOperators * results.pieceCost * 3).toFixed(0)}
                                </p>
                                <p className="text-[10px] text-zinc-600">@ 3x markup</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Monthly Labor Cost</p>
                                <p className="text-xl font-black text-white">
                                    ${(results.dailyLabor * 22).toFixed(0)}
                                </p>
                                <p className="text-[10px] text-zinc-600">22 working days/month</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostingView;
