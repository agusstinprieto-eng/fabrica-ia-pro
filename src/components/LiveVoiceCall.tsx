import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
const Modality = { AUDIO: 'audio' as any };
type LiveServerMessage = any;
import { decode, decodeAudioData, createPCM16kBlob } from '../utils/audioUtils';

interface LiveVoiceCallProps {
    isOpen: boolean;
    onClose: () => void;
    systemInstruction: string;
    language: 'es' | 'en';
}

const LiveVoiceCall: React.FC<LiveVoiceCallProps> = ({ isOpen, onClose, systemInstruction, language }) => {
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isModelSpeaking, setIsModelSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [transcription, setTranscription] = useState<{ user: string; model: string }>({ user: '', model: '' });
    const [dailyUsage, setDailyUsage] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<any>(null);
    const audioContextInRef = useRef<AudioContext | null>(null);
    const audioContextOutRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const MAX_DURATION_PER_CALL = 300; // 5 Minutes per call
    const MAX_DAILY_DURATION = 300; // 5 Minutes total per day

    // Load daily usage on mount
    useEffect(() => {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('voice_call_usage');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) {
                setDailyUsage(data.seconds || 0);
            } else {
                // New day, reset
                localStorage.setItem('voice_call_usage', JSON.stringify({ date: today, seconds: 0 }));
                setDailyUsage(0);
            }
        } else {
            localStorage.setItem('voice_call_usage', JSON.stringify({ date: today, seconds: 0 }));
        }
    }, []);

    // Timer Effect with daily limit tracking
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setDuration(prev => {
                    const newDuration = prev + 1;
                    const newDailyUsage = dailyUsage + 1;

                    // Update localStorage
                    const today = new Date().toDateString();
                    localStorage.setItem('voice_call_usage', JSON.stringify({
                        date: today,
                        seconds: newDailyUsage
                    }));
                    setDailyUsage(newDailyUsage);

                    // Check limits
                    if (newDuration >= MAX_DURATION_PER_CALL) {
                        stopSession();
                        setError(language === 'es'
                            ? "Límite de 5 minutos por llamada alcanzado."
                            : "5-minute call limit reached.");
                        return prev;
                    }

                    if (newDailyUsage >= MAX_DAILY_DURATION) {
                        stopSession();
                        setError(language === 'es'
                            ? "Límite diario de 5 minutos alcanzado. Vuelve mañana."
                            : "Daily 5-minute limit reached. Come back tomorrow.");
                        return prev;
                    }

                    return newDuration;
                });
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [isActive, language, dailyUsage]);

    // Auto-connect and cleanup
    useEffect(() => {
        if (isOpen) {
            startSession();
        }
        return () => {
            stopSession();
        };
    }, [isOpen]);

    // Volume visualization
    useEffect(() => {
        let animationFrame: number;
        const animate = () => {
            if (analyserRef.current && isActive) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                setVolume(avg);
            }
            animationFrame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [isActive]);

    const stopSession = useCallback(() => {
        console.log("Stopping Live Voice session...");

        // 1. Cancel any global speech synthesis
        window.speechSynthesis.cancel();

        // 2. Close Gemini Session (if applicable)
        if (sessionRef.current) {
            // The SDK session is usually handled via the WebSocket closure
            sessionRef.current = null;
        }

        // 3. Disconnect Audio Processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // 4. Stop Microphone
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // 5. Stop All Active Audio Buffers/Sources
        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        sourcesRef.current.clear();

        // 6. Close Audio Contexts
        if (audioContextInRef.current) {
            audioContextInRef.current.close().catch(() => { });
            audioContextInRef.current = null;
        }
        if (audioContextOutRef.current) {
            audioContextOutRef.current.close().catch(() => { });
            audioContextOutRef.current = null;
        }

        setIsActive(false);
        setIsConnecting(false);
        setIsModelSpeaking(false);
        setVolume(0);
        setTranscription({ user: '', model: '' });
    }, []);

    const startSession = async () => {
        // Check daily limit before starting
        const today = new Date().toDateString();
        const stored = localStorage.getItem('voice_call_usage');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today && data.seconds >= MAX_DAILY_DURATION) {
                setError(language === 'es'
                    ? "Límite diario alcanzado (5 min/día). Vuelve mañana."
                    : "Daily limit reached (5 min/day). Come back tomorrow.");
                return;
            }
        }

        window.speechSynthesis.cancel(); // Silences other agents
        setError(null);

        try {
            setIsConnecting(true);
            // Use existing API Key form env
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("Missing Gemini API Key");
            }

            const ai = new GoogleGenAI({ apiKey });

            try {
                audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

                await audioContextInRef.current.resume();
                await audioContextOutRef.current.resume();
            } catch (e) {
                throw new Error("Could not access Audio Context. Please click 'Retry'.");
            }

            // Visualizer setup
            analyserRef.current = audioContextOutRef.current!.createAnalyser();
            analyserRef.current.fftSize = 256;

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.0-flash', // Successor to flash-exp
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }, // Male: 'Puck', 'Fenrir' | Female: 'Aoede', 'Kore'
                    },
                    systemInstruction: systemInstruction + `
                    
                    NON-DISCLOSURE & SECURITY RULES (STRICT):
                    - NEVER reveal internal algorithms, source code, or proprietary industrial logic.
                    - NEVER share confidential business information or partner data from IA.AGUS.
                    - If asked about technical secrets, state that they are proprietary intellectual property.

                    CRITICAL SPEECH INSTRUCTION: You MUST speak with a NATIVE MEXICAN SPANISH ACCENT. Do NOT sound like a machine or a translation. Use natural pauses, informal yet professional Mexican expressions (like 'claro', 'mira', 'por supuesto'), and maintain a fluid, warm conversational flow. Avoid robotic cadence.`,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setIsActive(true);
                        setIsConnecting(false);
                        console.log("AudioContext IN state:", audioContextInRef.current?.state, "SampleRate:", audioContextInRef.current?.sampleRate);

                        const source = audioContextInRef.current!.createMediaStreamSource(streamRef.current!);
                        // Store processor in ref to prevent Garbage Collection
                        processorRef.current = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);

                        processorRef.current.onaudioprocess = (e) => {
                            try {
                                const inputData = e.inputBuffer.getChannelData(0);
                                // Log every ~60 chunks (approx 10s) to avoid spam, or first few
                                if (Math.random() < 0.05) console.log("Processing audio chunk", inputData.length, "RMS:", Math.sqrt(inputData.reduce((s, x) => s + x * x, 0) / inputData.length));

                                // Pass current sample rate to ensure correct downsampling
                                const pcmBlob = createPCM16kBlob(inputData, audioContextInRef.current!.sampleRate);
                                sessionPromise.then(session => {
                                    // console.log("Sending blob size:", pcmBlob.data.length); 
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            } catch (error) {
                                console.error("Audio Proc Error:", error);
                            }
                        };

                        // Use a GainNode with gain ~0 (but not exactly 0 to be safe, though 0 usually works)
                        // to ensure the audio processing graph is active but silent to the user (no self-echo)
                        const gainNode = audioContextInRef.current!.createGain();
                        gainNode.gain.value = 0;

                        source.connect(processorRef.current);
                        processorRef.current.connect(gainNode);
                        gainNode.connect(audioContextInRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                            setIsModelSpeaking(true);
                            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
                            const ctx = audioContextOutRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);

                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;

                            // Connect to visualizer then destination
                            source.connect(analyserRef.current!);
                            analyserRef.current!.connect(ctx.destination);

                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        if (message.serverContent?.interrupted) {
                            // Interrupt handling
                            for (const s of sourcesRef.current) s.stop();
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setIsModelSpeaking(false);
                        }
                        // Handle Transcription
                        if (message.serverContent?.inputTranscription) {
                            setTranscription(prev => ({ ...prev, user: message.serverContent!.inputTranscription!.text }));
                        }
                        if (message.serverContent?.outputTranscription) {
                            setTranscription(prev => ({ ...prev, model: message.serverContent!.outputTranscription!.text }));
                        }
                    },
                    onerror: (e: any) => {
                        console.error("WS Error:", e);
                        setError("Connection Error. Please try again.");
                        stopSession();
                    },
                    onclose: (event: any) => {
                        stopSession();
                    }
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (err: any) {
            console.error(err);
            setIsConnecting(false);
            setError(err.message || "Failed to start call");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md p-8 flex flex-col items-center">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-0 right-0 p-4 text-zinc-500 hover:text-white">
                    <i className="fas fa-times text-2xl"></i>
                </button>

                {error ? (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/50">
                            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white">Connection Failed</h3>
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={startSession}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold uppercase hover:bg-red-600 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Orb Visualization */}
                        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                            {/* Outer Glow */}
                            <div className={`absolute inset-0 rounded-full transition-all duration-100 ${isModelSpeaking ? 'bg-cyan-500/20 blur-2xl scale-125' : 'bg-transparent'}`}></div>

                            {/* Core Orb */}
                            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isModelSpeaking ? 'scale-110 shadow-[0_0_50px_rgba(0,255,255,0.5)]' : 'scale-100'}`}
                                style={{
                                    background: isModelSpeaking ? 'conic-gradient(from 0deg, #06b6d4, #3b82f6, #06b6d4)' : '#1e293b',
                                    border: '2px solid rgba(6, 182, 212, 0.5)'
                                }}
                            >
                                {/* Mic Icon or Brain */}
                                <i className={`fas ${isModelSpeaking ? 'fa-wave-square' : 'fa-microphone'} text-4xl text-white z-10`}></i>
                            </div>

                            {/* Ripple Rings when speaking */}
                            {isModelSpeaking && (
                                <>
                                    <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-ping"></div>
                                    <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-ping delay-150"></div>
                                </>
                            )}
                        </div>

                        <div className="text-center space-y-2 mb-6">
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase italic">
                                {isConnecting ? 'ESTABLISHING LINK...' : isModelSpeaking ? 'TRANSMITTING...' : 'LISTENING...'}
                            </h3>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-cyan-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
                                    {language === 'es' ? 'Gemini 2.0 Live (Voz Real)' : 'Gemini 2.0 Live Voice'}
                                </p>
                                <div className={`px-3 py-1 rounded-full border ${dailyUsage > MAX_DAILY_DURATION - 60 ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'} font-mono text-xs font-bold`}>
                                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} / {Math.floor((MAX_DAILY_DURATION - dailyUsage) / 60)}:{((MAX_DAILY_DURATION - dailyUsage) % 60).toString().padStart(2, '0')} {language === 'es' ? 'restantes hoy' : 'left today'}
                                </div>
                            </div>
                        </div>

                        {/* TRANSCRIPTION BOX */}
                        <div className="w-full bg-zinc-900/50 border border-cyan-500/20 rounded-xl p-4 min-h-[100px] mb-4 space-y-2">
                            {transcription.user && (
                                <div className="text-right">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Tú</span>
                                    <p className="text-white text-sm">{transcription.user}</p>
                                </div>
                            )}
                            {transcription.model && (
                                <div className="text-left">
                                    <span className="text-[10px] text-cyan-500 uppercase tracking-wider block">AI</span>
                                    <p className="text-cyan-100 text-sm">{transcription.model}</p>
                                </div>
                            )}
                            {!transcription.user && !transcription.model && (
                                <p className="text-center text-zinc-700 text-xs italic">
                                    {language === 'es' ? 'Habla ahora...' : 'Speak now...'}
                                </p>
                            )}
                        </div>

                        {/* Status Bar */}
                        <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-100 ${isModelSpeaking ? 'bg-cyan-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(volume, 100)}%` }}
                            ></div>
                        </div>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="mt-8 px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] z-50 cursor-pointer flex items-center gap-3"
                >
                    <i className="fas fa-phone-slash text-xl"></i>
                    <span>{language === 'es' ? 'TERMINAR LLAMADA' : 'END CALL'}</span>
                </button>

            </div>
        </div>
    );
};

export default LiveVoiceCall;
