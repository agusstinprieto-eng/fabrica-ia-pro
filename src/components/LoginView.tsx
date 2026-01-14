import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const success = await login(email, password);

        if (!success) {
            setError('Credenciales inválidas. Intente nuevamente.');
            setIsLoading(false);
        }
        // If success, the auth state change will trigger re-render/redirect
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full delay-1000" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
                        {/* Manufactura Icon (Factory) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M17 18h1" /><path d="M12 18h1" /><path d="M7 18h1" /></svg>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                        MANUFACTURA <span className="text-cyan-500">IA</span> PRO
                    </h1>
                    <p className="text-cyber-text/60 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase">Smart Industrial Hub</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="border-b border-white/5 pb-4 mb-4">
                                <h2 className="text-xl font-bold text-white text-center">Bienvenido</h2>
                                <p className="text-xs text-zinc-500 text-center mt-1">Ingresa tus credenciales de acceso</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-zinc-500 ml-4 tracking-widest">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    title="Email Corporativo"
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                                    placeholder="admin@ia-agus.com"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-zinc-500 ml-4 tracking-widest">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(8,145,178,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span className="text-[10px]">Autenticando...</span>
                                    </div>
                                ) : (
                                    <>
                                        ACCEDER
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <a
                            href="https://www.ia-agus.com"
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
                            <span className="text-[10px] font-mono text-zinc-500 tracking-widest group-hover:text-white transition-colors">
                                Powered by <span className="font-bold text-cyan-500 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">IA.AGUS</span>
                                <span className="ml-2 lowercase opacity-70 group-hover:opacity-100 transition-opacity">www.ia-agus.com</span>
                            </span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginView;
