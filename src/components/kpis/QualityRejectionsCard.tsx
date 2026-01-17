import React from 'react';
import { XCircle, TrendingUp, AlertTriangle, DollarSign, Info } from 'lucide-react';

interface RejectionsData {
    plant: string;
    percentage: number;
    scrap_cost: number;
    rework_cost: number;
}

interface CauseData {
    name: string;
    percentage: number;
}

interface QualityRejectionsCardProps {
    global: number;
    target: number;
    plants: RejectionsData[];
    causes?: CauseData[];
}

export const QualityRejectionsCard: React.FC<QualityRejectionsCardProps> = ({
    global,
    target,
    plants,
    causes
}) => {
    const totalScrapCost = plants.reduce((acc, curr) => acc + curr.scrap_cost, 0);
    const totalReworkCost = plants.reduce((acc, curr) => acc + curr.rework_cost, 0);
    const totalCost = totalScrapCost + totalReworkCost;

    const getStatusColor = (val: number) => {
        if (val < 2) return 'emerald';
        if (val < 5) return 'yellow';
        return 'red';
    };

    const statusColor = getStatusColor(global);

    return (
        <div className="bg-cyber-dark border border-orange-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-orange-500/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-3xl rounded-full animate-pulse"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                        <XCircle size={14} />
                        Quality Rejections
                    </h3>
                    <div className="relative group/info">
                        <Info size={12} className="text-zinc-600 cursor-help hover:text-orange-400 transition-colors" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                            % of units rejected. Increases waste (Scrap) and repair costs (Rework).
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
                    const barWidth = Math.min((plantItem.percentage / 10) * 100, 100);

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

            {/* Economic Impact */}
            <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-zinc-600 font-bold uppercase tracking-wider">Economic Impact:</div>
                    <div className="relative group/econ-info">
                        <Info size={10} className="text-zinc-600 cursor-help hover:text-orange-400 transition-colors" />
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/econ-info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                            Real-time financial loss based on your Scrap Cost settings and current defect rate.
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-zinc-400">💰 Scrap</span>
                        <div className="relative group/scrap-info">
                            <Info size={10} className="text-zinc-600 cursor-help hover:text-orange-400 transition-colors" />
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover/scrap-info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                                Formula: Rejected Units * Cost per Unit (Scrap)
                            </div>
                        </div>
                    </div>
                    <span className="text-red-400 font-black">${totalScrapCost.toLocaleString()} USD</span>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/50">
                <span className="text-zinc-300 font-bold">Total</span>
                <span className="text-orange-400 font-black">${totalCost.toLocaleString()} USD</span>
            </div>


            {/* Root Causes */}
            {
                causes && causes.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-2">Root Causes:</div>
                        {causes.slice(0, 3).map((cause, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">• {cause.name}</span>
                                <span className="text-orange-400 font-black">{cause.percentage}%</span>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
};
