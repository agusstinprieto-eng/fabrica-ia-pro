import { ComplianceReport, FrameAnalysisResult, SafetyViolation, PPEType } from '../types/safety';
import { supabase } from '../lib/supabaseClient';

export const analyzeSafetyCompliance = async (
    videoFrames: { base64: string; timestamp: number }[],
    ppeType: PPEType = 'safety_glasses'
): Promise<ComplianceReport> => {
    const violations: SafetyViolation[] = [];
    let totalWorkersDetected = 0;
    let totalCompliant = 0;
    let totalNonCompliant = 0;

    console.log(`[Safety Analysis] Analyzing ${videoFrames.length} frames for ${ppeType}`);

    for (const frame of videoFrames) {
        try {
            const { data, error } = await supabase.functions.invoke('industrial-ai', {
                body: {
                    action: 'safety',
                    payload: {
                        frameBase64: frame.base64,
                        ppeType
                    }
                }
            });

            if (error) throw error;

            const responseText = data.result;

            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

            const parsed: FrameAnalysisResult = JSON.parse(jsonText);

            // Aggregate statistics
            totalWorkersDetected += (parsed.totalWorkers || 0);
            totalCompliant += (parsed.workersWithGlasses || 0);
            totalNonCompliant += (parsed.workersWithoutGlasses || 0);

            // Record violations
            if (parsed.violations && parsed.violations.length > 0) {
                parsed.violations.forEach(v => {
                    violations.push({
                        timestamp: frame.timestamp,
                        frameUrl: `data:image/jpeg;base64,${frame.base64}`,
                        workerPosition: v.workerPosition,
                        confidence: v.confidence,
                        description: v.description
                    });
                });
            }

        } catch (error) {
            console.error(`[Safety Analysis] Error analyzing frame at ${frame.timestamp}s:`, error);
        }
    }

    // Calculate overall compliance rate
    const complianceRate = totalWorkersDetected > 0
        ? Math.round((totalCompliant / totalWorkersDetected) * 100)
        : 100;

    // Generate recommendations
    const recommendations = generateRecommendations(complianceRate, violations.length, ppeType);

    return {
        ppeItem: ppeType,
        totalFramesAnalyzed: videoFrames.length,
        totalWorkersDetected,
        workersCompliant: totalCompliant,
        workersNonCompliant: totalNonCompliant,
        complianceRate,
        violations,
        recommendations,
        analysisTimestamp: new Date().toISOString()
    };
};

const generateRecommendations = (
    complianceRate: number,
    violationCount: number,
    ppeType: PPEType
): string[] => {
    const recommendations: string[] = [];

    const ppeNames: Record<PPEType, string> = {
        safety_glasses: 'safety glasses',
        helmet: 'safety helmets',
        gloves: 'safety gloves',
        mask: 'face masks'
    };

    const ppeName = ppeNames[ppeType];

    if (complianceRate < 50) {
        recommendations.push(`🚨 CRITICAL: Only ${complianceRate}% compliance. Immediate intervention required.`);
        recommendations.push(`Conduct mandatory ${ppeName} training for all workers.`);
        recommendations.push(`Install warning signage at all workstation entrances.`);
        recommendations.push(`Implement disciplinary policy for repeated violations.`);
    } else if (complianceRate < 80) {
        recommendations.push(`⚠️ WARNING: ${complianceRate}% compliance is below target (80%).`);
        recommendations.push(`Reinforce ${ppeName} usage policy with team leads.`);
        recommendations.push(`Schedule follow-up audit within 1 week.`);
    } else if (complianceRate < 95) {
        recommendations.push(`✅ GOOD: ${complianceRate}% compliance. Minor improvements needed.`);
        recommendations.push(`Provide refresher training for workers with violations.`);
    } else {
        recommendations.push(`🌟 EXCELLENT: ${complianceRate}% compliance. Maintain current standards.`);
        recommendations.push(`Recognize compliant workers to reinforce positive behavior.`);
    }

    if (violationCount > 0) {
        recommendations.push(`Review ${violationCount} violation screenshot(s) and identify specific workers for coaching.`);
    }

    return recommendations;
};

// Helper function to extract frames from video (to be called from frontend)
export const extractFramesFromVideo = (
    videoFile: File,
    intervalSeconds: number = 2
): Promise<{ base64: string; timestamp: number }[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }

        const frames: { base64: string; timestamp: number }[] = [];
        const objectUrl = URL.createObjectURL(videoFile);
        video.src = objectUrl;
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            let duration = video.duration;

            // CRITICAL FIX: Handle Infinity or NaN duration
            if (!Number.isFinite(duration) || duration <= 0) {
                console.warn("[Safety Analysis] Video duration not available or infinite. Defaulting to 10s scan.");
                duration = 10;
            }

            // Cap max duration for safety analysis to avoid OOM
            if (duration > 60) {
                console.warn("[Safety Analysis] Cap duration to 60s for safety check.");
                duration = 60;
            }

            const timestamps: number[] = [];
            for (let t = 0; t < duration; t += intervalSeconds) {
                timestamps.push(t);
            }

            // Double check we have timestamps
            if (timestamps.length === 0) timestamps.push(0);

            let currentIndex = 0;

            const processNextFrame = () => {
                // Safety escape
                if (currentIndex >= timestamps.length) {
                    cleanup();
                    resolve(frames);
                    return;
                }

                video.currentTime = timestamps[currentIndex];
            };

            const onSeeked = () => {
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    try {
                        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                        frames.push({
                            base64,
                            timestamp: timestamps[currentIndex]
                        });
                    } catch (e) {
                        console.error("Frame capture error:", e);
                    }
                }

                currentIndex++;
                processNextFrame();
            };

            const cleanup = () => {
                video.removeEventListener('seeked', onSeeked);
                URL.revokeObjectURL(objectUrl);
            };

            video.addEventListener('seeked', onSeeked);

            // Start processing
            processNextFrame();
        };

        video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Video loading failed'));
        };
    });
};
