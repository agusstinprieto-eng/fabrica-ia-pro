
import React, { useState, useRef, useEffect } from 'react';
import LiveVoiceCall from './LiveVoiceCall';
import { chatWithReport, IndustrialMode } from '../services/geminiService';
import { exportChatToPDF } from '../services/pdfService';

interface ReportChatProps {
    analysisContext: string;
    language: 'es' | 'en';
    mode: IndustrialMode;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

// Global helper to avoid re-creation
const formatMessage = (text: string) => {
    if (!text) return null;

    // Helper to process inline formatting (bold)
    const processInline = (lineText: string) => {
        // Regex to match **text** or __text__
        const parts = lineText.split(/(\*\*.*?\*\*|__.*?__)/g);
        return parts.map((part, i) => {
            if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
                return <strong key={i} className="text-cyber-blue font-black">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Split by newlines to handle block elements (lists)
    return text.split('\n').map((line, idx) => {
        // Handle List Items
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const listContent = line.trim().substring(2);
            return (
                <div key={idx} className="flex gap-2 ml-2 mb-1">
                    <span className="text-cyber-blue">•</span>
                    <span>{processInline(listContent)}</span>
                </div>
            );
        }

        // Handle Headers (Basic support)
        if (line.trim().startsWith('### ')) {
            return <h3 key={idx} className="text-cyber-blue font-bold text-lg mt-2 mb-1">{processInline(line.trim().substring(4))}</h3>;
        }

        // Standard Paragraph / Line
        // Empty lines become spacers
        if (!line.trim()) return <div key={idx} className="h-2"></div>;

        return <div key={idx} className="mb-0.5">{processInline(line)}</div>;
    });
};

const ReportChat: React.FC<ReportChatProps> = ({ analysisContext, language, mode }) => {
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('engineer_chat_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('engineer_chat_history', JSON.stringify(messages));
    }, [messages]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Grounding / Search Limit State
    const [isGroundingEnabled, setIsGroundingEnabled] = useState(false);
    const [searchCount, setSearchCount] = useState(0);
    const [lastSearchDate, setLastSearchDate] = useState<string>(new Date().toDateString());

    useEffect(() => {
        const savedCount = localStorage.getItem('industrial_search_count');
        const savedDate = localStorage.getItem('industrial_search_date');
        const today = new Date().toDateString();

        if (savedDate !== today) {
            setSearchCount(0);
            setLastSearchDate(today);
            localStorage.setItem('industrial_search_count', '0');
            localStorage.setItem('industrial_search_date', today);
        } else if (savedCount) {
            setSearchCount(parseInt(savedCount));
            setLastSearchDate(savedDate);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('industrial_search_count', searchCount.toString());
        localStorage.setItem('industrial_search_date', lastSearchDate);
    }, [searchCount, lastSearchDate]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Prepare history for API
            const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));

            const shouldSearch = isGroundingEnabled && searchCount < 30;
            const response = await chatWithReport(analysisContext, userMsg, historyForApi, language, mode, shouldSearch);

            if (shouldSearch) {
                setSearchCount(prev => prev + 1);
            }

            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        } catch (e: any) {
            console.error("Chat API Error Details:", e);
            // Log specific error message if available
            if (e.message) console.error("Message:", e.message);
            if (e.cause) console.error("Cause:", e.cause);

            setMessages(prev => [...prev, { role: 'ai', content: language === 'es' ? 'Error de conexión. Intenta nuevamente.' : 'Connection error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };


    // Voice & TTS Logic
    const [isListening, setIsListening] = useState(false);
    const [isLiveCallOpen, setIsLiveCallOpen] = useState(false); // NEW Live Call State
    const [voiceStatus, setVoiceStatus] = useState<string>('');
    const recognitionRef = useRef<any>(null);
    const inputRef = useRef(''); // Use Ref to access latest input in callbacks
    const [voiceMode, setVoiceMode] = useState(false); // Track if we are in voice conversation

    // Sync input ref
    useEffect(() => { inputRef.current = input; }, [input]);

    // TTS Effect
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (voiceMode && lastMsg?.role === 'ai' && !isLoading) {
            const utterance = new SpeechSynthesisUtterance(lastMsg.content);

            // Auto-detect language or use default
            utterance.rate = 1.0; /* Normal speed */

            // Smart Voice Selection based on message content or browser language
            const voices = window.speechSynthesis.getVoices();

            // Try to find a voice that matches the user's current choice, but allow fallback
            const preferredVoice = voices.find(v =>
                v.lang.includes(language === 'es' ? 'es' : 'en') &&
                (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
            );

            if (preferredVoice) {
                utterance.voice = preferredVoice;
                utterance.lang = preferredVoice.lang;
            } else {
                utterance.lang = language === 'es' ? 'es-MX' : 'en-US';
            }

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    }, [messages, isLoading, voiceMode, language]);

    const handleReset = () => {
        if (window.confirm(language === 'es' ? '¿Borrar historial de chat?' : 'Clear chat history?')) {
            setMessages([]);
            localStorage.removeItem('engineer_chat_history');
        }
    };

    const handleDeleteMessage = (index: number) => {
        setMessages(prev => prev.filter((_, i) => i !== index));
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setVoiceStatus('');
        } else {
            // STOP AI SPEAKING IMMEDIATELY (Barge-in)
            window.speechSynthesis.cancel();

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Speech recognition not supported.");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language === 'es' ? 'es-MX' : 'en-US';

            recognition.onstart = () => {
                setVoiceStatus(language === 'es' ? 'Escuchando... (Auto-envío)' : 'Listening... (Auto-send)');
                setVoiceMode(true); // Enable voice mode (TTS)
            };

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');

                setInput(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech error", event.error);
                setIsListening(false);
                if (event.error === 'no-speech') {
                    setVoiceStatus(language === 'es' ? '❌ Silencio.' : '❌ Silence.');
                } else if (event.error === 'not-allowed') {
                    setVoiceStatus(language === 'es' ? '❌ Permiso denegado. Revisa tu micrófono.' : '❌ Permission denied. Check mic.');
                } else {
                    setVoiceStatus(language === 'es' ? `❌ Error: ${event.error}` : `❌ Error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setVoiceStatus('');
                // AUTO-SEND if we have input
                if (inputRef.current.trim().length > 0) {
                    handleSend();
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsListening(true);
        }
    };

    const [isMaximized, setIsMaximized] = useState(false);

    return (

        <div className={`bg-cyber-dark rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-cyber-blue/20 overflow-hidden flex flex-col transition-all duration-300 ${isMaximized ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[600px] h-[80vh] md:h-[700px] z-50 shadow-[0_0_100px_rgba(0,240,255,0.3)]' : 'h-[500px]'}`}>
            <div className="p-6 border-b border-cyber-blue/20 bg-cyber-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyber-blue/20 border border-cyber-blue flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] relative">
                        <i className="fas fa-robot text-cyber-blue text-lg relative z-10"></i>
                        <div className="absolute inset-0 bg-cyber-blue/20 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wide drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                            {language === 'es' ? 'INGENIERO' : 'ENGINEER'}
                        </h3>

                        <p className="text-[10px] text-cyber-blue/60 font-medium">
                            {language === 'es' ? 'Pregunta sobre el reporte...' : 'Ask about the report...'}
                        </p>
                    </div>
                </div>

                {/* Window Controls */}
                {/* Window Controls & Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => messages.length > 0 && exportChatToPDF(messages)}
                        disabled={messages.length === 0}
                        className="h-9 px-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue flex items-center gap-2 hover:bg-cyber-blue hover:text-black transition-all disabled:opacity-30 disabled:grayscale"
                        title={language === 'es' ? 'Exportar PDF' : 'Export PDF'}
                    >
                        <i className="fas fa-file-pdf"></i>
                        <span className="text-[10px] font-black uppercase">PDF</span>
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={messages.length === 0}
                        className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:grayscale"
                        title={language === 'es' ? 'Reiniciar Chat' : 'Reset Chat'}
                    >
                        <i className="fas fa-history text-xs"></i>
                    </button>

                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className={`w-9 h-9 rounded-lg border transition-all flex items-center justify-center group ${isMaximized ? 'bg-amber-500/20 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black' : 'bg-cyber-gray border-white/10 hover:bg-cyber-blue hover:text-black hover:border-cyber-blue'}`}
                        title={isMaximized ? (language === 'es' ? 'Reducir' : 'Minimize') : (language === 'es' ? 'Maximizar' : 'Maximize')}
                    >
                        <i className={`fas ${isMaximized ? 'fa-compress' : 'fa-expand'} text-xs group-hover:scale-110 transition-transform`}></i>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-cyber-dark/80 custom-scrollbar" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm text-cyber-text/50 font-medium italic font-mono">
                            {language === 'es' ? '¿Cómo puedo optimizar este proceso?' : 'How can I optimize this process?'}
                        </p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group max-w-full`}>


                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-lg whitespace-pre-wrap relative group/bubble ${msg.role === 'user'
                            ? 'bg-cyber-blue text-black rounded-br-none font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                            : 'bg-cyber-gray border border-cyber-blue/20 text-cyber-text rounded-bl-none'
                            }`}>
                            <div>{formatMessage(msg.content)}</div>

                            {/* Message Actions */}
                            <div className={`flex items-center gap-2 mt-3 pt-2 border-t transition-all ${msg.role === 'user' ? 'border-black/10' : 'border-white/5'}`}>
                                <button
                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                    className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5 ${msg.role === 'user' ? 'text-black/40 hover:text-black hover:bg-black/5' : 'text-cyber-text/40 hover:text-cyber-blue hover:bg-cyber-blue/10'}`}
                                    title="Copy Message"
                                >
                                    <i className="fas fa-copy text-[10px]"></i>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Copy</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteMessage(idx)}
                                    className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5 ${msg.role === 'user' ? 'text-black/40 hover:text-red-700 hover:bg-red-500/10' : 'text-cyber-text/40 hover:text-red-500 hover:bg-red-500/10'}`}
                                    title="Delete Message"
                                >
                                    <i className="fas fa-trash-alt text-[10px]"></i>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Delete</span>
                                </button>
                            </div>
                        </div>


                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-cyber-gray border border-cyber-blue/20 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2">
                            <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-cyber-black border-t border-cyber-blue/20">
                {/* Status Message */}
                {voiceStatus && (
                    <p className={`text-xs mb-2 font-mono ${voiceStatus.includes('❌') ? 'text-red-400' : 'text-cyber-blue animate-pulse'}`}>
                        {voiceStatus}
                    </p>
                )}
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening
                            ? (language === 'es' ? 'Escuchando... (Auto-envío)' : 'Listening... (Auto-send)')
                            : (language === 'es' ? 'Escribe tu consulta...' : 'Type your question...')}
                        className={`w-full h-12 bg-cyber-dark border border-cyber-gray rounded-xl px-4 text-sm text-white focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all placeholder-cyber-text/30 ${isListening ? 'border-cyber-blue/50 ring-1 ring-cyber-blue/50' : ''}`}
                    />

                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                            {/* Live Voice Button */}
                            <button
                                onClick={() => setIsLiveCallOpen(true)}
                                className="w-12 h-12 rounded-xl bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                                title={language === 'es' ? 'Llamada de Voz en Vivo' : 'Live Voice Call'}
                            >
                                <i className="fas fa-phone-volume text-lg animate-pulse"></i>
                            </button>

                            <button
                                onClick={toggleListening}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${isListening
                                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                    : 'bg-cyber-dark/80 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue hover:text-black shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                                    }`}
                                title={language === 'es' ? 'Activar micrófono (Dictado)' : 'Toggle microphone (Dictation)'}
                            >
                                <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
                            </button>

                            {/* Grounding Toggle */}
                            <button
                                onClick={() => searchCount < 30 && setIsGroundingEnabled(!isGroundingEnabled)}
                                disabled={searchCount >= 30}
                                className={`h-12 px-3 rounded-xl flex flex-col items-center justify-center transition-all border ${isGroundingEnabled
                                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                    : 'bg-cyber-dark/80 border-white/10 text-white/40 hover:border-amber-500/50 hover:text-amber-500'
                                    } disabled:opacity-20 disabled:grayscale`}
                                title={language === 'es' ? `Búsqueda en Internet (${30 - searchCount} restantes)` : `Web Search (${30 - searchCount} left)`}
                            >
                                <i className={`fas fa-globe text-sm ${isGroundingEnabled ? 'animate-spin-slow' : ''}`}></i>
                                <span className="text-[8px] font-black uppercase mt-0.5">{searchCount}/30</span>
                            </button>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="w-12 h-12 rounded-xl bg-cyber-blue text-black flex items-center justify-center hover:bg-white hover:text-cyber-blue hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] shrink-0 z-10"
                        >
                            <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane text-lg'}`}></i>
                        </button>
                    </div>
                </div>
            </div>
            {/* Live Call Modal */}
            <LiveVoiceCall
                isOpen={isLiveCallOpen}
                onClose={() => setIsLiveCallOpen(false)}
                language={language}
                systemInstruction={`
                    You are the **IA.AGUS Global Master Architect**, an expert Industrial Engineer specializing in **${mode.toUpperCase()}** manufacturing.
                    
                    **ANALYSIS CONTEXT**: ${analysisContext || 'General manufacturing consulting mode.'}
                    
                    **UNIVERSAL MULTILINGUAL PROTOCOL**:
                    - You are a POLYGLOT EXPERT fluent in ALL global languages (Chinese, Japanese, Arabic, German, etc.).
                    - **CRITICAL**: Detect the user's language automatically and respond in that EXACT language.
                    - **NEVER** refuse to speak in any language. If the user speaks Japanese, reply in Japanese. If they speak Chinese, reply in Chinese.
                    - Avoid any language bias. You are a global citizen.
                    
                    **MISSION**:
                    1. Focus on **EFFICIENCY, QUALITY, AND PRODUCTIVITY**.
                    2. If asked about deep "Predictive Maintenance" (vibrations, IoT sensors), clarify you are a VISUAL PROCESS expert and suggest the "Mantenimiento IA Pro" app.
                    3. Be flexible. If asked about other factories or industries, use your general industrial engineering expertise.
                    
                    **TECHNICAL SUPPORT**:
                    - If asked about video errors: Explain HEVC/H.265 issues and suggest switching to "Most Compatible" (H.264).
                    
                    Be concise, professional, and provide world-class advice.
                `}
            />
        </div>
    );
};

export default ReportChat;
