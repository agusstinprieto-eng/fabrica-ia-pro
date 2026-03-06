import React, { useState, useEffect } from 'react';
import {
    Building2, UserPlus, Bot, Save, Trash2,
    ShieldCheck, Search, Edit2, Globe, Key,
    Activity, Smartphone, X
} from 'lucide-react';
import { Tenant } from '../types';
import { supabase } from '../services/supabase';
import { CustomDropdown } from './CustomDropdown';

interface AdminTenantsViewProps {
    activeColor: string;
}

export const AdminTenantsView: React.FC<AdminTenantsViewProps> = ({ activeColor }) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        agentName: 'Asistente IA',
        primaryColor: 'bg-indigo-600',
        evolution_instance: '',
        evolution_api_url: '',
        evolution_api_key: '',
        whatsapp_recipient_phone: '',
        websiteUrl: '',
        agentVoice: 'Puck',
        whatsapp_provider: 'evolution' as 'meta' | 'evolution',
        whatsapp_auto_send: true,
        erp_type: 'none' as 'sap' | 'oracle' | 'dynamics' | 'other' | 'none',
        active_modality: 'text' as 'text' | 'voice' | 'call'
    });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        const { data, error } = await supabase.from('tenant_configs').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            const mapped = data.map(t => ({
                ...t,
                agentName: t.agent_name,
                primaryColor: t.primary_color,
                agentVoice: t.agent_voice,
                websiteUrl: t.website_url
            }));
            setTenants(mapped);
        }
        setIsLoading(false);
    };

    const handleOpenCreate = () => {
        setIsEditing(false);
        setFormData({
            id: '',
            name: '',
            agentName: 'Asistente IA',
            primaryColor: 'bg-indigo-600',
            evolution_instance: '',
            evolution_api_url: '',
            evolution_api_key: '',
            whatsapp_recipient_phone: '',
            websiteUrl: '',
            agentVoice: 'Puck',
            whatsapp_provider: 'evolution',
            whatsapp_auto_send: true,
            erp_type: 'none',
            active_modality: 'text'
        });
        setShowForm(true);
    };

    const handleOpenEdit = (tenant: Tenant) => {
        setIsEditing(true);
        setFormData({
            id: tenant.id,
            name: tenant.name,
            agentName: tenant.agentName || 'Asistente IA',
            primaryColor: tenant.primaryColor || 'bg-indigo-600',
            evolution_instance: tenant.evolution_instance || '',
            evolution_api_url: tenant.evolution_api_url || '',
            evolution_api_key: tenant.evolution_api_key || '',
            whatsapp_recipient_phone: tenant.whatsapp_recipient_phone || '',
            websiteUrl: tenant.websiteUrl || '',
            agentVoice: tenant.agentVoice || 'Puck',
            whatsapp_provider: tenant.whatsapp_provider || 'evolution',
            whatsapp_auto_send: tenant.whatsapp_auto_send ?? true,
            erp_type: tenant.erp_type || 'none',
            active_modality: tenant.active_modality || 'text'
        });
        setShowForm(true);
    };

    const handleSaveTenant = async () => {
        if (!formData.id || !formData.name) {
            alert('ID y Nombre son obligatorios');
            return;
        }
        setIsSaving(true);

        const payload = {
            id: formData.id,
            name: formData.name,
            agent_name: formData.agentName,
            primary_color: formData.primaryColor,
            evolution_instance: formData.evolution_instance,
            evolution_api_url: formData.evolution_api_url,
            evolution_api_key: formData.evolution_api_key,
            whatsapp_recipient_phone: formData.whatsapp_recipient_phone,
            website_url: formData.websiteUrl,
            agent_voice: formData.agentVoice,
            whatsapp_provider: formData.whatsapp_provider,
            whatsapp_auto_send: formData.whatsapp_auto_send,
            erp_type: formData.erp_type,
            active_modality: formData.active_modality
        };

        let result;
        if (isEditing) {
            result = await supabase
                .from('tenant_configs')
                .update(payload)
                .eq('id', formData.id);
        } else {
            result = await supabase
                .from('tenant_configs')
                .insert([payload]);
        }

        if (!result.error) {
            setShowForm(false);
            fetchTenants();
        } else {
            alert('Error saving business: ' + result.error.message);
        }
        setIsSaving(false);
    };

    const handleDeleteTenant = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar este negocio? Esta acción no se puede deshacer.')) return;
        const { error } = await supabase.from('tenant_configs').delete().eq('id', id);
        if (!error) fetchTenants();
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.id.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-8 w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Building2 className="text-indigo-400" />
                        Master <span className="text-slate-500">Empresas</span>
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Gestión global de identidades y accesos</p>
                </div>
                <button
                    onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
                    className={`px-6 py-3 rounded-2xl ${activeColor} text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2`}
                >
                    {showForm ? 'Cerrar' : 'Alta de Nuevo Negocio'}
                    {showForm ? <X size={14} /> : <UserPlus size={14} />}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Información Básica</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">ID / Slug (Único)</label>
                                    <input
                                        type="text"
                                        disabled={isEditing}
                                        placeholder="ej: mi-tienda-pro"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Comercial</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-indigo-500/50 transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre del Agente IA</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-indigo-500/50 transition-all font-tech"
                                        value={formData.agentName}
                                        onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                                    />
                                </div>
                                <CustomDropdown
                                    label="Voz del Agente (Gemini 2.5)"
                                    value={formData.agentVoice}
                                    onChange={(val) => setFormData({ ...formData, agentVoice: val })}
                                    options={[
                                        { value: 'Puck', label: 'Adrian (Puck) - Masculina' },
                                        { value: 'Charon', label: 'Aaron (Charon) - Masculina' },
                                        { value: 'Kore', label: 'Nova (Kore) - Femenina' },
                                        { value: 'Aoede', label: 'Valentina (Aoede) - Femenina' }
                                    ]}
                                />
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Modalidad Activa</label>
                                    <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                                        {(['text', 'voice', 'call', 'off'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setFormData({ ...formData, active_modality: mode })}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.active_modality === mode
                                                        ? (mode === 'text' ? 'bg-cyan-600 text-white shadow-lg border border-cyan-400/50 scale-[1.02]' :
                                                            mode === 'voice' ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400/50 scale-[1.02]' :
                                                                mode === 'call' ? 'bg-orange-600 text-white shadow-lg border border-orange-400/50 scale-[1.02]' :
                                                                    'bg-red-600 text-white shadow-lg border border-red-500/50 scale-[1.02]')
                                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <i className={`fas fa-${mode === 'text' ? 'comment-alt' : mode === 'voice' ? 'microphone' : mode === 'call' ? 'phone-alt' : 'power-off'} mr-2`}></i>
                                                {mode === 'text' ? 'Texto' : mode === 'voice' ? 'Voz' : mode === 'call' ? 'Llamada' : 'OFF'}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[8px] text-slate-600 italic ml-4 font-bold uppercase tracking-tighter">
                                        * Define el canal de respuesta predeterminado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Integration Info */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-2">Evolution API & Integración</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Instancia Evolution</label>
                                    <div className="relative">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-sm outline-none focus:border-emerald-500/50 transition-all"
                                            value={formData.evolution_instance}
                                            onChange={e => setFormData({ ...formData, evolution_instance: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">URL de API</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-sm outline-none focus:border-emerald-500/50 transition-all"
                                            value={formData.evolution_api_url}
                                            onChange={e => setFormData({ ...formData, evolution_api_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">API Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={16} />
                                        <input
                                            type="password"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-sm outline-none focus:border-emerald-500/50 transition-all"
                                            value={formData.evolution_api_key}
                                            onChange={e => setFormData({ ...formData, evolution_api_key: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">WhatsApp Recipient (Hooks)</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" size={16} />
                                        <input
                                            type="text"
                                            placeholder="ej: 528711439941"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-sm outline-none focus:border-cyan-500/50 transition-all"
                                            value={formData.whatsapp_recipient_phone}
                                            onChange={e => setFormData({ ...formData, whatsapp_recipient_phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-full">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">URL de Conocimiento (Página Web)</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50" size={16} />
                                            <input
                                                type="url"
                                                placeholder="https://ejemplo.com"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-sm outline-none focus:border-indigo-500/50 transition-all font-tech"
                                                value={formData.websiteUrl}
                                                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-[8px] text-slate-600 italic ml-4 font-bold uppercase tracking-tighter">* Usado para alimentar el cerebro de la IA.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveTenant}
                            disabled={isSaving}
                            className={`w-full py-5 ${isEditing ? 'bg-emerald-600' : 'bg-indigo-600'} text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3`}
                        >
                            {isSaving ? 'Procesando Núcleo...' : isEditing ? 'Actualizar Configuración' : 'Registrar en Supabase'}
                            <Save size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold text-sm outline-none"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-slate-900/40 border border-white/5 rounded-3xl animate-pulse" />
                        ))
                    ) : filteredTenants.map(t => (
                        <div key={t.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl ${t.primaryColor} flex items-center justify-center shadow-lg border border-white/10`}>
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(t)}
                                        className="p-2 text-slate-700 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTenant(t.id)}
                                        className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase text-xs tracking-widest truncate">{t.name}</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">ID: {t.id}</p>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-emerald-500" />
                                        <span className="text-[10px] text-emerald-500/80 font-black uppercase tracking-widest truncate">{t.agentName}</span>
                                    </div>
                                    {t.evolution_instance && (
                                        <div className="flex items-center gap-2">
                                            <Activity size={10} className="text-indigo-500" />
                                            <span className="text-[8px] text-indigo-400 font-bold uppercase truncate">{t.evolution_instance}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
