
import React, { useState, useRef, useEffect } from 'react';
import { chatWithReport } from '../services/geminiService';

interface ReportChatProps {
    analysisContext: string;
    language: 'es' | 'en';
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

const ReportChat: React.FC<ReportChatProps> = ({ analysisContext, language }) => {
    const [messages, setMessages] = useState<Message[]>([]);
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
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: language === 'es' ? 'Error de conexión.' : 'Connection error.' }]);
        } finally {
            setIsLoading(false);
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
                        {language === 'es' ? 'Ingeniero IA' : 'AI Engineer'}
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
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-lg ${msg.role === 'user'
                            ? 'bg-cyber-blue text-black rounded-br-none font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                            : 'bg-cyber-gray border border-cyber-blue/20 text-cyber-text rounded-bl-none'
                            }`}>
                            {msg.content}
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
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={language === 'es' ? 'Escribe tu consulta técnica...' : 'Type your technical question...'}
                        className="flex-1 bg-cyber-dark border border-cyber-gray rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all placeholder-cyber-text/30"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-cyber-blue text-black px-6 rounded-xl hover:bg-white hover:text-cyber-blue transition-all disabled:opacity-50 font-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportChat;
