export type BusinessNiche = 'medical' | 'legal' | 'dentist' | 'beauty' | 'consultancy' | 'general' | 'industrial' | 'real_estate' | 'hr';

export enum ServiceType {
    GAS_30KG = 'Gas 30kg',
    GAS_ESTACIONARIO = 'Gas Estacionario',
    GARRAFON_AWA = 'Garrafón AWA',
    MANTENIMIENTO = 'Mantenimiento',
    AGUA_DOMICILIO = 'Agua a Domicilio'
}

export enum CallStatus {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR'
}

export enum OrderStatus {
    PENDING = 'Pendiente',
    IN_PROGRESS = 'En camino',
    DELIVERED = 'Entregado',
    CANCELLED = 'Cancelado'
}

export interface Customer {
    id?: string;
    tenant_id: string;
    name?: string;
    phone?: string;
    additional_phones?: string[];
    email?: string;
    address?: string;
    notes?: string;
    tags?: string[];
    metadata?: any;
    created_at?: string;
    updated_at?: string;
    // Legacy support (Audit/Call Center)
    nombre_cliente?: string;
    telefono?: string;
    servicio?: string;
    distancia_chofer?: number;
    hora_reporte?: string;
}

export interface Tenant {
    id: string;
    name: string;
    agentName?: string;
    agentVoice?: string;
    websiteUrl?: string;
    primaryColor: string;
    logoColor?: string;
    systemInstruction?: string;
    customers?: Customer[];
    logoUrl?: string;
    niche?: BusinessNiche;
    aplicacion?: string; // Added for unification
    // WhatsApp Integration
    whatsapp_provider?: 'meta' | 'evolution';
    whatsapp_phone_id?: string;
    whatsapp_token?: string;
    whatsapp_business_id?: string;
    whatsapp_recipient_phone?: string;
    whatsapp_auto_send?: boolean;
    evolution_api_url?: string;
    evolution_api_key?: string;
    evolution_instance?: string;
    // ERP & External Systems
    erp_type?: 'sap' | 'oracle' | 'dynamics' | 'other' | 'none';
    erp_endpoint?: string;
    erp_api_key?: string;
    erp_status?: 'connected' | 'error' | 'disconnected';
    ai_engine?: 'gemini' | 'deepseek' | 'together' | 'openrouter' | 'opencode';
    deepseek_api_key?: string;
    together_api_key?: string;
    openrouter_api_key?: string;
    opencode_url?: string;
    // Company info fields
    contactName?: string;
    contactPhone?: string;
    address?: string;
    businessType?: string;
    exchangeRate?: number;
    // External Call Provider
    call_provider_url?: string;
    call_provider_api_key?: string;
    // Telegram Integration
    telegram_bot_token?: string;
    telegram_chat_id?: string;
    telegram_enabled?: boolean;
    // CRM Integration
    crm_type?: 'hubspot' | 'zoho' | 'none';
    crm_api_key?: string;
    crm_endpoint?: string;
    crm_enabled?: boolean;
    active_modality?: 'text' | 'voice' | 'call' | 'off';
}

export interface InteractiveAction {
    id: string;
    title: string;
    description?: string;
    type?: 'reply' | 'list';
}

export interface TranscriptionEntry {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    interactive?: {
        type: 'button' | 'list';
        title?: string;
        body?: string;
        footer?: string;
        actions: InteractiveAction[];
    };
}

export interface CallRecord {
    id: string;
    tenantId: string;
    customer: Customer;
    transcriptions: TranscriptionEntry[];
    summary: string;
    timestamp: number;
}

export interface Order {
    id: string;
    tenantId: string;
    customerName: string;
    customerPhone: string;
    product: string;
    quantity: string;
    address: string;
    notes: string;
    status: OrderStatus;
    timestamp: number;
    transcriptions?: TranscriptionEntry[];
}

export interface CompanyDocument {
    id: string;
    tenantId: string;
    name: string;
    size: number;
    content: string;
    uploadedAt: number;
}

export interface SentimentPoint {
    time: number;
    score: number;
}

export interface Appointment {
    id: string;
    tenant_id: string;
    customer_name: string;
    customer_phone: string;
    date: string;
    time: string;
    subject?: string;
    type?: string;
    status: 'scheduled' | 'cancelled' | 'completed';
    notes?: string;
}

export const BRAND_THEMES: Record<string, { bg: string, text: string, border: string, ring: string, ghost: string, hoverBg: string, pulse: string }> = {
    orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', ring: 'ring-orange-500/50', ghost: 'bg-orange-500/10 text-orange-400', hoverBg: 'hover:bg-orange-600', pulse: 'shadow-[0_0_30px_rgba(249,115,22,0.6)]' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-500', border: 'border-blue-500', ring: 'ring-blue-500/50', ghost: 'bg-blue-500/10 text-blue-400', hoverBg: 'hover:bg-blue-700', pulse: 'shadow-[0_0_30px_rgba(37,99,235,0.6)]' },
    red: { bg: 'bg-red-600', text: 'text-red-500', border: 'border-red-500', ring: 'ring-red-500/50', ghost: 'bg-red-500/10 text-red-400', hoverBg: 'hover:bg-red-700', pulse: 'shadow-[0_0_30px_rgba(220,38,38,0.6)]' },
    green: { bg: 'bg-green-600', text: 'text-green-500', border: 'border-green-500', ring: 'ring-green-500/50', ghost: 'bg-green-500/10 text-green-400', hoverBg: 'hover:bg-green-700', pulse: 'shadow-[0_0_30px_rgba(22,163,74,0.6)]' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-500', border: 'border-violet-500', ring: 'ring-violet-500/50', ghost: 'bg-violet-500/10 text-violet-400', hoverBg: 'hover:bg-violet-700', pulse: 'shadow-[0_0_30px_rgba(124,58,237,0.6)]' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500/50', ghost: 'bg-emerald-500/10 text-emerald-400', hoverBg: 'hover:bg-emerald-700', pulse: 'shadow-[0_0_30px_rgba(16,185,129,0.6)]' },
};
