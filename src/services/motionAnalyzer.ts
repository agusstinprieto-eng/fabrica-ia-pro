/**
 * Motion Analysis Service
 * 
 * Uses the Canvas API to analyze video frames and detect motion intensity
 * based on pixel differences between consecutive frames.
 * 
 * This provides a "Scientific" ground truth to validate AI timestamp hallucinations.
 */

export interface MotionDatapoint {
    time: number;      // Seconds
    intensity: number; // 0-100% (Relative pixel change)
}

/**
 * Analyzes a video file to generate a motion intensity graph.
 * @param videoFile The video file to analyze
 * @param sampleRate Frames per second to sample (default 10)
 * @param onProgress Optional callback for progress (0-100)
 */
export async function analyzeMotion(
    videoFile: File,
    sampleRate: number = 5,
    onProgress?: (percent: number) => void
): Promise<MotionDatapoint[]> {
    return new Promise((resolve, reject) => {
        // 1. Setup hidden video and canvas
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }

        const url = URL.createObjectURL(videoFile);
        video.src = url;
        video.muted = true;
        video.playsInline = true;

        // Optimization: Process at low resolution for speed
        // 320px width is enough for motion detection
        const PROCESS_WIDTH = 320;
        let PROCESS_HEIGHT = 240;

        let previousFrameData: Uint8ClampedArray | null = null;
        const datapoints: MotionDatapoint[] = [];

        video.addEventListener('loadedmetadata', async () => {
            const duration = video.duration;
            const width = video.videoWidth;
            const height = video.videoHeight;
            const aspectRatio = width / height;

            PROCESS_HEIGHT = Math.round(PROCESS_WIDTH / aspectRatio);
            canvas.width = PROCESS_WIDTH;
            canvas.height = PROCESS_HEIGHT;

            const interval = 1 / sampleRate;
            let currentTime = 0;

            // Helper to seek and capture
            const processFrame = async () => {
                if (currentTime > duration) {
                    // Done
                    URL.revokeObjectURL(url);
                    resolve(datapoints);
                    return;
                }

                // Update progress
                if (onProgress) {
                    onProgress(Math.round((currentTime / duration) * 100));
                }

                // Seek
                video.currentTime = currentTime;
            };

            video.addEventListener('seeked', () => {
                // Draw frame
                ctx.drawImage(video, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);

                // Get pixel data
                const frameData = ctx.getImageData(0, 0, PROCESS_WIDTH, PROCESS_HEIGHT).data;

                if (previousFrameData) {
                    // Compare
                    let diffSum = 0;
                    // Loop through pixels (R, G, B, A) - skip every 4th byte (Alpha)
                    // Optimization: Check every Nth pixel to speed up big loops
                    const step = 4 * 4; // Check every 4th pixel
                    let pixelsChecked = 0;

                    for (let i = 0; i < frameData.length; i += step) {
                        const r1 = previousFrameData[i];
                        const g1 = previousFrameData[i + 1];
                        const b1 = previousFrameData[i + 2];

                        const r2 = frameData[i];
                        const g2 = frameData[i + 1];
                        const b2 = frameData[i + 2];

                        // Simple Euclidean distance or Manhattan
                        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
                        diffSum += diff;
                        pixelsChecked++;
                    }

                    // Normalize intensity (Average diff per pixel / Max diff possible (255*3))
                    const avgDiff = diffSum / pixelsChecked;
                    const maxDiff = 255 * 3;
                    let intensity = (avgDiff / maxDiff) * 100 * 5; // x5 gain to make motion visible

                    if (intensity > 100) intensity = 100;

                    datapoints.push({
                        time: currentTime,
                        intensity: parseFloat(intensity.toFixed(2))
                    });
                } else {
                    // First frame, no movement
                    datapoints.push({ time: currentTime, intensity: 0 });
                }

                previousFrameData = frameData; // Store for next comparison
                currentTime += interval;
                processFrame(); // Next
            });

            // Start processing
            processFrame();
        });

        video.addEventListener('error', (e) => {
            reject(new Error("Video load error"));
        });
    });
}

/**
 * Aligns AI-generated cycle timestamps with Motion Analysis data.
 * "Snaps" start/end times to the nearest High-Motion Block boundaries.
 */
export function alignTimestamps(
    cycleElements: any[], // CycleElement[]
    motionPoints: MotionDatapoint[],
    toleranceSeconds: number = 3.0
): { alignedElements: any[], corrections: string[] } {
    if (!motionPoints || motionPoints.length === 0) return { alignedElements: cycleElements, corrections: [] };

    // 1. Identify Motion Blocks (Sustained activity > threshold)
    const threshold = 15; // 15% intensity is a good baseline for "Active"
    let isBlockActive = false;
    let blockStart = 0;
    const motionBlocks: { start: number, end: number }[] = [];

    motionPoints.forEach((p, i) => {
        if (p.intensity > threshold && !isBlockActive) {
            isBlockActive = true;
            blockStart = p.time;
        } else if (p.intensity <= threshold && isBlockActive) {
            isBlockActive = false;
            // Filter short noise (< 0.5s)
            if (p.time - blockStart > 0.5) {
                motionBlocks.push({ start: blockStart, end: p.time });
            }
        }
    });
    // Close last block
    if (isBlockActive) {
        motionBlocks.push({ start: blockStart, end: motionPoints[motionPoints.length - 1].time });
    }

    const corrections: string[] = [];
    const alignedElements = JSON.parse(JSON.stringify(cycleElements)); // Deep copy

    // 2. Snap logic
    // We assume the elements are sequential. We really care about the Total Cycle Time
    // or specific machine steps.
    // For now, let's try to match the "Machine Cycle" or "Sewing" element specifically?
    // Or just correct ALL timestamps?
    // Simple approach: Total Cycle Time Correction.
    // If the element name contains "Sew" or "Machine" or "Costura", snap it to the biggest motion block.

    let totalCorrection = 0;

    alignedElements.forEach((el: any) => {
        // Only correct obvious machine operations
        const isMachineOp = /sew|costur|machine|maquina|operacion|cycle/i.test(el.element);

        if (isMachineOp && motionBlocks.length > 0) {
            // Find overlapping block
            // AI Time: el.time_seconds (Duration). We don't have absolute start/end in CycleElement usually, just duration?
            // Wait, CycleElement typically has just 'time_seconds'.
            // If we don't have absolute timestamps (start/end) for each element, we cannot snap effectively!
            // 'consensusService' usually outputs just a list of elements with durations.
            // Motion Analysis gives us Absolute Time (Timeline).

            // CRITICAL: We need to know WHEN the element happened to snap it to motion.
            // If we only have durations, we can only guess.
            // BUT, usually the "Machine Cycle" is the DOMINANT action.
            // Strategy: Find the longest Motion Block and assume that is the Machine Cycle.

            // Find longest motion block
            const longestBlock = motionBlocks.reduce((prev, current) =>
                (current.end - current.start) > (prev.end - prev.start) ? current : prev
            );

            const motionDuration = longestBlock.end - longestBlock.start;
            const aiDuration = el.time_seconds;

            // If AI is way off (> 2s difference), snap to motion duration
            if (Math.abs(aiDuration - motionDuration) > 2) {
                corrections.push(`Snapped '${el.element}' from ${aiDuration.toFixed(2)}s to ${motionDuration.toFixed(2)}s (Motion Block)`);
                el.time_seconds = parseFloat(motionDuration.toFixed(2));
            }
        }
    });

    return { alignedElements, corrections };
}
