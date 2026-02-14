import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { uploadAndIndexDocument } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import {
    FileText,
    FileSpreadsheet,
    FileIcon,
    Upload,
    X,
    Loader2,
    Database,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface Document {
    id: string;
    name: string;
    size: string;
    type: string;
    status: 'uploading' | 'indexing' | 'active' | 'error';
    progress: number;
    url?: string;
}

const DocumentManager: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText className="text-red-400" />;
        if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="text-emerald-400" />;
        return <FileIcon className="text-blue-400" />;
    };


    const { user } = useAuth();

    // Fetch documents on mount
    React.useEffect(() => {
        if (!user) return;
        const fetchDocs = async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('company_id', user.company) // Simple tenancy filter
                .order('created_at', { ascending: false });

            if (data) {
                setDocuments(data.map(d => ({
                    id: d.id,
                    name: d.name,
                    size: 'Unknown', // Metadata might be missing
                    type: d.type || 'application/pdf',
                    status: 'active',
                    progress: 100,
                    url: d.url
                })));
            }
        };
        fetchDocs();
    }, [user]);

    const uploadFile = async (file: File) => {
        if (!user) return;

        const newDoc: Document = {
            id: Math.random().toString(36).substr(2, 9), // Temp ID
            name: file.name,
            size: formatSize(file.size),
            type: file.type,
            status: 'uploading',
            progress: 0
        };

        setDocuments(prev => [newDoc, ...prev]);

        try {
            // Simulator progress for UX while uploading
            const interval = setInterval(() => {
                setDocuments(prev => prev.map(d =>
                    d.id === newDoc.id && d.progress < 90 ? { ...d, progress: d.progress + 10 } : d
                ));
            }, 500);

            await uploadAndIndexDocument(file, user.company);

            clearInterval(interval);
            setDocuments(prev => prev.map(d =>
                d.id === newDoc.id ? { ...d, status: 'active', progress: 100 } : d
            ));
        } catch (error) {
            console.error("Upload failed", error);
            setDocuments(prev => prev.map(d =>
                d.id === newDoc.id ? { ...d, status: 'error' } : d
            ));
        }
    };


    const handleFiles = (files: FileList) => {
        Array.from(files).forEach(file => uploadFile(file));
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const removeDoc = (id: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
    };

    return (
        <div className="space-y-6">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-2xl p-8 transition-all text-center group cursor-pointer
                    ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/40 bg-black/20'}`}
            >
                <input
                    type="file"
                    multiple
                    className="hidden"
                    id="manufactura-doc-upload"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <label htmlFor="manufactura-doc-upload" className="cursor-pointer">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="text-cyan-400" size={32} />
                    </div>
                    <h4 className="font-black text-white text-lg mb-2 uppercase tracking-tighter">CENTRO DE INTELIGENCIA TÉCNICA</h4>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
                        PDF, DOCX, XLSX o TXT · Arrastre manuales de planta aquí
                    </p>
                </label>
            </div>

            {documents.length > 0 && (
                <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Base de Conocimiento Activa</span>
                        <span className="text-[10px] font-mono text-zinc-500">{documents.length} DOCUMENTOS</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {documents.map(doc => (
                            <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                                <div className="p-2 bg-black/40 rounded-lg">
                                    {getFileIcon(doc.type)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="text-sm font-bold text-white truncate pr-4 uppercase tracking-tight">{doc.name}</h5>
                                        <button
                                            onClick={() => removeDoc(doc.id)}
                                            className="text-zinc-600 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase">
                                        <span>{doc.size}</span>
                                        <span>•</span>
                                        <span className={`flex items-center gap-1 ${doc.status === 'active' ? 'text-emerald-400' :
                                            doc.status === 'error' ? 'text-red-400' : 'text-cyan-400'
                                            }`}>
                                            {doc.status === 'uploading' && <Loader2 size={10} className="animate-spin" />}
                                            {doc.status === 'indexing' && <Database size={10} className="animate-pulse" />}
                                            {doc.status === 'active' && <CheckCircle2 size={10} />}
                                            {doc.status === 'error' && <AlertCircle size={10} />}
                                            {doc.status === 'uploading' ? `Cargando ${Math.round(doc.progress)}%` :
                                                doc.status === 'indexing' ? 'Indexando en Vector DB' :
                                                    doc.status === 'active' ? 'Activo en Cerebro IA' : 'Error de carga'}
                                        </span>
                                    </div>
                                    {doc.status === 'uploading' && (
                                        <div className="w-full h-1 bg-black/40 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-300"
                                                style={{ width: `${doc.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManager;
