import React, { useState, useEffect } from 'react';
import { exportRegionalComparisonToPDF } from '../../services/pdfService';
import { exportRegionalComparisonToExcel } from '../../services/excelService';
import { IndustrialMode } from '../../services/geminiService';

// Industry-specific product types
const INDUSTRY_PRODUCTS: Record<IndustrialMode, { id: string; name: string; sam: number; icon: string }[]> = {
    textile: [
        { id: 'tshirt', name: 'T-Shirt Básica', sam: 12, icon: '👕' },
        { id: 'polo', name: 'Polo Shirt', sam: 18, icon: '👔' },
        { id: 'jeans', name: 'Jeans (5 bolsillos)', sam: 28, icon: '👖' },
        { id: 'dress-shirt', name: 'Camisa Formal', sam: 25, icon: '👔' },
        { id: 'hoodie', name: 'Sudadera con Capucha', sam: 35, icon: '🧥' },
        { id: 'jacket', name: 'Chamarra/Jacket', sam: 45, icon: '🧥' },
    ],
    automotive: [
        { id: 'seat', name: 'Asiento Completo', sam: 45, icon: '💺' },
        { id: 'dashboard', name: 'Tablero Inst.', sam: 60, icon: '📟' },
        { id: 'bumper', name: 'Parachoques', sam: 30, icon: '🚗' },
        { id: 'door-panel', name: 'Panel Puerta', sam: 25, icon: '🚪' },
        { id: 'harness', name: 'Arnés Eléctrico', sam: 55, icon: '🔌' },
    ],
    aerospace: [
        { id: 'wing-panel', name: 'Panel de Ala', sam: 120, icon: '✈️' },
        { id: 'seat-economy', name: 'Asiento Economy', sam: 80, icon: '💺' },
        { id: 'cable-assy', name: 'Ensamble Cables', sam: 90, icon: '🔌' },
        { id: 'overhead-bin', name: 'Compartimento Sup.', sam: 150, icon: '📦' },
    ],
    electronics: [
        { id: 'pcb-main', name: 'PCB Principal', sam: 5, icon: '🟩' },
        { id: 'smartphone', name: 'Smartphone Assy', sam: 15, icon: '📱' },
        { id: 'tablet', name: 'Tablet Assy', sam: 20, icon: '📟' },
        { id: 'laptop', name: 'Laptop Assy', sam: 35, icon: '💻' },
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
    electronics: 8 // High component cost
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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            <i className="fas fa-globe-americas text-cyber-blue mr-3"></i>
                            Regional Analysis: <span className="text-cyber-purple">{mode}</span>
                        </h2>
                        <p className="text-zinc-500 text-sm">
                            Compare labor costs and competitiveness for {mode} manufacturing
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Industry Selector */}
                        {setMode && (
                            <div className="relative">
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as IndustrialMode)}
                                    className="bg-black/50 border border-cyber-blue/30 text-cyber-blue font-bold pl-4 pr-8 py-3 rounded-xl focus:border-cyber-blue outline-none appearance-none cursor-pointer uppercase text-xs"
                                >
                                    <option value="automotive">🚗 Automotive</option>
                                    <option value="aerospace">✈️ Aerospace</option>
                                    <option value="electronics">⚡ Electronics</option>
                                    <option value="textile">🧵 Textile</option>
                                </select>
                                <i className="fas fa-industry absolute right-3 top-1/2 -translate-y-1/2 text-cyber-blue pointer-events-none"></i>
                            </div>
                        )}

                        {/* Export Buttons */}
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
                                exportRegionalComparisonToPDF(countries, sam, product?.name || 'General');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold"
                        >
                            <i className="fas fa-file-pdf"></i>
                            PDF
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
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold"
                        >
                            <i className="fas fa-file-excel"></i>
                            Excel
                        </button>

                        {/* Product Selector */}
                        <div className="relative">
                            <select
                                value={selectedProduct}
                                onChange={(e) => {
                                    setSelectedProduct(e.target.value);
                                    const product = currentProducts.find(g => g.id === e.target.value);
                                    if (product) setSam(product.sam);
                                }}
                                className="bg-cyber-dark border border-cyber-purple/30 text-white font-bold pl-10 pr-6 py-3 rounded-xl focus:border-cyber-purple outline-none appearance-none cursor-pointer hover:border-cyber-purple/50 transition-all"
                            >
                                {currentProducts.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.icon} {product.name} ({product.sam} min)
                                    </option>
                                ))}
                            </select>
                            <i className="fas fa-box absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple"></i>
                        </div>

                        {/* Region Selector */}
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="bg-cyber-dark border border-cyber-blue/30 text-white font-bold px-6 py-3 rounded-xl focus:border-cyber-blue outline-none"
                        >
                            {REGIONAL_DATA_SOURCE.map((region) => (
                                <option key={region.region} value={region.region}>
                                    {region.region}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Global Champion */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500 p-6 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                                🏆 Most Competitive (FOB)
                            </p>
                            <p className="text-2xl font-black text-white">
                                {cheapest.flag} {cheapest.name}
                            </p>
                            <p className="text-sm text-zinc-400 mt-1">
                                FOB: ${calculateFOBCost(calculateCMCost(cheapest.hourlyWage, cheapest.overhead, cheapest.productivity)).toFixed(3)} | CM: ${calculateCMCost(cheapest.hourlyWage, cheapest.overhead, cheapest.productivity).toFixed(3)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 mb-1">Hourly Wage</p>
                            <p className="text-lg font-black text-emerald-400">${cheapest.hourlyWage}</p>
                        </div>
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
                                        <p className={`text-2xl font-black ${isCompetitive ? 'text-emerald-400' : 'text-white'}`}>
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
