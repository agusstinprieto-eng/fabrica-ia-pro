import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { exportRegionalComparisonToPDF } from '../../services/pdfService';
import { exportRegionalComparisonToExcel } from '../../services/excelService';
import { IndustrialMode } from '../../services/geminiService';

// Industry-specific product types
const INDUSTRY_PRODUCTS: Record<IndustrialMode, { id: string; name: string; sam: number; icon: string }[]> = {
    textile: [
        { id: 'tshirt', name: 'Basic T-Shirt', sam: 12, icon: '👕' },
        { id: 'polo', name: 'Polo Shirt', sam: 18, icon: '👔' },
        { id: 'jeans', name: 'Jeans (5-Pocket)', sam: 28, icon: '👖' },
        { id: 'dress-shirt', name: 'Dress Shirt', sam: 25, icon: '👔' },
        { id: 'hoodie', name: 'Hoodie', sam: 35, icon: '🧥' },
        { id: 'jacket', name: 'Jacket', sam: 45, icon: '🧥' },
    ],
    automotive: [
        { id: 'seat', name: 'Full Seat', sam: 45, icon: '💺' },
        { id: 'dashboard', name: 'Instrument Panel', sam: 60, icon: '📟' },
        { id: 'bumper', name: 'Bumper', sam: 30, icon: '🚗' },
        { id: 'door-panel', name: 'Door Panel', sam: 25, icon: '🚪' },
        { id: 'harness', name: 'Wire Harness', sam: 55, icon: '🔌' },
    ],
    aerospace: [
        { id: 'wing-panel', name: 'Wing Panel', sam: 120, icon: '✈️' },
        { id: 'seat-economy', name: 'Economy Seat', sam: 80, icon: '💺' },
        { id: 'cable-assy', name: 'Cable Assembly', sam: 90, icon: '🔌' },
        { id: 'overhead-bin', name: 'Overhead Bin', sam: 150, icon: '📦' },
    ],
    electronics: [
        { id: 'pcb-main', name: 'Main PCB', sam: 5, icon: '🟩' },
        { id: 'smartphone', name: 'Smartphone Assy', sam: 15, icon: '📱' },
        { id: 'tablet', name: 'Tablet Assy', sam: 20, icon: '📟' },
        { id: 'laptop', name: 'Laptop Assy', sam: 35, icon: '💻' },
    ],
    footwear: [
        { id: 'sneaker', name: 'Sports Sneaker', sam: 40, icon: '👟' },
        { id: 'boot', name: 'Industrial Boot', sam: 55, icon: '🥾' },
        { id: 'formal', name: 'Formal Shoe', sam: 45, icon: '👞' },
        { id: 'sandal', name: 'Casual Sandal', sam: 15, icon: '👡' },
    ],
    pharmaceutical: [
        { id: 'paracetamol', name: 'Paracetamol 500mg', sam: 2, icon: '💊' },
        { id: 'antibiotic', name: 'Generic Antibiotic', sam: 5, icon: '💉' },
        { id: 'vitamin', name: 'Vitamin C', sam: 3, icon: '🍊' },
    ],
    food: [
        { id: 'soda', name: 'Soda 600ml', sam: 0.5, icon: '🥤' },
        { id: 'cereal', name: 'Cereal Box', sam: 1.2, icon: '🥣' },
        { id: 'energy', name: 'Energy Drink', sam: 0.8, icon: '⚡' },
    ],
    metalworking: [
        { id: 'chassis', name: 'Auto Chassis', sam: 75, icon: '🏗️' },
        { id: 'gearbox', name: 'Gearbox', sam: 120, icon: '⚙️' },
        { id: 'bracket', name: 'Steel Bracket', sam: 15, icon: '🔩' },
    ],
    medical_devices: [
        { id: 'stent', name: 'Cardiac Stent', sam: 45, icon: '💓' },
        { id: 'catheter', name: 'Angiographic Catheter', sam: 30, icon: '🧪' },
        { id: 'scalpel', name: 'Disposable Scalpel', sam: 10, icon: '🔪' },
        { id: 'monitor', name: 'Vital Signs Monitor', sam: 120, icon: '🩺' },
    ],
    energy: [
        { id: 'solar-inv', name: 'Solar Inverter', sam: 90, icon: '☀️' },
        { id: 'battery-pack', name: 'Storage Battery 5kWh', sam: 110, icon: '🔋' },
        { id: 'wind-blade', name: 'Wind Blade Composite', sam: 300, icon: '🌬️' },
        { id: 'meter', name: 'Smart Meter', sam: 25, icon: '⚡' },
    ]
};

// FOB calculation constants
const DEFAULT_BOM = {
    materials: 4.50,
    trimmings: 1.20,
    washing: 0.00,
    logistics: 0.45
};

// Industry specific BOM multipliers/overrides (Simplified for demo)
const INDUSTRY_BOM_MULTIPLIERS = {
    textile: 1,
    automotive: 5, // Higher material cost
    aerospace: 12, // Very high material cost
    electronics: 8, // High component cost
    footwear: 2.5, // Leather/Synthetic costs
    pharmaceutical: 15, // Extremely high regulation/QA cost
    food: 3, // Ingredients + Packaging
    metalworking: 6, // Heavy steel/aluminum costs
    medical_devices: 20, // Critical precision + sterility
    energy: 12 // High grade electronics + energy storage
};

const FOB_PROFIT_MARGIN = 0.12; // 12% profit for factory

// Data Source
const REGIONAL_DATA_SOURCE = [
    {
        region: 'Asia',
        countries: [
            { name: 'Bangladesh', flag: '🇧🇩', hourlyWage: 0.58, overhead: 15, productivity: 45 },
            { name: 'Vietnam', flag: '🇻🇳', hourlyWage: 1.80, overhead: 18, productivity: 65 },
            { name: 'China (Inland)', flag: '🇨🇳', hourlyWage: 3.50, overhead: 20, productivity: 75 },
            { name: 'Cambodia', flag: '🇰🇭', hourlyWage: 0.95, overhead: 16, productivity: 50 },
        ]
    },
    {
        region: 'Americas',
        countries: [
            { name: 'Mexico', flag: '🇲🇽', hourlyWage: 2.50, overhead: 22, productivity: 70 },
            { name: 'Honduras', flag: '🇭🇳', hourlyWage: 1.60, overhead: 25, productivity: 60 },
            { name: 'El Salvador', flag: '🇸🇻', hourlyWage: 1.35, overhead: 24, productivity: 55 },
            { name: 'Colombia', flag: '🇨🇴', hourlyWage: 1.90, overhead: 20, productivity: 65 },
        ]
    },
    {
        region: 'Africa/Europe',
        countries: [
            { name: 'Turkey', flag: '🇹🇷', hourlyWage: 2.80, overhead: 18, productivity: 72 },
            { name: 'Ethiopia', flag: '🇪🇹', hourlyWage: 0.35, overhead: 30, productivity: 40 },
            { name: 'Morocco', flag: '🇲🇦', hourlyWage: 1.85, overhead: 20, productivity: 60 },
        ]
    }
];

interface RegionalComparisonViewProps {
    mode?: IndustrialMode;
    setMode?: (mode: IndustrialMode) => void;
}

const RegionalComparisonView: React.FC<RegionalComparisonViewProps> = ({ mode = 'textile', setMode }) => {
    const [selectedRegion, setSelectedRegion] = useState<string>('Asia');
    // Initialize with first product of current mode
    const [selectedProduct, setSelectedProduct] = useState<string>(INDUSTRY_PRODUCTS[mode][0].id);
    const [sam, setSam] = useState<number>(INDUSTRY_PRODUCTS[mode][0].sam);

    // Update product selection when mode changes
    useEffect(() => {
        const firstProduct = INDUSTRY_PRODUCTS[mode][0];
        setSelectedProduct(firstProduct.id);
        setSam(firstProduct.sam);
    }, [mode]);

    const currentRegion = REGIONAL_DATA_SOURCE.find((r) => r.region === selectedRegion);
    const currentProducts = INDUSTRY_PRODUCTS[mode];

    const calculateCMCost = (wage: number, overhead: number, productivity: number) => {
        const effectiveCost = (wage / 60) / (productivity / 100);
        return (sam * effectiveCost) * (1 + overhead / 100);
    };

    const calculateFOBCost = (cmCost: number) => {
        // Base BOM adjusted by industry multiplier
        const baseMaterials = DEFAULT_BOM.materials * INDUSTRY_BOM_MULTIPLIERS[mode];
        const baseTrimmings = DEFAULT_BOM.trimmings * (mode === 'textile' ? 1 : 2); // Trimmings mostly for textile
        const logistics = DEFAULT_BOM.logistics * (mode === 'aerospace' ? 10 : mode === 'automotive' ? 5 : 1);

        const totalBase = cmCost + baseMaterials + baseTrimmings + DEFAULT_BOM.washing + logistics;
        return totalBase * (1 + FOB_PROFIT_MARGIN);
    };

    const allCountries = REGIONAL_DATA_SOURCE.flatMap((r) => r.countries);
    const cheapest = allCountries.reduce((prev, curr) =>
        calculateFOBCost(calculateCMCost(curr.hourlyWage, curr.overhead, curr.productivity)) <
            calculateFOBCost(calculateCMCost(prev.hourlyWage, prev.overhead, prev.productivity))
            ? curr
            : prev
    );

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            <i className="fas fa-globe-americas text-cyber-blue mr-3"></i>
                            Regional Analysis: <span className="text-cyber-blue">{mode}</span>
                        </h2>
                        <p className="text-zinc-500 text-sm">
                            Compare labor costs and competitiveness for {mode} manufacturing
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Industry Selector */}
                        {setMode && (
                            <div className="relative">
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as IndustrialMode)}
                                    className="bg-gray-900 border border-cyber-blue/30 text-cyber-blue font-bold pl-4 pr-8 py-3 rounded-xl focus:border-cyber-blue outline-none appearance-none cursor-pointer uppercase text-xs"
                                >
                                    <option value="automotive" className="bg-gray-900 text-white">🚗 Automotive</option>
                                    <option value="aerospace" className="bg-gray-900 text-white">✈️ Aerospace</option>
                                    <option value="electronics" className="bg-gray-900 text-white">⚡ Electronics</option>
                                    <option value="textile" className="bg-gray-900 text-white">🧵 Textile</option>
                                    <option value="footwear" className="bg-gray-900 text-white">👟 Footwear</option>
                                    <option value="pharmaceutical" className="bg-gray-900 text-white">💊 Pharma</option>
                                    <option value="food" className="bg-gray-900 text-white">🥤 Food & Bev</option>
                                    <option value="metalworking" className="bg-gray-900 text-white">⚙️ Metalworking</option>
                                    <option value="medical_devices" className="bg-gray-900 text-white">🩺 Medical Devices</option>
                                    <option value="energy" className="bg-gray-900 text-white">🔋 Energy & Renewables</option>
                                </select>
                                <i className="fas fa-industry absolute right-3 top-1/2 -translate-y-1/2 text-cyber-blue pointer-events-none"></i>
                            </div>
                        )}

                        {/* Export Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const countries = allCountries.map(c => {
                                        const cm = calculateCMCost(c.hourlyWage, c.overhead, c.productivity);
                                        return {
                                            ...c,
                                            costPerPiece: calculateFOBCost(cm)
                                        };
                                    });
                                    const product = currentProducts.find(g => g.id === selectedProduct);
                                    exportRegionalComparisonToPDF(countries, sam, product?.name || 'General', mode);
                                }}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold text-xs sm:text-sm"
                            >
                                <i className="fas fa-file-pdf"></i>
                                <span className="hidden sm:inline">PDF</span>
                            </button>

                            <button
                                onClick={() => {
                                    const countries = allCountries.map(c => {
                                        const cm = calculateCMCost(c.hourlyWage, c.overhead, c.productivity);
                                        return {
                                            ...c,
                                            costPerPiece: calculateFOBCost(cm)
                                        };
                                    });
                                    exportRegionalComparisonToExcel(countries, sam);
                                }}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold text-xs sm:text-sm"
                            >
                                <i className="fas fa-file-excel"></i>
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                        </div>

                        {/* Product & Region Selectors */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {/* Product Selector */}
                            <div className="relative flex-1">
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => {
                                        setSelectedProduct(e.target.value);
                                        const product = currentProducts.find(g => g.id === e.target.value);
                                        if (product) setSam(product.sam);
                                    }}
                                    className="w-full bg-gray-900 border border-cyber-blue/30 text-white font-bold pl-10 pr-6 py-3 rounded-xl focus:border-cyber-blue outline-none appearance-none cursor-pointer hover:border-cyber-blue/50 transition-all text-sm sm:text-base"
                                >
                                    {currentProducts.map((product) => (
                                        <option key={product.id} value={product.id} className="bg-gray-900 text-white">
                                            {product.icon} {product.name} ({product.sam} min)
                                        </option>
                                    ))}
                                </select>
                                <i className="fas fa-box absolute left-3 top-1/2 -translate-y-1/2 text-cyber-blue"></i>
                            </div>

                            {/* Region Selector */}
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="bg-gray-900 border border-cyber-blue/30 text-white font-bold px-6 py-3 rounded-xl focus:border-cyber-blue outline-none text-sm sm:text-base"
                            >
                                {REGIONAL_DATA_SOURCE.map((region) => (
                                    <option key={region.region} value={region.region} className="bg-gray-900 text-white">
                                        {region.region}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Global Champion */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500 p-4 sm:p-6 rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                                🏆 Most Competitive (FOB)
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-white">
                                {cheapest.flag} {cheapest.name}
                            </p>
                            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                                FOB: ${calculateFOBCost(calculateCMCost(cheapest.hourlyWage, cheapest.overhead, cheapest.productivity)).toFixed(3)} | CM: ${calculateCMCost(cheapest.hourlyWage, cheapest.overhead, cheapest.productivity).toFixed(3)}
                            </p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-xs text-zinc-500 mb-1">Hourly Wage</p>
                            <p className="text-lg font-black text-emerald-400">${cheapest.hourlyWage}</p>
                        </div>
                    </div>

                    {/* Cost Comparison Chart */}
                    <div className="bg-cyber-dark border border-white/10 rounded-2xl overflow-hidden p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <i className="fas fa-chart-bar text-cyber-blue"></i>
                                Global Cost Ranking (FOB)
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">Countries sorted by total FOB cost (lowest to highest)</p>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={allCountries
                                    .map(country => {
                                        const cm = calculateCMCost(country.hourlyWage, country.overhead, country.productivity);
                                        const fob = calculateFOBCost(cm);
                                        return {
                                            name: country.name,
                                            flag: country.flag,
                                            cost: parseFloat(fob.toFixed(2)),
                                            isCompetitive: country.name === cheapest.name
                                        };
                                    })
                                    .sort((a, b) => a.cost - b.cost)}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                <XAxis
                                    type="number"
                                    stroke="#00d4ff"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#00d4ff"
                                    tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
                                    width={120}
                                    tickFormatter={(value, index) => {
                                        const item = allCountries
                                            .map(country => {
                                                const cm = calculateCMCost(country.hourlyWage, country.overhead, country.productivity);
                                                const fob = calculateFOBCost(cm);
                                                return {
                                                    name: country.name,
                                                    flag: country.flag,
                                                    cost: parseFloat(fob.toFixed(2))
                                                };
                                            })
                                            .sort((a, b) => a.cost - b.cost)[index];
                                        return item ? `${item.flag} ${value}` : value;
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #00d4ff',
                                        borderRadius: '8px',
                                        padding: '8px 12px'
                                    }}
                                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                    itemStyle={{ color: '#22d3ee' }}
                                    formatter={(value: any) => [`$${value}`, 'FOB Cost']}
                                />
                                <Bar dataKey="cost" radius={[0, 8, 8, 0]}>
                                    {allCountries.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? '#10b981' : '#00d4ff'}
                                            opacity={index === 0 ? 1 : 0.85}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="cost"
                                        position="right"
                                        style={{ fill: '#fff', fontWeight: 'bold', fontSize: 12 }}
                                        formatter={(value: any) => `$${value}`}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Country Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentRegion?.countries.map((country) => {
                        const cmCost = calculateCMCost(country.hourlyWage, country.overhead, country.productivity);
                        const fobCost = calculateFOBCost(cmCost);
                        const isCompetitive = fobCost < (mode === 'textile' ? 12 : 100); // Dynamic threshold

                        return (
                            <div
                                key={country.name}
                                className={`bg-cyber-dark border rounded-2xl p-6 transition-all hover:scale-105 ${country.name === cheapest.name
                                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    : 'border-white/10 hover:border-cyber-blue/50'
                                    }`}
                            >
                                <div className="text-center mb-4">
                                    <span className="text-5xl">{country.flag}</span>
                                    <h3 className="text-lg font-black text-white mt-2">{country.name}</h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-zinc-500">Wage / OH</span>
                                        <span className="font-bold text-cyber-blue">${country.hourlyWage} / {country.overhead}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-zinc-500">CM Cost</span>
                                        <span className="font-bold text-white">${cmCost.toFixed(3)}</span>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-white/10">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Est. FOB Price</p>
                                        <p className={`text-xl sm:text-2xl font-black ${isCompetitive ? 'text-emerald-400' : 'text-white'}`}>
                                            ${fobCost.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Table */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-black text-white uppercase tracking-wide">
                            Detailed Comparison Table
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-black/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-cyber-blue uppercase">Country</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">Wage/Hour</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">CM Cost</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">BOM+Logistics</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">Profit (12%)</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">FOB Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCountries
                                    .sort((a, b) => {
                                        const costA = calculateFOBCost(calculateCMCost(a.hourlyWage, a.overhead, a.productivity));
                                        const costB = calculateFOBCost(calculateCMCost(b.hourlyWage, b.overhead, b.productivity));
                                        return costA - costB;
                                    })
                                    .map((country, index) => {
                                        const cm = calculateCMCost(country.hourlyWage, country.overhead, country.productivity);
                                        const fob = calculateFOBCost(cm);
                                        const bomAndLogistics = fob / (1 + FOB_PROFIT_MARGIN) - cm;
                                        const profit = fob - (cm + bomAndLogistics);

                                        return (
                                            <tr key={country.name} className="border-t border-white/5 hover:bg-white/5">
                                                <td className="px-6 py-4 text-sm font-bold text-white">
                                                    {country.flag} {country.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-cyber-blue font-bold">
                                                    ${country.hourlyWage}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-zinc-400">
                                                    ${cm.toFixed(3)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-zinc-400">
                                                    ${bomAndLogistics.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-zinc-500 italic">
                                                    +${profit.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-black text-white">
                                                    ${fob.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegionalComparisonView;
