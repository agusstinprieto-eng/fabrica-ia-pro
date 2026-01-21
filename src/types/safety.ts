export interface SafetyViolation {
    timestamp: number;        // Seconds into video
    frameUrl: string;         // Base64 or URL to screenshot
    workerPosition: string;   // "left", "center", "right", "background"
    confidence: number;       // 0.0 to 1.0
    description: string;
}

export interface FrameAnalysisResult {
    totalWorkers: number;
    workersWithGlasses: number;
    workersWithoutGlasses: number;
    violations: {
        workerPosition: string;
        confidence: number;
        description: string;
    }[];
    complianceRate: number;   // 0-100
}

export interface ComplianceReport {
    ppeItem: 'safety_glasses' | 'helmet' | 'gloves' | 'mask';
    totalFramesAnalyzed: number;
    totalWorkersDetected: number;
    workersCompliant: number;
    workersNonCompliant: number;
    complianceRate: number;   // Percentage 0-100
    violations: SafetyViolation[];
    recommendations: string[];
    analysisTimestamp: string;
}

export type PPEType = 'safety_glasses' | 'helmet' | 'gloves' | 'mask';
