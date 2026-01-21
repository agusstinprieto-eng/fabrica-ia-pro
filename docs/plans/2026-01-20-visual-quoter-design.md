# Visual Quoter - Design Document
**Date:** 2026-01-20  
**Feature:** Sample Photo to Manufacturing Cost Estimator  
**Target Module:** Manufactura IA Pro

## Executive Summary
The Visual Quoter enables sales teams and production planners to generate instant manufacturing cost estimates by photographing a garment sample. This transforms a multi-day engineering analysis into a 30-second mobile workflow.

## User Journey

### 1. Capture Phase
- User opens "Visual Quoter" module
- Takes photo of garment sample (or uploads from gallery)
- System displays loading state: "Analyzing garment structure..."

### 2. AI Analysis Phase (Backend)
- **Image Classification:** Gemini Vision identifies garment type (e.g., "5-Pocket Denim Jeans")
- **Operation Detection:** AI detects visible construction features:
  - Pocket types (scoop, welt, patch)
  - Closure mechanisms (zipper, buttons)
  - Hem types (cuffed, raw edge, blind stitch)
  - Decorative elements (topstitching, embroidery)
- **SAM Mapping:** Each detected operation is mapped to Standard Allowed Minutes from GSD (General Sewing Data) library

### 3. Verification Screen (Human-in-the-Loop)
**UI Layout:**
```
┌─────────────────────────────────────┐
│  [Photo Preview]                    │
│  (with visual markers on features)  │
├─────────────────────────────────────┤
│  Detected Operations:               │
│  ☑ Back Pocket Attach (2x)  1.2 min│
│  ☑ Side Seam Close          0.8 min│
│  ☐ Belt Loop Attach (7x)    0.9 min│ <- User can toggle
│  ☑ Zipper Install           1.5 min│
│  + Add Custom Operation            │
├─────────────────────────────────────┤
│  [Confirm & Calculate Cost]         │
└─────────────────────────────────────┘
```

**User Actions:**
- Toggle operations on/off
- Adjust quantity (e.g., change "2 pockets" to "4 pockets")
- Add missing operations from dropdown library
- Click "Confirm" to proceed

### 4. Cost Card (Final Output)
**Display:**
```
╔═══════════════════════════════════╗
║  ESTIMATED MANUFACTURING COST     ║
╠═══════════════════════════════════╣
║  Total Sewing Time: 14.2 min      ║
║  Labor Cost (Mexico): $1.85 USD   ║
║  ─────────────────────────────    ║
║  Comparison:                      ║
║  Bangladesh: $0.55 (-70%)         ║
║  Vietnam: $0.68 (-63%)            ║
╚═══════════════════════════════════╝
```

**Actions:**
- Export as PDF quote
- Share via WhatsApp
- Save to project history

## Technical Architecture

### Component Structure
```
src/
├── components/
│   └── VisualQuoter/
│       ├── VisualQuoter.tsx          # Main container
│       ├── CaptureView.tsx           # Photo capture UI
│       ├── VerificationView.tsx      # Operation checklist
│       ├── CostCard.tsx              # Final estimate display
│       └── OperationLibrary.tsx      # SAM database browser
├── services/
│   ├── geminiQuoterService.ts        # AI analysis logic
│   └── samDatabase.ts                # GSD standards library
└── types/
    └── quoter.ts                     # TypeScript interfaces
```

### Data Flow
1. **Image Upload** → Base64 encoding → Gemini Vision API
2. **AI Response** → Parse JSON → `DetectedOperation[]`
3. **User Confirmation** → Merge with manual edits → `ConfirmedOperation[]`
4. **Cost Calculation** → Sum SAMs × Labor Rate → `CostEstimate`

### AI Prompt Strategy
```typescript
const QUOTER_PROMPT = `
You are a garment construction expert. Analyze this photo and identify:

1. GARMENT TYPE (e.g., "5-Pocket Jeans", "Oxford Shirt")
2. VISIBLE OPERATIONS with confidence scores:
   - Pocket construction (type, quantity)
   - Seam types (flat-felled, overlock, etc.)
   - Closures (zipper, buttons, snaps)
   - Hems and cuffs
   - Decorative stitching

Return JSON:
{
  "garmentType": "string",
  "operations": [
    {
      "name": "Back Pocket Attach",
      "quantity": 2,
      "confidence": 0.95,
      "samCode": "PKT_PATCH_SINGLE"
    }
  ]
}
`;
```

### SAM Database Schema
```typescript
interface SAMEntry {
  code: string;           // "PKT_PATCH_SINGLE"
  description: string;    // "Attach single patch pocket"
  baseMinutes: number;    // 0.6
  difficulty: 1 | 2 | 3;  // Complexity multiplier
  category: 'pocket' | 'seam' | 'closure' | 'hem' | 'decorative';
}
```

**Initial Library (MVP):**
- 50 most common garment operations
- Sourced from GSD/MOST standards
- Expandable via admin panel

### Labor Rate Configuration
```typescript
interface LaborRate {
  country: string;
  hourlyRate: number;  // USD
  efficiency: number;  // 0.7 = 70% efficiency
}

const DEFAULT_RATES: LaborRate[] = [
  { country: 'Mexico', hourlyRate: 7.80, efficiency: 0.75 },
  { country: 'Bangladesh', hourlyRate: 2.30, efficiency: 0.70 },
  { country: 'Vietnam', hourlyRate: 3.20, efficiency: 0.72 }
];
```

## Error Handling

### AI Failure Scenarios
1. **Low Confidence Detection:** Show warning badge, require manual review
2. **Unrecognized Garment:** Fallback to "Generic Apparel" template
3. **API Timeout:** Retry with exponential backoff (3 attempts)

### User Input Validation
- Minimum 1 operation selected
- Total SAM > 0.1 minutes
- Photo resolution ≥ 640px (warn if lower)

## Success Metrics
- **Speed:** Analysis complete in <5 seconds
- **Accuracy:** ±15% of actual production cost (validated against 100 historical samples)
- **Adoption:** 60% of sales team uses feature weekly within 3 months

## Future Enhancements (Out of Scope for MVP)
- Fabric cost estimation (requires material database)
- Trim/accessories cost (buttons, zippers)
- Multi-garment batch quoting
- Integration with ERP systems

## Implementation Checklist
- [ ] Create `VisualQuoter.tsx` component skeleton
- [ ] Implement `geminiQuoterService.ts` with prompt engineering
- [ ] Build SAM database JSON file (50 operations)
- [ ] Design `VerificationView` UI with operation toggles
- [ ] Implement cost calculation engine
- [ ] Create PDF export functionality
- [ ] Add to main navigation menu
- [ ] Write unit tests for SAM calculations
- [ ] User acceptance testing with 10 sample garments
