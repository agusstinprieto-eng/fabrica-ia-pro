import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedOperation, QuoterAnalysisResult } from '../types/quoter';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const analyzeGarmentSample = async (base64Image: string): Promise<QuoterAnalysisResult> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a garment construction expert with deep knowledge of industrial sewing operations.

Analyze this photo of a garment sample and identify:

1. **GARMENT TYPE**: Classify the item (e.g., "5-Pocket Denim Jeans", "Oxford Dress Shirt", "Polo Shirt", "Cargo Pants")

2. **VISIBLE CONSTRUCTION OPERATIONS**: List every sewing operation you can detect with high confidence.
   For each operation, provide:
   - Exact name (use industry standard terminology)
   - Quantity (how many times this operation appears)
   - Confidence score (0.0 to 1.0)
   - Appropriate SAM code from this list:

   POCKETS: PKT_PATCH_SINGLE, PKT_PATCH_DOUBLE, PKT_SCOOP, PKT_WELT_SINGLE, PKT_WELT_DOUBLE, PKT_WATCH
   SEAMS: SEAM_SIDE_CLOSE, SEAM_INSEAM, SEAM_SHOULDER, SEAM_FLAT_FELLED, SEAM_FRENCH, SEAM_OVERLOCK
   CLOSURES: ZIP_CENTERED, ZIP_LAPPED, ZIP_INVISIBLE, BTN_ATTACH, BTN_HOLE, SNAP_ATTACH, HOOK_EYE
   HEMS: HEM_BLIND, HEM_TOPSTITCH, HEM_ROLLED, HEM_CUFF, HEM_FACING
   DECORATIVE: DECO_TOPSTITCH_SINGLE, DECO_TOPSTITCH_DOUBLE, DECO_BARTACK, DECO_EMBROIDERY_SMALL, DECO_EMBROIDERY_LARGE
   OTHER: WAIST_ATTACH, WAIST_ELASTIC, COLLAR_ATTACH, COLLAR_STAND, CUFF_ATTACH, LOOP_BELT, LABEL_SIZE, LABEL_CARE, LABEL_BRAND, PLEAT_SINGLE, DART_SINGLE, GATHER_SECTION, YOKE_ATTACH, SLEEVE_SET, SLEEVE_RAGLAN, FINISH_PRESS, FINISH_INSPECT, FINISH_FOLD, FINISH_TAG

**CRITICAL RULES:**
- Only detect operations that are CLEARLY VISIBLE in the photo
- If you can't see a specific feature (e.g., inside pocket construction), don't guess
- For symmetric garments (pants, shirts), count operations on BOTH sides (e.g., 2 side seams, 2 sleeves)
- Assign confidence < 0.7 if the operation is partially obscured or uncertain
- Use the exact SAM codes provided above

Return ONLY valid JSON in this exact format:
{
  "garmentType": "string",
  "operations": [
    {
      "name": "Back Pocket Attach",
      "quantity": 2,
      "confidence": 0.95,
      "samCode": "PKT_PATCH_SINGLE",
      "category": "pocket"
    }
  ]
}`;

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();

        // Extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

        const parsed = JSON.parse(jsonText);

        return {
            garmentType: parsed.garmentType || 'Unknown Garment',
            operations: parsed.operations || [],
            imageUrl: `data:image/jpeg;base64,${base64Image}`,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        throw new Error('Failed to analyze garment. Please try again with a clearer photo.');
    }
};

export const refineOperationList = (
    operations: DetectedOperation[],
    userEdits: { samCode: string; quantity: number; confirmed: boolean }[]
): DetectedOperation[] => {
    const refined = operations.map(op => {
        const edit = userEdits.find(e => e.samCode === op.samCode);
        if (edit) {
            return { ...op, quantity: edit.quantity, confidence: 1.0 };
        }
        return op;
    });

    return refined.filter(op => {
        const edit = userEdits.find(e => e.samCode === op.samCode);
        return !edit || edit.confirmed;
    });
};
