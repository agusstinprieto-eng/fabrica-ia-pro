import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Lock, Mail, Eye, EyeOff, LayoutPanelLeft } from 'lucide-react';

const LoginView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    // Sound effects utilities
    const playSound = (type: 'click' | 'error' | 'success') => {
        const sounds = {
            click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
            error: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
            success: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'
        };
        const audio = new Audio(sounds[type]);
        audio.volume = 0.2;
        audio.play().catch(() => { }); // Ignore blocked audio
    };

    // Load remembered credentials
    useEffect(() => {
        const savedEmail = localStorage.getItem('manuf-ia-email');
        const savedRemember = localStorage.getItem('manuf-ia-remember') === 'true';
        if (savedRemember && savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        playSound('click');

        const success = await login(email, password);

        if (success) {
            playSound('success');
            if (rememberMe) {
                localStorage.setItem('manuf-ia-email', email);
                localStorage.setItem('manuf-ia-remember', 'true');
            } else {
                localStorage.removeItem('manuf-ia-email');
                localStorage.removeItem('manuf-ia-remember');
            }
        } else {
            playSound('error');
            setError('ACCESO DENEGADO. VERIFIQUE CREDENCIALES.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-tech">
            {/* BACKGROUND IMAGE WITH OVERLAY */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105"
                style={{ backgroundImage: `url('/C:/Users/aguss/.gemini/antigravity/brain/0be18f8c-a4d3-4960-b877-492ee43c011d/manufactura_login_bg_1772202381563.png')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/40 to-cyan-900/40" />
            </div>

            {/* SCANLINE EFFECT */}
            <div className="absolute inset-0 z-1 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[420px] relative z-10"
            >
                {/* COMPACT LOGO UNIT */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-4 border border-cyan-400/30"
                    >
                        <LayoutPanelLeft className="text-white" size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-none">
                        MANUFACTURA <span className="text-cyan-400 glow-text-cyan">IA</span> PRO
                    </h1>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
                        <p className="text-[10px] text-cyan-400/70 font-mono tracking-[0.4em] uppercase font-bold">Smart Industrial OS</p>
                    </div>
                </div>

                {/* LOGIN CARD */}
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group">
                    {/* Glowing corner decor */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700" />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black text-center uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Fields */}
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-cyan-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm font-medium"
                                    placeholder="USUARIO O EMAIL"
                                    required
                                />
                            </div>

                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-cyan-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm font-medium"
                                    placeholder="PASSPHRASE"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* REMEMBER ME & FORGOT */}
                        <div className="flex items-center justify-between px-2">
                            <label className="flex items-center gap-2 cursor-pointer group/check">
                                <div className="relative w-5 h-5">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                    />
                                    <div className={`w-5 h-5 rounded-md border border-white/10 transition-all ${rememberMe ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-transparent'}`}>
                                        {rememberMe && <Zap size={12} className="text-white absolute inset-0 m-auto" />}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-zinc-500 group-hover/check:text-cyan-400 transition-colors uppercase tracking-widest">Recordarme</span>
                            </label>
                            <button type="button" className="text-[10px] font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">Reset</button>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group/btn overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 transition-all duration-300 group-hover/btn:scale-105" />
                            <div className={`relative flex items-center justify-center gap-3 py-4 text-white font-black uppercase tracking-[0.3em] text-xs transition-all ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        AUTENTICANDO...
                                    </>
                                ) : (
                                    <>
                                        ACCESO AL HUB
                                        <Shield size={16} />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>

                {/* FOOTER */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 text-zinc-600">
                        <div className="h-[1px] w-12 bg-white/5" />
                        <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Security Level 4 Enabled</span>
                        <div className="h-[1px] w-12 bg-white/5" />
                    </div>

                    <a
                        href="https://www.ia-agus.com"
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col items-center gap-1"
                    >
                        <span className="text-[10px] font-mono text-zinc-500 tracking-widest group-hover:text-cyan-400 transition-colors uppercase">
                            Built by <span className="font-bold text-white group-hover:text-cyan-400 transition-all">IA.AGUS</span>
                        </span>
                        <span className="text-[8px] text-zinc-700 group-hover:text-zinc-500 transition-colors tracking-[0.4em]">WWW.IA-AGUS.COM</span>
                    </a>
                </div>
            </motion.div>

            {/* CSS GLOBALS FOR EFFECTS */}
            <style>{`
                .glow-text-cyan {
                    text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3);
                }
                .shadow-neon-blue {
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.4);
                }
            `}</style>
        </div>
    );
};

export default LoginView;

