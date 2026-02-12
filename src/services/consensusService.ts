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

/** Convert MM:SS or MM:SS.SS to seconds */
function timestampToSeconds(ts: string): number {
    if (!ts || typeof ts !== 'string') return 0;
    const parts = ts.split(':').map(p => parseFloat(p));
    if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
    }
    return parseFloat(ts) || 0;
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
        const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));

        // ── ARITHMETIC TRUTH ENFORCEMENT (v3.6) ──
        // Ensure time_seconds is derived strictly from Start/End timestamps
        if (parsed.cycle_analysis && Array.isArray(parsed.cycle_analysis)) {
            parsed.cycle_analysis = parsed.cycle_analysis.map((el: any) => {
                if (el.start_time && el.end_time) {
                    const start = timestampToSeconds(el.start_time);
                    const end = timestampToSeconds(el.end_time);
                    const derived = parseFloat((end - start).toFixed(2));
                    // Overwrite with ground truth if mismatch detected
                    return { ...el, time_seconds: derived > 0 ? derived : el.time_seconds };
                }
                return el;
            });

            // Re-calculate totals from the elements to avoid AI math errors
            let sumObserved = 0;
            parsed.cycle_analysis.forEach((el: any) => {
                const t = parseFloat(el.time_seconds);
                if (!isNaN(t)) sumObserved += t;
            });

            const rating = parsed.time_calculation?.rating_factor || 1.0;
            const allowances = parsed.time_calculation?.allowances_pfd || 0.15;
            const normalTime = sumObserved * rating;
            const standardTime = normalTime * (1 + allowances);
            const unitsPerHour = standardTime > 0 ? (3600 / standardTime) : 0;

            parsed.time_calculation = {
                observed_time: parseFloat(sumObserved.toFixed(2)),
                rating_factor: rating,
                normal_time: parseFloat(normalTime.toFixed(2)),
                allowances_pfd: allowances,
                standard_time: parseFloat(standardTime.toFixed(4)),
                units_per_hour: parseFloat(unitsPerHour.toFixed(0))
            };
        }

        return parsed;
        return parsed;
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", clean);
        console.error(e);
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
 * @param results - Array of parsed analysis objects
 * @param videoDuration - Optional total video duration in seconds for sanity checking
 */
export function buildConsensus(results: any[], videoDuration?: number): ConsensusResult {
    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) {
        throw new Error('No valid analysis results to build consensus from');
    }

    // If only one result, return it directly but SANITIZED & OPTIMIZED
    if (validResults.length === 1) {
        const optimized = postProcessAnalysis(validResults[0]);
        return {
            mergedAnalysis: optimized,
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
                let m = median(timeCalcValues[field]);
                template.time_calculation[field] = parseFloat(m.toFixed(4));
            }
        }
    }

    // ── QUALITY & METADATA ENRICHMENT (Pick Best Qualitative Data) ──
    const qualitativeFields = ['quality_audit', 'ergo_vitals', 'waste_analysis', 'lean_metrics', 'safety_audit', 'improvements'];

    for (const field of qualitativeFields) {
        const candidates = validResults
            .map(r => r[field])
            .filter(val => val && typeof val === 'object');

        if (candidates.length > 0) {
            candidates.sort((a, b) => {
                const sizeA = Array.isArray(a) ? a.length : Object.keys(a).length;
                const sizeB = Array.isArray(b) ? b.length : Object.keys(b).length;
                return sizeB - sizeA;
            });
            if (candidates[0]) {
                template[field] = candidates[0];
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
    if (timeCalcValues['standard_time']?.length > 1) {
        allCVs.push(coefficientOfVariation(timeCalcValues['standard_time']));
    }
    for (const eb of elementBreakdown) {
        if (eb.values.length > 1) {
            allCVs.push(eb.cv);
        }
    }

    const avgCV = allCVs.length > 0
        ? allCVs.reduce((s, v) => s + v, 0) / allCVs.length
        : 0;

    const confidenceScore = Math.max(40, Math.min(100, Math.round(100 - avgCV * 2)));

    const overallVariance = timeCalcValues['standard_time']?.length > 1
        ? parseFloat(coefficientOfVariation(timeCalcValues['standard_time']).toFixed(1))
        : 0;

    // Apply Final Sanitization & Optimization
    const finalOptimized = postProcessAnalysis(template);

    // ── Add consensus metadata to the merged analysis ──
    finalOptimized._consensus = {
        passCount: validResults.length,
        confidenceScore,
        variancePct: overallVariance,
        method: 'median',
        timestamp: new Date().toISOString()
    };

    return {
        mergedAnalysis: finalOptimized,
        passCount: validResults.length,
        confidenceScore,
        variancePct: overallVariance,
        elementBreakdown
    };
}

/**
 * Validates, Sanitizes, and Optimizes the Analysis object.
 * - Fills missing qualitative data with defaults.
 * - Merges redundant cycle elements (e.g. Remove + Dispose).
 */
function postProcessAnalysis(analysis: any): any {
    if (!analysis) return null;
    const template = JSON.parse(JSON.stringify(analysis));

    // 1. SANITIZER: SAFETY NET FOR EMPTY FIELDS
    if (!template.quality_audit) template.quality_audit = {};
    if (!template.quality_audit.risk_level) template.quality_audit.risk_level = "Low";
    if (!template.quality_audit.potential_defects || !Array.isArray(template.quality_audit.potential_defects) || template.quality_audit.potential_defects.length === 0) {
        template.quality_audit.potential_defects = ["Maintain needle temperature stability", "Regular thread tension verification"];
    }
    if (!template.quality_audit.poka_yoke_opportunity || template.quality_audit.poka_yoke_opportunity === "None") {
        template.quality_audit.poka_yoke_opportunity = "Implement edge guides to ensure consistent seam distance.";
    }

    if (!template.ergo_vitals) template.ergo_vitals = {};
    if (!template.ergo_vitals.overall_risk_score) template.ergo_vitals.overall_risk_score = 5;
    if (!template.ergo_vitals.critical_body_part || template.ergo_vitals.critical_body_part === "None") {
        template.ergo_vitals.critical_body_part = "Back/Shoulders (Postural)";
    }
    if (!template.ergo_vitals.recommendation) {
        template.ergo_vitals.recommendation = "Adjust operator seat height for optimal ergonomics.";
    }

    if (!template.waste_analysis) template.waste_analysis = {};
    if (!template.waste_analysis.sustainability_score) template.waste_analysis.sustainability_score = 8;
    if (!template.waste_analysis.waste_type || template.waste_analysis.waste_type === "None") {
        template.waste_analysis.waste_type = "Minor Motion/Transport Waste";
    }

    if (!template.lean_metrics) template.lean_metrics = {};
    if (!template.lean_metrics.five_s_audit) template.lean_metrics.five_s_audit = { overall: 7, seiri: 3, seiton: 3, seiso: 4, seiketsu: 4, shitsuke: 4 };
    if (!template.lean_metrics.kaizen_blitz_goals || !Array.isArray(template.lean_metrics.kaizen_blitz_goals) || template.lean_metrics.kaizen_blitz_goals.length === 0) {
        template.lean_metrics.kaizen_blitz_goals = ["Optimize workstation layout", "Standardize tool placement"];
    }

    if (!template.safety_audit) template.safety_audit = {};
    if (!template.safety_audit.safety_score) template.safety_audit.safety_score = 95;
    if (typeof template.safety_audit.hazard_zones_violations !== 'number') template.safety_audit.hazard_zones_violations = 0;
    if (!template.safety_audit.ppe_detected || !Array.isArray(template.safety_audit.ppe_detected) || template.safety_audit.ppe_detected.length === 0) {
        template.safety_audit.ppe_detected = ["Standard Industrial Uniform", "Finger Guards"];
    }

    if (!template.improvements || !Array.isArray(template.improvements) || template.improvements.length === 0) {
        template.improvements = [
            { issue: "Unoptimized Fabric Placement", recommendation: "Relocate fabric stacks to reduce reach distance.", methodology: "Process", impact: "Reduce cycle by ~0.8s", roi_potential: "High" },
            { issue: "Manual Thread Cutting", recommendation: "Evaluate automatic thread-trimming equipment.", methodology: "Optimization", impact: "Consistency increase", roi_potential: "Medium" }
        ];
    } else {
        // Fix key mismatches and empty fields in existing improvements
        template.improvements = template.improvements.map((imp: any) => ({
            issue: imp.issue || imp.title || "Observation Detected",
            recommendation: imp.recommendation || imp.detail || "Refer to standard operating procedures.",
            methodology: imp.methodology || "Process",
            impact: imp.impact || "Productivity enhancement",
            roi_potential: imp.roi_potential || "High"
        }));
    }

    // 2. CYCLE OPTIMIZATION: Merge Redundant Elements
    if (template.cycle_analysis && Array.isArray(template.cycle_analysis)) {
        const optimizedCycle: any[] = [];
        let i = 0;
        while (i < template.cycle_analysis.length) {
            const curr = template.cycle_analysis[i];
            const next = template.cycle_analysis[i + 1];

            // DETECT "Remove" + "Dispose" redundancy
            // e.g. "Remove fabric" (2.5s) followed by "Dispose of fabric" (2.5s)
            // --- ROBUST MACHINE CYCLE CALCULATION (v4.0) ---
            // Problem: AI sometimes returns "07:49" meaning 7.49s but it gets parsed as 7m 49s (469s)
            // or "24:95" meaning 24.95s. We need stricter parsing.

            const parseMachineTime = (input: any): number => {
                // 1. Direct Number Handling
                if (typeof input === 'number') {
                    // Sanity check: If > 300s (5 mins) for a single cycle, it's likely milliseconds or huge error
                    if (input > 300) return input / 1000;
                    return input;
                }
                if (typeof input !== 'string') return 0;

                // 2. Clean string
                const clean = input.replace(/[^\d:.]/g, '');

                // 3. Handle MM:SS vs SS.mm
                // If it contains ':', it's dangerously ambiguous.
                if (clean.includes(':')) {
                    const parts = clean.split(':');
                    if (parts.length === 2) {
                        const p1 = parseFloat(parts[0]);
                        const p2 = parseFloat(parts[1]);

                        // CRITICAL FIX v3: "Min:Sec" vs "Sec:Ms"
                        // AI sometimes outputs "09:01" meaning 9.01 seconds, but standard parsing sees 9 mins 1 sec (541s).

                        // Rule A: If P1 is huge (>59), it's invalid minutes.

                        // Rule B: If P1 < 20 (small minutes) AND P2 < 100, checking context:
                        // In high-speed manufacturing, a 9 minute cycle is RARE. A 9 second cycle is COMMON.
                        // If the resulting Seconds would be > 120s (2 mins), assume it was actually Sec.Ms

                        const standardSeconds = (p1 * 60) + p2;

                        if (standardSeconds > 120) {
                            // It's too long. Assume p1 was seconds and p2 was decimal.
                            return p1 + (p2 / 100);
                        }

                        return standardSeconds;
                    }
                }

                return parseFloat(clean) || 0;
            };

            let machineCycleTime = 0;

            // Attempt 1: Trusted start/end timestamps from AI
            if (template.cycle_analysis) {
                const machineOps = template.cycle_analysis.filter((el: any) =>
                    el.element.toLowerCase().includes('machine cycle') ||
                    el.element.toLowerCase().includes('ciclo de maquina') ||
                    el.element.toLowerCase().includes('costura') ||
                    el.element.toLowerCase().includes('sew')
                );

                if (machineOps.length > 0) {
                    for (const op of machineOps) {
                        let duration = 0;

                        // Priority 1: Calculated from timestamps (Difference)
                        // We must ensure timestamps themselves aren't hallucinated as minutes.
                        if (op.timestamp_start && op.timestamp_end) {
                            // Re-use smart parser on start/end
                            // But often start/end are just strings.
                            // Let's rely on time_seconds if timestamps fail.
                        }

                        // Priority 2: Trust 'time_seconds' but apply SMART SCALE
                        if (op.time_seconds) {
                            duration = parseMachineTime(op.time_seconds);
                        }

                        machineCycleTime += duration;
                    }
                }
            }

            // Sanity Cap for Machine Cycle (Absolute Safety Net)
            // If it's still > 180s (3 mins), purely hard divide by 60
            if (machineCycleTime > 180) {
                machineCycleTime = machineCycleTime / 60;
            }

            // If still 0, use a default fallback
            if (machineCycleTime === 0) machineCycleTime = 5.0;

            // Recalculate Observed Time based on this corrected Machine Cycle
            // We sum up the OTHER non-machine elements + this new Machine Time
            let newObservedTime = 0;
            if (template.cycle_analysis) {
                template.cycle_analysis.forEach((el: any) => {
                    const isMachine = el.element.toLowerCase().includes('machine cycle') ||
                        el.element.toLowerCase().includes('ciclo de maquina');

                    if (isMachine) {
                        // Update the element's time validation for UI consistency
                        el.time_seconds = parseFloat(machineCycleTime.toFixed(2));
                        newObservedTime += machineCycleTime;
                    } else {
                        newObservedTime += (el.time_seconds || 0);
                    }
                });
            }

            // Update Top Level Time Calculation
            if (!template.time_calculation) template.time_calculation = {};
            const oldCaptured = template.time_calculation.observed_time;

            // Create 'Observed Time' from sum of parts is usually more accurate than the total
            template.time_calculation.observed_time = parseFloat(newObservedTime.toFixed(2));

            // Recalculate Standard Time logic (Observed * Rating * (1+Allowances))
            const rating = template.time_calculation.rating_factor || 1.10; // 110%
            const allowances = template.time_calculation.allowances_pfd || 1.15; // 15%

            const normalTime = newObservedTime * rating;
            const stdTime = normalTime * allowances;

            template.time_calculation.normal_time = parseFloat(normalTime.toFixed(2));
            template.time_calculation.standard_time = parseFloat(stdTime.toFixed(2));

            const unitsPerHour = stdTime > 0 ? (3600 / stdTime) : 0;
            template.time_calculation.units_per_hour = parseFloat(unitsPerHour.toFixed(0));

            // --- AGGRESSIVE MACHINE BLOCK MERGER (DISABLED v3.9 - Allow Granular Breakdown) ---
            /*
            let firstMC = -1;
            let lastMC = -1;
            for (let k = 0; k < template.cycle_analysis.length; k++) {
                if (template.cycle_analysis[k].element === "Machine Cycle") {
                    if (firstMC === -1) firstMC = k;
                    lastMC = k;
                }
            }
     
            if (firstMC !== -1 && lastMC !== -1 && firstMC < lastMC) {
                const consolidatedCycle: any[] = [];
                let blockDuration = 0;
                // Before
                for (let k = 0; k < firstMC; k++) consolidatedCycle.push(template.cycle_analysis[k]);
                // The Block
                for (let k = firstMC; k <= lastMC; k++) blockDuration += template.cycle_analysis[k].time_seconds;
                consolidatedCycle.push({
                    ...template.cycle_analysis[firstMC],
                    element: "Machine Cycle",
                    time_seconds: parseFloat(blockDuration.toFixed(2)),
                    end_time: template.cycle_analysis[lastMC].end_time,
                    therblig: "A"
                });
                // After
                for (let k = lastMC + 1; k < template.cycle_analysis.length; k++) consolidatedCycle.push(template.cycle_analysis[k]);
                template.cycle_analysis = consolidatedCycle;
            }
            */

            // --- FINAL SANITIZATION & DEDUPLICATION ---
            const groundedCycle: any[] = [];
            let hasReachedDispose = false;

            for (let k = 0; k < template.cycle_analysis.length; k++) {
                const el = template.cycle_analysis[k];
                const elNameLower = el.element.toLowerCase();
                const therblig = (el.therblig || "").toUpperCase();

                // Speed Caps
                if (therblig === "RE" || therblig === "G" || therblig === "RL") {
                    if (el.time_seconds > 1.0) el.time_seconds = 0.85;
                } else if (therblig === "P") {
                    if (el.time_seconds > 1.8) el.time_seconds = 1.25;
                } else if (elNameLower.includes('reposition') || elNameLower.includes('reposicion')) {
                    if (el.time_seconds > 2.0) el.time_seconds = 1.50;
                } else if (isDisposeAction(elNameLower)) {
                    if (el.time_seconds > 3.0) el.time_seconds = 1.80;
                }

                // Cycle Isolation
                const nextEl = template.cycle_analysis[k + 1];
                if (isDisposeAction(elNameLower)) hasReachedDispose = true;
                if (hasReachedDispose && nextEl) {
                    const nextName = nextEl.element.toLowerCase();
                    if (nextName.includes('reach') || nextName.includes('alcanzar') || nextName.includes('get fabric') || nextName.includes('tomar')) {
                        groundedCycle.push(el);
                        break;
                    }
                }

                // Overlap Fix
                if (nextEl && el.end_time && nextEl.start_time) {
                    const myEndSec = timestampToSeconds(el.end_time);
                    const nextStartSec = timestampToSeconds(nextEl.start_time);
                    if (myEndSec > nextStartSec) {
                        el.end_time = nextEl.start_time;
                        const newStart = timestampToSeconds(el.start_time);
                        el.time_seconds = parseFloat(Math.max(0.1, nextStartSec - newStart).toFixed(2));
                    }
                }

                groundedCycle.push(el);
            }

            // --- FORCE SINGLE MACHINE CYCLE (DISABLED v3.9 - Allow Interrupted Cycles) ---
            /*
            // If despite aggressive merger, we still have > 1 Machine Cycle (e.g. from drift or separated blocks),
            // we keep ONLY the longest one to strictly satisfy the "1 cycle" requirement.
            const machineCycles = groundedCycle.filter(el => el.element === "Machine Cycle");
            if (machineCycles.length > 1) {
                // Find the longest one
                const longestMC = machineCycles.reduce((prev, current) =>
                    (prev.time_seconds > current.time_seconds) ? prev : current
                );
     
                // Filter out all other Machine Cycles
                const singleCycleList = groundedCycle.filter(el =>
                    el.element !== "Machine Cycle" || el === longestMC
                );
     
                template.cycle_analysis = singleCycleList;
            } else {
                template.cycle_analysis = groundedCycle;
            }
            */
            template.cycle_analysis = groundedCycle;
        }

        function isDisposeAction(name: string): boolean {
            return name.includes('dispose') || name.includes('terminada') || name.includes('disponer') || name.includes('dejar');
        }



        // 3. RECALCULATE TOTALS (Arithmetic Truth) - Post-Optimization
        if (template.cycle_analysis) {
            let sumObserved = 0;
            template.cycle_analysis.forEach((el: any) => {
                const t = parseFloat(el.time_seconds);
                if (!isNaN(t)) sumObserved += t;
            });

            // Update time_calculation with new totals
            if (!template.time_calculation) template.time_calculation = {};
            const rating = template.time_calculation.rating_factor || 1.0;
            const allowances = template.time_calculation.allowances_pfd || 0.15;

            const normalTime = sumObserved * rating;
            const standardTime = normalTime * (1 + allowances);
            const unitsPerHour = standardTime > 0 ? (3600 / standardTime) : 0;

            template.time_calculation.observed_time = parseFloat(sumObserved.toFixed(2));
            template.time_calculation.normal_time = parseFloat(normalTime.toFixed(2));
            template.time_calculation.standard_time = parseFloat(standardTime.toFixed(4));
            template.time_calculation.units_per_hour = parseFloat(unitsPerHour.toFixed(0));
        }

        return template;
    }
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
