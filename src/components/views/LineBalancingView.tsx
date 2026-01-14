import React, { useState, useEffect } from 'react';
import { exportLineBalancingToPDF } from '../../services/pdfService';
import { exportLineBalancingToExcel } from '../../services/excelService';
import { exportLineBalancingToPowerPoint } from '../../services/pptxService';
import { IndustrialMode } from '../../services/geminiService';

interface Operation {
    id: string;
    name: string;
    code: string;
    time: number;
    stationId: string | null;
    category: ProcessType;
}

interface Station {
    id: string;
    name: string;
    operations: Operation[];
}

type ProcessType = 'generic' | 'assembly' | 'inspection' | 'testing' | 'packaging' | 'machining' | 'soldering' | 'sewing';

// Data structure for different industries
const INDUSTRIAL_OPERATIONS: Record<IndustrialMode, Record<string, Omit<Operation, 'stationId'>[]>> = {
    automotive: {
        'seat_belt': [
            { id: 'sb-1', name: 'Mount Retractor', code: 'OP-10', time: 12.5, category: 'assembly' },
            { id: 'sb-2', name: 'Attach Webbing', code: 'OP-20', time: 15.2, category: 'assembly' },
            { id: 'sb-3', name: 'Install Tensioner', code: 'OP-30', time: 18.5, category: 'assembly' },
            { id: 'sb-4', name: 'Torque Check', code: 'QC-10', time: 8.5, category: 'inspection' },
            { id: 'sb-5', name: 'Buckle Assembly', code: 'OP-40', time: 14.2, category: 'assembly' },
            { id: 'sb-6', name: 'Final Pull Test', code: 'QC-20', time: 22.0, category: 'testing' },
        ],
        'transmission': [
            { id: 'tr-1', name: 'Case Preparation', code: 'OP-05', time: 25.0, category: 'machining' },
            { id: 'tr-2', name: 'Install Gears', code: 'OP-15', time: 45.5, category: 'assembly' },
            { id: 'tr-3', name: 'Seal Housing', code: 'OP-25', time: 18.2, category: 'assembly' },
            { id: 'tr-4', name: 'Leak Test', code: 'QC-05', time: 30.0, category: 'testing' },
        ]
    },
    aerospace: {
        'avionics': [
            { id: 'av-1', name: 'PCB Mounting', code: 'AV-10', time: 35.5, category: 'assembly' },
            { id: 'av-2', name: 'Wiring Harness', code: 'AV-20', time: 55.0, category: 'assembly' },
            { id: 'av-3', name: 'Connector Crimping', code: 'AV-25', time: 22.5, category: 'assembly' },
            { id: 'av-4', name: 'Continuity Check', code: 'QC-10', time: 15.0, category: 'testing' },
            { id: 'av-5', name: 'FOD Guard', code: 'QA-01', time: 10.0, category: 'inspection' },
        ],
        'fuselage': [
            { id: 'fs-1', name: 'Panel Positioning', code: 'ST-10', time: 120.0, category: 'assembly' },
            { id: 'fs-2', name: 'Riveting (Auto)', code: 'ST-20', time: 45.0, category: 'machining' },
            { id: 'fs-3', name: 'Sealant Application', code: 'ST-30', time: 35.0, category: 'assembly' },
            { id: 'fs-4', name: 'NDT Inspection', code: 'QA-50', time: 60.0, category: 'inspection' },
        ]
    },
    electronics: {
        'pcb_smt': [
            { id: 'smt-1', name: 'Solder Paste', code: 'SMT-01', time: 12.0, category: 'soldering' },
            { id: 'smt-2', name: 'Pick & Place', code: 'SMT-05', time: 45.0, category: 'assembly' },
            { id: 'smt-3', name: 'Reflow Oven', code: 'SMT-10', time: 180.0, category: 'soldering' },
            { id: 'smt-4', name: 'AOI Inspection', code: 'QA-05', time: 15.0, category: 'inspection' },
        ],
        'box_build': [
            { id: 'bb-1', name: 'Sub-Assembly', code: 'ASY-10', time: 25.0, category: 'assembly' },
            { id: 'bb-2', name: 'Wiring Routing', code: 'ASY-20', time: 35.0, category: 'assembly' },
            { id: 'bb-3', name: 'Enclosure Close', code: 'ASY-30', time: 12.0, category: 'assembly' },
            { id: 'bb-4', name: 'Functional Test', code: 'QA-10', time: 45.0, category: 'testing' },
            { id: 'bb-5', name: 'Packaging', code: 'PKG-01', time: 10.0, category: 'packaging' },
        ]
    },
    textile: {
        'jeans': [
            { id: 'jean-1', name: 'Coser Entrepierna', code: 'GSD 5.8', time: 12.5, category: 'sewing' },
            { id: 'jean-2', name: 'Pegar Bolsillos', code: 'GSD 7.4', time: 18.3, category: 'sewing' },
            { id: 'jean-3', name: 'Coser Lateral', code: 'GSD 5.9', time: 14.2, category: 'sewing' },
            { id: 'jean-4', name: 'Poner Cierre', code: 'GSD 8.6', time: 22.5, category: 'sewing' },
            { id: 'jean-5', name: 'Pespunte', code: 'GSD 6.7', time: 15.8, category: 'sewing' },
            { id: 'jean-6', name: 'Pretina', code: 'GSD 7.9', time: 11.2, category: 'sewing' },
            { id: 'jean-7', name: 'Ruedo', code: 'GSD 9.1', time: 9.5, category: 'sewing' },
            { id: 'jean-8', name: 'Botón/Remache', code: 'GSD 10.3', time: 4.8, category: 'assembly' },
        ],
        'tshirt': [
            { id: 'tsh-1', name: 'Coser Hombros', code: 'GSD 5.2', time: 6.3, category: 'sewing' },
            { id: 'tsh-2', name: 'Pegar Mangas', code: 'GSD 7.1', time: 9.5, category: 'sewing' },
            { id: 'tsh-3', name: 'Cerrar Costados', code: 'GSD 5.6', time: 8.1, category: 'sewing' },
            { id: 'tsh-4', name: 'Ribete Cuello', code: 'GSD 6.4', time: 10.2, category: 'sewing' },
            { id: 'tsh-5', name: 'Ruedo Manga', code: 'GSD 7.3', time: 5.4, category: 'sewing' },
            { id: 'tsh-6', name: 'Ruedo Base', code: 'GSD 9.1', time: 7.8, category: 'sewing' },
        ]
    }
};

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
            // Reset stations and ops when mode switches hard
            setStations([
                { id: 'station-1', name: 'Station 1', operations: [] },
                { id: 'station-2', name: 'Station 2', operations: [] },
                { id: 'station-3', name: 'Station 3', operations: [] },
                { id: 'station-4', name: 'Station 4', operations: [] },
            ]);
        }
    }, [mode]);

    // Update available ops when product changes
    useEffect(() => {
        const productOps = (INDUSTRIAL_OPERATIONS[mode] || INDUSTRIAL_OPERATIONS['textile'])[selectedProduct] || [];
        setAvailableOps(productOps.map(op => ({ ...op, stationId: null })));
    }, [selectedProduct, mode]);

    const [stations, setStations] = useState<Station[]>([
        { id: 'station-1', name: 'Station 1', operations: [] },
        { id: 'station-2', name: 'Station 2', operations: [] },
        { id: 'station-3', name: 'Station 3', operations: [] },
        { id: 'station-4', name: 'Station 4', operations: [] },
    ]);

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

        setStations(prev => prev.map(station => {
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

        setStations(prev => prev.map(s => {
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

    const getBottleneck = () => {
        const times = stations.map(s => calculateStationTime(s));
        const maxTime = Math.max(...times);
        return maxTime;
    };

    const getEfficiency = () => {
        const bottleneck = getBottleneck();
        if (bottleneck === 0) return 100;
        const totalTime = stations.reduce((sum, s) => sum + calculateStationTime(s), 0);
        const avgTime = totalTime / stations.length;
        return ((avgTime / bottleneck) * 100).toFixed(1);
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
                                className="bg-black/50 text-white font-bold text-sm rounded-lg px-4 py-2 border border-white/10 focus:border-cyber-blue outline-none cursor-pointer uppercase"
                            >
                                <option value="automotive">🚗 Automotive</option>
                                <option value="aerospace">✈️ Aerospace</option>
                                <option value="electronics">⚡ Electronics</option>
                                <option value="textile">🧵 Textile</option>
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
                                <option key={key} value={key}>{formatProductLabel(key)}</option>
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
