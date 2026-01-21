// Predictive Maintenance Data Types

export type MachineType = 'CNC' | 'Press' | 'Welder' | 'Conveyor' | 'Robot' | 'Other';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface ComponentRisk {
    name: string;
    riskPercentage: number;
    estimatedFailureDate: string;
    recommendedAction: string;
}

export interface MaintenanceRecord {
    id: string;
    date: string;
    type: MaintenanceType;
    description: string;
    technician: string;
    cost: number;
    partsReplaced: string[];
    duration: number; // minutes
}

export interface FailureRecord {
    id: string;
    date: string;
    component: string;
    description: string;
    downtime: number; // hours
    repairCost: number;
    wasPredicted: boolean;
}

export interface Machine {
    id: string;
    name: string;
    type: MachineType;
    location: string;
    productionLine: string;
    installDate: string;

    // Operational Data
    totalOperatingHours: number;
    cyclesCompleted: number;
    currentEfficiency: number;

    // Health Metrics
    healthScore: number;
    riskLevel: RiskLevel;
    lastInspection: string;
    nextMaintenanceDue: string;

    // Predictions
    failureProbability: number;
    estimatedFailureDate: string | null;
    componentsAtRisk: ComponentRisk[];

    // History
    maintenanceHistory: MaintenanceRecord[];
    failureHistory: FailureRecord[];
}

export interface MaintenanceAlert {
    id: string;
    machineId: string;
    machineName: string;
    severity: AlertSeverity;
    type: 'failure_prediction' | 'maintenance_due' | 'component_risk';
    message: string;
    daysUntilAction: number;
    recommendations: string[];
    createdAt: string;
    resolvedAt: string | null;
    status: AlertStatus;
}

export interface MaintenancePrediction {
    healthScore: number;
    riskLevel: RiskLevel;
    componentsAtRisk: ComponentRisk[];
    recommendations: string[];
    spareParts: string[];
    estimatedCost: number;
    urgency: 'immediate' | 'week' | 'month' | 'quarter';
}
