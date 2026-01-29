import { DetectedOperation, QuoterAnalysisResult } from '../types/quoter';
import { supabase } from '../lib/supabaseClient';

export const analyzeGarmentSample = async (base64Image: string): Promise<QuoterAnalysisResult> => {
    try {
        const { data, error } = await supabase.functions.invoke('industrial-ai', {
            body: {
                action: 'quoter',
                payload: {
                    base64Image
                }
            }
        });

        if (error) throw error;

        const responseText = data.result;

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
