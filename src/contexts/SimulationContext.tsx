import React, { createContext, useContext, useState, useEffect } from 'react';
import { IndustrialMode, Station, CostInputs, Operation } from '../types';
import { INDUSTRIAL_OPERATIONS } from '../data/industrialData';

interface SimulationMetrics {
    oee: number;
    output: number;
    defectRate: number;
    cycleTime: number; // Current live cycle time (fluctuating)
    qualityScore: number;
    laborEfficiency: number;
    // Trends (-1 for down, 0 for stable, 1 for up)
    trends: {
        oee: number;
        output: number;
        quality: number;
    };
}

interface SimulationContextType {
    // State
    stations: Station[];
    costInputs: CostInputs;
    liveMetrics: SimulationMetrics;

    // Actions
    setStations: (stations: Station[]) => void;
    setCostInputs: (inputs: CostInputs) => void;
    moveOperationToStation: (opId: string, stationId: string, op: Operation) => void;
    removeOperationFromStation: (opId: string, stationId: string) => void;
    updateCostInput: (field: keyof CostInputs, value: number) => void;

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

    // Costing State
    const [costInputs, setCostInputs] = useState<CostInputs>({
        sam: 12.5,
        efficiency: 85,
        hourlyWage: 2.5,
        overhead: 45,
        targetProduction: 500,
        workingHours: 8
    });

    // Dashboard Live State
    const [liveMetrics, setLiveMetrics] = useState<SimulationMetrics>({
        oee: 85,
        output: 1240,
        defectRate: 1.2,
        cycleTime: 12.5,
        qualityScore: 9.8,
        laborEfficiency: 92,
        trends: { oee: 0, output: 1, quality: 0 }
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

    // --- SIMULATION LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveMetrics(prev => {
                // 1. Calculate Base Factors from Real Data
                const bottleneck = getBottleneck(); // From Balancing
                const calculatedEfficiency = getEfficiency(); // From Balancing
                const costData = calculateCosts(); // From Costing

                // If no bottleneck (empty line), fallback to costInputs.sam
                const baseCycleTime = bottleneck > 0 ? bottleneck : costInputs.sam;

                // 2. Simulate Fluctuations
                const cycleTimeVariation = (Math.random() * 0.4) - 0.2; // +/- 0.2s
                const currentCycleTime = Math.max(0.5, baseCycleTime + cycleTimeVariation);

                // 3. Update Output
                // If cycle time is 10s, we produce 0.1 units per second * 3 seconds interval = 0.3 units
                // We'll accumulate whole units. 
                // Simplified: Just add a small random amount proportional to speed
                const productionTick = 3; // 3 seconds passed
                const unitsProduced = (productionTick / currentCycleTime);
                const newOutput = prev.output + unitsProduced;

                // 4. Update OEE
                // Availability: Random fluctuation high (92-98%)
                const availability = 0.95 + ((Math.random() * 0.04) - 0.02);

                // Performance: Real Efficiency from Line Balancing or Cost Input
                const performance = (bottleneck > 0 ? (calculatedEfficiency / 100) : (costInputs.efficiency / 100));

                // Quality: Based on Defect Rate
                const quality = (1 - (prev.defectRate / 100));

                const newOEE = (availability * performance * quality) * 100;

                // 5. Update Defect Rate & Quality Score
                // Random walk
                const defectChange = (Math.random() * 0.2) - 0.1;
                let newDefectRate = Math.max(0.1, Math.min(5.0, prev.defectRate + defectChange));
                const newQualityScore = 10 - (newDefectRate * 0.5);

                return {
                    oee: newOEE,
                    output: newOutput,
                    defectRate: newDefectRate,
                    cycleTime: currentCycleTime,
                    qualityScore: newQualityScore,
                    laborEfficiency: performance * 100, // Show raw performance
                    trends: {
                        oee: newOEE > prev.oee ? 1 : -1,
                        output: 1,
                        quality: newQualityScore > prev.qualityScore ? 1 : -1
                    }
                };
            });
        }, 3000); // 3 second tick

        return () => clearInterval(interval);
    }, [stations, costInputs]); // Re-run logic structure if structural config changes? 
    // Actually, setInterval closure captures state. To access LATEST state inside interval, we need refs or functional updates.
    // Functional updates (prev => ...) work for the metrics themselves, but 'getBottleneck' inside the effect uses the OLD 'stations' closure.
    // Fixed: Added [stations, costInputs] to dependency array so effect restarts with fresh closure when they change.

    return (
        <SimulationContext.Provider value={{
            stations,
            costInputs,
            liveMetrics,
            setStations,
            setCostInputs,
            moveOperationToStation,
            removeOperationFromStation,
            updateCostInput,
            getBottleneck,
            getEfficiency,
            calculateCosts,
            resetSimulation
        }}>
            {children}
        </SimulationContext.Provider>
    );
};
