import React, { useState, useRef } from 'react';
import { Settings, Save, Palette, Bot, Shield, Zap, CheckCircle2, Mic2, Play, Volume2, User, UserCheck, ChevronRight, Globe, BrainCircuit, Sparkles, CreditCard } from 'lucide-react';
import { Tenant } from '../types';
import { updateTenantConfig } from '../services/supabaseService';
import { GoogleGenAI } from '@google/genai';

// --- AUDIO HELPERS ---
function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}

interface VoiceOption {
    id: string;
    name: string;
    gender: 'femenina' | 'masculina';
    previewUrl: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
    { id: 'Kore', name: 'Nova (Kore)', gender: 'femenina', previewUrl: '' },
    { id: 'Aoede', name: 'Valentina (Aoede)', gender: 'femenina', previewUrl: '' },
    { id: 'Puck', name: 'Adrian (Puck)', gender: 'masculina', previewUrl: '' },
    { id: 'Charon', name: 'Aaron (Charon)', gender: 'masculina', previewUrl: '' }
];

// Map local IDs to Gemini Voice names (they are the same now for consistency)
const VOICE_MAP: Record<string, string> = {
    'Kore': 'Kore',
    'Aoede': 'Aoede',
    'Puck': 'Puck',
    'Charon': 'Charon'
};

interface ConfigViewProps {
    tenant: Tenant | undefined;
    activeColor: string;
    onSave?: (updates: Partial<Tenant>) => Promise<void>;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ tenant, activeColor, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [formData, setFormData] = useState({
        agentName: tenant?.agentName || '',
        name: tenant?.name || '',
        primaryColor: tenant?.primaryColor || 'bg-indigo-600',
        agentVoice: tenant?.agentVoice || 'Puck',
        websiteUrl: tenant?.websiteUrl || '',
        telegramBotToken: tenant?.telegram_bot_token || '',
        telegramChatId: tenant?.telegram_chat_id || '',
        callProviderUrl: tenant?.call_provider_url || '',
        callProviderApiKey: tenant?.call_provider_api_key || '',
        evolutionApiUrl: tenant?.evolution_api_url || '',
        evolutionApiKey: tenant?.evolution_api_key || '',
        evolutionInstance: tenant?.evolution_instance || '',
        // CRM
        crmType: tenant?.crm_type || 'none',
        crmApiKey: tenant?.crm_api_key || '',
        crmEndpoint: tenant?.crm_endpoint || '',
        activeModality: tenant?.active_modality || 'text' as 'text' | 'voice' | 'call'
    });

    // Sync formData when tenant changes
    React.useEffect(() => {
        if (tenant) {
            setFormData({
                agentName: tenant.agentName || '',
                name: tenant.name || '',
                primaryColor: tenant.primaryColor || 'bg-indigo-600',
                agentVoice: tenant.agentVoice || 'Puck',
                websiteUrl: tenant.websiteUrl || '',
                telegramBotToken: tenant.telegram_bot_token || '',
                telegramChatId: tenant.telegram_chat_id || '',
                callProviderUrl: tenant.call_provider_url || '',
                callProviderApiKey: tenant.call_provider_api_key || '',
                evolutionApiUrl: tenant.evolution_api_url || '',
                evolutionApiKey: tenant.evolution_api_key || '',
                evolutionInstance: tenant.evolution_instance || '',
                crmType: tenant.crm_type || 'none',
                crmApiKey: tenant.crm_api_key || '',
                crmEndpoint: tenant.crm_endpoint || '',
                activeModality: tenant.active_modality || 'text'
            });
        }
    }, [tenant]);

    const toggleVoicePreview = async (voice: VoiceOption) => {
        if (playingVoice === voice.id) {
            setPlayingVoice(null);
            return;
        }

        setPlayingVoice(voice.id);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                console.error('API Key missing');
                setPlayingVoice(null);
                return;
            }

            const ai = new (GoogleGenAI as any)({ apiKey, apiVersion: 'v1alpha' });
            const selectedGeminiVoice = VOICE_MAP[voice.id] || 'Puck';

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            let nextStartTime = audioCtx.currentTime;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: ['audio' as any],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedGeminiVoice } }
                    }
                },
                callbacks: {
                    onopen: async () => {
                        const session = await sessionPromise;
                        session.sendClientContent({
                            turns: [{ role: 'user', parts: [{ text: "Hola, soy tu asistente de voz de Agus Pro. ¿En qué puedo ayudarte hoy?" }] }],
                            turnComplete: true
                        });
                    },
                    onmessage: async (message: any) => {
                        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
                            const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000);
                            const source = audioCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioCtx.destination);

                            nextStartTime = Math.max(nextStartTime, audioCtx.currentTime);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;

                            source.onended = () => {
                                if (message.serverContent?.turnComplete) {
                                    setTimeout(() => {
                                        setPlayingVoice(null);
                                        sessionPromise.then((s: any) => s.close());
                                    }, 500);
                                }
                            };
                        }
                    },
                    onerror: (err: any) => {
                        console.error('Gemini Live Error:', err);
                        setPlayingVoice(null);
                    },
                    onclose: () => {
                        setPlayingVoice(null);
                    }
                }
            });

        } catch (error) {
            console.error('Error playing voice preview:', error);
            setPlayingVoice(null);
        }
    };

    const handleSave = async () => {
        if (!tenant?.id) return;
        setIsSaving(true);
        try {
            const updates = {
                name: formData.name,
                agentName: formData.agentName,
                primaryColor: formData.primaryColor,
                agentVoice: formData.agentVoice,
                websiteUrl: formData.websiteUrl,
                telegramBotToken: formData.telegramBotToken,
                telegramChatId: formData.telegramChatId,
                callProviderUrl: formData.callProviderUrl,
                callProviderApiKey: formData.callProviderApiKey,
                evolutionApiUrl: formData.evolutionApiUrl,
                evolutionApiKey: formData.evolutionApiKey,
                evolutionInstance: formData.evolutionInstance,
                crmType: formData.crmType,
                crmApiKey: formData.crmApiKey,
                crmEndpoint: formData.crmEndpoint,
                activeModality: formData.activeModality
            };

            if (onSave) {
                await onSave(updates as any);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Unexpected error saving config:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            <audio ref={audioRef} onEnded={() => setPlayingVoice(null)} className="hidden" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Settings className={activeColor.replace('bg-', 'text-')} size={32} />
                        Configuración <span className="text-slate-500 font-normal">Neural</span>
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Personalización avanzada del núcleo del sistema — powered by Agus PRO</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Identity Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />

                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${activeColor} flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)]`}>
                            <Bot className="text-white" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Identidad del Agente</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Parámetros de reconocimiento</p>
                        </div>
                    </div>

                    <div className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Público del Chatbot</label>
                            <input
                                type="text"
                                value={formData.agentName}
                                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold font-sans text-lg outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Alias de la Empresa</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all font-sans"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de Conocimiento (Página Web)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50" size={18} />
                                <input
                                    type="url"
                                    placeholder="https://tu-empresa.com"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-lg outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all font-sans"
                                />
                            </div>
                            <p className="text-[9px] text-slate-500 italic mt-1 ml-1">* El cerebro de la IA usará esta URL para conocer tu negocio.</p>
                        </div>
                        {/* Selector de Modalidad */}
                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad de Respuesta Activa</label>
                            <div className="flex bg-black/40 p-1.5 rounded-[1.5rem] border border-white/5">
                                {(['text', 'voice', 'call', 'off'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setFormData({ ...formData, activeModality: mode })}
                                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.activeModality === mode
                                                ? (mode === 'text' ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.05] border border-cyan-400/50' :
                                                    mode === 'voice' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.05] border border-emerald-400/50' :
                                                        mode === 'call' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-[1.05] border border-orange-400/50' :
                                                            'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-[1.05] border border-red-500/50')
                                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <i className={`fas fa-${mode === 'text' ? 'comment-alt' : mode === 'voice' ? 'microphone' : mode === 'call' ? 'phone-alt' : 'power-off'}`}></i>
                                        {mode === 'text' ? 'Texto' : mode === 'voice' ? 'Voz' : mode === 'call' ? 'Llamada' : 'OFF'}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-500 italic mt-1 ml-1">* Elige cómo quieres que el bot responda preferentemente.</p>
                        </div>
                    </div>
                </div>

                {/* Voice Selection Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />

                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]`}>
                            <Mic2 className="text-amber-500" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Voz del Agente</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">DNA Auditivo del Sistema — Gemini 2.5</p>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                        {['femenina', 'masculina'].map((gender) => (
                            <div key={gender} className="space-y-3">
                                <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] ml-1">{gender}</label>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {VOICE_OPTIONS.filter(v => v.gender === gender).map((voice) => (
                                        <div
                                            key={voice.id}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.agentVoice === voice.id
                                                ? 'bg-amber-500/10 border-amber-500/30 text-white'
                                                : 'bg-black/20 border-white/5 text-slate-400 hover:bg-black/40 hover:border-white/10'
                                                }`}
                                        >
                                            <button
                                                onClick={() => setFormData({ ...formData, agentVoice: voice.id })}
                                                className="flex items-center gap-4 flex-1 text-left"
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.agentVoice === voice.id ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                                                    {formData.agentVoice === voice.id ? <UserCheck size={20} /> : <User size={20} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold">{voice.name}</span>
                                                    <span className="text-[10px] opacity-40 uppercase tracking-widest">Alta Fidelidad</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => toggleVoicePreview(voice)}
                                                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${playingVoice === voice.id
                                                    ? 'bg-amber-500 text-white animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                                    }`}
                                            >
                                                {playingVoice === voice.id ? <Volume2 size={18} /> : <Play size={18} fill="currentColor" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visual Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />

                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)]`}>
                            <Palette className="text-white" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Estética & UI</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">DNA Visual del Sistema</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Esquema Cromático</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { name: 'Indigo Cyber', val: 'bg-indigo-600', hover: 'hover:border-indigo-500/50' },
                                    { name: 'Emerald Pulse', val: 'bg-emerald-600', hover: 'hover:border-emerald-500/50' },
                                    { name: 'Nuclear Orange', val: 'bg-orange-600', hover: 'hover:border-orange-500/50' },
                                    { name: 'Violet Night', val: 'bg-violet-600', hover: 'hover:border-violet-500/50' }
                                ].map(color => (
                                    <button
                                        key={color.val}
                                        onClick={() => setFormData({ ...formData, primaryColor: color.val })}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${formData.primaryColor === color.val ? 'border-white/20 bg-white/10 shadow-lg' : 'border-white/5 bg-transparent'} ${color.hover} outline-none`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg ${color.val} shadow-inner`} />
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">{color.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]`}>
                            <Shield className="text-red-500" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Seguridad Neural</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Limites de Procesamiento</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-red-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-500/20 rounded-xl">
                                <Zap className="text-amber-500" size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-white uppercase tracking-widest">Modo Godmode</span>
                                <span className="text-[9px] text-slate-500 uppercase">Sin restricciones de cuota</span>
                            </div>
                        </div>
                        <div className="w-12 h-7 bg-indigo-600 rounded-full relative p-1 cursor-pointer shadow-inner">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-1 shadow-md" />
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-800/20 border border-white/5">
                        <p className="text-[10px] text-slate-500 font-medium italic">
                            El modo Godmode permite procesamiento ilimitado en todas las ramas de IA conectadas al tenant principal.
                        </p>
                    </div>
                </div>

                {/* Integrations Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300 md:col-span-2">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700" />

                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]`}>
                            <Zap className="text-cyan-400" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Canales & Integraciones</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Conexión con ecosistemas externos</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Telegram Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1 border-l-2 border-cyan-500/50 pl-3">Telegram Bot</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Bot Token</label>
                                    <input
                                        type="password"
                                        value={formData.telegramBotToken}
                                        onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                                        placeholder="0000000000:AAxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-cyan-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Chat ID de Notificaciones</label>
                                    <input
                                        type="text"
                                        value={formData.telegramChatId}
                                        onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                                        placeholder="-100xxxxxxxxxx"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1 border-l-2 border-emerald-500/50 pl-3">WhatsApp (Evolution API)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Evolution API URL</label>
                                    <input
                                        type="text"
                                        value={formData.evolutionApiUrl}
                                        onChange={(e) => setFormData({ ...formData, evolutionApiUrl: e.target.value })}
                                        placeholder="https://su-instancia.com"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Evolution API Key</label>
                                        <input
                                            type="password"
                                            value={formData.evolutionApiKey}
                                            onChange={(e) => setFormData({ ...formData, evolutionApiKey: e.target.value })}
                                            placeholder="apikey-xxxxx"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre de Instancia</label>
                                        <input
                                            type="text"
                                            value={formData.evolutionInstance}
                                            onChange={(e) => setFormData({ ...formData, evolutionInstance: e.target.value })}
                                            placeholder="Agus_Chatbot"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Call Provider Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 border-l-2 border-amber-500/50 pl-3">Proveedor de Llamadas PRO</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Endpoint API (Base URL)</label>
                                    <input
                                        type="url"
                                        value={formData.callProviderUrl}
                                        onChange={(e) => setFormData({ ...formData, callProviderUrl: e.target.value })}
                                        placeholder="https://api.callprovider.com/v1"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-amber-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">API Key / Secreto</label>
                                    <input
                                        type="password"
                                        value={formData.callProviderApiKey}
                                        onChange={(e) => setFormData({ ...formData, callProviderApiKey: e.target.value })}
                                        placeholder="sk_xxxxxxxxxxxxxxxx"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-amber-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CRM Section */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1 border-l-2 border-emerald-500/50 pl-3">CRM Integration</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Plataforma CRM</label>
                                        <select
                                            value={formData.crmType}
                                            onChange={(e) => setFormData({ ...formData, crmType: e.target.value as any })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all"
                                        >
                                            <option value="none" className="bg-slate-900">Sin CRM</option>
                                            <option value="hubspot" className="bg-slate-900">HubSpot</option>
                                            <option value="zoho" className="bg-slate-900">Zoho CRM</option>
                                        </select>
                                    </div>
                                    {formData.crmType !== 'none' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">API Key</label>
                                                <input
                                                    type="password"
                                                    value={formData.crmApiKey}
                                                    onChange={(e) => setFormData({ ...formData, crmApiKey: e.target.value })}
                                                    placeholder={formData.crmType === 'hubspot' ? 'pat-na1-xxxxxxxxxxxx' : 'xxxxxxxxxxxxxx'}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Endpoint</label>
                                                <input
                                                    type="url"
                                                    value={formData.crmEndpoint}
                                                    onChange={(e) => setFormData({ ...formData, crmEndpoint: e.target.value })}
                                                    placeholder={formData.crmType === 'hubspot' ? 'https://api.hubapi.com' : 'https://www.zohoapis.com/crm/v2'}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Personality & Rules */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]`}>
                            <BrainCircuit className="text-indigo-400" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Personalidad de la IA</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Comportamiento y Tono</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tono de Voz Principal</label>
                            <select
                                value={formData.agentVoice}
                                onChange={(e) => setFormData({ ...formData, agentVoice: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-indigo-500/50 transition-all font-black uppercase"
                            >
                                <option value="Puck" className="bg-slate-900">Profesional & Directo</option>
                                <option value="Maya" className="bg-slate-900">Amigable & Empático</option>
                                <option value="Kasper" className="bg-slate-900">Vendedor Agresivo</option>
                                <option value="Fenrir" className="bg-slate-900">Técnico & Preciso</option>
                            </select>
                        </div>
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex gap-3">
                                <Sparkles className="text-indigo-400 shrink-0" size={16} />
                                <p className="text-[10px] text-indigo-300/70 leading-relaxed font-medium">
                                    El tono seleccionado ajusta automáticamente la temperatura y los tokens de "system influence" para que las respuestas se alineen con la marca del cliente de forma orgánica.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription & Billing (SaaS UI) */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Activa</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]`}>
                            <CreditCard className="text-emerald-400" size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Suscripción & Facturación</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Plan de Negocio</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="p-5 bg-black/40 border border-white/5 rounded-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actual</span>
                                <span className="text-[12px] font-black text-white uppercase italic">IA PRO GOLDMODE</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[85%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">85% de Créditos Consumidos</span>
                                <span className="text-[9px] text-emerald-400 font-black uppercase">RENOVAR PROXIMAMENTE</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Ver Facturas & Métodos de Pago
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center pt-12">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full max-w-lg py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden ${showSuccess
                        ? 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-emerald-400/50'
                        : isSaving
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : `bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] hover:brightness-110 border border-white/10`
                        }`}
                >
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                    {showSuccess ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                                <i className="fas fa-check text-white"></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-[0.2em] relative z-10">
                                Configuración Guardada
                            </span>
                        </>
                    ) : (
                        <>
                            <div className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ${isSaving ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                                <i className={`fas fa-${isSaving ? 'circle-notch' : 'save'} text-white`}></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-[0.2em] relative z-10">
                                {isSaving ? 'Procesando...' : 'Grabar Configuración'}
                            </span>
                        </>
                    )}
                </button>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-6 italic">Sincronización en tiempo real con Supabase Core</p>
            </div>
        </div>
    );
};

export default ConfigView;
