import React from 'react';
import { Station, ProcessType } from '../types';
import { useSimulation } from '../contexts/SimulationContext';

interface FlowDiagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    stations: Station[];
    productName: string;
}

const CATEGORY_COLORS: Record<ProcessType, { border: string; bg: string; glow: string }> = {
    generic: { border: 'border-zinc-500', bg: 'bg-zinc-500/20', glow: 'shadow-zinc-500/50' },
    assembly: { border: 'border-cyan-500', bg: 'bg-cyan-500/20', glow: 'shadow-cyan-500/50' },
    inspection: { border: 'border-yellow-500', bg: 'bg-yellow-500/20', glow: 'shadow-yellow-500/50' },
    testing: { border: 'border-purple-500', bg: 'bg-purple-500/20', glow: 'shadow-purple-500/50' },
    packaging: { border: 'border-emerald-500', bg: 'bg-emerald-500/20', glow: 'shadow-emerald-500/50' },
    machining: { border: 'border-orange-500', bg: 'bg-orange-500/20', glow: 'shadow-orange-500/50' },
    soldering: { border: 'border-red-500', bg: 'bg-red-500/20', glow: 'shadow-red-500/50' },
    sewing: { border: 'border-pink-500', bg: 'bg-pink-500/20', glow: 'shadow-pink-500/50' },
};

const FlowDiagramModal: React.FC<FlowDiagramModalProps> = ({ isOpen, onClose, stations, productName }) => {
    const { getBottleneck, getEfficiency } = useSimulation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 md:pl-72">
            <div className="bg-[#0a0a12] border border-cyber-blue/30 rounded-2xl w-full max-w-[95vw] h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,243,255,0.1)] relative overflow-hidden">

                {/* Background Grid Animation */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #0ed7b5 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* Header */}
                <div className="relative z-10 p-6 border-b border-cyber-blue/20 flex justify-between items-center bg-black/40 backdrop-blur-sm">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fas fa-project-diagram text-cyber-blue shadow-[0_0_15px_rgba(0,243,255,0.6)] rounded-full"></i>
                            Flow Diagram <span className="text-zinc-600">|</span> <span className="text-cyber-blue">{productName}</span>
                        </h3>
                        <div className="flex gap-4 mt-2">
                            <span className="text-xs font-mono text-zinc-400">
                                EFFICIENCY: <span className="text-emerald-400 font-bold">{getEfficiency()}%</span>
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                                BOTTLENECK: <span className="text-red-400 font-bold">{getBottleneck().toFixed(1)}s</span>
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-white/10"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Diagram Area */}
                <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden p-10 flex items-center">
                    <div className="flex items-start gap-0 mx-auto min-w-max">

                        {/* Start Node */}
                        <div className="flex flex-col items-center justify-center mr-8 opacity-50">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center mb-4 bg-zinc-900/50">
                                <span className="text-zinc-500 font-bold text-xs">START</span>
                            </div>
                            <div className="h-0.5 w-8 bg-zinc-700"></div>
                        </div>

                        {stations.map((station, index) => {
                            const stationTime = station.operations.reduce((sum, op) => sum + op.time, 0);
                            const isBottleneck = stationTime === getBottleneck() && stationTime > 0;

                            return (
                                <React.Fragment key={station.id}>
                                    {/* Station Node */}
                                    <div className="relative group">
                                        {/* Bottleneck Indicator */}
                                        {isBottleneck && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500 text-red-500 text-[10px] font-black uppercase px-2 py-1 rounded animate-bounce">
                                                Bottleneck
                                            </div>
                                        )}

                                        <div className={`
                                            w-64 min-h-[300px] rounded-2xl border-2 transition-all duration-500 flex flex-col relative overflow-hidden bg-black/80
                                            ${isBottleneck
                                                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                                                : 'border-cyber-blue/30 hover:border-cyber-blue shadow-[0_0_20px_rgba(0,243,255,0.1)] hover:shadow-[0_0_30px_rgba(0,243,255,0.2)]'}
                                        `}>
                                            {/* Station Header */}
                                            <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                                <h4 className="font-bold text-white uppercase text-sm">{station.name}</h4>
                                                <span className={`text-xs font-mono font-black ${isBottleneck ? 'text-red-400' : 'text-cyber-blue'}`}>
                                                    {stationTime.toFixed(1)}s
                                                </span>
                                            </div>

                                            {/* Operations List inside Station */}
                                            <div className="p-4 space-y-3 flex-1">
                                                {station.operations.map((op, i) => {
                                                    const colors = CATEGORY_COLORS[op.category] || CATEGORY_COLORS.generic;
                                                    return (
                                                        <div key={op.id} className="relative pl-6">
                                                            {/* Connection Line to prev op */}
                                                            {i > 0 && (
                                                                <div className="absolute left-2.5 -top-4 bottom-1/2 w-0.5 bg-zinc-700"></div>
                                                            )}
                                                            {/* Dot */}
                                                            <div className={`absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border ${colors.border} ${colors.bg}`}></div>

                                                            <div className={`
                                                                p-3 rounded-lg border bg-opacity-30 backdrop-blur-sm transition-all hover:scale-105
                                                                ${colors.border} ${colors.bg}
                                                            `}>
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-white font-bold text-xs">{op.name}</span>
                                                                    <span className="text-zinc-400 text-[10px] font-mono">{op.time}s</span>
                                                                </div>
                                                                <div className="mt-1 text-[9px] text-zinc-500 uppercase tracking-wider">{op.category}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {station.operations.length === 0 && (
                                                    <div className="h-full flex items-center justify-center text-zinc-700 text-xs italic">
                                                        No Ops
                                                    </div>
                                                )}
                                            </div>

                                            {/* Station Footer Graph Bar */}
                                            <div className="h-1 w-full bg-zinc-800 mt-auto">
                                                <div
                                                    className={`h-full ${isBottleneck ? 'bg-red-500' : 'bg-cyber-blue'}`}
                                                    style={{ width: `${Math.min((stationTime / (getBottleneck() || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connector Arrow */}
                                    {index < stations.length - 1 && (
                                        <div className="w-24 h-full flex items-center justify-center relative">
                                            {/* Animated Flow Line */}
                                            <div className="h-0.5 w-full bg-zinc-800 overflow-hidden relative">
                                                <div className="absolute inset-0 bg-cyber-blue/50 w-1/2 animate-[shimmer_2s_infinite] translate-x-[-100%]"></div>
                                            </div>
                                            {/* Arrow Head */}
                                            <i className="fas fa-chevron-right text-zinc-600 absolute right-0"></i>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* End Node */}
                        <div className="flex flex-col items-center justify-center ml-8">
                            <div className="h-0.5 w-8 bg-zinc-700"></div>
                            <div className="w-16 h-16 rounded-full border-2 border-cyber-blue bg-cyber-blue/20 flex items-center justify-center mt-4 shadow-[0_0_20px_rgba(0,243,255,0.3)] animate-pulse">
                                <span className="text-cyber-blue font-bold text-xs">END</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-cyber-blue/20 bg-black/40 flex justify-end">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg flex items-center gap-2 text-xs font-bold uppercase transition-all"
                    >
                        <i className="fas fa-print"></i> Print Diagram
                    </button>
                </div>
            </div>

            {/* Global Styles for Keyframes */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default FlowDiagramModal;
