import React from 'react';
import { Info } from 'lucide-react';

interface ProductionLine {
    id: string;
    name: string;
    absenteeismRate: number;
    qualityRejectionRate: number;
}

interface CostAnalysisChartProps {
    lines: ProductionLine[];
    lossData: {
        lineId: string;
        laborLoss: number;
        qualityLoss: number;
        totalLoss: number;
    }[];
}

export const CostAnalysisChart: React.FC<CostAnalysisChartProps> = ({ lines, lossData }) => {
    const maxLoss = Math.max(...lossData.map(d => d.totalLoss), 500);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Financial Loss Impact (Hourly)</h3>
                <div className="relative group">
                    <Info size={14} className="text-zinc-600 cursor-help hover:text-red-400 transition-colors" />
                    <div className="absolute left-full top-0 ml-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                        Estimated hourly loss due to Absenteeism (Labor Cost) and Quality Defects (Scrap & Rework).
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4 relative overflow-hidden">
                {lossData.map((d) => {
                    const lineName = lines.find(l => l.id === d.lineId)?.name || 'Unknown';
                    const widthPercent = (d.totalLoss / maxLoss) * 100;

                    return (
                        <div key={d.lineId} className="w-full relative group">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-300 font-bold">{lineName}</span>
                                <span className="text-red-400 font-mono">${d.totalLoss.toLocaleString()}</span>
                            </div>

                            {/* Bar Background */}
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                {/* Fill Bar */}
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full relative"
                                    style={{ width: `${widthPercent}%` }}
                                >
                                    {/* Animated Shimmer */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-shimmer"></div>
                                </div>
                            </div>

                            {/* Context Detail */}
                            <p className="text-[10px] text-zinc-600 mt-1">
                                Primary Driver: <span className="text-zinc-500">{d.reason}</span>
                            </p>
                        </div>
                    );
                })}

                {lossData.length === 0 && (
                    <div className="text-center text-zinc-600 text-xs py-8">
                        No significant losses detected.
                    </div>
                )}
            </div>
        </div>
    );
};
