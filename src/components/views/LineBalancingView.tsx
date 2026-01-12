import React, { useState } from 'react';
import { exportLineBalancingToPDF } from '../../services/pdfService';
import { exportLineBalancingToExcel } from '../../services/excelService';
import { exportLineBalancingToPowerPoint } from '../../services/pptxService';

interface Operation {
    id: string;
    name: string;
    code: string;
    time: number;
    stationId: string | null;
    category: GarmentType;
}

interface Station {
    id: string;
    name: string;
    operations: Operation[];
}

type GarmentType = 'generic' | 'jeans' | 'polo' | 'tshirt' | 'dress_shirt' | 'jacket' | 'shorts' | 'hoodie';

const GARMENT_OPERATIONS: Record<GarmentType, Omit<Operation, 'stationId'>[]> = {
    generic: [
        { id: 'gen-1', name: 'Posicionar Tela', code: 'GSD 4.1', time: 3.5, category: 'generic' },
        { id: 'gen-2', name: 'Coser Lateral', code: 'GSD 5.3', time: 8.2, category: 'generic' },
        { id: 'gen-3', name: 'Girar Pieza', code: 'GSD 6.1', time: 2.1, category: 'generic' },
        { id: 'gen-4', name: 'Doblar y Apilar', code: 'GSD 9.3', time: 3.2, category: 'generic' },
    ],
    tshirt: [
        { id: 'tsh-1', name: 'Coser Hombros', code: 'GSD 5.2', time: 6.3, category: 'tshirt' },
        { id: 'tsh-2', name: 'Pegar Mangas', code: 'GSD 7.1', time: 9.5, category: 'tshirt' },
        { id: 'tsh-3', name: 'Cerrar Costados', code: 'GSD 5.6', time: 8.1, category: 'tshirt' },
        { id: 'tsh-4', name: 'Ribete Cuello', code: 'GSD 6.4', time: 10.2, category: 'tshirt' },
        { id: 'tsh-5', name: 'Ruedo Manga', code: 'GSD 7.3', time: 5.4, category: 'tshirt' },
        { id: 'tsh-6', name: 'Ruedo Base', code: 'GSD 9.1', time: 7.8, category: 'tshirt' },
    ],
    jeans: [
        { id: 'jean-1', name: 'Coser Entrepierna', code: 'GSD 5.8', time: 12.5, category: 'jeans' },
        { id: 'jean-2', name: 'Pegar Bolsillos Traseros', code: 'GSD 7.4', time: 18.3, category: 'jeans' },
        { id: 'jean-3', name: 'Coser Lateral Externo', code: 'GSD 5.9', time: 14.2, category: 'jeans' },
        { id: 'jean-4', name: 'Poner Cierre', code: 'GSD 8.6', time: 22.5, category: 'jeans' },
        { id: 'jean-5', name: 'Pespunte Decorativo', code: 'GSD 6.7', time: 15.8, category: 'jeans' },
        { id: 'jean-6', name: 'Coser Pretina', code: 'GSD 7.9', time: 11.2, category: 'jeans' },
        { id: 'jean-7', name: 'Hacer Ruedo', code: 'GSD 9.1', time: 9.5, category: 'jeans' },
        { id: 'jean-8', name: 'Poner Botón/Remache', code: 'GSD 10.3', time: 4.8, category: 'jeans' },
    ],
    polo: [
        { id: 'polo-1', name: 'Coser Cuello', code: 'GSD 6.3', time: 8.7, category: 'polo' },
        { id: 'polo-2', name: 'Pegar Mangas', code: 'GSD 7.1', time: 12.4, category: 'polo' },
        { id: 'polo-3', name: 'Coser Costados', code: 'GSD 5.5', time: 10.2, category: 'polo' },
        { id: 'polo-4', name: 'Ribete Cuello', code: 'GSD 6.8', time: 14.5, category: 'polo' },
        { id: 'polo-5', name: 'Ojales Botonera', code: 'GSD 8.2', time: 6.3, category: 'polo' },
        { id: 'polo-6', name: 'Poner Botones', code: 'GSD 9.4', time: 5.1, category: 'polo' },
        { id: 'polo-7', name: 'Hacer Ruedo Manga', code: 'GSD 7.7', time: 7.8, category: 'polo' },
        { id: 'polo-8', name: 'Hacer Ruedo Base', code: 'GSD 9.2', time: 9.3, category: 'polo' },
    ],
    dress_shirt: [
        { id: 'dsh-1', name: 'Montar Cuello y Pie', code: 'GSD 8.5', time: 16.2, category: 'dress_shirt' },
        { id: 'dsh-2', name: 'Pegar Yugo', code: 'GSD 6.9', time: 11.5, category: 'dress_shirt' },
        { id: 'dsh-3', name: 'Coser Pinzas', code: 'GSD 5.4', time: 7.3, category: 'dress_shirt' },
        { id: 'dsh-4', name: 'Pegar Mangas', code: 'GSD 7.2', time: 13.8, category: 'dress_shirt' },
        { id: 'dsh-5', name: 'Coser Costados', code: 'GSD 5.7', time: 10.5, category: 'dress_shirt' },
        { id: 'dsh-6', name: 'Ojales (7 ud.)', code: 'GSD 8.8', time: 14.7, category: 'dress_shirt' },
        { id: 'dsh-7', name: 'Poner Botones', code: 'GSD 9.6', time: 12.1, category: 'dress_shirt' },
        { id: 'dsh-8', name: 'Hacer Puños', code: 'GSD 7.5', time: 19.5, category: 'dress_shirt' },
    ],
    jacket: [
        { id: 'jkt-1', name: 'Coser Hombros Forro', code: 'GSD 6.2', time: 14.8, category: 'jacket' },
        { id: 'jkt-2', name: 'Montar Cuello/Solapa', code: 'GSD 9.7', time: 28.5, category: 'jacket' },
        { id: 'jkt-3', name: 'Pegar Mangas', code: 'GSD 7.8', time: 22.3, category: 'jacket' },
        { id: 'jkt-4', name: 'Cerrar Costados', code: 'GSD 6.1', time: 16.7, category: 'jacket' },
        { id: 'jkt-5', name: 'Pegar Bolsillos', code: 'GSD 8.4', time: 18.9, category: 'jacket' },
        { id: 'jkt-6', name: 'Ojales y Botones', code: 'GSD 10.2', time: 15.4, category: 'jacket' },
        { id: 'jkt-7', name: 'Unir Forro', code: 'GSD 7.9', time: 25.6, category: 'jacket' },
        { id: 'jkt-8', name: 'Hacer Ruedo', code: 'GSD 9.3', time: 12.8, category: 'jacket' },
    ],
    shorts: [
        { id: 'sho-1', name: 'Coser Entrepierna', code: 'GSD 5.6', time: 8.3, category: 'shorts' },
        { id: 'sho-2', name: 'Pegar Bolsillos', code: 'GSD 7.2', time: 12.5, category: 'shorts' },
        { id: 'sho-3', name: 'Coser Laterales', code: 'GSD 5.8', time: 9.7, category: 'shorts' },
        { id: 'sho-4', name: 'Poner Cierre', code: 'GSD 8.3', time: 14.2, category: 'shorts' },
        { id: 'sho-5', name: 'Coser Pretina', code: 'GSD 7.5', time: 10.8, category: 'shorts' },
        { id: 'sho-6', name: 'Hacer Ruedo', code: 'GSD 9.1', time: 7.5, category: 'shorts' },
    ],
    hoodie: [
        { id: 'hoo-1', name: 'Coser Capucha', code: 'GSD 8.1', time: 16.8, category: 'hoodie' },
        { id: 'hoo-2', name: 'Pegar Capucha a Cuerpo', code: 'GSD 7.4', time: 14.3, category: 'hoodie' },
        { id: 'hoo-3', name: 'Pegar Mangas', code: 'GSD 7.2', time: 13.5, category: 'hoodie' },
        { id: 'hoo-4', name: 'Cerrar Costados', code: 'GSD 5.9', time: 11.2, category: 'hoodie' },
        { id: 'hoo-5', name: 'Pegar Bolsillo Kanguro', code: 'GSD 8.5', time: 18.7, category: 'hoodie' },
        { id: 'hoo-6', name: 'Ribete Puño Manga', code: 'GSD 6.8', time: 9.4, category: 'hoodie' },
        { id: 'hoo-7', name: 'Ribete Base', code: 'GSD 7.1', time: 10.8, category: 'hoodie' },
        { id: 'hoo-8', name: 'Poner Cordón', code: 'GSD 9.2', time: 6.5, category: 'hoodie' },
    ],
};

const CATEGORY_COLORS: Record<GarmentType, { border: string; bg: string; text: string }> = {
    generic: { border: 'border-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
    tshirt: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    jeans: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    polo: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    dress_shirt: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    jacket: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    shorts: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    hoodie: { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-400' },
};

const LineBalancingView: React.FC = () => {
    const [garmentType, setGarmentType] = useState<GarmentType>('jeans');
    const [stations, setStations] = useState<Station[]>([
        { id: 'station-1', name: 'Station 1', operations: [] },
        { id: 'station-2', name: 'Station 2', operations: [] },
        { id: 'station-3', name: 'Station 3', operations: [] },
        { id: 'station-4', name: 'Station 4', operations: [] },
    ]);

    const [availableOps, setAvailableOps] = useState<Operation[]>(
        GARMENT_OPERATIONS[garmentType].map(op => ({ ...op, stationId: null }))
    );

    const [draggedOp, setDraggedOp] = useState<Operation | null>(null);
    const [targetCycleTime] = useState(20);

    const handleGarmentChange = (type: GarmentType) => {
        setGarmentType(type);
        setStations(prev => prev.map(s => ({ ...s, operations: [] })));
        setAvailableOps(GARMENT_OPERATIONS[type].map(op => ({ ...op, stationId: null })));
    };

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

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        Smart <span className="text-cyber-blue">Balancing</span>
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Drag operations to stations to optimize production flow
                    </p>
                </div>

                {/* Export & Garment Type Selector */}
                <div className="flex items-center gap-3">
                    {/* Export Buttons */}
                    <button
                        onClick={() => {
                            exportLineBalancingToPDF(stations, targetCycleTime, garmentType);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-pdf"></i>
                        PDF
                    </button>

                    <button
                        onClick={() => {
                            exportLineBalancingToExcel(stations, targetCycleTime, garmentType);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-excel"></i>
                        Excel
                    </button>

                    <button
                        onClick={() => {
                            exportLineBalancingToPowerPoint(stations, targetCycleTime, garmentType);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all font-bold"
                    >
                        <i className="fas fa-file-powerpoint"></i>
                        PowerPoint
                    </button>

                    {/* Garment Type Selector */}
                    <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-3 flex items-center gap-3">
                        <i className="fas fa-tshirt text-cyber-blue"></i>
                        <select
                            value={garmentType}
                            onChange={(e) => handleGarmentChange(e.target.value as GarmentType)}
                            className="bg-black/50 text-white font-bold text-sm rounded-lg px-4 py-2 border border-white/10 focus:border-cyber-blue outline-none cursor-pointer"
                        >
                            <option value="generic">⚙️ Generic Operations</option>
                            <option value="tshirt">👕 T-Shirt</option>
                            <option value="polo">🎽 Polo Shirt</option>
                            <option value="dress_shirt">👔 Dress Shirt</option>
                            <option value="jeans">👖 Jeans / Denim</option>
                            <option value="shorts">🩳 Shorts</option>
                            <option value="jacket">🧥 Jacket / Blazer</option>
                            <option value="hoodie">🧥 Hoodie</option>
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
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Available Operations</p>
                    <p className="text-2xl font-black text-white">{availableOps.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Operations Pool */}
                <div className="col-span-3">
                    <h3 className="text-sm font-black text-cyber-blue uppercase tracking-wider mb-4">
                        <i className="fas fa-list mr-2"></i>Operations Pool
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
                        <i className="fas fa-industry mr-2"></i>Production Line
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
                                                Drop operations here
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
