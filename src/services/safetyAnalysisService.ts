import { GoogleGenerativeAI } from '@google/generative-ai';
import { ComplianceReport, FrameAnalysisResult, SafetyViolation, PPEType } from '../types/safety';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

const PPE_PROMPTS: Record<PPEType, string> = {
    safety_glasses: `You are a workplace safety inspector analyzing this image for PPE compliance.

TASK: Detect if ALL visible workers are wearing safety glasses/goggles.

INSTRUCTIONS:
1. Count the total number of workers visible in the image
2. For each worker, determine if they are wearing safety glasses
3. Safety glasses include: clear safety goggles, tinted safety glasses, face shields with eye protection
4. DO NOT count as compliant: regular prescription glasses, sunglasses without side shields, no eyewear

CRITICAL RULES:
- Only analyze workers whose faces are clearly visible
- If a worker's face is obscured or turned away, do not count them
- Be conservative: if uncertain, mark as non-compliant
- Provide confidence score (0.0-1.0) for each detection

Return ONLY valid JSON in this exact format:
{
  "totalWorkers": number,
  "workersWithGlasses": number,
  "workersWithoutGlasses": number,
  "violations": [
    {
      "workerPosition": "left side" | "center" | "right side" | "background",
      "confidence": 0.95,
      "description": "Worker not wearing safety glasses"
    }
  ],
  "complianceRate": percentage (0-100)
}`,

    helmet: `Analyze if workers are wearing safety helmets/hard hats. Return JSON with same structure.`,
    gloves: `Analyze if workers are wearing safety gloves. Return JSON with same structure.`,
    mask: `Analyze if workers are wearing face masks/respirators. Return JSON with same structure.`
};

export const analyzeSafetyCompliance = async (
    videoFrames: { base64: string; timestamp: number }[],
    ppeType: PPEType = 'safety_glasses'
): Promise<ComplianceReport> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = PPE_PROMPTS[ppeType];

    const violations: SafetyViolation[] = [];
    let totalWorkersDetected = 0;
    let totalCompliant = 0;
    let totalNonCompliant = 0;

    console.log(`[Safety Analysis] Analyzing ${videoFrames.length} frames for ${ppeType}`);

    for (const frame of videoFrames) {
        try {
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: frame.base64
                    }
                },
                { text: prompt }
            ]);

            const responseText = result.response.text();

            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

            const parsed: FrameAnalysisResult = JSON.parse(jsonText);

            // Aggregate statistics
            totalWorkersDetected += parsed.totalWorkers;
            totalCompliant += parsed.workersWithGlasses;
            totalNonCompliant += parsed.workersWithoutGlasses;

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
            // Continue with next frame instead of failing entire analysis
        }
    }

    // Calculate overall compliance rate
    const complianceRate = totalWorkersDetected > 0
        ? Math.round((totalCompliant / totalWorkersDetected) * 100)
        : 100; // If no workers detected, assume 100% compliance

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

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const duration = video.duration;
            const timestamps: number[] = [];

            // Generate timestamps (every N seconds)
            for (let t = 0; t < duration; t += intervalSeconds) {
                timestamps.push(t);
            }

            let currentIndex = 0;

            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

                frames.push({
                    base64,
                    timestamp: timestamps[currentIndex]
                });

                currentIndex++;

                if (currentIndex < timestamps.length) {
                    video.currentTime = timestamps[currentIndex];
                } else {
                    URL.revokeObjectURL(objectUrl);
                    resolve(frames);
                }
            };

            video.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Video loading failed'));
            };

            // Start extraction
            video.currentTime = timestamps[0];
        };
    });
};
