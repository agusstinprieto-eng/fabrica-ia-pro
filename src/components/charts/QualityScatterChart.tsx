import React from 'react';
import { Info } from 'lucide-react';

interface ProductionLine {
    id: string;
    name: string;
    absenteeismRate: number;
    qualityRejectionRate: number;
}

interface QualityScatterChartProps {
    lines: ProductionLine[];
}

export const QualityScatterChart: React.FC<QualityScatterChartProps> = ({ lines }) => {
    // ... logic ...
    const maxAbs = Math.max(...lines.map(l => l.absenteeismRate), 5);
    const maxRej = Math.max(...lines.map(l => l.qualityRejectionRate), 5);

    // Add 20% buffer for visual breathing room
    const maxX = Math.ceil(maxAbs * 1.2);
    const maxY = Math.ceil(maxRej * 1.2);

    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Quality (Y) vs Absenteeism (X)</h3>
                    <div className="relative group">
                        <Info size={14} className="text-zinc-600 cursor-help hover:text-cyber-blue transition-colors" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 border border-white/10 p-2 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm">
                            Identifies correlation between workforce issues and quality. Top-Right = High Risk Zone.
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-red-500/50"></span> Risk Area
                </div>
            </div>

            <div className="flex-1 relative border-l border-b border-white/10 m-2">
                {/* Labels */}
                <div className="absolute -bottom-8 right-0 text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase">Absenteeism %</div>
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase -rotate-90">Rejection %</div>

                {/* Grid */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="border-r border-t border-white/5"></div>
                    ))}
                </div>

                {/* Danger Zone (Top Right) */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500/5 rounded-bl-3xl"></div>

                {/* Plot Points */}
                {lines.map((line, idx) => {
                    const xPos = Math.min((line.absenteeismRate / maxX) * 100, 100);
                    const yPos = Math.min((line.qualityRejectionRate / maxY) * 100, 100);
                    // Invert Y for CSS positioning (bottom is 0)
                    const bottomPos = yPos;

                    const isDanger = xPos > 50 && yPos > 50;
                    const color = isDanger ? '#ef4444' : '#00f3ff';

                    return (
                        <div
                            key={line.id}
                            className="absolute transform -translate-x-1/2 translate-y-1/2 group transition-all duration-1000"
                            style={{
                                left: `${xPos}%`,
                                bottom: `${bottomPos}%`
                            }}
                        >
                            {/* Bubble */}
                            <div
                                className={`w-4 h-4 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-150 transition-transform flex items-center justify-center z-10 relative`}
                                style={{
                                    borderColor: color,
                                    backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 243, 255, 0.2)'
                                }}
                            >
                                <div className="w-1 h-1 rounded-full bg-white"></div>
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 p-2 rounded z-20 whitespace-nowrap pointer-events-none">
                                <div className="text-white font-bold text-xs">{line.name}</div>
                                <div className="text-[10px] text-zinc-400">
                                    Abs: {line.absenteeismRate}% | Rej: {line.qualityRejectionRate}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
