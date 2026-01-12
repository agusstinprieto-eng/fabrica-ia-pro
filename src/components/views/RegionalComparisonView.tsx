import React, { useState } from 'react';
import { exportRegionalComparisonToPDF } from '../../services/pdfService';
import { exportRegionalComparisonToExcel } from '../../services/excelService';

// Garment types with predefined SAM values
const GARMENT_TYPES = [
    { id: 'tshirt', name: 'T-Shirt Básica', sam: 12, icon: '👕' },
    { id: 'polo', name: 'Polo Shirt', sam: 18, icon: '👔' },
    { id: 'jeans', name: 'Jeans (5 bolsillos)', sam: 28, icon: '👖' },
    { id: 'dress-shirt', name: 'Camisa Formal', sam: 25, icon: '👔' },
    { id: 'hoodie', name: 'Sudadera con Capucha', sam: 35, icon: '🧥' },
    { id: 'jacket', name: 'Chamarra/Jacket', sam: 45, icon: '🧥' },
    { id: 'shorts', name: 'Shorts Deportivos', sam: 15, icon: '🩳' },
    { id: 'dress', name: 'Vestido Casual', sam: 32, icon: '👗' },
];

// FOB calculation constants
const DEFAULT_BOM = {
    materials: 4.50,
    trimmings: 1.20,
    washing: 0.00,
    logistics: 0.45
};

const JEANS_BOM = {
    materials: 5.04,  // 1.6 yds @ $3.15
    trimmings: 1.35,  // YKK zip, buttons, rivets
    washing: 2.00,    // Stone wash + Enzymes
    logistics: 0.45   // Polybags, local transport
};

const FOB_PROFIT_MARGIN = 0.12; // 12% profit for factory

const RegionalComparisonView: React.FC = () => {
    const [selectedRegion, setSelectedRegion] = useState<string>('Asia');
    const [selectedGarment, setSelectedGarment] = useState<string>('tshirt');
    const [sam, setSam] = useState<number>(GARMENT_TYPES[0].sam); // Default to first garment

    const currentRegion = REGIONS_DATA.find((r) => r.region === selectedRegion);

    const calculateCMCost = (wage: number, overhead: number, productivity: number) => {
        const effectiveCost = (wage / 60) / (productivity / 100);
        return (sam * effectiveCost) * (1 + overhead / 100);
    };

    const calculateFOBCost = (cmCost: number, garmentId: string) => {
        const bom = garmentId === 'jeans' ? JEANS_BOM : DEFAULT_BOM;
        const totalBase = cmCost + bom.materials + bom.trimmings + bom.washing + bom.logistics;
        return totalBase * (1 + FOB_PROFIT_MARGIN);
    };

    const allCountries = REGIONS_DATA.flatMap((r) => r.countries);
    const cheapest = allCountries.reduce((prev, curr) =>
        calculateFOBCost(calculateCMCost(curr.hourlyWage, curr.overhead, curr.productivity), selectedGarment) <
            calculateFOBCost(calculateCMCost(prev.hourlyWage, prev.overhead, prev.productivity), selectedGarment)
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
                            Regional Cost Comparison
                        </h2>
                        <p className="text-zinc-500 text-sm">
                            Compare labor costs and competitiveness across global manufacturing hubs
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Export Buttons */}
                        <button
                            onClick={() => {
                                const countries = allCountries.map(c => {
                                    const cm = calculateCMCost(c.hourlyWage, c.overhead, c.productivity);
                                    return {
                                        ...c,
                                        costPerPiece: calculateFOBCost(cm, selectedGarment)
                                    };
                                });
                                const garment = GARMENT_TYPES.find(g => g.id === selectedGarment);
                                exportRegionalComparisonToPDF(countries, sam, garment?.name || 'General');
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
                                        costPerPiece: calculateFOBCost(cm, selectedGarment)
                                    };
                                });
                                exportRegionalComparisonToExcel(countries, sam);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-bold"
                        >
                            <i className="fas fa-file-excel"></i>
                            Excel
                        </button>

                        {/* Garment Type Selector */}
                        <div className="relative">
                            <select
                                value={selectedGarment}
                                onChange={(e) => {
                                    setSelectedGarment(e.target.value);
                                    const garment = GARMENT_TYPES.find(g => g.id === e.target.value);
                                    if (garment) setSam(garment.sam);
                                }}
                                className="bg-cyber-dark border border-cyber-purple/30 text-white font-bold pl-10 pr-6 py-3 rounded-xl focus:border-cyber-purple outline-none appearance-none cursor-pointer hover:border-cyber-purple/50 transition-all"
                            >
                                {GARMENT_TYPES.map((garment) => (
                                    <option key={garment.id} value={garment.id}>
                                        {garment.icon} {garment.name} ({garment.sam} min)
                                    </option>
                                ))}
                            </select>
                            <i className="fas fa-tshirt absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple"></i>
                        </div>

                        {/* Region Selector */}
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="bg-cyber-dark border border-cyber-blue/30 text-white font-bold px-6 py-3 rounded-xl focus:border-cyber-blue outline-none"
                        >
                            {REGIONS_DATA.map((region) => (
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
                                FOB: ${calculateFOBCost(calculateCMCost(cheapest.hourlyWage, cheapest.overhead, cheapest.productivity), selectedGarment).toFixed(3)} | CM: ${calculateCMCost(cheapest.hourlyWage, cheapest.overhead, cheapest.productivity).toFixed(3)}
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
                        const fobCost = calculateFOBCost(cmCost, selectedGarment);
                        const isCompetitive = fobCost < 12; // Example threshold for FOB jeans

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
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">BOM+Washing</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">Profit (12%)</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-cyber-blue uppercase">FOB Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCountries
                                    .sort((a, b) => {
                                        const costA = calculateFOBCost(calculateCMCost(a.hourlyWage, a.overhead, a.productivity), selectedGarment);
                                        const costB = calculateFOBCost(calculateCMCost(b.hourlyWage, b.overhead, b.productivity), selectedGarment);
                                        return costA - costB;
                                    })
                                    .map((country, index) => {
                                        const cm = calculateCMCost(country.hourlyWage, country.overhead, country.productivity);
                                        const bom = selectedGarment === 'jeans' ? JEANS_BOM : DEFAULT_BOM;
                                        const bomTotal = bom.materials + bom.trimmings + bom.washing + bom.logistics;
                                        const fob = (cm + bomTotal) * (1 + FOB_PROFIT_MARGIN);
                                        const profit = (cm + bomTotal) * FOB_PROFIT_MARGIN;

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
                                                    ${bomTotal.toFixed(2)}
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
