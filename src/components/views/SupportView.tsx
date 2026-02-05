import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { chatWithHelpDesk } from '../../services/geminiService';
import LiveVoiceCall from '../LiveVoiceCall';
import { useAuth } from '../../contexts/AuthContext';

interface SupportViewProps {
    language: 'es' | 'en';
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

const SupportView: React.FC<SupportViewProps> = ({ language }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('support_chat_history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        return [{
            role: 'ai',
            content: language === 'es'
                ? "Hola, soy el agente de soporte de IA.AGUS. Estoy disponible 24/7. ¿En qué puedo ayudarte hoy? (Dudas de la app, precios, soporte técnico...)"
                : "Hello, I am the IA.AGUS support agent. I am available 24/7. How can I help you today? (App questions, pricing, technical support...)"
        }];
    });

    // Persist messages
    useEffect(() => {
        localStorage.setItem('support_chat_history', JSON.stringify(messages));
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
            const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
            const shouldSearch = isGroundingEnabled && searchCount < 30;
            const response = await chatWithHelpDesk(userMsg, historyForApi, language, shouldSearch);

            if (shouldSearch) {
                setSearchCount(prev => prev + 1);
            }

            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'ai', content: language === 'es' ? 'Lo siento, tuve un error de conexión. Intenta de nuevo.' : 'Sorry, connection error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Optional: Add visual feedback here
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 240, 255); // Cyber Blue
        doc.text("IA.AGUS - Soporte IA", 20, 22);

        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 20, 32);

        doc.setDrawColor(0, 240, 255);
        doc.setLineWidth(0.5);
        doc.line(20, 37, pageWidth - 20, 37);

        let y = 50;
        doc.setFontSize(11);

        messages.forEach((msg) => {
            const label = msg.role === 'user' ? 'CLIENTE: ' : 'SOPORTE IA.AGUS: ';
            const color = msg.role === 'user' ? [0, 100, 200] : [0, 160, 160];

            doc.setFont("helvetica", "bold");
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(label, 20, y);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(60, 60, 60);

            const lines = doc.splitTextToSize(msg.content, pageWidth - 65);

            if (y + lines.length * 7 > 280) {
                doc.addPage();
                y = 25;
            }

            doc.text(lines, 50, y);
            y += lines.length * 6 + 10;
        });

        doc.save(`Historial-Soporte-Agus-${new Date().getTime()}.pdf`);
    };


    // Voice Recognition Logic
    // Voice & TTS
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState<string>('');
    const recognitionRef = useRef<any>(null);
    const inputRef = useRef('');

    const [voiceMode, setVoiceMode] = useState(false);
    const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);

    useEffect(() => { inputRef.current = input; }, [input]);

    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (voiceMode && lastMsg?.role === 'ai' && !isLoading) {
            const utterance = new SpeechSynthesisUtterance(lastMsg.content);
            utterance.lang = language === 'es' ? 'es-MX' : 'en-US';
            utterance.rate = 1.0;

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
            // STOP AI SPEAKING IMMEDIATELY
            window.speechSynthesis.cancel();

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) { return; }
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language === 'es' ? 'es-MX' : 'en-US';

            recognition.onstart = () => {
                setVoiceStatus(language === 'es' ? 'Escuchando... (Auto-envío)' : 'Listening... (Auto-send)');
                setVoiceMode(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');

                setInput(transcript);
            };

            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (event.error === 'no-speech') {
                    setVoiceStatus(language === 'es' ? '❌ Silencio.' : '❌ Silence.');
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setVoiceStatus('');
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
        <div className="flex flex-col h-full bg-cyber-black p-4 lg:p-8">
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col bg-cyber-dark rounded-2xl border border-cyber-blue/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-cyber-blue/20 bg-black/40 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-blue to-purple-600 flex items-center justify-center shadow-lg relative">
                        <i className="fas fa-headset text-white text-xl relative z-10"></i>
                        <div className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-black bottom-0 right-0 z-20" title="Online"></div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">
                            {language === 'es' ? 'Soporte 24/7' : '24/7 Support'}
                        </h2>
                        <p className="text-xs text-cyber-blue font-mono flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {language === 'es' ? 'Agente IA Activo • Respuesta Inmediata' : 'AI Agent Active • Instant Response'}
                        </p>
                    </div>
                    <button
                        onClick={exportToPDF}
                        className="p-3 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue rounded-xl hover:bg-cyber-blue hover:text-black transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-tighter"
                        title={language === 'es' ? 'Exportar historial a PDF' : 'Export history to PDF'}
                    >
                        <i className="fas fa-file-pdf text-lg"></i>
                        <span className="hidden sm:inline">{language === 'es' ? 'Exportar PDF' : 'Export PDF'}</span>
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                            <div className={`max-w-[80%] rounded-2xl p-5 relative shadow-lg ${msg.role === 'user'
                                ? 'bg-cyber-blue text-black rounded-br-none shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                                : 'bg-white/5 border border-white/10 text-gray-100 rounded-bl-none'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                    {msg.content}
                                </p>
                                <span className="text-[10px] opacity-50 absolute bottom-2 right-4 font-mono">
                                    {msg.role === 'ai' ? 'IA.AGUS Support' : 'You'}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(msg.content)}
                                    className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-cyber-blue transition-all"
                                    title={language === 'es' ? 'Copiar mensaje' : 'Copy message'}
                                >
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 text-gray-100 rounded-2xl rounded-bl-none p-4 flex gap-2 items-center">
                                <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-black/40 border-t border-cyber-blue/10">
                    {/* Status Message */}
                    {voiceStatus && (
                        <p className={`text-xs mb-2 font-mono ${voiceStatus.includes('❌') ? 'text-red-400' : 'text-cyber-blue animate-pulse'}`}>
                            {voiceStatus}
                        </p>
                    )}
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={toggleListening}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 shrink-0 ${isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                : 'bg-cyber-dark/80 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue hover:text-black shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                                }`}
                            title={language === 'es' ? 'Activar micrófono' : 'Toggle microphone'}
                        >
                            <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-xl`}></i>
                        </button>
                        <button
                            onClick={() => setIsLiveCallOpen(true)}
                            className="w-14 h-14 rounded-2xl bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.1)] shrink-0"
                            title={language === 'es' ? 'Llamada de Voz en Vivo' : 'Live Voice Call'}
                        >
                            <i className="fas fa-phone-volume text-xl animate-pulse"></i>
                        </button>

                        {/* Grounding Toggle */}
                        <button
                            onClick={() => searchCount < 30 && setIsGroundingEnabled(!isGroundingEnabled)}
                            disabled={searchCount >= 30}
                            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all border shrink-0 ${isGroundingEnabled
                                ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                : 'bg-cyber-dark/80 border-white/10 text-white/40 hover:border-amber-500/50 hover:text-amber-500'
                                } disabled:opacity-20 disabled:grayscale`}
                            title={language === 'es' ? `Búsqueda en Internet (${30 - searchCount} restantes)` : `Web Search (${30 - searchCount} left)`}
                        >
                            <i className={`fas fa-globe text-sm ${isGroundingEnabled ? 'animate-spin-slow' : ''}`}></i>
                            <span className="text-[8px] font-black uppercase mt-0.5">{searchCount}/30</span>
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening
                                ? (language === 'es' ? 'Escuchando... (Habla ahora)' : 'Listening... (Speak now)')
                                : (language === 'es' ? 'Escribe tu pregunta aquí...' : 'Type your question here...')}
                            className={`flex-1 h-14 bg-cyber-black border border-white/10 rounded-2xl px-6 text-lg text-white focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all placeholder-gray-600 ${isListening ? 'border-cyber-blue/50' : ''}`}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyber-blue to-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0"
                        >
                            <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane text-xl'}`}></i>
                        </button>
                    </div>
                    <p className="text-[10px] text-center mt-3 text-gray-600">
                        Powered by Gemini 2.0 Flash • IA.AGUS Enterprise Solutions
                    </p>
                </div>
            </div>
            <LiveVoiceCall
                isOpen={isLiveCallOpen}
                onClose={() => setIsLiveCallOpen(false)}
                language={language}
                systemInstruction="You are an expert AI Support Agent for IA.AGUS. Help the user with questions about the app, pricing, technical support, and features. Be polite, professional, and efficient."
                unlimited={user?.isUnlimited === true}
            />
        </div>
    );
};

export default SupportView;
