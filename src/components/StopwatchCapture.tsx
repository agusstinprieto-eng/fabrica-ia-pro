import React, { useState, useRef, useEffect } from 'react';

interface StopwatchCaptureProps {
    videoUrl: string;
    onAnalysisComplete: (segments: { start: number; end: number; duration: number }[]) => void;
    onCancel: () => void;
}

export const StopwatchCapture: React.FC<StopwatchCaptureProps> = ({ videoUrl, onAnalysisComplete, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [timestamps, setTimestamps] = useState<number[]>([]);
    const [segments, setSegments] = useState<{ start: number; end: number; duration: number }[]>([]);

    // Update segments whenever timestamps change
    useEffect(() => {
        if (timestamps.length < 2) {
            setSegments([]);
            return;
        }
        const newSegments = [];
        for (let i = 0; i < timestamps.length - 1; i++) {
            const start = timestamps[i];
            const end = timestamps[i + 1];
            newSegments.push({
                start: parseFloat(start.toFixed(3)),
                end: parseFloat(end.toFixed(3)),
                duration: parseFloat((end - start).toFixed(3))
            });
        }
        setSegments(newSegments);
    }, [timestamps]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setTimestamps(prev => [...prev, time].sort((a, b) => a - b));
        }
    };

    // Keyboard shortcut (Space = Capture, if playing)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                if (isPlaying) handleCapture();
                else handlePlayPause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying]);

    const handleReset = () => {
        setTimestamps([]);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const handleFinish = () => {
        if (timestamps.length < 2) {
            alert("Please capture at least 2 timestamps (Start and End of an element).");
            return;
        }
        // Automatically add 0 if not present? Maybe not. User might want to skip intro.
        // If only 1 timestamp, assume 0 to T? No, explicit is better.

        onAnalysisComplete(segments);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">

                {/* Left: Video Player */}
                <div className="flex-1 relative bg-black flex flex-col justify-center">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full max-h-[60vh] object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                    />

                    {/* Controls Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                        <button
                            onClick={handlePlayPause}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors"
                        >
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                        <div className="font-mono text-xl font-bold text-white w-24 text-center">
                            {currentTime.toFixed(2)}s
                        </div>
                        <button
                            onClick={handleCapture}
                            className="px-6 py-2 rounded-full bg-cyber-blue text-black font-bold hover:bg-cyan-400 transition-colors active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                        >
                            TAP / SPACE
                        </button>
                    </div>
                </div>

                {/* Right: Segments List */}
                <div className="w-full md:w-96 bg-zinc-900 border-l border-zinc-700 flex flex-col">
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1">Stopwatch Mode</h3>
                        <p className="text-xs text-zinc-400">Tap per element. AI will label them.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {segments.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50">
                                <i className="fas fa-stopwatch text-4xl"></i>
                                <p className="text-center text-sm px-8">Play video and tap SPACE to mark start/end points of each element.</p>
                            </div>
                        )}

                        {segments.map((seg, idx) => (
                            <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 flex items-center justify-between group hover:bg-zinc-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-cyber-blue/20 text-cyber-blue text-xs font-bold flex items-center justify-center border border-cyber-blue/30">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <div className="text-white font-mono font-bold text-lg leading-none">{seg.duration.toFixed(2)}s</div>
                                        <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                            {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
                                        </div>
                                    </div>
                                </div>
                                {/* Maybe add a delete button later, complex logic to merge segments */}
                            </div>
                        ))}
                    </div>

                    {/* Timestamps RAW (Bottom) */}
                    <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 overflow-x-auto whitespace-nowrap">
                        TS: [{timestamps.map(t => t.toFixed(2)).join(', ')}]
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-zinc-800 flex flex-col gap-3">
                        <button
                            onClick={handleFinish}
                            disabled={segments.length === 0}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-blue to-blue-600 text-white font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            Analyze {segments.length} Segments
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 text-xs font-bold uppercase transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 text-xs font-bold uppercase transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
