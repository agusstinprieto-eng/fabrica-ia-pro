import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Paintbrush,
    Sparkles,
    Layers,
    Layout,
    Square,
    ChevronRight,
    Download,
    Share2,
    Undo,
    Trash2,
    Armchair,
    Table,
    Lamp,
    Bed,
    Briefcase,
    TreePine,
    Bath,
    Store,
    Martini,
    Maximize2,
    PenTool,
    Copy,
    Check,
    Wand2,
    Palette,
    Brain,
    Info
} from 'lucide-react';
import { generateFurnitureConcept } from '../../services/geminiService';

interface Concept {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    type: string;
    material: string;
    rationale: string;
    imagePrompt: string;
    style: string;
    timestamp: string;
}

interface GenerativeDesignViewProps {
    language: 'es' | 'en';
    files: any[];
    setFiles: (files: any[]) => void;
}

const GenerativeDesignView: React.FC<GenerativeDesignViewProps> = ({ language }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('Japandi');
    const [selectedCategory, setSelectedCategory] = useState('Salas');
    const [selectedMaterial, setSelectedMaterial] = useState('Natural Wood');
    const [selectedFabric, setSelectedFabric] = useState('Linen');
    const [selectedColor, setSelectedColor] = useState('Sand');
    const [designerBrand, setDesignerBrand] = useState('IA-AGUS STUDIO');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [history, setHistory] = useState<Concept[]>([]);
    const [copied, setCopied] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    const categories = [
        { id: 'Salas', icon: Armchair, label: language === 'es' ? 'Salas' : 'Living Rooms' },
        { id: 'Comedores', icon: Table, label: language === 'es' ? 'Comedores' : 'Dining' },
        { id: 'Cocinas', icon: Layout, label: language === 'es' ? 'Cocinas' : 'Kitchens' },
        { id: 'Recamaras', icon: Bed, label: language === 'es' ? 'Recámaras' : 'Bedrooms' },
        { id: 'Oficinas', icon: Briefcase, label: language === 'es' ? 'Oficinas' : 'Offices' },
        { id: 'Exteriores', icon: TreePine, label: language === 'es' ? 'Exteriores' : 'Outdoor' },
        { id: 'Baños', icon: Bath, label: language === 'es' ? 'Baños' : 'Bathrooms' },
        { id: 'Bar', icon: Martini, label: language === 'es' ? 'Bar / Lounge' : 'Bar & Lounge' },
        { id: 'Comercial', icon: Store, label: language === 'es' ? 'Comercial' : 'Commercial' },
        { id: 'Accesorios', icon: Lamp, label: language === 'es' ? 'Accesorios' : 'Decor' }
    ];

    const materials = ['Natural Wood', 'Walnut', 'Brushed Metal', 'Industrial Steel', 'Marble', 'Granite', 'Quartz', 'Concrete', 'Porcelain'];
    const fabrics = ['Linen', 'Velvet', 'Leather', 'Bouclé', 'Cotton Canvas'];
    const colors = ['Sand', 'Charcoal', 'Forest Green', 'Navy Blue', 'Terracotta', 'Cream', 'Graphite', 'Oak Finish', 'Black Matte'];
    const styles = ['Japandi', 'Industrial', 'Minimalist', 'Mid-Century'];

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setShowPrompt(true);

        try {
            const categoryMapping: Record<string, string> = {
                'Salas': 'Living Rooms',
                'Comedores': 'Dining',
                'Cocinas': 'Kitchens',
                'Recamaras': 'Bedrooms',
                'Oficinas': 'Home Office',
                'Exteriores': 'Outdoor Furniture',
                'Baños': 'Bathroom & Spa',
                'Bar': 'Bar & Lounge Furniture',
                'Comercial': 'Commercial & Retail Spaces',
                'Accesorios': 'Decor & Accessories'
            };
            const categoryLabel = categoryMapping[selectedCategory] || selectedCategory;

            // Progress simulation for better UX feedback
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 600);

            const combinedPrompt = `${prompt}. Designer Brand/Signature: ${designerBrand}. Primary Material: ${selectedMaterial}. Fabric/Texture: ${selectedFabric}. Color Palette: ${selectedColor}.`;
            const conceptsData = await generateFurnitureConcept(
                combinedPrompt,
                categoryLabel,
                selectedStyle,
                selectedMaterial,
                selectedFabric,
                selectedColor
            );

            clearInterval(progressInterval);
            setProgress(100);

            const newConcepts = conceptsData.map((data: any, index: number) => {
                const seed = Math.floor(Math.random() * 1000000) + index;
                // Use a more descriptive prompt for Pollinations and fix the URL template
                const cleanPrompt = data.imagePrompt.replace(/['"]/g, '');
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1280&height=720&nologo=true&model=flux&seed=${seed}`;

                return {
                    id: `${Date.now()}-${index}`,
                    ...data,
                    imageUrl,
                    timestamp: new Date().toLocaleTimeString()
                };
            });

            setHistory([...newConcepts, ...history]);
            setPrompt('');
        } catch (error) {
            console.error("Generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full bg-industrial-bg overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fas fa-pencil-ruler text-industrial-accent"></i>
                            {language === 'es' ? 'Diseño Generativo' : 'Generative Design'}
                            <span className="text-xs bg-industrial-accent/20 text-industrial-accent px-2 py-0.5 rounded-full border border-industrial-accent/30 animate-pulse">AI PRO</span>
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            {language === 'es' ? 'Co-creación de conceptos de muebles con lenguaje natural' : 'Furniture co-creation concepts using natural language'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-black/40 backdrop-blur-xl border border-industrial-accent/20 rounded-3xl p-6 space-y-6">
                            {/* Categories */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                                    {language === 'es' ? 'Selección de Categoría' : 'Category Selection'}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`flex-1 group relative p-4 rounded-2xl border transition-all duration-300 ${selectedCategory === cat.id
                                                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {selectedCategory === cat.id && (
                                                <motion.div
                                                    layoutId="categoryGlow"
                                                    className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xl"
                                                />
                                            )}
                                            <div className="relative z-10 flex items-center gap-3">
                                                <cat.icon size={16} />
                                                <span className="text-[10px] font-bold uppercase">{cat.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Material Selectors */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* Primary Material (Wood/Metal) */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                                        {language === 'es' ? 'Material Principal' : 'Primary Material'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {materials.map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedMaterial(m)}
                                                className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all duration-300 ${selectedMaterial === m
                                                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Fabric & Color (Relevant categories) */}
                                {(selectedCategory === 'Salas' || selectedCategory === 'Accesorios' || selectedCategory === 'Comedores' || selectedCategory === 'Cocinas' || selectedCategory === 'Recamaras' || selectedCategory === 'Oficinas' || selectedCategory === 'Exteriores' || selectedCategory === 'Baños' || selectedCategory === 'Bar' || selectedCategory === 'Comercial') && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                                                {selectedCategory === 'Cocinas' || selectedCategory === 'Baños' || selectedCategory === 'Comercial'
                                                    ? (language === 'es' ? 'Acabado / Textura' : 'Finish / Texture')
                                                    : (language === 'es' ? 'Tela / Textura' : 'Fabric / Texture')
                                                }
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedCategory === 'Cocinas' || selectedCategory === 'Baños' || selectedCategory === 'Comercial' ? ['Polished', 'Matte', 'Textured', 'High Gloss'] :
                                                    selectedCategory === 'Exteriores' ? ['Weather-proof', 'Canvas', 'Rope', 'Woven'] :
                                                        fabrics).map((f) => (
                                                            <button
                                                                key={f}
                                                                onClick={() => setSelectedFabric(f)}
                                                                className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all duration-300 ${selectedFabric === f
                                                                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                                    }`}
                                                            >
                                                                {f}
                                                            </button>
                                                        ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                                                {language === 'es' ? 'Paleta de Color' : 'Color Palette'}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {colors.map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setSelectedColor(c)}
                                                        className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all duration-300 ${selectedColor === c
                                                            ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Styles */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                                    {language === 'es' ? 'Estilo Visual' : 'Visual Style'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {styles.map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setSelectedStyle(style as any)}
                                            className={`group relative p-3 rounded-lg border text-[10px] font-bold uppercase transition-all duration-300 ${selectedStyle === style
                                                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {selectedStyle === style && (
                                                <motion.div
                                                    layoutId="styleGlow"
                                                    className="absolute inset-0 rounded-lg bg-cyan-500/10 blur-lg"
                                                />
                                            )}
                                            <span className="relative z-10">{style}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Designer Brand Input */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <PenTool size={12} className="text-cyan-400" />
                                    {language === 'es' ? 'Firma / Marca del Diseñador' : 'Designer Signature / Brand'}
                                </label>
                                <input
                                    type="text"
                                    value={designerBrand}
                                    onChange={(e) => setDesignerBrand(e.target.value)}
                                    placeholder={language === 'es' ? 'Tu marca personal...' : 'Your personal brand...'}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-400/50 transition-all"
                                />
                            </div>

                            {/* Prompt Input */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Sparkles size={12} className="text-industrial-accent" />
                                    {language === 'es' ? 'Instrucciones IA' : 'AI Instructions'}
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={language === 'es' ? 'Describe el mueble de tus sueños...' : 'Describe your dream furniture...'}
                                    className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-industrial-accent/50 transition-all resize-none"
                                />
                            </div>

                            {/* Generate Button with Progress */}
                            <div className="space-y-4">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt.trim()}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all relative overflow-hidden ${isGenerating || !prompt.trim()
                                        ? 'bg-zinc-800 text-white/50 cursor-not-allowed border border-white/5'
                                        : 'bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] active:scale-[0.98]'
                                        }`}
                                >
                                    {/* Progress Background */}
                                    {isGenerating && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="absolute inset-0 bg-white/20 z-0"
                                        />
                                    )}

                                    <span className="relative z-10 flex items-center gap-3">
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                {language === 'es' ? `Generando... ${progress}%` : `Generating... ${progress}%`}
                                            </>
                                        ) : (
                                            <>
                                                {language === 'es' ? 'Crear Concepto' : 'Create Concept'}
                                                <Paintbrush size={16} />
                                            </>
                                        )}
                                    </span>
                                </button>

                                {isGenerating && (
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trend Analysis Card */}
                        <div className="bg-industrial-accent/5 border border-industrial-accent/20 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-industrial-accent uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} />
                                    {language === 'es' ? 'Análisis de Tendencias' : 'Trend Analysis'}
                                </h3>
                                <div className="text-[10px] font-bold text-emerald-500">+12% Demand</div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-zinc-300 uppercase">Japandi Style</span>
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-industrial-accent w-[85%]" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-zinc-300 uppercase">Sustainable Wood</span>
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-industrial-accent w-[60%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Results & History */}
                    <div className="lg:col-span-8 space-y-8">
                        <AnimatePresence mode="wait">
                            {isGenerating ? (
                                <motion.div
                                    key="loader"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-[500px] border border-industrial-accent/20 rounded-[3rem] bg-black/40 flex flex-col items-center justify-center text-center space-y-6 p-8"
                                >
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-industrial-accent/20 rounded-full border-t-industrial-accent animate-spin" />
                                        <Sparkles className="absolute inset-0 m-auto text-industrial-accent animate-pulse" size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-white uppercase tracking-widest">{language === 'es' ? 'Diseñando 5 Conceptos AI...' : 'Designing 5 AI Concepts...'}</p>
                                        <p className="text-zinc-500 text-sm max-w-sm">{language === 'es' ? 'Generando variaciones estructurales y estéticas en inglés.' : 'Generating structural and aesthetic variations in English.'}</p>
                                    </div>
                                </motion.div>
                            ) : history.length > 0 ? (
                                <div className="space-y-12">
                                    {history.slice(0, 5).map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="relative group"
                                        >
                                            <div className="rounded-[3rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl overflow-hidden">
                                                <div className="grid grid-cols-1 md:grid-cols-2">
                                                    {/* Image Section */}
                                                    <div className="h-[400px] relative overflow-hidden group bg-zinc-900 flex items-center justify-center">
                                                        <img
                                                            src={item.imageUrl}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            alt={item.title}
                                                            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                                            style={{ opacity: '0', transition: 'opacity 0.5s' }}
                                                        />
                                                        {/* Loading State for Image */}
                                                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                                                            <div className="w-10 h-10 border-2 border-industrial-accent/20 border-t-industrial-accent rounded-full animate-spin" />
                                                        </div>
                                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                                                        <div className="absolute bottom-6 left-6 flex gap-2">
                                                            <span className="px-3 py-1 rounded-full bg-industrial-accent text-white text-[10px] font-black uppercase shadow-lg">
                                                                {item.style}
                                                            </span>
                                                            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase backdrop-blur-md border border-white/20">
                                                                {item.material}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Info & Prompt Section */}
                                                    <div className="p-8 flex flex-col justify-between space-y-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                                                                    {item.title}
                                                                </h3>
                                                                <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                                                            </div>
                                                            <p className="text-zinc-300 text-sm leading-relaxed">
                                                                {item.description}
                                                            </p>

                                                            {/* Rationale Tag */}
                                                            <div className="bg-industrial-accent/10 border border-industrial-accent/20 p-3 rounded-xl">
                                                                <p className="text-[10px] text-zinc-400 italic">
                                                                    <Brain size={12} className="inline mr-2 text-industrial-accent" />
                                                                    {item.rationale}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Prompt Lab Panel - Always Visible as requested */}
                                                        <div className="bg-black/60 border border-white/5 rounded-2xl p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[9px] font-black text-industrial-accent uppercase tracking-widest flex items-center gap-2">
                                                                    <Wand2 size={10} />
                                                                    AI DESIGN PROMPT
                                                                </h4>
                                                                <button
                                                                    onClick={() => copyToClipboard(item.imagePrompt)}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${copied
                                                                        ? 'bg-emerald-500 border-emerald-400 text-white'
                                                                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                                        }`}
                                                                >
                                                                    {copied ? <Check size={10} /> : <Copy size={10} />}
                                                                    {copied ? 'COPIED' : 'COPY'}
                                                                </button>
                                                            </div>
                                                            <p className="text-zinc-400 font-mono text-[11px] leading-tight select-all cursor-text">
                                                                {item.imagePrompt}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <button className="flex-1 h-12 rounded-xl bg-industrial-accent text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-industrial-accent/90 transition-all shadow-lg">
                                                                {language === 'es' ? 'Exportar' : 'Export'}
                                                                <Download size={16} />
                                                            </button>
                                                            <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                                                                <Maximize2 size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[500px] border border-dashed border-white/10 rounded-[3rem] bg-white/5 flex flex-col items-center justify-center text-center p-8 space-y-4"
                                >
                                    <div className="w-20 h-20 rounded-full bg-industrial-accent/5 flex items-center justify-center">
                                        <PenTool size={32} className="text-industrial-accent/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-white uppercase tracking-widest">{language === 'es' ? 'Esperando tu creatividad' : 'Awaiting your creativity'}</p>
                                        <p className="text-zinc-400 text-sm max-w-xs">{language === 'es' ? 'Describe un mueble a la izquierda para comenzar el proceso de diseño generativo.' : 'Describe a piece of furniture on the left to begin the generative design process.'}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Recent Generations */}
                        {history.length > 1 && (
                            <div className="space-y-4 pt-4">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-1">{language === 'es' ? 'Historial de Co-creación' : 'Co-creation History'}</h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {history.slice(1, 5).map((item) => (
                                        <div key={item.id} className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5 group cursor-pointer relative">
                                            <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 size={24} className="text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default GenerativeDesignView;
