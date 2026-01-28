import React, { createContext, useContext, useState, useEffect } from 'react';
import { IndustrialMode, Station, CostInputs, Operation } from '../types';
import { INDUSTRIAL_OPERATIONS } from '../data/industrialData';
import { supabase } from '../services/supabase';

interface ProductionLine {
    id: string;
    name: string;
    absenteeismRate: number; // User set %
    qualityRejectionRate: number; // User set %
}

interface SimulationMetrics {
    oee: number;
    output: number;
    defectRate: number;
    cycleTime: number; // Current live cycle time (fluctuating)
    qualityScore: number;
    laborEfficiency: number;
    probabilityOfFailure: number; // 0-100%
    projectedOutput: number; // Projected units for next hour
    // Trends (-1 for down, 0 for stable, 1 for up)
    trends: {
        oee: number;
        output: number;
        quality: number;
    };
    qualityRejections: number; // Average Percentage
    absenteeism: number; // Average Percentage
}

interface SimulationContextType {
    // State
    stations: Station[];
    costInputs: CostInputs;
    liveMetrics: SimulationMetrics;
    lines: ProductionLine[];

    // Actions
    setStations: (stations: Station[]) => void;
    setCostInputs: (inputs: CostInputs) => void;
    moveOperationToStation: (opId: string, stationId: string, op: Operation) => void;
    removeOperationFromStation: (opId: string, stationId: string) => void;
    updateCostInput: (field: keyof CostInputs, value: number) => void;
    updateLineParams: (lineId: string, params: Partial<ProductionLine>) => void;
    addLine: (name: string) => void;
    removeLine: (lineId: string) => void;

    // Computed (from current state)
    getBottleneck: () => number;
    getEfficiency: () => number;
    calculateCosts: () => {
        minuteCost: number;
        pieceCost: number;
        dailyLabor: number;
        requiredOperators: number;
        actualProduction: number;
    };

    // Config
    resetSimulation: (mode: IndustrialMode) => void;
    updateMetricsFromAnalysis: (analysisJson: any) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};

interface SimulationProviderProps {
    children: React.ReactNode;
    mode: IndustrialMode;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({ children, mode }) => {
    // --- STATE ---

    // Balancing State
    const [stations, setStations] = useState<Station[]>([
        { id: 'station-1', name: 'Station 1', operations: [] },
        { id: 'station-2', name: 'Station 2', operations: [] },
        { id: 'station-3', name: 'Station 3', operations: [] },
        { id: 'station-4', name: 'Station 4', operations: [] },
    ]);

    // Line Params State (Manual Inputs)
    const [lines, setLines] = useState<ProductionLine[]>([]);

    // Supabase Sync
    useEffect(() => {
        // Fetch Initial
        const fetchLines = async () => {
            const { data, error } = await supabase
                .from('production_lines')
                .select('*')
                .order('created_at', { ascending: true });

            if (data) {
                // Map database columns to app state if needed (snake_case to camelCase handled manually if names differ)
                const mappedLines = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    absenteeismRate: d.absenteeism_rate || 0,
                    qualityRejectionRate: d.quality_rejection_rate || 0
                }));
                // If DB is empty, use defaults and optional seed
                if (mappedLines.length === 0) {
                    // Seed defaults if empty
                    setLines([
                        { id: 'line-1', name: 'North Plant (Demo)', absenteeismRate: 5.0, qualityRejectionRate: 2.1 },
                        { id: 'line-2', name: 'South Plant (Demo)', absenteeismRate: 12.0, qualityRejectionRate: 4.5 },
                    ]);
                } else {
                    setLines(mappedLines);
                }
            } else if (error) {
                console.error("Error fetching lines:", error);
                // Fallback to local state if DB fails
                setLines([
                    { id: 'line-1', name: 'North Plant', absenteeismRate: 5.0, qualityRejectionRate: 2.1 },
                    { id: 'line-2', name: 'South Plant', absenteeismRate: 12.0, qualityRejectionRate: 4.5 },
                ]);
            }
        };

        fetchLines();

        // Realtime Subscription
        const subscription = supabase
            .channel('production_lines_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'production_lines' }, (payload) => {
                fetchLines(); // Refresh on any change for simplicity
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Costing State
    const [costInputs, setCostInputs] = useState<CostInputs>({
        sam: 12.5,
        efficiency: 85,
        hourlyWage: 2.5,
        overhead: 45,
        targetProduction: 500,
        workingHours: 8,
        scrapCost: 5.0 // Default cost per unit ($)
    });

    // Dashboard Live State
    const [liveMetrics, setLiveMetrics] = useState<SimulationMetrics>({
        oee: 85,
        output: 1240,
        defectRate: 1.2,
        cycleTime: 12.5,
        qualityScore: 9.8,
        laborEfficiency: 92,
        probabilityOfFailure: 5,
        projectedOutput: 288,
        trends: { oee: 0, output: 1, quality: 0 },
        qualityRejections: 3.2,
        absenteeism: 8.5
    });

    // --- RESET LOGIC ---
    useEffect(() => {
        resetSimulation(mode);
    }, [mode]);

    const resetSimulation = (newMode: IndustrialMode) => {
        // Reset Stations
        setStations([
            { id: 'station-1', name: 'Station 1', operations: [] },
            { id: 'station-2', name: 'Station 2', operations: [] },
            { id: 'station-3', name: 'Station 3', operations: [] },
            { id: 'station-4', name: 'Station 4', operations: [] },
        ]);

        // Reset Cost Inputs based on Mode
        if (newMode === 'automotive') {
            setCostInputs(prev => ({ ...prev, sam: 45, efficiency: 90, hourlyWage: 15, overhead: 120 }));
        } else if (newMode === 'aerospace') {
            setCostInputs(prev => ({ ...prev, sam: 120, efficiency: 80, hourlyWage: 25, overhead: 200 }));
        } else if (newMode === 'electronics') {
            setCostInputs(prev => ({ ...prev, sam: 5, efficiency: 95, hourlyWage: 8, overhead: 80 }));
        } else {
            setCostInputs(prev => ({ ...prev, sam: 12.5, efficiency: 85, hourlyWage: 2.5, overhead: 45 }));
        }
    };

    // --- HELPERS ---
    const calculateStationTime = (station: Station) => {
        return station.operations.reduce((sum, op) => sum + op.time, 0);
    };

    const getBottleneck = () => {
        const times = stations.map(s => calculateStationTime(s));
        return Math.max(...times, 0); // Ensure at least 0
    };

    const getEfficiency = () => {
        const bottleneck = getBottleneck();
        if (bottleneck === 0) return 0;
        const totalTime = stations.reduce((sum, s) => sum + calculateStationTime(s), 0);
        const avgTime = totalTime / stations.length;
        // If bottleneck is 0, avoid NaN
        return bottleneck > 0 ? parseFloat(((avgTime / bottleneck) * 100).toFixed(1)) : 0;
    };

    const calculateCosts = () => {
        const { sam, efficiency, hourlyWage, overhead, targetProduction, workingHours } = costInputs;

        // Logic from CostingView
        const effectiveMinuteCost = (hourlyWage / 60) / (efficiency / 100);
        const laborCostPerPiece = (sam * effectiveMinuteCost);
        const totalPieceCost = laborCostPerPiece * (1 + overhead / 100);
        const dailyLaborCost = workingHours * hourlyWage;
        const availableMinutes = workingHours * 60 * (efficiency / 100);
        const requiredOperators = Math.ceil((sam * targetProduction) / availableMinutes) || 0;
        const actualProductionPerOperator = sam > 0 ? Math.floor(availableMinutes / sam) : 0;

        return {
            minuteCost: effectiveMinuteCost,
            pieceCost: totalPieceCost,
            dailyLabor: dailyLaborCost * requiredOperators,
            requiredOperators,
            actualProduction: actualProductionPerOperator
        };
    };

    // --- ACTIONS ---
    const moveOperationToStation = (opId: string, stationId: string, op: Operation) => {
        // Remove from source if it exists (handled by caller typically, but good to be safe)
        // Add to standard
        setStations(prev => prev.map(station => {
            if (station.id === stationId) {
                // Prevent duplicate add if logic allows
                return { ...station, operations: [...station.operations, { ...op, stationId }] };
            }
            return station;
        }));
    };

    const removeOperationFromStation = (opId: string, stationId: string) => {
        setStations(prev => prev.map(s => {
            if (s.id === stationId) {
                return { ...s, operations: s.operations.filter(o => o.id !== opId) };
            }
            return s;
        }));
    };

    const updateCostInput = (field: keyof CostInputs, value: number) => {
        setCostInputs(prev => ({ ...prev, [field]: value }));
    };

    const updateLineParams = async (lineId: string, params: Partial<ProductionLine>) => {
        // Optimistic Update
        setLines(prev => prev.map(line =>
            line.id === lineId ? { ...line, ...params } : line
        ));

        const dbParams: any = {};
        if (params.name !== undefined) dbParams.name = params.name;
        if (params.absenteeismRate !== undefined) dbParams.absenteeism_rate = params.absenteeismRate;
        if (params.qualityRejectionRate !== undefined) dbParams.quality_rejection_rate = params.qualityRejectionRate;

        const { error } = await supabase
            .from('production_lines')
            .update(dbParams)
            .eq('id', lineId);

        if (error) console.error("Error updating line:", error);
    };

    const addLine = async (name: string) => {
        const { data, error } = await supabase
            .from('production_lines')
            .insert([{ name: name, absenteeism_rate: 0, quality_rejection_rate: 0 }])
            .select();

        if (data && data.length > 0) {
            const newLine = {
                id: data[0].id,
                name: data[0].name,
                absenteeismRate: data[0].absenteeism_rate || 0,
                qualityRejectionRate: data[0].quality_rejection_rate || 0
            };
            setLines(prev => [...prev, newLine]);
        }

        if (error) console.error("Error adding line:", error);
    };

    const removeLine = async (lineId: string) => {
        // Optimistic Update
        setLines(prev => prev.filter(l => l.id !== lineId));

        const { error } = await supabase
            .from('production_lines')
            .delete()
            .eq('id', lineId);

        if (error) console.error("Error deleting line:", error);
    };


    // --- SIMULATION LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveMetrics(prev => {
                // 1. Calculate Base Factors from Real Data
                const bottleneck = getBottleneck(); // From Balancing
                const calculatedEfficiency = getEfficiency(); // From Balancing

                // If no bottleneck (empty line), fallback to costInputs.sam
                const baseCycleTime = bottleneck > 0 ? bottleneck : costInputs.sam;

                // 2. Simulate Fluctuations
                const cycleTimeVariation = (Math.random() * 0.4) - 0.2; // +/- 0.2s
                const currentCycleTime = Math.max(0.5, baseCycleTime + cycleTimeVariation);

                // --- NEW LOGIC: Calculate Average Absenteeism & Quality from Lines ---
                const avgAbsenteeism = lines.length > 0
                    ? lines.reduce((sum, l) => sum + l.absenteeismRate, 0) / lines.length
                    : 0;
                const avgQualityRejections = lines.length > 0
                    ? lines.reduce((sum, l) => sum + l.qualityRejectionRate, 0) / lines.length
                    : 0;

                // 3. Update Output with Absenteeism & Quality Impact
                // Base production based on cycle time
                const productionTick = 3; // 3 seconds passed
                // Impact Factors:
                // Absenteeism reduces effective capacity (fewer operators = slower output)
                const capacityFactor = Math.max(0.5, 1 - (avgAbsenteeism / 100));
                // Quality Rejections reduces Valid Output (Yield)
                const yieldFactor = Math.max(0.5, 1 - (avgQualityRejections / 100));

                const theoreticalUnits = (productionTick / currentCycleTime);
                // Final Output = Theoretical * Capacity * Yield
                const effectiveUnits = theoreticalUnits * capacityFactor * yieldFactor;

                const newOutput = (isNaN(prev.output) ? 0 : prev.output) + (isNaN(effectiveUnits) ? 0 : effectiveUnits);

                // 4. Update OEE
                // Availability: Impacted by Absenteeism (less people = more stops)
                const availabilityBase = 0.95 + ((Math.random() * 0.04) - 0.02);
                const availability = availabilityBase * capacityFactor;

                // Performance: Real Efficiency
                const performance = (bottleneck > 0 ? (calculatedEfficiency / 100) : (costInputs.efficiency / 100));

                // Quality: Based on Defect Rate & Rejections
                // Combine simulated defect rate with manual rejection rate
                const defectChange = (Math.random() * 0.2) - 0.1;
                let newDefectRate = Math.max(0.1, Math.min(5.0, prev.defectRate + defectChange));

                // Total Quality Factor for OEE
                const quality = (1 - (newDefectRate / 100)) * yieldFactor;

                const newOEE = (availability * performance * quality) * 100;
                const newQualityScore = 10 - (avgQualityRejections * 0.8) - (newDefectRate * 0.2);

                return {
                    oee: isNaN(newOEE) ? 0 : newOEE,
                    output: newOutput,
                    defectRate: newDefectRate,
                    cycleTime: currentCycleTime,
                    qualityScore: Math.max(0, newQualityScore),
                    laborEfficiency: performance * 100, // Show raw performance
                    probabilityOfFailure: Math.min(100, Math.max(0, (100 - (isNaN(newOEE) ? 0 : newOEE)) * 0.5 + (newDefectRate * 10))),
                    projectedOutput: Math.round((3600 / currentCycleTime) * (newOEE / 100)),
                    trends: {
                        oee: 0,
                        output: 1,
                        quality: newQualityScore > prev.qualityScore ? 1 : -1
                    },
                    absenteeism: avgAbsenteeism,
                    qualityRejections: avgQualityRejections
                };
            });
        }, 3000); // 3 second tick

        return () => clearInterval(interval);
    }, [stations, costInputs, lines]); // Added lines dependency

    const updateMetricsFromAnalysis = (analysis: any) => {
        if (!analysis || !analysis.time_calculation) return;

        setLiveMetrics(prev => ({
            ...prev,
            oee: (analysis.time_calculation.rating_factor || 85), // Rating factor as OEE proxy
            cycleTime: analysis.time_calculation.standard_time || prev.cycleTime,
            projectedOutput: analysis.time_calculation.units_per_hour || prev.projectedOutput,
            qualityScore: analysis.ergo_vitals?.overall_risk_score ? (10 - analysis.ergo_vitals.overall_risk_score) : prev.qualityScore,
            defectRate: analysis.quality_audit?.risk_level === 'Low' ? 1.0 : 3.5,
            // We keep the current output but it will now grow based on real cycle time
        }));
    };

    return (
        <SimulationContext.Provider value={{
            stations,
            costInputs,
            liveMetrics,
            lines,
            setStations,
            setCostInputs,
            moveOperationToStation,
            removeOperationFromStation,
            updateCostInput,
            updateLineParams,
            addLine,
            removeLine,
            getBottleneck,
            getEfficiency,
            calculateCosts,
            resetSimulation,
            updateMetricsFromAnalysis
        }}>
            {children}
        </SimulationContext.Provider>
    );
};
