import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend, ComposedChart, Area } from 'recharts';
import { Globe2, MapPin, DollarSign, Zap, Truck, TrendingUp, Info } from 'lucide-react';
import { IndustrialMode } from '../../services/geminiService';

// Industry-specific product types (Aligned with RegionalComparisonView)
const INDUSTRY_PRODUCTS: Record<IndustrialMode, { id: string; name: string; sam: number; icon: string }[]> = {
    textile: [
        { id: 'tshirt', name: 'Basic T-Shirt', sam: 12, icon: '👕' },
        { id: 'polo', name: 'Polo Shirt', sam: 18, icon: '👔' },
        { id: 'jeans', name: 'Jeans (5-Pocket)', sam: 28, icon: '👖' },
    ],
    automotive: [
        { id: 'seat', name: 'Full Seat', sam: 45, icon: '💺' },
        { id: 'dashboard', name: 'Instrument Panel', sam: 60, icon: '📟' },
        { id: 'harness', name: 'Wire Harness', sam: 55, icon: '🔌' },
    ],
    aerospace: [
        { id: 'wing-panel', name: 'Wing Panel', sam: 120, icon: '✈️' },
        { id: 'seat-economy', name: 'Economy Seat', sam: 80, icon: '💺' },
        { id: 'overhead-bin', name: 'Overhead Bin', sam: 150, icon: '📦' },
    ],
    electronics: [
        { id: 'pcb-main', name: 'Main PCB', sam: 5, icon: '🟩' },
        { id: 'smartphone', name: 'Smartphone Assy', sam: 15, icon: '📱' },
    ],
    footwear: [
        { id: 'sneaker', name: 'Sports Sneaker', sam: 40, icon: '👟' },
        { id: 'boot', name: 'Industrial Boot', sam: 55, icon: '🥾' },
    ],
    pharmaceutical: [
        { id: 'paracetamol', name: 'Paracetamol 500mg', sam: 2, icon: '💊' },
        { id: 'antibiotic', name: 'Generic Antibiotic', sam: 5, icon: '💉' },
    ],
    food: [
        { id: 'soda', name: 'Soda 600ml', sam: 0.5, icon: '🥤' },
        { id: 'cereal', name: 'Cereal Box', sam: 1.2, icon: '🥣' },
    ],
    metalworking: [
        { id: 'chassis', name: 'Auto Chassis', sam: 75, icon: '🏗️' },
        { id: 'gearbox', name: 'Gearbox', sam: 120, icon: '⚙️' },
    ],
    medical_devices: [
        { id: 'stent', name: 'Cardiac Stent', sam: 45, icon: '💓' },
        { id: 'monitor', name: 'Vital Signs Monitor', sam: 120, icon: '🩺' },
    ],
    energy: [
        { id: 'solar-inv', name: 'Solar Inverter', sam: 90, icon: '☀️' },
        { id: 'battery-pack', name: 'Storage Battery 5kWh', sam: 110, icon: '🔋' },
    ]
};

// Mexico Cluster Data - 2026 Projections (Annualized/Burdened)
const MEXICO_CLUSTERS = [
    {
        name: 'Baja California',
        rent: 9.72, // USD/sqft Annual
        labor: 5.40, // USD/hour Burdened
        energy: 0.14, // USD/kWh
        logistics: 9.8, // Strategy Score 1-10
        color: '#00d4ff',
        specialty: 'Aerospace & Medical',
        nearshoring_index: 9.5
    },
    {
        name: 'Nuevo León',
        rent: 8.40,
        labor: 5.75,
        energy: 0.12,
        logistics: 9.2,
        color: '#ff00aa',
        specialty: 'Automotive & Heavy Ind.',
        nearshoring_index: 9.8
    },
    {
        name: 'Querétaro',
        rent: 6.72,
        labor: 5.15,
        energy: 0.13,
        logistics: 8.8,
        color: '#7000ff',
        specialty: 'Aerospace & Data Centers',
        nearshoring_index: 9.0
    }
];

const MexicoClustersView: React.FC<{ mode: IndustrialMode; setMode?: (m: IndustrialMode) => void }> = ({ mode, setMode }) => {
    const [selectedProduct, setSelectedProduct] = useState(INDUSTRY_PRODUCTS[mode][0].id);
    const [sam, setSam] = useState(INDUSTRY_PRODUCTS[mode][0].sam);

    useEffect(() => {
        const first = INDUSTRY_PRODUCTS[mode][0];
        setSelectedProduct(first.id);
        setSam(first.sam);
    }, [mode]);

    const calculateCostPerPiece = (cluster: typeof MEXICO_CLUSTERS[0]) => {
        // Simple heuristic for demo: (Labor * SAM / 60) + (Rent Factor) + (Energy Factor)
        const laborCost = (cluster.labor * (sam / 60)) * 1.25; // +25% overhead
        const energyCost = (cluster.energy * (sam / 10)); // Arbitrary scaling
        const rentCost = (cluster.rent / 12 / 100); // Distributed rent factor
        return laborCost + energyCost + rentCost;
    };

    return (
        <div className="h-full p-6 space-y-6 overflow-y-auto bg-cyber-black animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                        <Globe2 className="text-cyber-blue w-8 h-8" />
                        MEXICO <span className="text-cyber-blue italic">NEARSHORING</span> CLUSTERS
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">2026 Strategic Cost Analysis for Border and Central Clusters</p>
                </div>

                <div className="flex gap-3">
                    <select
                        value={mode}
                        onChange={(e) => setMode?.(e.target.value as IndustrialMode)}
                        className="bg-gray-900 border border-cyber-blue/30 text-cyber-blue font-bold px-4 py-2 rounded-xl focus:border-cyber-blue outline-none uppercase text-xs"
                    >
                        {Object.keys(INDUSTRY_PRODUCTS).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={selectedProduct}
                        onChange={(e) => {
                            setSelectedProduct(e.target.value);
                            const p = INDUSTRY_PRODUCTS[mode].find(x => x.id === e.target.value);
                            if (p) setSam(p.sam);
                        }}
                        className="bg-gray-900 border border-cyber-blue/30 text-white font-bold px-4 py-2 rounded-xl focus:border-cyber-blue outline-none text-xs"
                    >
                        {INDUSTRY_PRODUCTS[mode].map(p => (
                            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MEXICO_CLUSTERS.map(cluster => {
                    const costPerPiece = calculateCostPerPiece(cluster);
                    return (
                        <div key={cluster.name} className="bg-cyber-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-cyber-blue/50 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <MapPin size={48} color={cluster.color} />
                            </div>

                            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-wider">{cluster.name}</h3>
                            <p className="text-xs text-cyber-blue font-bold mb-4">{cluster.specialty}</p>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">LABOR (BURDENED)</span>
                                    <span className="text-white font-mono">${cluster.labor}/HR</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">INDUSTRIAL RENT</span>
                                    <span className="text-white font-mono">${cluster.rent} SQFT/YR</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">NEARSHORING INDEX</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1 bg-zinc-800 rounded-full">
                                            <div className="h-full bg-cyber-blue rounded-full" style={{ width: `${cluster.nearshoring_index * 10}%` }}></div>
                                        </div>
                                        <span className="text-cyber-blue font-bold">{cluster.nearshoring_index}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Estimated Cost Per Piece</p>
                                <p className="text-3xl font-black text-white">${costPerPiece.toFixed(2)} <span className="text-xs text-zinc-500 font-normal">USD</span></p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Distribution Chart */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-white uppercase mb-6 flex items-center gap-2">
                        <DollarSign className="text-cyber-blue w-5 h-5" />
                        Cost Component Comparison
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MEXICO_CLUSTERS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tick={{ fill: '#71717a' }} />
                                <YAxis stroke="#52525b" fontSize={12} tick={{ fill: '#71717a' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend />
                                <Bar dataKey="labor" name="Labor Factor" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="rent" name="Rent Factor" fill="#ff00aa" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="energy" name="Energy Unit" fill="#7000ff" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Efficiency vs Cost Analysis */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-white uppercase mb-6 flex items-center gap-2">
                        <TrendingUp className="text-cyber-blue w-5 h-5" />
                        Nearshoring Strategy Map
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={MEXICO_CLUSTERS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#52525b" fontSize={12} />
                                <YAxis stroke="#52525b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="logistics" name="Logistics Advantage" fill="#00d4ff20" stroke="#00d4ff" />
                                <Bar dataKey="nearshoring_index" name="Strategic Index" fill="#7000ff" radius={[4, 4, 0, 0]} barSize={20} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Logistics & Energy Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/40 border border-cyber-blue/20 rounded-2xl p-6 flex gap-4">
                    <div className="w-12 h-12 bg-cyber-blue/10 rounded-xl flex items-center justify-center shrink-0">
                        <Zap className="text-cyber-blue" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Energy Stability 2026</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Nuevo León leads in industrial energy infrastructure with the highest percentage of private generation capacity, reducing downtime risks for heavy manufacturing.
                        </p>
                    </div>
                </div>

                <div className="bg-black/40 border border-cyber-blue/20 rounded-2xl p-6 flex gap-4">
                    <div className="w-12 h-12 bg-cyber-blue/10 rounded-xl flex items-center justify-center shrink-0">
                        <Truck className="text-cyber-blue" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Logistics Corridor Alpha</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Baja California provides the fastest TTM (Time-to-Market) for West Coast distribution, while Querétaro serves as the premier multimodal hub for Central Mexico.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-cyber-blue/5 border border-cyber-blue/30 rounded-xl p-4 flex items-start gap-3">
                <Info className="text-cyber-blue shrink-0 w-5 h-5" />
                <p className="text-[10px] text-cyber-blue/80 italic leading-relaxed">
                    Note: Cost projections are based on early 2026 market benchmarks. Labor rates include typical employer burdens (IMSS, Infonavit, etc.) for skilled manufacturing operators. Rent is based on Class A industrial inventory.
                </p>
            </div>
        </div>
    );
};

export default MexicoClustersView;
