import React, { useState, useEffect } from 'react';
import { exportLineBalancingToPDF } from '../../services/pdfService';
import { exportLineBalancingToExcel } from '../../services/excelService';
import { exportLineBalancingToPowerPoint } from '../../services/pptxService';
import { IndustrialMode, Station, Operation, ProcessType } from '../../types';
import { INDUSTRIAL_OPERATIONS } from '../../data/industrialData';
import { useSimulation } from '../../contexts/SimulationContext';

const CATEGORY_COLORS: Record<ProcessType, { border: string; bg: string; text: string }> = {
    generic: { border: 'border-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
    assembly: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    inspection: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    testing: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    packaging: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    machining: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    soldering: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
    sewing: { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-400' },
};

interface LineBalancingViewProps {
    mode?: IndustrialMode;
    setMode?: (mode: IndustrialMode) => void;
}

const LineBalancingView: React.FC<LineBalancingViewProps> = ({ mode = 'textile', setMode }) => {
    const { stations, setStations, getBottleneck, getEfficiency } = useSimulation();

    // Determine available products for the current mode
    const modeProducts = INDUSTRIAL_OPERATIONS[mode] || INDUSTRIAL_OPERATIONS['textile'];
    const productKeys = Object.keys(modeProducts);

    const [selectedProduct, setSelectedProduct] = useState<string>(productKeys[0]);

    // Update product selection when mode changes
    useEffect(() => {
        const newProducts = INDUSTRIAL_OPERATIONS[mode] || INDUSTRIAL_OPERATIONS['textile'];
        const keys = Object.keys(newProducts);
        if (keys.length > 0) {
            setSelectedProduct(keys[0]);
            // Station reset is handled by SimulationContext!
        }
    }, [mode]);

    // Update available ops when product changes
    useEffect(() => {
        const productOps = (INDUSTRIAL_OPERATIONS[mode] || INDUSTRIAL_OPERATIONS['textile'])[selectedProduct] || [];
        setAvailableOps(productOps.map(op => ({ ...op, stationId: null })));
    }, [selectedProduct, mode]);

    const [availableOps, setAvailableOps] = useState<Operation[]>([]);
    const [draggedOp, setDraggedOp] = useState<Operation | null>(null);
    const [targetCycleTime] = useState(mode === 'electronics' ? 60 : 30); // Dynamic target

    const handleDragStart = (op: Operation) => {
        setDraggedOp(op);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDropToStation = (stationId: string) => {
        if (!draggedOp) return;

        setAvailableOps(prev => prev.filter(op => op.id !== draggedOp.id));

        setStations(stations.map(station => {
            if (station.id === stationId) {
                return {
                    ...station,
                    operations: [...station.operations, { ...draggedOp, stationId }]
                };
            }
            return station;
        }));

        setDraggedOp(null);
    };

    const handleRemoveFromStation = (opId: string, stationId: string) => {
        const station = stations.find(s => s.id === stationId);
        const op = station?.operations.find(o => o.id === opId);

        if (!op) return;

        setStations(stations.map(s => {
            if (s.id === stationId) {
                return {
                    ...s,
                    operations: s.operations.filter(o => o.id !== opId)
                };
            }
            return s;
        }));

        setAvailableOps(prev => [...prev, { ...op, stationId: null }]);
    };

    const calculateStationTime = (station: Station) => {
        return station.operations.reduce((sum, op) => sum + op.time, 0);
    };

    // Format label for dropdown
    const formatProductLabel = (key: string) => {
        return key.replace(/_/g, ' ').toUpperCase();
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        Smart <span className="text-cyber-blue">Balancing</span>
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Optimizing line efficiency for: <span className="text-cyber-blue font-bold uppercase">{mode} MODE</span>
                    </p>
                </div>

                {/* Export & Product Selector */}
                <div className="flex items-center gap-3">
                    {/* Industry Selector */}
                    {setMode && (
                        <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-3 flex items-center gap-3">
                            <i className="fas fa-industry text-cyber-blue"></i>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as IndustrialMode)}
                                className="bg-[#050b14] text-cyber-blue font-bold text-sm rounded-lg px-4 py-2 border border-cyber-blue shadow-[0_0_10px_rgba(0,255,255,0.1)] focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none cursor-pointer uppercase transition-all"
                            >
                                <option value="automotive" className="bg-cyber-black text-white">🚗 Automotive</option>
                                <option value="aerospace" className="bg-cyber-black text-white">✈️ Aerospace</option>
                                <option value="electronics" className="bg-cyber-black text-white">⚡ Electronics</option>
                                <option value="textile" className="bg-cyber-black text-white">🧵 Textile</option>
                                <option value="footwear" className="bg-cyber-black text-white">👟 Footwear</option>
                                <option value="pharmaceutical" className="bg-cyber-black text-white">💊 Pharma</option>
                                <option value="food" className="bg-cyber-black text-white">🥗 Food</option>
                                <option value="metalworking" className="bg-cyber-black text-white">⚙️ Metalworking</option>
                            </select>
                        </div>
                    )}
                    {/* Export Buttons */}
                    <button
                        onClick={() => {
                            // Cast generic type if needed or update PDF service signature (omitted for brevity)
                            exportLineBalancingToPDF(stations, targetCycleTime, selectedProduct);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-pdf"></i>
                        PDF
                    </button>

                    <button
                        onClick={() => {
                            exportLineBalancingToExcel(stations, targetCycleTime, selectedProduct);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-excel"></i>
                        Excel
                    </button>

                    {/* Product Selector */}
                    <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-3 flex items-center gap-3">
                        <i className="fas fa-cogs text-cyber-blue"></i>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="bg-black/50 text-white font-bold text-sm rounded-lg px-4 py-2 border border-white/10 focus:border-cyber-blue outline-none cursor-pointer"
                        >
                            {productKeys.map(key => (
                                <option key={key} value={key} className="bg-cyber-black text-white">{formatProductLabel(key)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-cyber-dark border border-cyber-blue/30 p-4 rounded-xl">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Cycle Time (Bottleneck)</p>
                    <p className="text-2xl font-black text-white">{getBottleneck().toFixed(1)}s</p>
                    <p className={`text-xs font-bold mt-1 ${getBottleneck() > targetCycleTime ? 'text-red-400' : 'text-emerald-400'}`}>
                        Target: {targetCycleTime}s
                    </p>
                </div>
                <div className="bg-cyber-dark border border-cyber-purple/30 p-4 rounded-xl">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Line Efficiency</p>
                    <p className="text-2xl font-black text-white">{getEfficiency()}%</p>
                </div>
                <div className="bg-cyber-dark border border-cyber-gray/30 p-4 rounded-xl">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Available Ops</p>
                    <p className="text-2xl font-black text-white">{availableOps.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Operations Pool */}
                <div className="col-span-3">
                    <h3 className="text-sm font-black text-cyber-blue uppercase tracking-wider mb-4">
                        <i className="fas fa-list mr-2"></i>Process Pool
                    </h3>
                    <div className="space-y-2">
                        {availableOps.map(op => {
                            const colors = CATEGORY_COLORS[op.category];
                            return (
                                <div
                                    key={op.id}
                                    draggable
                                    onDragStart={() => handleDragStart(op)}
                                    className={`${colors.bg} border ${colors.border} p-3 rounded-lg cursor-move hover:scale-105 transition-all group`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-white mb-1">{op.name}</p>
                                            <p className={`text-[10px] font-mono ${colors.text}`}>{op.code}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black ${colors.text}`}>{op.time}s</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Stations */}
                <div className="col-span-9">
                    <h3 className="text-sm font-black text-cyber-purple uppercase tracking-wider mb-4">
                        <i className="fas fa-industry mr-2"></i>Assembly Line
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {stations.map(station => {
                            const cycleTime = calculateStationTime(station);
                            const isBottleneck = cycleTime === getBottleneck() && cycleTime > 0;
                            const isOverloaded = cycleTime > targetCycleTime;

                            return (
                                <div
                                    key={station.id}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDropToStation(station.id)}
                                    className={`bg-cyber-dark border-2 border-dashed rounded-xl p-4 min-h-[200px] transition-all ${isBottleneck
                                        ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                        : isOverloaded
                                            ? 'border-yellow-500'
                                            : 'border-cyber-gray hover:border-cyber-purple'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-white uppercase tracking-wider text-sm">
                                            {station.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {isBottleneck && (
                                                <span className="text-[9px] font-black text-red-500 bg-red-500/20 px-2 py-1 rounded uppercase">
                                                    Bottleneck
                                                </span>
                                            )}
                                            <span
                                                className={`text-xs font-black px-2 py-1 rounded ${isOverloaded
                                                    ? 'bg-yellow-500/20 text-yellow-500'
                                                    : 'bg-emerald-500/20 text-emerald-500'
                                                    }`}
                                            >
                                                {cycleTime.toFixed(1)}s
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {station.operations.length === 0 ? (
                                            <p className="text-zinc-600 text-xs text-center py-8 italic">
                                                Drop tasks here
                                            </p>
                                        ) : (
                                            station.operations.map(op => {
                                                const colors = CATEGORY_COLORS[op.category];
                                                return (
                                                    <div
                                                        key={op.id}
                                                        className={`${colors.bg} border ${colors.border} p-2 rounded-lg group hover:border-red-500/50 transition-all`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-bold text-white">{op.name}</p>
                                                                <p className={`text-[9px] font-mono ${colors.text}`}>{op.code}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[11px] font-black ${colors.text}`}>{op.time}s</span>
                                                                <button
                                                                    onClick={() => handleRemoveFromStation(op.id, station.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
                                                                >
                                                                    <i className="fas fa-times text-[10px]"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LineBalancingView;
