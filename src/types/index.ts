export interface FileData {
  base64: string;
  mimeType: string;
  selected?: boolean;
  previewUrl?: string; // Optional for UI display
  // We can add metadata here like size, name, etc. if needed
}

export interface AnalysisResult {
  id: string;
  date: Date;
  originalContent: string; // The raw markdown/text response
  jsonContent?: IndustrialAnalysis; // The parsed structured data
  images: FileData[];
  layoutVisualization?: string | null; // Base64 or URL of the generated layout image
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'cyber';
  language: 'es' | 'en';
  // Add other global settings here
}

export interface UserProfile {
  name: string;
  role: string;
  company?: string;
}

// --- NEW ENGINEERING TYPES ---

export interface CycleElement {
  element: string; // e.g. "Grasp", "Position", "Sew"
  time_seconds: number;
  value_added: boolean; // True if it adds value (Sew), False if waste (Wait/Move)
  code?: string; // e.g. "M4", "P2" (MTM codes optional)
}

export interface TimeCalculation {
  observed_time: number; // Sum of elements
  rating_factor: number; // Westfield / Westinghouse (e.g. 1.10 = 110%)
  normal_time: number; // Observed * Rating
  allowances_pfd: number; // Personal, Fatigue, Delay % (e.g. 0.15)
  standard_time: number; // Normal * (1 + Allowances)
  units_per_hour: number; // 3600 / Standard Time
  units_per_shift: number; // Units per 8h shift
}

export interface QualityAudit {
  risk_level: "Critical" | "High" | "Medium" | "Low";
  potential_defects: string[];
  iso_compliance: string; // e.g. "ISO-9001:2015 Clause 8.5.1"
  poka_yoke_opportunity: string; // Suggested physical constraint
}

export interface ProcessImprovement {
  issue: string; // The problem detected
  recommendation: string; // The fix
  methodology: "Lean" | "Six Sigma" | "Ergonomics" | "Quality";
  impact: string; // e.g. "Reduce cycle by 1.5s"
  roi_potential?: string; // e.g. "High", "Medium", "Low"
}

export interface MaterialCalculation {
  material_list: {
    name: string; // e.g. "Polyester Thread", "YKK Zipper", "Denim Fabric"
    quantity_estimated: string; // e.g. "1.5 meters", "1 unit"
    unit_cost_estimate?: string; // Optional estimate
    waste_factor_percent?: number; // e.g. 5%
  }[];
  total_material_cost_estimate?: string;
}

export interface WasteAnalysis {
  waste_type: string; // e.g. "Fabric Scraps", "Thread Trimmings"
  environmental_impact: "Low" | "Medium" | "High";
  disposal_recommendation: string; // e.g. "Recycle", "Incinerate"
  sustainability_score: number; // 1-10
}

export interface IndustrialAnalysis {
  operation_name: string;
  timestamp: string;
  technical_specs: {
    machine: string; // e.g. "Singer 20U", "Fanuc Robot"
    material: string; // e.g. "Denim 14oz", "Aluminum 6061"
    rpm_speed?: number | string;
  };
  cycle_analysis: CycleElement[];
  time_calculation: TimeCalculation;
  quality_audit: QualityAudit;
  improvements: ProcessImprovement[];
  summary_text: string; // A brief executive summary (2-3 lines)
}