import React from 'react';
import { Users, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';

interface AbsenteeismData {
    plant: string;
    percentage: number;
    units_impact: number;
    cost_impact: number;
}

interface AbsenteeismCardProps {
    global: number;
    target: number;
    plants: AbsenteeismData[];
    criticalProcess?: {
        name: string;
        percentage: number;
    };
}

export const AbsenteeismCard: React.FC<AbsenteeismCardProps> = ({
    global,
    target,
    plants,
    criticalProcess
}) => {
    const totalUnitsImpact = plants.reduce((acc, curr) => acc + curr.units_impact, 0);
    const totalCostImpact = plants.reduce((acc, curr) => acc + curr.cost_impact, 0);

    const getStatusColor = (val: number) => {
        if (val < 5) return 'emerald';
        if (val < 10) return 'yellow';
        return 'red';
    };

    const statusColor = getStatusColor(global);

    return (
        <div className="bg-cyber-dark border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full animate-pulse"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                        <Users size={14} />
                        Absenteeism
                    </h3>
                    <div className="relative group/info">
                        <Info size={12} className="text-zinc-600 cursor-help hover:text-purple-400 transition-colors" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                            % of staff absent. Reduces production speed and impacts OEE Availability.
                        </div>
                    </div>
                </div>
                <div className={`text-xs font-black px-2 py-1 rounded ${statusColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                    statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                    {statusColor === 'emerald' ? '🟢' : statusColor === 'yellow' ? '🟡' : '🔴'}
                </div>
            </div>

            {/* Global Metric */}
            <div className="mb-4">
                <div className="text-4xl font-black text-white mb-1">{global.toFixed(1)}%</div>
                <div className="text-xs text-zinc-500">Target: &lt;{target.toFixed(1)}%</div>
            </div>

            {/* By Plant */}
            <div className="space-y-2 mb-4">
                <div className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-2">By Plant:</div>
                {plants.map((plantItem, idx) => {
                    const plantColor = getStatusColor(plantItem.percentage);
                    const barWidth = Math.min((plantItem.percentage / 20) * 100, 100);

                    return (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">🏭 {plantItem.plant}</span>
                                <span className={`font-black ${plantColor === 'emerald' ? 'text-emerald-400' :
                                    plantColor === 'yellow' ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>
                                    {plantItem.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${plantColor === 'emerald' ? 'bg-emerald-500' :
                                        plantColor === 'yellow' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}
                                    style={{ width: `${barWidth}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Impacto en Producción */}
            <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-zinc-600 font-bold uppercase tracking-wider">Production Impact:</div>
                    <div className="relative group/impact-info">
                        <Info size={10} className="text-zinc-600 cursor-help hover:text-purple-400 transition-colors" />
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/impact-info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                            Quantifies the manufacturing capacity lost directly due to missing workforce.
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-zinc-400">📉 Lost Units</span>
                        <div className="relative group/units-info">
                            <Info size={10} className="text-zinc-600 cursor-help hover:text-purple-400 transition-colors" />
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/units-info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                                Formula: (Current Output / (1 - Absenteeism Rate)) - Current Output
                            </div>
                        </div>
                    </div>
                    <span className="text-red-400 font-black">-{totalUnitsImpact}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-zinc-400">💰 Estimated Cost</span>
                        <div className="relative group/cost-info">
                            <Info size={10} className="text-zinc-600 cursor-help hover:text-purple-400 transition-colors" />
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/cost-info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                                Formula: (Units Lost * Cycle Time) * Hourly Wage
                            </div>
                        </div>
                    </div>
                    <span className="text-red-400 font-black">${totalCostImpact.toLocaleString()} USD</span>
                </div>
            </div>

            {/* Proceso Crítico */}
            {criticalProcess && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-red-400 font-bold">Critical:</span>
                        <span className="text-white">{criticalProcess.name}</span>
                        <span className="text-red-400 font-black ml-auto">{criticalProcess.percentage}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};
