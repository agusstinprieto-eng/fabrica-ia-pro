import React, { useEffect, useState, useRef } from 'react';
import { useSimulation } from '../../contexts/SimulationContext';
import { exportExecutiveSummaryToPDF } from '../../services/pdfService';
import html2canvas from 'html2canvas'; // Import html2canvas
import { AbsenteeismCard } from '../kpis/AbsenteeismCard';
import { QualityRejectionsCard } from '../kpis/QualityRejectionsCard';
import { ProductionBarChart } from '../charts/ProductionBarChart';
import { CostAnalysisChart } from '../charts/CostAnalysisChart';
import { QualityScatterChart } from '../charts/QualityScatterChart';

interface DashboardViewProps {
    onNavigateToAnalysis?: () => void;
    onOpenHistory?: () => void;
    onExportSummary?: () => void;
    mode?: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({
    onNavigateToAnalysis,
    onOpenHistory,
    onExportSummary,
    mode = 'automotive'
}) => {
    const { liveMetrics, costInputs, lines } = useSimulation();

    // Refs for chart containers to capture
    const chartsRef = useRef<HTMLDivElement>(null);

    const handleExportSummary = async () => {
        // Capture charts
        const chartImages: string[] = [];
        if (chartsRef.current) {
            // We capture each chart individually for better PDF layout control
            const chartElements = Array.from(chartsRef.current.children) as HTMLElement[];
            for (const el of chartElements) {
                const canvas = await html2canvas(el, {
                    backgroundColor: '#0a0a0a', // Keep dark theme
                    scale: 2
                });
                chartImages.push(canvas.toDataURL('image/png'));
            }
        }

        const metrics = {
            oee: liveMetrics.oee,
            output: liveMetrics.output,
            defectRate: liveMetrics.defectRate,
            cycleTime: liveMetrics.cycleTime,
            laborEfficiency: liveMetrics.laborEfficiency,
            qualityScore: liveMetrics.qualityScore,
            projectedOutput: liveMetrics.projectedOutput,
            probabilityOfFailure: liveMetrics.probabilityOfFailure,
            trends: liveMetrics.trends,
            chartData: [] // Removed legacy chart data
        };
        exportExecutiveSummaryToPDF(metrics, mode, chartImages);
    };

    return (
        <div className="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-8">Executive <span className="text-cyber-blue">Dashboard</span></h2>

            {/* Top Row - Primary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div title="OEE = Availability × Performance × Quality | Measures overall equipment effectiveness" className="bg-cyber-dark border border-cyber-blue/30 p-6 rounded-2xl relative overflow-hidden group hover:border-cyber-blue/60 transition-all cursor-help">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/10 blur-3xl rounded-full animate-pulse"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Efficiency (OEE)</h3>
                    <div className="text-4xl font-black text-white mb-2">{isNaN(liveMetrics.oee) ? '0.0' : liveMetrics.oee.toFixed(1)}%</div>
                    <div className={`flex items-center gap-2 text-xs font-bold ${liveMetrics.trends.oee > 0 ? 'text-emerald-400' : liveMetrics.trends.oee < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                        <i className={`fas fa-arrow-${liveMetrics.trends.oee > 0 ? 'up' : liveMetrics.trends.oee < 0 ? 'down' : 'right'}`}></i>
                        {liveMetrics.trends.oee > 0 ? '+0.1%' : liveMetrics.trends.oee < 0 ? '-0.1%' : 'Stable'} <span className="text-zinc-600">vs last tick</span>
                    </div>
                </div>

                <div title="Total Output = Sum of all completed units in current period | Tracks production volume" className="bg-cyber-dark border border-cyber-blue/30 p-6 rounded-2xl relative overflow-hidden group hover:border-cyber-blue/60 transition-all cursor-help">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/10 blur-3xl rounded-full animate-pulse"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Total Output (Pcs)</h3>
                    <div className="text-4xl font-black text-white mb-2">{isNaN(liveMetrics.output) ? '0' : Math.floor(liveMetrics.output).toLocaleString()}</div>
                    <div className="flex items-center gap-2 text-cyber-blue text-xs font-bold">
                        <i className="fas fa-bullseye"></i> Target: {costInputs.targetProduction.toLocaleString()}
                    </div>
                </div>

                <div title="Defect Rate = (Defective Units / Total Units) × 100 | Lower is better" className="bg-cyber-dark border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/60 transition-all cursor-help">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full animate-pulse"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Defect Rate</h3>
                    <div className="text-4xl font-black text-white mb-2">{liveMetrics.defectRate.toFixed(1)}%</div>
                    <div className={`flex items-center gap-2 text-xs font-bold ${liveMetrics.defectRate < 2.0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <i className={`fas fa-${liveMetrics.defectRate < 2.0 ? 'check' : 'exclamation-triangle'}`}></i>
                        {liveMetrics.defectRate < 2.0 ? 'Below Limit (2.0%)' : 'Above Limit (2.0%)'}
                    </div>
                </div>
            </div>

            {/* Second Row - Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div title="Avg Cycle Time = Total Production Time / Units Produced | Time per unit completion" className="bg-cyber-dark border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/60 transition-all cursor-help">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-3xl rounded-full"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Avg Cycle Time</h3>
                    <div className="text-4xl font-black text-white mb-2">{liveMetrics.cycleTime.toFixed(1)}s</div>
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                        <i className="fas fa-clock"></i> Live Pacing
                    </div>
                </div>

                <div title="Labor Efficiency = (Standard Hours / Actual Hours) × 100 | Operator productivity metric" className="bg-cyber-dark border border-yellow-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-yellow-500/60 transition-all cursor-help">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-3xl rounded-full"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Labor Efficiency</h3>
                    <div className="text-4xl font-black text-white mb-2">{liveMetrics.laborEfficiency.toFixed(1)}%</div>
                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                        <i className="fas fa-users"></i> Based on Performance
                    </div>
                </div>

                <div title="Quality Score = Weighted average of defect rate, rework, and customer complaints | 10 = perfect" className="bg-cyber-dark border border-pink-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-pink-500/60 transition-all cursor-help">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 blur-3xl rounded-full"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Quality Score</h3>
                    <div className="text-4xl font-black text-white mb-2">{liveMetrics.qualityScore.toFixed(1)}/10</div>
                    <div className={`flex items-center gap-2 text-xs font-bold ${liveMetrics.trends.quality > 0 ? 'text-pink-400' : 'text-zinc-500'}`}>
                        <i className="fas fa-star"></i> {liveMetrics.qualityScore > 9 ? 'Elite Status' : 'In Progress'}
                    </div>
                </div>
            </div>

            {/* NEW: HR & Quality KPIs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AbsenteeismCard
                    global={liveMetrics.absenteeism}
                    target={5.0}
                    plants={lines.map(line => {
                        const lostUnits = Math.floor((liveMetrics.output / (1 - line.absenteeismRate / 100)) - liveMetrics.output);
                        const hoursLost = lostUnits * (liveMetrics.cycleTime / 3600);
                        return {
                            plant: line.name,
                            percentage: line.absenteeismRate,
                            units_impact: lostUnits,
                            cost_impact: Math.floor(hoursLost * costInputs.hourlyWage) // Real Labor Cost Impact
                        };
                    })}
                    criticalProcess={lines.length > 0 ? (() => {
                        const criticalLine = lines.reduce((prev, current) => (prev.absenteeismRate > current.absenteeismRate) ? prev : current);
                        return {
                            name: criticalLine.name,
                            percentage: criticalLine.absenteeismRate
                        };
                    })() : undefined}
                />
                <QualityRejectionsCard
                    global={liveMetrics.qualityRejections}
                    target={2.0}
                    plants={lines.map(line => {
                        const scrapUnits = Math.ceil(liveMetrics.output * (line.qualityRejectionRate / 100));
                        return {
                            plant: line.name,
                            percentage: line.qualityRejectionRate,
                            scrap_cost: Math.floor(scrapUnits * costInputs.scrapCost), // Real Scrap Cost
                            rework_cost: 0
                        };
                    })}
                    // Causes removed as per user request for "real" data only
                    causes={[]}
                />
            </div>

            {/* NEW: Predictive Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-cyber-dark to-cyber-black border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-1">Projected Output (1h)</h3>
                            <p className="text-[10px] text-cyan-400 font-mono">Based on current OEE & Pacing</p>
                        </div>
                        <i className="fas fa-forward text-cyan-500 animate-pulse"></i>
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="text-5xl font-black text-white cyber-font">{liveMetrics.projectedOutput}</div>
                        <div className="text-zinc-500 font-bold text-sm mb-2">Pcs / Hr</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyber-dark to-cyber-black border border-red-500/20 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-1">System Instability Risk</h3>
                            <p className="text-[10px] text-red-400 font-mono">Probability of Downtime</p>
                        </div>
                        <i className="fas fa-exclamation-triangle text-red-500"></i>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-5xl font-black text-white cyber-font">{liveMetrics.probabilityOfFailure.toFixed(1)}%</div>
                        <div className="flex-1 h-3 bg-red-950 rounded-full overflow-hidden border border-red-500/20">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                                style={{ width: `${liveMetrics.probabilityOfFailure}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 lg:h-[400px]">
                {/* 1. Production Bar Chart (Vertical) */}
                <div className="bg-cyber-black/50 border border-cyber-gray/30 rounded-2xl p-6 flex flex-col min-h-[400px] lg:min-h-0">
                    <ProductionBarChart
                        lines={lines}
                        data={lines.map(l => ({
                            lineId: l.id,
                            // Estimate output share based on capacity factors
                            output: lines.length > 0 ? (liveMetrics.output / lines.length) * (1 - l.absenteeismRate / 100) * (1 - l.qualityRejectionRate / 100) : 0
                        }))}
                    />
                </div>

                {/* 2. Cost Analysis (Horizontal Bars) */}
                <div className="bg-cyber-black/50 border border-cyber-gray/30 rounded-2xl p-6 flex flex-col min-h-[400px] lg:min-h-0">
                    <CostAnalysisChart
                        lines={lines}
                        lossData={lines.map(l => {
                            // Simple heuristic for demo cost calc
                            const laborLoss = l.absenteeismRate * 450; // $450 per % of absenteeism
                            const qualityLoss = l.qualityRejectionRate * 800; // $800 per % of scrap
                            return {
                                lineId: l.id,
                                totalLoss: Math.floor(laborLoss + qualityLoss),
                                reason: laborLoss > qualityLoss ? 'High Absenteeism' : 'Quality Scraps'
                            };
                        }).sort((a, b) => b.totalLoss - a.totalLoss)}
                    />
                </div>

                {/* 3. Scatter Plot (Quality vs Abs) */}
                <div className="bg-cyber-black/50 border border-cyber-gray/30 rounded-2xl p-6 flex flex-col min-h-[400px] lg:min-h-0">
                    <QualityScatterChart lines={useSimulation().lines} />
                </div>
            </div>

            {/* Quick Actions & Recent Activity Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Quick Actions */}
                <div className="lg:col-span-4 bg-cyber-dark border border-cyber-blue/20 rounded-2xl p-6 h-fit">
                    <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                        <div>
                            <button
                                onClick={onNavigateToAnalysis}
                                title="Start a new operation analysis"
                                className="w-full bg-cyber-blue text-black font-bold py-3 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]">
                                <i className="fas fa-plus-circle"></i>
                                New Analysis
                            </button>
                            <p className="text-[10px] text-zinc-600 mt-1 text-center">Start operation analysis</p>
                        </div>
                        <div>
                            <button
                                onClick={onOpenHistory}
                                title="View all past analysis reports"
                                className="w-full bg-cyber-dark border border-cyber-blue text-cyber-blue font-bold py-3 rounded-xl hover:bg-cyber-blue hover:text-white transition-all flex items-center justify-center gap-2 text-sm">
                                <i className="fas fa-history"></i>
                                View Reports
                            </button>
                            <p className="text-[10px] text-zinc-600 mt-1 text-center">Browse past analyses</p>
                        </div>
                        <div>
                            <button
                                onClick={handleExportSummary}
                                title="Download executive summary PDF"
                                className="w-full bg-cyber-dark border border-emerald-500 text-emerald-500 font-bold py-3 rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 text-sm">
                                <i className="fas fa-download"></i>
                                Export Summary
                            </button>
                            <p className="text-[10px] text-zinc-600 mt-1 text-center">Download PDF report</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-cyber-gray/30 hidden sm:block md:hidden lg:block">
                        <h4 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-3">System Status</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-400">AI Engine</span>
                                <span className="text-emerald-400 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    Online
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Camera Feed</span>
                                <span className="text-emerald-400 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Last Sync</span>
                                <span className="text-zinc-500">2 min ago</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-8 bg-cyber-dark border border-cyber-gray/30 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-4">Recent Analyses</h3>
                    <div className="space-y-3">
                        {[
                            { time: '14:32', operation: 'Seat Cushion Assembly', efficiency: '89.2%', status: 'completed' },
                            { time: '13:15', operation: 'Door Panel Stitching', efficiency: '91.5%', status: 'completed' },
                            { time: '11:48', operation: 'Headrest Installation', efficiency: '87.1%', status: 'completed' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-cyber-black/50 rounded-lg hover:bg-cyber-black/80 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="text-cyber-blue font-mono text-xs">{item.time}</div>
                                    <div>
                                        <div className="text-white text-sm font-medium">{item.operation}</div>
                                        <div className="text-zinc-500 text-xs">Efficiency: {item.efficiency}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-emerald-400 text-xs font-bold uppercase hidden sm:block">
                                        <i className="fas fa-check-circle mr-1"></i>
                                        {item.status}
                                    </span>
                                    <i className="fas fa-chevron-right text-zinc-600 group-hover:text-cyber-blue transition-colors"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DashboardView;
