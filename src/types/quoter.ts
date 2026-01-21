export interface DetectedOperation {
    name: string;
    quantity: number;
    confidence: number; // 0-1
    samCode: string;
    category: 'pocket' | 'seam' | 'closure' | 'hem' | 'decorative' | 'other';
}

export interface ConfirmedOperation extends DetectedOperation {
    confirmed: boolean;
    manuallyAdded?: boolean;
}

export interface SAMEntry {
    code: string;
    description: string;
    baseMinutes: number;
    difficulty: 1 | 2 | 3;
    category: 'pocket' | 'seam' | 'closure' | 'hem' | 'decorative' | 'other';
}

export interface LaborRate {
    country: string;
    hourlyRate: number;
    efficiency: number;
}

export interface CostEstimate {
    totalMinutes: number;
    laborCostUSD: number;
    country: string;
    operations: ConfirmedOperation[];
    comparisons?: {
        country: string;
        cost: number;
        savingsPercent: number;
    }[];
}

export interface QuoterAnalysisResult {
    garmentType: string;
    operations: DetectedOperation[];
    imageUrl: string;
    timestamp: string;
}
