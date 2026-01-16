import React from 'react';
import { Info } from 'lucide-react';

interface ProductionLine {
    id: string;
    name: string;
    absenteeismRate: number;
    qualityRejectionRate: number;
}

interface ProductionBarChartProps {
    lines: ProductionLine[];
    data: { lineId: string; output: number }[];
}

export const ProductionBarChart: React.FC<ProductionBarChartProps> = ({ lines, data }) => {
    const maxOutput = Math.max(...data.map(d => d.output), 100);
    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']; // cyan, violet, pink, amber, emerald
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Production per Plant</h3>
                <div className="relative group">
                    <Info size={14} className="text-zinc-600 cursor-help hover:text-cyber-blue transition-colors" />
                    <div className="absolute left-full top-0 ml-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                        Total units produced in current session. Taller bars indicate higher output efficiently.
                    </div>
                </div>
            </div>
            <div className="flex-1 flex items-end justify-around gap-2 px-2 pb-6 relative">
                {/* Y-Axis Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[100, 75, 50, 25, 0].map((tick) => (
                        <div key={tick} className="w-full border-b border-white/5 h-0 relative">
                            <span className="absolute -top-3 left-0 text-[10px] text-zinc-700">{Math.round((maxOutput * tick) / 100)}</span>
                        </div>
                    ))}
                </div>

                {data.map((d, idx) => {
                    const lineName = lines.find(l => l.id === d.lineId)?.name || 'Unknown';
                    const heightPercent = (d.output / maxOutput) * 100;
                    const color = colors[idx % colors.length];

                    return (
                        <div key={d.lineId} className="relative group w-12 flex flex-col items-center z-10 h-full justify-end">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-20">
                                {lineName}: {Math.floor(d.output)} pcs
                            </div>

                            {/* Bar */}
                            <div
                                className="w-full rounded-t-md transition-all duration-1000 ease-out hover:brightness-125 relative"
                                style={{
                                    height: `${heightPercent}%`,
                                    backgroundColor: color,
                                    boxShadow: `0 0 20px ${color}40`
                                }}
                            >
                                {/* Reflection effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            {/* Label */}
                            <div className="absolute top-full mt-2 text-[10px] text-zinc-500 font-bold uppercase truncate w-20 text-center transform -rotate-45 origin-top-left md:rotate-0 md:origin-center md:w-auto">
                                {lineName.split(' ')[1] || lineName.substring(0, 3)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
