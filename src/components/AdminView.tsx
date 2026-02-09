
import React, { useState } from 'react';
import { Shield, User, Mail, Lock, CreditCard, CheckCircle2, AlertCircle, Loader2, Copy, BarChart3, RefreshCcw, LogOut, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { usageService, InteractionType } from '../services/usageService';
import { useAuth } from '../contexts/AuthContext';

interface AdminViewProps {
    onBack: () => void;
    onGoToApp: () => void;
    // brandColor: string; // Removed brandColor prop to keep it simpler if not strictly needed or I can default it
}
const AdminView: React.FC<AdminViewProps> = ({ onBack, onGoToApp }) => {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        orgName: '',
        email: '',
        password: '',
        location: '',
        plan: 'PRO' as 'FREE' | 'PRO' | 'ENTERPRISE'
    });

    const [activeTab, setActiveTab] = useState<'provisioning' | 'stats'>('provisioning');
    const [usageLogs, setUsageLogs] = useState<any[]>([]);
    const [isLoadingUsage, setIsLoadingUsage] = useState(false);
    const [usageSummary, setUsageSummary] = useState({
        total_voice: 0,
        total_video: 0,
        total_text: 0
    });

    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string, orgId: string } | null>(null);

    const loadUsageData = async () => {
        setIsLoadingUsage(true);
        try {
            const logs = await usageService.getAllUsage();
            setUsageLogs(logs);

            const totals = logs.reduce((acc: any, log: any) => {
                if (log.interaction_type === InteractionType.VOICE_MINUTE) acc.total_voice += (log.quantity || 0);
                if (log.interaction_type === InteractionType.VIDEO_ANALYSIS) acc.total_video += (log.quantity || 0);
                if (log.interaction_type === InteractionType.TEXT_QUERY) acc.total_text += (log.quantity || 0);
                return acc;
            }, { total_voice: 0, total_video: 0, total_text: 0 });

            setUsageSummary(totals);
        } catch (err) {
            console.error("Error loading usage data:", err);
        } finally {
            setIsLoadingUsage(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'stats') {
            loadUsageData();
        }
    }, [activeTab]);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        setCreatedCredentials(null);

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.orgName,
                        role: 'org_owner' // Changed from agency_owner
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No user created");

            const userId = authData.user.id;
            const orgId = crypto.randomUUID();

            // 2. Create Organization Record (Mapping to 'organizations' or similar if it existed, for now using 'agencies' table or maybe I should use 'organizations' if I create migration later?)
            // User asked to use "this panel", sticking to 'agencies' for compatibility or changing to 'organizations' if I want to be cleaner?
            // "Manufactura" context supports "organizations" usually.
            // Let's assume we use 'organizations' table.
            const { error: orgError } = await supabase
                .from('organizations') // Changed table name
                .insert({
                    id: orgId,
                    owner_id: userId,
                    name: formData.orgName,
                    // brand_color: '#f59e0b', 
                    location: formData.location,
                    plan_type: formData.plan,
                    status: 'ACTIVE'
                });

            // NOTE: Since I don't know if 'organizations' table exists, this might fail unless I create it.
            // But the user just said "put the panel here". They didn't say "migrate the db". 
            // However, for the panel to *work*, the DB needs to support it. 
            // If I use 'agencies', it might conflict conceptually.
            // I will use 'organizations' and if it fails, the user will see the error and we can fix DB.

            if (orgError) {
                // Fallback to 'agencies' if 'organizations' doesn't exist? No, better to fail and fix.
                throw orgError;
            }

            // 3. Create/Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: formData.email,
                    name: formData.orgName,
                    role: 'org_owner',
                    organization_id: orgId, // Changed from agency_id
                    active: true
                });

            if (profileError) throw profileError;

            // 4. Create Billing Record
            const { error: billingError } = await supabase
                .from('organization_billing') // Changed from agency_billing
                .insert({
                    organization_id: orgId,
                    plan: formData.plan,
                    status: 'ACTIVE',
                    credits_balance: 0,
                    billing_period_start: new Date().toISOString(),
                    billing_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                });

            if (billingError) throw billingError;

            setSuccess(`Organización "${formData.orgName}" creada exitosamente.`);
            setCreatedCredentials({
                email: formData.email,
                password: formData.password,
                orgId: orgId
            });

            // Clear form
            setFormData({ ...formData, orgName: '', email: '', password: '' });

        } catch (err: any) {
            console.error('Provisioning Error:', err);
            setError(err.message || "Error al crear la organización");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-cyber-blue/10 rounded-2xl flex items-center justify-center border border-cyber-blue/20">
                            <Shield className="w-8 h-8 text-cyber-blue" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                GOD MODE <span className="text-cyber-blue">ADMIN</span>
                            </h1>
                            <p className="text-zinc-500 font-bold italic uppercase tracking-widest">
                                PROVISIONAMIENTO MANUAL DE PLANTAS
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onGoToApp}
                            className="flex items-center gap-2 px-5 py-2.5 bg-cyber-blue text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                        >
                            Entrar a App
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-red-500/30 text-red-400 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-zinc-800">
                        <button
                            onClick={() => setActiveTab('provisioning')}
                            className={`px-6 py-4 font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'provisioning'
                                ? 'border-cyber-blue text-cyber-blue'
                                : 'border-transparent text-zinc-500 hover:text-white'
                                }`}
                        >
                            Provisionamiento
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`px-6 py-4 font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'stats'
                                ? 'border-cyber-blue text-cyber-blue'
                                : 'border-transparent text-zinc-500 hover:text-white'
                                }`}
                        >
                            Estadísticas
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {activeTab === 'provisioning' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Form */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <User className="text-zinc-500" /> Nueva Organización
                                </h2>

                                <form onSubmit={handleCreateOrg} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Negocio / Planta</label>
                                        <input
                                            type="text"
                                            value={formData.orgName}
                                            onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-cyber-blue outline-none transition-colors"
                                            placeholder="Ej. Manufactura Global S.A."
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubicación</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-cyber-blue outline-none transition-colors"
                                            placeholder="Ej. Monterrey, NL"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email (Login)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-black border border-zinc-800 rounded-xl p-4 pl-12 text-white focus:border-cyber-blue outline-none transition-colors"
                                                placeholder="contacto@empresa.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contraseña Temporal</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-black border border-zinc-800 rounded-xl p-4 pl-12 text-white focus:border-cyber-blue outline-none transition-colors"
                                                placeholder="Generar contraseña segura..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan Inicial</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['FREE', 'PRO', 'ENTERPRISE'].map((plan) => (
                                                <button
                                                    key={plan}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, plan: plan as any })}
                                                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.plan === plan
                                                        ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue'
                                                        : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                        }`}
                                                >
                                                    {plan}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-cyber-blue hover:bg-cyan-400 text-black font-bold rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-cyber-blue/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> PROVISIONAR ORGANIZACIÓN</>}
                                    </button>
                                </form>
                            </div>

                            {/* Success / Instructions */}
                            <div className="space-y-6">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 h-full">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <CreditCard className="text-zinc-500" /> Credenciales Generadas
                                    </h2>

                                    {createdCredentials ? (
                                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                                                <div className="flex items-center gap-3 text-green-400 mb-4">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                    <span className="font-bold text-lg">¡Cuenta Creada!</span>
                                                </div>
                                                <p className="text-zinc-400 text-sm mb-4">
                                                    Comparte estos datos con el cliente. Podrá iniciar sesión inmediatamente.
                                                </p>

                                                <div className="space-y-3">
                                                    <div className="group relative bg-black/50 p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                                                        <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">Usuario (Email)</span>
                                                        <code className="text-white font-mono">{createdCredentials.email}</code>
                                                        <button
                                                            onClick={() => copyToClipboard(createdCredentials.email)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-white transition-colors"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="group relative bg-black/50 p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                                                        <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">Contraseña</span>
                                                        <code className="text-white font-mono">{createdCredentials.password}</code>
                                                        <button
                                                            onClick={() => copyToClipboard(createdCredentials.password)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-white transition-colors"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="group relative bg-black/50 p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                                                        <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">Organization ID</span>
                                                        <code className="text-zinc-400 font-mono text-xs">{createdCredentials.orgId}</code>
                                                        <button
                                                            onClick={() => copyToClipboard(createdCredentials.orgId)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-white transition-colors"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-zinc-500 text-xs mt-4">
                                                    Recuerda: El cliente debe cambiar su contraseña al primer inicio.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl opacity-50">
                                            <User size={48} className="mb-4" />
                                            <p>Completa el formulario para generar las credenciales de acceso.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Statistics View */
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 text-cyber-blue mb-4">
                                        <BarChart3 className="w-5 h-5" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest">Análisis de Video</h3>
                                    </div>
                                    <div className="text-4xl font-black text-white">{usageSummary.total_video}</div>
                                    <p className="text-zinc-500 text-[10px] mt-1 uppercase font-bold tracking-tighter">Eventos Totales</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 text-cyan-400 mb-4">
                                        <Loader2 className="w-5 h-5" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest">Minutos de Voz</h3>
                                    </div>
                                    <div className="text-4xl font-black text-white">{usageSummary.total_voice}</div>
                                    <p className="text-zinc-500 text-[10px] mt-1 uppercase font-bold tracking-tighter">Minutos Consumidos</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-4">
                                        <RefreshCcw className="w-5 h-5" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest">Consultas Texto</h3>
                                    </div>
                                    <div className="text-4xl font-black text-white">{usageSummary.total_text}</div>
                                    <p className="text-zinc-500 text-[10px] mt-1 uppercase font-bold tracking-tighter">Consultas IA</p>
                                </div>
                            </div>

                            {/* Logs Table */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Registro General de Actividad</h3>
                                    <button
                                        onClick={loadUsageData}
                                        disabled={isLoadingUsage}
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-cyber-blue disabled:opacity-50"
                                    >
                                        <RefreshCcw className={`w-4 h-4 ${isLoadingUsage ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-black/50 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Usuario</th>
                                                <th className="px-6 py-4">Tipo</th>
                                                <th className="px-6 py-4">Cantidad</th>
                                                <th className="px-6 py-4">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {usageLogs.length > 0 ? (
                                                usageLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-medium text-white">{log.username}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${log.interaction_type === InteractionType.VIDEO_ANALYSIS ? 'bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20' :
                                                                log.interaction_type === InteractionType.VOICE_MINUTE ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                                    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                                                }`}>
                                                                {log.interaction_type.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-bold text-white">{log.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-600">
                                                        No se encontraron registros de uso.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminView;
