# Safety Compliance Monitor - Design Document
**Date:** 2026-01-20  
**Feature:** PPE Detection (Safety Glasses)  
**Target Module:** Manufactura IA Pro

## Executive Summary
The Safety Compliance Monitor enables safety managers to verify PPE (Personal Protective Equipment) usage by analyzing uploaded videos. This reduces legal liability, prevents workplace accidents, and automates compliance reporting for OSHA/STPS audits.

## User Journey

### 1. Video Upload
- User uploads a 1-2 minute video of a workstation (same workflow as current video analysis)
- System displays loading state: "Analyzing safety compliance..."

### 2. AI Analysis Phase
- **Frame Sampling:** Extract 1 frame every 2 seconds (30 frames for a 1-minute video)
- **Person Detection:** Identify all workers visible in each frame
- **PPE Detection:** For each detected person, analyze if they are wearing safety glasses
- **Violation Tracking:** Record timestamp and screenshot when violations are detected

### 3. Compliance Report (New Section in Analysis)
**UI Layout:**
```
╔═══════════════════════════════════════════════╗
║  SAFETY COMPLIANCE REPORT                     ║
╠═══════════════════════════════════════════════╣
║  PPE Item: Safety Glasses                     ║
║  Compliance Rate: 80% (4/5 workers)           ║
║  ─────────────────────────────────────────    ║
║  Violations Detected: 1                       ║
║  Timestamp: 0:45, 1:23                        ║
║  ─────────────────────────────────────────    ║
║  [View Violation Screenshots]                 ║
║  [Download Compliance Certificate]            ║
╚═══════════════════════════════════════════════╝
```

### 4. Violation Screenshots
- Display captured frames showing workers without safety glasses
- Each screenshot includes:
  - Timestamp
  - Worker ID (if identifiable)
  - Red bounding box around face
  - Warning icon

### 5. Recommendations
- AI generates actionable recommendations:
  - "Reinforce safety training for Station #3"
  - "Install reminder signage near workstation entrance"
  - "Schedule follow-up audit in 1 week"

## Technical Architecture

### Component Structure
```
src/
├── components/
│   └── SafetyCompliance/
│       ├── ComplianceReport.tsx      # Main report display
│       ├── ViolationGallery.tsx      # Screenshot carousel
│       └── ComplianceMetrics.tsx     # Stats cards
├── services/
│   └── safetyAnalysisService.ts      # Gemini Vision API integration
└── types/
    └── safety.ts                     # TypeScript interfaces
```

### Data Flow
1. **Video Upload** → Extract frames (1 every 2 seconds)
2. **Frame Analysis** → Send to Gemini Vision API with PPE detection prompt
3. **Violation Detection** → Parse JSON response, identify non-compliant workers
4. **Report Generation** → Aggregate results, calculate compliance rate
5. **Screenshot Capture** → Save violation frames for evidence

### AI Prompt Strategy
```typescript
const SAFETY_GLASSES_PROMPT = `
You are a workplace safety inspector analyzing this image for PPE compliance.

TASK: Detect if ALL visible workers are wearing safety glasses/goggles.

INSTRUCTIONS:
1. Count the total number of workers visible in the image
2. For each worker, determine if they are wearing safety glasses
3. Safety glasses include: clear safety goggles, tinted safety glasses, face shields with eye protection
4. DO NOT count: regular prescription glasses, sunglasses without side shields

Return JSON:
{
  "totalWorkers": number,
  "workersWithGlasses": number,
  "workersWithoutGlasses": number,
  "violations": [
    {
      "workerPosition": "left side of frame" | "center" | "right side",
      "confidence": 0.0-1.0,
      "description": "Worker not wearing safety glasses"
    }
  ],
  "complianceRate": percentage (0-100)
}
`;
```

### TypeScript Interfaces
```typescript
interface SafetyViolation {
  timestamp: number;        // Seconds into video
  frameUrl: string;         // Base64 or URL to screenshot
  workerPosition: string;
  confidence: number;
  description: string;
}

interface ComplianceReport {
  ppeItem: 'safety_glasses' | 'helmet' | 'gloves';
  totalFramesAnalyzed: number;
  totalWorkersDetected: number;
  workersCompliant: number;
  workersNonCompliant: number;
  complianceRate: number;   // Percentage
  violations: SafetyViolation[];
  recommendations: string[];
}
```

## Integration with Existing System

### Modify `geminiService.ts`
Add new function:
```typescript
export const analyzeSafetyCompliance = async (
  videoFrames: string[],  // Base64 encoded frames
  ppeType: 'safety_glasses' | 'helmet' | 'gloves'
): Promise<ComplianceReport>
```

### Modify `AnalysisDisplay.tsx`
Add new section after existing analysis:
```tsx
{safetyReport && (
  <div className="mt-8">
    <ComplianceReport report={safetyReport} />
  </div>
)}
```

### Add Toggle in Upload UI
```tsx
<label className="flex items-center gap-2">
  <input type="checkbox" checked={enableSafetyCheck} onChange={...} />
  <span>Enable Safety Compliance Check (PPE Detection)</span>
</label>
```

## Performance Considerations

### Frame Sampling Strategy
- **1-minute video:** 30 frames (1 every 2 seconds)
- **2-minute video:** 60 frames (1 every 2 seconds)
- **Max frames:** 60 (to avoid API rate limits)

### API Cost Optimization
- Only analyze frames where workers are visible (skip empty frames)
- Batch API calls (5 frames per request)
- Cache results to avoid re-analysis

### Error Handling
1. **No workers detected:** Display "No workers visible in video"
2. **Low confidence (<0.6):** Mark as "Uncertain - Manual review required"
3. **API timeout:** Retry with exponential backoff (3 attempts)

## Success Metrics
- **Accuracy:** ±10% of manual inspection (validated against 50 test videos)
- **Speed:** Complete analysis in <30 seconds for 1-minute video
- **Adoption:** 40% of users enable safety check within 2 months

## Future Enhancements (Out of Scope for MVP)
- Multi-PPE detection (glasses + helmet + gloves in one pass)
- Real-time monitoring mode (live camera feed)
- Integration with HR systems (automatic incident reports)
- Facial recognition to identify specific workers

## Implementation Checklist
- [ ] Create `safety.ts` types file
- [ ] Implement `analyzeSafetyCompliance` in `geminiService.ts`
- [ ] Create `ComplianceReport.tsx` component
- [ ] Create `ViolationGallery.tsx` component
- [ ] Add safety check toggle to upload UI
- [ ] Integrate into existing analysis workflow
- [ ] Add PDF export for compliance reports
- [ ] Write unit tests for violation detection logic
- [ ] User acceptance testing with 10 sample videos
