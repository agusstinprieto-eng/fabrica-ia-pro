
import React, { useState, useRef, useEffect } from 'react';
import LiveVoiceCall from './LiveVoiceCall';
import { chatWithReport } from '../services/geminiService';
import { exportChatToPDF } from '../services/pdfService';

interface ReportChatProps {
    analysisContext: string;
    language: 'es' | 'en';
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

const ReportChat: React.FC<ReportChatProps> = ({ analysisContext, language }) => {
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
            // Prepare history for API (excluding the just added user message for now, or handling in service)
            // The service maps standard history format.
            const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await chatWithReport(analysisContext, userMsg, historyForApi, language);

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
            utterance.lang = language === 'es' ? 'es-MX' : 'en-US';
            utterance.rate = 1.0; /* Normal speed */

            // Smart Voice Selection
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v =>
                v.lang.includes(language === 'es' ? 'es' : 'en') &&
                (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
            );

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    }, [messages, isLoading, voiceMode, language]);

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

    return (

        <div className="bg-cyber-dark rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-cyber-blue/20 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-cyber-blue/20 bg-cyber-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyber-blue/20 border border-cyber-blue flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] relative">
                    <i className="fas fa-robot text-cyber-blue text-lg relative z-10"></i>
                    <div className="absolute inset-0 bg-cyber-blue/20 rounded-full animate-ping opacity-20"></div>
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                        {language === 'es' ? 'SISTEMA IA' : 'AI SYSTEM'}
                    </h3>
                    <p className="text-[10px] text-cyber-blue/60 font-medium">
                        {language === 'es' ? 'Pregunta sobre el reporte...' : 'Ask about the report...'}
                    </p>
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
                            <button
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                className={`absolute bottom-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/bubble:opacity-100 transition-all hover:scale-110 active:scale-95 ${msg.role === 'user' ? 'text-black/40 hover:text-black bg-white/10' : 'text-cyber-text/40 hover:text-cyber-blue bg-cyber-black/50'} border border-transparent hover:border-current`}
                                title="Copy Message"
                            >
                                <i className="fas fa-copy text-xs"></i>
                            </button>
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
                        <div className="flex gap-2">
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
                <div className="flex justify-end mt-2">
                    <button
                        onClick={() => messages.length > 0 && exportChatToPDF(messages)}
                        disabled={messages.length === 0}
                        className="text-xs text-cyber-blue hover:text-white transition-colors flex items-center gap-2 opacity-60 hover:opacity-100 disabled:opacity-0"
                    >
                        <i className="fas fa-file-pdf"></i>
                        {language === 'es' ? 'Descargar Conversación (PDF)' : 'Download Chat History (PDF)'}
                    </button>
                </div>
            </div>
            {/* Live Call Modal */}
            <LiveVoiceCall
                isOpen={isLiveCallOpen}
                onClose={() => setIsLiveCallOpen(false)}
                language={language}
                systemInstruction={language === 'es'
                    ? `Eres un Experto Ingeniero Industrial AI. Tu objetivo es discutir el análisis de video proporcionado. Contexto del Análisis: ${analysisContext}. Responde SIEMPRE en Español. Sé conciso, profesional y útil.`
                    : `You are an Expert Industrial Engineering AI. Your goal is to discuss the provided video analysis. Analysis Context: ${analysisContext}. Always respond in English. Be concise, professional, and helpful.`
                }
            />
        </div>
    );
};

export default ReportChat;
