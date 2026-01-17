import React, { useState, useEffect, useRef } from 'react';
import FlowDiagramModal from '../FlowDiagramModal';
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

    // NEW: Custom Products State (Moved up to fix initialization order)
    const [customProducts, setCustomProducts] = useState<Record<string, Omit<Operation, 'stationId'>[]>>(() => {
        const saved = localStorage.getItem(`custom_products_${mode}`);
        return saved ? JSON.parse(saved) : {};
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newOps, setNewOps] = useState<Partial<Operation>[]>([
        { id: '1', name: '', code: '', time: undefined, category: 'assembly' }
    ]);
    const [isDiagramOpen, setIsDiagramOpen] = useState(false);

    // Focus Management
    const [autoFocusNew, setAutoFocusNew] = useState(false);
    const lastOpInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocusNew && lastOpInputRef.current) {
            const timer = setTimeout(() => {
                lastOpInputRef.current?.focus();
                setAutoFocusNew(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [newOps, autoFocusNew]);

    // Merge static data with custom data
    const allProducts = { ...modeProducts, ...customProducts };
    const allProductKeys = Object.keys(allProducts);

    const { updateCostInput } = useSimulation();

    useEffect(() => {
        const saved = localStorage.getItem(`custom_products_${mode}`);
        setCustomProducts(saved ? JSON.parse(saved) : {});
    }, [mode]);

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
        const productOps = allProducts[selectedProduct] || [];
        setAvailableOps(productOps.map(op => ({ ...op, stationId: null })));

        // Sync with Costing SAM
        const totalTime = productOps.reduce((sum, op) => sum + op.time, 0);
        // If mode is textile or footwear, convert seconds to minutes (standard SAM)
        const samValue = (mode === 'textile' || mode === 'footwear' || mode === 'aerospace')
            ? parseFloat((totalTime / 60).toFixed(2))
            : totalTime;

        updateCostInput('sam', samValue);
    }, [selectedProduct, mode, customProducts]);

    const [availableOps, setAvailableOps] = useState<Operation[]>([]);
    const [draggedOp, setDraggedOp] = useState<Operation | null>(null);
    const [targetCycleTime] = useState(mode === 'electronics' ? 60 : 30); // Dynamic target

    const handleEditProduct = () => {
        const product = allProducts[selectedProduct];
        if (!product) return;

        setNewProductName(formatProductLabel(selectedProduct));
        setNewOps(product.map(op => ({ ...op })));
        setIsModalOpen(true);
    };

    const handleSaveProduct = () => {
        if (!newProductName) return;
        const productId = newProductName.toLowerCase().replace(/\s+/g, '_');
        const formattedOps = newOps.map((op, idx) => ({
            id: `${productId}-${idx}`,
            name: op.name || 'Unnamed Op',
            code: op.code || `OP-${idx + 1}`,
            time: Number(op.time) || 10,
            category: op.category || 'assembly'
        }));

        const updated = { ...customProducts, [productId]: formattedOps };
        setCustomProducts(updated);
        localStorage.setItem(`custom_products_${mode}`, JSON.stringify(updated));
        setSelectedProduct(productId);
        setIsModalOpen(false);
        setNewProductName('');
        setNewOps([{ id: '1', name: '', code: '', time: undefined, category: 'assembly' }]);
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
            <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        Smart <span className="text-cyber-blue">Balancing</span>
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Optimizing line efficiency for: <span className="text-cyber-blue font-bold uppercase">{mode} MODE</span>
                    </p>
                </div>

                {/* Export & Product Selector */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Industry Selector */}
                    {setMode && (
                        <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-3 flex items-center gap-3">
                            <i className="fas fa-industry text-cyber-blue"></i>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as IndustrialMode)}
                                className="bg-[#050b14] text-cyber-blue font-bold text-sm rounded-lg px-2 sm:px-4 py-2 border border-cyber-blue shadow-[0_0_10px_rgba(0,255,255,0.1)] focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none cursor-pointer uppercase transition-all"
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
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                exportLineBalancingToPDF(stations, targetCycleTime, selectedProduct);
                            }}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold text-xs sm:text-sm"
                        >
                            <i className="fas fa-file-pdf"></i>
                            <span className="hidden sm:inline">PDF</span>
                        </button>

                        <button
                            onClick={() => {
                                exportLineBalancingToExcel(stations, targetCycleTime, selectedProduct);
                            }}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold text-xs sm:text-sm"
                        >
                            <i className="fas fa-file-excel"></i>
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsDiagramOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyber-purple/20 to-cyber-blue/20 border border-cyber-blue/50 text-white rounded-lg hover:from-cyber-purple/40 hover:to-cyber-blue/40 transition-all font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse text-xs sm:text-sm"
                    >
                        <i className="fas fa-project-diagram text-cyber-blue"></i>
                        FLOW DIAGRAM
                    </button>

                    {/* Product Selector */}
                    <div className="bg-cyber-dark border border-cyber-blue/30 rounded-xl p-3 flex items-center gap-3">
                        <i className="fas fa-cogs text-cyber-blue"></i>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="bg-black/50 text-white font-bold text-sm rounded-lg px-2 sm:px-4 py-2 border border-white/10 focus:border-cyber-blue outline-none cursor-pointer max-w-[120px] sm:max-w-none"
                        >
                            {allProductKeys.map(key => (
                                <option key={key} value={key} className="bg-cyber-black text-white">
                                    {customProducts[key] ? '⭐ ' : ''}{formatProductLabel(key)}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-8 h-8 rounded-lg bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-black transition-all border border-cyber-blue/30 flex items-center justify-center"
                                title="Add Custom Product"
                            >
                                <i className="fas fa-plus text-xs"></i>
                            </button>
                            <button
                                onClick={handleEditProduct}
                                className="w-8 h-8 rounded-lg bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all border border-cyber-purple/30 flex items-center justify-center"
                                title="Edit Selected Product"
                            >
                                <i className="fas fa-edit text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-cyber-dark border border-cyber-blue/30 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Cycle Time (Bottleneck)</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{getBottleneck().toFixed(1)}s</p>
                    <p className={`text-xs font-bold mt-1 ${getBottleneck() > targetCycleTime ? 'text-red-400' : 'text-emerald-400'}`}>
                        Target: {targetCycleTime}s
                    </p>
                </div>
                <div className="bg-cyber-dark border border-cyber-purple/30 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Line Efficiency</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{getEfficiency()}%</p>
                </div>
                <div className="bg-cyber-dark border border-cyber-gray/30 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Available Ops</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{availableOps.length}</p>
                </div>
            </div>

            <div className="flex flex-col xl:grid xl:grid-cols-12 gap-8">
                {/* Operations Pool */}
                <div className="xl:col-span-3">
                    <h3 className="text-sm font-black text-cyber-blue uppercase tracking-wider mb-4">
                        <i className="fas fa-list mr-2"></i>Process Pool
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
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
                                            <p className="text-xs font-black text-white mb-1 leading-tight">{op.name}</p>
                                            <p className={`text-[10px] font-mono ${colors.text}`}>{op.code}</p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <p className={`text-sm font-black ${colors.text}`}>{op.time}s</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Stations */}
                <div className="xl:col-span-9">
                    <h3 className="text-sm font-black text-cyber-purple uppercase tracking-wider mb-4">
                        <i className="fas fa-industry mr-2"></i>Assembly Line
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                <span className="text-[8px] sm:text-[9px] font-black text-red-500 bg-red-500/20 px-2 py-1 rounded uppercase">
                                                    Bottleneck
                                                </span>
                                            )}
                                            <span
                                                className={`text-[10px] sm:text-xs font-black px-2 py-1 rounded ${isOverloaded
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
            {/* NEW: Custom Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-cyber-dark border border-cyber-blue/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.15)] animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-cyber-blue/20 flex justify-between items-center bg-cyber-blue/5">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">
                                <i className={`fas ${allProducts[selectedProduct] && formatProductLabel(selectedProduct) === newProductName.toUpperCase() ? 'fa-edit' : 'fa-plus-circle'} mr-2 text-cyber-blue`}></i>
                                {allProducts[selectedProduct] && formatProductLabel(selectedProduct) === newProductName.toUpperCase() ? 'Edit' : 'New Custom'} Product
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-cyber-blue uppercase tracking-widest mb-2">Product Name</label>
                                <input
                                    type="text"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    placeholder="e.g. Luxury Watch Assembly"
                                    className="w-full bg-black/50 border border-cyber-blue/20 rounded-xl p-3 text-white focus:border-cyber-blue outline-none transition-all"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-xs font-bold text-cyber-purple uppercase tracking-widest">Operations / Tasks</label>
                                    <button
                                        onClick={() => {
                                            setNewOps([...newOps, { id: Date.now().toString(), name: '', code: '', time: undefined, category: 'assembly' }]);
                                            setAutoFocusNew(true);
                                        }}
                                        className="text-[10px] font-bold text-cyber-purple hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <i className="fas fa-plus"></i> ADD ROW
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {newOps.map((op, idx) => (
                                        <div key={op.id} className="grid grid-cols-12 gap-3 items-end bg-white/5 p-3 rounded-xl border border-white/5 group">
                                            <div className="col-span-5">
                                                <label className="block text-[9px] text-zinc-500 uppercase mb-1">Operation Name</label>
                                                <input
                                                    ref={idx === newOps.length - 1 ? lastOpInputRef : null}
                                                    type="text"
                                                    value={op.name}
                                                    onChange={(e) => {
                                                        const updated = [...newOps];
                                                        updated[idx].name = e.target.value;
                                                        setNewOps(updated);
                                                    }}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-cyber-purple outline-none"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-[9px] text-zinc-500 uppercase mb-1">Time (sec)</label>
                                                <input
                                                    type="number"
                                                    value={op.time || ''}
                                                    onChange={(e) => {
                                                        const updated = [...newOps];
                                                        updated[idx].time = Number(e.target.value);
                                                        setNewOps(updated);
                                                    }}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-cyber-purple outline-none"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-[9px] text-zinc-500 uppercase mb-1">Category</label>
                                                <select
                                                    value={op.category}
                                                    onChange={(e) => {
                                                        const updated = [...newOps];
                                                        updated[idx].category = e.target.value as ProcessType;
                                                        setNewOps(updated);
                                                    }}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-cyber-purple outline-none"
                                                >
                                                    {Object.keys(CATEGORY_COLORS).map(cat => (
                                                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-1 pb-1">
                                                <button
                                                    onClick={() => setNewOps(newOps.filter((_, i) => i !== idx))}
                                                    className="text-red-500/50 hover:text-red-500 transition-colors p-2"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-cyber-blue/20 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-6 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:bg-white/5 transition-all font-bold uppercase text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                className="flex-[2] px-6 py-3 bg-cyber-blue text-black rounded-xl hover:bg-white transition-all font-black uppercase text-xs shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                            >
                                Save Product & Start Balancing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FlowDiagramModal
                isOpen={isDiagramOpen}
                onClose={() => setIsDiagramOpen(false)}
                stations={stations}
                productName={formatProductLabel(selectedProduct)}
            />
        </div>
    );
};

export default LineBalancingView;
