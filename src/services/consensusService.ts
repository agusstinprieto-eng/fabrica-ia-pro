/**
 * Consensus Service — Multi-pass analysis averaging for time study accuracy.
 * 
 * Takes N analysis results from repeated Gemini calls on the same frames,
 * extracts numeric time values, and returns the median + confidence metrics.
 */

export interface ConsensusResult {
    /** The merged analysis object with median time values */
    mergedAnalysis: any;
    /** How many passes were used */
    passCount: number;
    /** Confidence 0-100 based on inter-run consistency */
    confidenceScore: number;
    /** Coefficient of Variation (lower = more consistent) */
    variancePct: number;
    /** Per-element time comparison across runs */
    elementBreakdown: ElementComparison[];
}

export interface ElementComparison {
    element: string;
    values: number[];
    median: number;
    min: number;
    max: number;
    cv: number; // coefficient of variation
}

/** Parse a raw Gemini result string into a JSON object */
export function parseAnalysisResult(raw: string | object): any {
    if (typeof raw === 'object' && raw !== null) return raw;
    if (typeof raw !== 'string') return null;

    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;

    try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    } catch {
        return null;
    }
}

/** Compute the median of an array of numbers */
function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Compute standard deviation */
function stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
}

/** Compute coefficient of variation (%) */
function coefficientOfVariation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean === 0) return 0;
    return (stdDev(values) / Math.abs(mean)) * 100;
}

/**
 * Build consensus from multiple analysis passes.
 * 
 * Strategy:
 * - Extract time_calculation fields and cycle_analysis element times
 * - Use MEDIAN (not mean) for robustness against outliers
 * - Calculate confidence score based on inter-run consistency
 */
export function buildConsensus(results: any[]): ConsensusResult {
    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) {
        throw new Error('No valid analysis results to build consensus from');
    }

    // If only one result, return it directly with low confidence
    if (validResults.length === 1) {
        return {
            mergedAnalysis: validResults[0],
            passCount: 1,
            confidenceScore: 60, // Single pass = lower confidence
            variancePct: 0,
            elementBreakdown: []
        };
    }

    // Use the first result as the template
    const template = JSON.parse(JSON.stringify(validResults[0]));

    // ── Extract and merge time_calculation ──
    const timeCalcFields = ['observed_time', 'normal_time', 'standard_time', 'rating_factor', 'allowances_pfd', 'units_per_hour'];
    const timeCalcValues: Record<string, number[]> = {};

    for (const field of timeCalcFields) {
        timeCalcValues[field] = validResults
            .map(r => r?.time_calculation?.[field])
            .filter((v): v is number => typeof v === 'number' && isFinite(v));
    }

    // Apply medians to template
    if (template.time_calculation) {
        for (const field of timeCalcFields) {
            if (timeCalcValues[field].length > 0) {
                template.time_calculation[field] = parseFloat(median(timeCalcValues[field]).toFixed(4));
            }
        }
    }

    // ── Extract and merge cycle_analysis element times ──
    const elementBreakdown: ElementComparison[] = [];

    if (template.cycle_analysis && Array.isArray(template.cycle_analysis)) {
        for (let i = 0; i < template.cycle_analysis.length; i++) {
            const elementName = template.cycle_analysis[i]?.element || `Element ${i + 1}`;
            const timeValues = validResults
                .map(r => r?.cycle_analysis?.[i]?.time_seconds)
                .filter((v): v is number => typeof v === 'number' && isFinite(v));

            if (timeValues.length > 0) {
                const med = parseFloat(median(timeValues).toFixed(2));
                template.cycle_analysis[i].time_seconds = med;

                elementBreakdown.push({
                    element: elementName,
                    values: timeValues,
                    median: med,
                    min: Math.min(...timeValues),
                    max: Math.max(...timeValues),
                    cv: parseFloat(coefficientOfVariation(timeValues).toFixed(1))
                });
            }
        }
    }

    // ── Calculate overall confidence score ──
    const allCVs: number[] = [];

    // CV from standard_time across runs
    if (timeCalcValues['standard_time']?.length > 1) {
        allCVs.push(coefficientOfVariation(timeCalcValues['standard_time']));
    }

    // CV from each element
    for (const eb of elementBreakdown) {
        if (eb.values.length > 1) {
            allCVs.push(eb.cv);
        }
    }

    const avgCV = allCVs.length > 0
        ? allCVs.reduce((s, v) => s + v, 0) / allCVs.length
        : 0;

    // Convert CV to confidence: CV=0 → 100%, CV=20% → 60%, CV>40% → ~40%
    const confidenceScore = Math.max(40, Math.min(100, Math.round(100 - avgCV * 2)));

    const overallVariance = timeCalcValues['standard_time']?.length > 1
        ? parseFloat(coefficientOfVariation(timeCalcValues['standard_time']).toFixed(1))
        : 0;

    // ── Add consensus metadata to the merged analysis ──
    template._consensus = {
        passCount: validResults.length,
        confidenceScore,
        variancePct: overallVariance,
        method: 'median',
        timestamp: new Date().toISOString()
    };

    return {
        mergedAnalysis: template,
        passCount: validResults.length,
        confidenceScore,
        variancePct: overallVariance,
        elementBreakdown
    };
}

/**
 * SAM Benchmark Validation
 * 
 * Cross-check the AI's time result against known SAM benchmarks.
 * Returns a validation status and details.
 */
export interface SAMValidation {
    status: 'validated' | 'deviation' | 'no_match';
    matchedOperation?: string;
    expectedRange?: { min: number; max: number };
    measuredTime?: number;
    deviationPct?: number;
    message: string;
}

// Condensed SAM ranges for common textile operations (min, max in minutes)
const SAM_RANGES: Record<string, { min: number; max: number; label: string }> = {
    // Seams
    'straight_seam': { min: 0.15, max: 0.50, label: 'Straight Seam / Costura Recta' },
    'overlock': { min: 0.15, max: 0.50, label: 'Overlock / Sobrehilar' },
    'flat_felled': { min: 0.60, max: 1.20, label: 'Flat-Felled Seam / Costura Plana' },
    'french_seam': { min: 0.70, max: 1.30, label: 'French Seam / Costura Francesa' },
    'topstitch': { min: 0.25, max: 0.60, label: 'Topstitch / Pespunte' },
    // Pockets
    'pocket_patch': { min: 0.45, max: 1.20, label: 'Patch Pocket / Bolsa Parche' },
    'pocket_welt': { min: 1.00, max: 2.50, label: 'Welt Pocket / Bolsa Vivo' },
    'pocket_scoop': { min: 0.55, max: 1.00, label: 'Scoop Pocket / Bolsa Delantera' },
    'pocket_coin': { min: 0.25, max: 0.55, label: 'Coin Pocket / Relojera' },
    // Closures
    'zipper_fly': { min: 1.20, max: 2.30, label: 'Fly Zipper / Cierre Bragueta' },
    'zipper_centered': { min: 1.00, max: 2.00, label: 'Centered Zipper / Cierre Centrado' },
    'buttonhole': { min: 0.08, max: 0.20, label: 'Buttonhole / Ojal' },
    // Assembly
    'waistband': { min: 0.80, max: 1.50, label: 'Waistband / Pretina' },
    'collar': { min: 1.00, max: 2.20, label: 'Collar / Cuello' },
    'sleeve_set': { min: 0.70, max: 1.30, label: 'Set Sleeve / Pegar Manga' },
    'belt_loop': { min: 0.08, max: 0.18, label: 'Belt Loop / Presilla' },
    // Hems
    'hem_blind': { min: 0.30, max: 0.70, label: 'Blind Hem / Ruedo Invisible' },
    'hem_topstitch': { min: 0.25, max: 0.60, label: 'Topstitch Hem / Ruedo Pespunte' },
    // General
    'label_attach': { min: 0.10, max: 0.35, label: 'Label Attach / Pegar Etiqueta' },
    'bartack': { min: 0.10, max: 0.25, label: 'Bartack / Remate' },
};

/**
 * Attempt to match operation name to a SAM range and validate
 */
export function validateAgainstSAM(operationName: string, standardTimeMinutes: number): SAMValidation {
    if (!operationName || !isFinite(standardTimeMinutes) || standardTimeMinutes <= 0) {
        return { status: 'no_match', message: 'No operation name or time to validate.' };
    }

    const opLower = operationName.toLowerCase();

    // Try to match against known operations
    for (const [key, range] of Object.entries(SAM_RANGES)) {
        const keywords = key.split('_');
        const matches = keywords.every(kw => opLower.includes(kw)) ||
            opLower.includes(range.label.split('/')[0].trim().toLowerCase()) ||
            opLower.includes(range.label.split('/')[1]?.trim().toLowerCase() || '___');

        if (matches) {
            const deviationPct = standardTimeMinutes < range.min
                ? ((range.min - standardTimeMinutes) / range.min) * 100
                : standardTimeMinutes > range.max
                    ? ((standardTimeMinutes - range.max) / range.max) * 100
                    : 0;

            const withinRange = standardTimeMinutes >= range.min * 0.6 && standardTimeMinutes <= range.max * 1.4;

            return {
                status: withinRange ? 'validated' : 'deviation',
                matchedOperation: range.label,
                expectedRange: range,
                measuredTime: standardTimeMinutes,
                deviationPct: parseFloat(deviationPct.toFixed(1)),
                message: withinRange
                    ? `✅ Within expected SAM range (${range.min}-${range.max} min)`
                    : `⚠️ ${deviationPct.toFixed(0)}% deviation from SAM range (${range.min}-${range.max} min)`
            };
        }
    }

    return {
        status: 'no_match',
        measuredTime: standardTimeMinutes,
        message: '📊 No matching SAM benchmark found for this operation type.'
    };
}
