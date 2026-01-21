import { Machine, MaintenanceAlert } from '../types/maintenance';

// Mock data for 10 machines
export const mockMachines: Machine[] = [
    {
        id: 'cnc-001',
        name: 'CNC Mill #1',
        type: 'CNC',
        location: 'Production Floor A',
        productionLine: 'Line 1',
        installDate: '2020-03-15',
        totalOperatingHours: 12450,
        cyclesCompleted: 45230,
        currentEfficiency: 87,
        healthScore: 85,
        riskLevel: 'low',
        lastInspection: '2026-01-15',
        nextMaintenanceDue: '2026-02-05',
        failureProbability: 15,
        estimatedFailureDate: null,
        componentsAtRisk: [
            {
                name: 'Spindle Bearings',
                riskPercentage: 25,
                estimatedFailureDate: '2026-03-10',
                recommendedAction: 'Schedule inspection in next maintenance window'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm1',
                date: '2025-12-15',
                type: 'preventive',
                description: 'Routine maintenance and lubrication',
                technician: 'Juan Pérez',
                cost: 450,
                partsReplaced: ['Lubricant', 'Filters'],
                duration: 120
            }
        ],
        failureHistory: []
    },
    {
        id: 'press-002',
        name: 'Hydraulic Press #2',
        type: 'Press',
        location: 'Production Floor B',
        productionLine: 'Line 2',
        installDate: '2019-08-22',
        totalOperatingHours: 18920,
        cyclesCompleted: 67800,
        currentEfficiency: 62,
        healthScore: 58,
        riskLevel: 'medium',
        lastInspection: '2026-01-10',
        nextMaintenanceDue: '2026-01-23',
        failureProbability: 42,
        estimatedFailureDate: '2026-01-28',
        componentsAtRisk: [
            {
                name: 'Hydraulic Pump',
                riskPercentage: 65,
                estimatedFailureDate: '2026-01-28',
                recommendedAction: 'Replace pump immediately - high failure risk'
            },
            {
                name: 'Pressure Valve',
                riskPercentage: 38,
                estimatedFailureDate: '2026-02-15',
                recommendedAction: 'Monitor pressure readings daily'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm2',
                date: '2025-11-20',
                type: 'corrective',
                description: 'Replaced leaking hydraulic hose',
                technician: 'María González',
                cost: 780,
                partsReplaced: ['Hydraulic Hose', 'Seals'],
                duration: 180
            }
        ],
        failureHistory: [
            {
                id: 'f1',
                date: '2025-11-18',
                component: 'Hydraulic Hose',
                description: 'Hose rupture causing oil leak',
                downtime: 4,
                repairCost: 780,
                wasPredicted: false
            }
        ]
    },
    {
        id: 'robot-a1',
        name: 'Welding Robot A1',
        type: 'Robot',
        location: 'Assembly Area',
        productionLine: 'Line 3',
        installDate: '2021-05-10',
        totalOperatingHours: 8340,
        cyclesCompleted: 32100,
        currentEfficiency: 94,
        healthScore: 92,
        riskLevel: 'low',
        lastInspection: '2026-01-18',
        nextMaintenanceDue: '2026-03-15',
        failureProbability: 8,
        estimatedFailureDate: null,
        componentsAtRisk: [],
        maintenanceHistory: [
            {
                id: 'm3',
                date: '2026-01-05',
                type: 'preventive',
                description: 'Calibration and software update',
                technician: 'Carlos Ruiz',
                cost: 320,
                partsReplaced: [],
                duration: 90
            }
        ],
        failureHistory: []
    },
    {
        id: 'cnc-003',
        name: 'CNC Lathe #3',
        type: 'CNC',
        location: 'Production Floor A',
        productionLine: 'Line 1',
        installDate: '2018-11-30',
        totalOperatingHours: 22150,
        cyclesCompleted: 89400,
        currentEfficiency: 45,
        healthScore: 28,
        riskLevel: 'critical',
        lastInspection: '2026-01-19',
        nextMaintenanceDue: '2026-01-21',
        failureProbability: 78,
        estimatedFailureDate: '2026-01-25',
        componentsAtRisk: [
            {
                name: 'Main Drive Motor',
                riskPercentage: 85,
                estimatedFailureDate: '2026-01-25',
                recommendedAction: 'URGENT: Replace motor within 48 hours'
            },
            {
                name: 'Chuck Assembly',
                riskPercentage: 72,
                estimatedFailureDate: '2026-01-27',
                recommendedAction: 'Schedule replacement with motor'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm4',
                date: '2025-10-12',
                type: 'corrective',
                description: 'Replaced worn chuck jaws',
                technician: 'Roberto Sánchez',
                cost: 1200,
                partsReplaced: ['Chuck Jaws', 'Bearings'],
                duration: 240
            }
        ],
        failureHistory: [
            {
                id: 'f2',
                date: '2025-10-10',
                component: 'Chuck Jaws',
                description: 'Excessive wear causing part slippage',
                downtime: 6,
                repairCost: 1200,
                wasPredicted: true
            }
        ]
    },
    {
        id: 'conv-004',
        name: 'Conveyor Belt #4',
        type: 'Conveyor',
        location: 'Packaging Area',
        productionLine: 'Line 4',
        installDate: '2020-09-01',
        totalOperatingHours: 15600,
        cyclesCompleted: 0,
        currentEfficiency: 78,
        healthScore: 72,
        riskLevel: 'low',
        lastInspection: '2026-01-12',
        nextMaintenanceDue: '2026-02-12',
        failureProbability: 22,
        estimatedFailureDate: null,
        componentsAtRisk: [
            {
                name: 'Drive Belt',
                riskPercentage: 35,
                estimatedFailureDate: '2026-03-01',
                recommendedAction: 'Inspect for wear during next maintenance'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm5',
                date: '2025-12-12',
                type: 'preventive',
                description: 'Belt tension adjustment and cleaning',
                technician: 'Ana López',
                cost: 180,
                partsReplaced: [],
                duration: 60
            }
        ],
        failureHistory: []
    },
    {
        id: 'weld-005',
        name: 'Spot Welder #5',
        type: 'Welder',
        location: 'Production Floor B',
        productionLine: 'Line 2',
        installDate: '2019-04-18',
        totalOperatingHours: 19800,
        cyclesCompleted: 125600,
        currentEfficiency: 68,
        healthScore: 64,
        riskLevel: 'medium',
        lastInspection: '2026-01-08',
        nextMaintenanceDue: '2026-01-30',
        failureProbability: 35,
        estimatedFailureDate: '2026-02-10',
        componentsAtRisk: [
            {
                name: 'Electrode Tips',
                riskPercentage: 55,
                estimatedFailureDate: '2026-02-10',
                recommendedAction: 'Replace tips in next maintenance cycle'
            },
            {
                name: 'Transformer',
                riskPercentage: 28,
                estimatedFailureDate: '2026-03-20',
                recommendedAction: 'Monitor temperature and output voltage'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm6',
                date: '2025-11-30',
                type: 'preventive',
                description: 'Electrode tip replacement',
                technician: 'Pedro Martínez',
                cost: 420,
                partsReplaced: ['Electrode Tips'],
                duration: 90
            }
        ],
        failureHistory: []
    },
    {
        id: 'press-006',
        name: 'Stamping Press #6',
        type: 'Press',
        location: 'Production Floor A',
        productionLine: 'Line 1',
        installDate: '2021-02-14',
        totalOperatingHours: 9200,
        cyclesCompleted: 38900,
        currentEfficiency: 89,
        healthScore: 88,
        riskLevel: 'low',
        lastInspection: '2026-01-17',
        nextMaintenanceDue: '2026-02-28',
        failureProbability: 12,
        estimatedFailureDate: null,
        componentsAtRisk: [],
        maintenanceHistory: [
            {
                id: 'm7',
                date: '2025-12-28',
                type: 'preventive',
                description: 'Lubrication and safety check',
                technician: 'Luis Hernández',
                cost: 280,
                partsReplaced: ['Lubricant'],
                duration: 75
            }
        ],
        failureHistory: []
    },
    {
        id: 'robot-b2',
        name: 'Assembly Robot B2',
        type: 'Robot',
        location: 'Assembly Area',
        productionLine: 'Line 3',
        installDate: '2020-07-22',
        totalOperatingHours: 11450,
        cyclesCompleted: 54200,
        currentEfficiency: 82,
        healthScore: 76,
        riskLevel: 'low',
        lastInspection: '2026-01-14',
        nextMaintenanceDue: '2026-02-20',
        failureProbability: 18,
        estimatedFailureDate: null,
        componentsAtRisk: [
            {
                name: 'Gripper Mechanism',
                riskPercentage: 32,
                estimatedFailureDate: '2026-03-05',
                recommendedAction: 'Inspect gripper alignment and pressure'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm8',
                date: '2025-12-20',
                type: 'preventive',
                description: 'Gripper calibration and sensor check',
                technician: 'Sofia Ramírez',
                cost: 380,
                partsReplaced: [],
                duration: 105
            }
        ],
        failureHistory: []
    },
    {
        id: 'cnc-007',
        name: 'CNC Router #7',
        type: 'CNC',
        location: 'Production Floor C',
        productionLine: 'Line 5',
        installDate: '2022-01-10',
        totalOperatingHours: 6800,
        cyclesCompleted: 28400,
        currentEfficiency: 91,
        healthScore: 90,
        riskLevel: 'low',
        lastInspection: '2026-01-16',
        nextMaintenanceDue: '2026-03-10',
        failureProbability: 10,
        estimatedFailureDate: null,
        componentsAtRisk: [],
        maintenanceHistory: [
            {
                id: 'm9',
                date: '2026-01-10',
                type: 'preventive',
                description: 'Routine inspection and cleaning',
                technician: 'Diego Torres',
                cost: 220,
                partsReplaced: [],
                duration: 60
            }
        ],
        failureHistory: []
    },
    {
        id: 'conv-008',
        name: 'Roller Conveyor #8',
        type: 'Conveyor',
        location: 'Shipping Area',
        productionLine: 'Line 4',
        installDate: '2019-12-05',
        totalOperatingHours: 17300,
        cyclesCompleted: 0,
        currentEfficiency: 55,
        healthScore: 48,
        riskLevel: 'high',
        lastInspection: '2026-01-11',
        nextMaintenanceDue: '2026-01-24',
        failureProbability: 58,
        estimatedFailureDate: '2026-02-02',
        componentsAtRisk: [
            {
                name: 'Motor Gearbox',
                riskPercentage: 68,
                estimatedFailureDate: '2026-02-02',
                recommendedAction: 'Replace gearbox within 2 weeks'
            },
            {
                name: 'Roller Bearings',
                riskPercentage: 52,
                estimatedFailureDate: '2026-02-08',
                recommendedAction: 'Replace bearings with gearbox'
            }
        ],
        maintenanceHistory: [
            {
                id: 'm10',
                date: '2025-09-24',
                type: 'corrective',
                description: 'Replaced damaged rollers',
                technician: 'Miguel Flores',
                cost: 950,
                partsReplaced: ['Rollers', 'Bearings'],
                duration: 210
            }
        ],
        failureHistory: [
            {
                id: 'f3',
                date: '2025-09-22',
                component: 'Rollers',
                description: 'Roller seizure causing belt jam',
                downtime: 5,
                repairCost: 950,
                wasPredicted: false
            }
        ]
    }
];

// Mock alerts based on machine data
export const mockAlerts: MaintenanceAlert[] = [
    {
        id: 'alert-001',
        machineId: 'cnc-003',
        machineName: 'CNC Lathe #3',
        severity: 'critical',
        type: 'failure_prediction',
        message: 'Main Drive Motor failure predicted within 5 days',
        daysUntilAction: 5,
        recommendations: [
            'Schedule immediate motor replacement',
            'Order replacement motor (Part #: MDM-3000)',
            'Prepare backup production plan'
        ],
        createdAt: '2026-01-20T10:30:00',
        resolvedAt: null,
        status: 'active'
    },
    {
        id: 'alert-002',
        machineId: 'press-002',
        machineName: 'Hydraulic Press #2',
        severity: 'warning',
        type: 'component_risk',
        message: 'Hydraulic Pump showing signs of wear',
        daysUntilAction: 8,
        recommendations: [
            'Inspect pump for leaks',
            'Check hydraulic fluid levels',
            'Order replacement pump as precaution'
        ],
        createdAt: '2026-01-19T14:15:00',
        resolvedAt: null,
        status: 'active'
    },
    {
        id: 'alert-003',
        machineId: 'conv-008',
        machineName: 'Roller Conveyor #8',
        severity: 'warning',
        type: 'failure_prediction',
        message: 'Motor Gearbox failure risk at 68%',
        daysUntilAction: 13,
        recommendations: [
            'Schedule gearbox replacement',
            'Inspect roller bearings simultaneously',
            'Plan 4-hour maintenance window'
        ],
        createdAt: '2026-01-18T09:00:00',
        resolvedAt: null,
        status: 'active'
    }
];
