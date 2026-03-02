import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Armchair,
    ColumnsIcon,
    Lamp,
    Layout,
    Heart,
    Share2,
    Maximize2,
    ChevronRight,
    Sparkles,
    ShoppingBag,
    Table
} from 'lucide-react';

interface FurnitureItem {
    id: string;
    title: string;
    category: 'Salas' | 'Comedores' | 'Cocinas' | 'Oficinas' | 'Dormitorios';
    price: string;
    imageUrl: string;
    description: string;
    status: 'In Stock' | 'Custom Only' | 'New Design';
}

const GALLERY_DATA: FurnitureItem[] = [
    {
        id: '1',
        title: 'Sofá Modular Nordit',
        category: 'Salas',
        price: '$1,299',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
        description: 'Sofá de alto impacto con diseño minimalista y textiles repelentes.',
        status: 'In Stock'
    },
    {
        id: '2',
        title: 'Mesa Roble Centenaria',
        category: 'Comedores',
        price: 'Contract',
        imageUrl: 'https://images.unsplash.com/photo-1530018607912-eff2df114f11?auto=format&fit=crop&q=80&w=800',
        description: 'Madera sólida con acabado industrial rústico. Una pieza central eterna.',
        status: 'Custom Only'
    },
    {
        id: '3',
        title: 'Gourmet Tech Chef',
        category: 'Cocinas',
        price: '$4,500+',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800',
        description: 'Islas de cocina integradas con herrajes de amortiguación inteligente.',
        status: 'New Design'
    },
    {
        id: '4',
        title: 'Escritorio Executive Pro',
        category: 'Oficinas',
        price: '$850',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800',
        description: 'Ergonomía superior con gestión de cables invisible y madera premium.',
        status: 'In Stock'
    },
    {
        id: '5',
        title: 'Sillón Eames Vibe',
        category: 'Salas',
        price: '$450',
        imageUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=800',
        description: 'Réplica de alta fidelidad con materiales sostenibles y cuero ecológico.',
        status: 'In Stock'
    },
    {
        id: '6',
        title: 'Cama Loft Minimal',
        category: 'Dormitorios',
        price: '$1,100',
        imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=800',
        description: 'Estructura flotante de bajo perfil con iluminación LED integrada.',
        status: 'Custom Only'
    }
];

const FurnitureGalleryView: React.FC<{ language: 'es' | 'en' }> = ({ language }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { id: 'All', icon: Layout, label: language === 'es' ? 'Todo' : 'All' },
        { id: 'Salas', icon: Armchair, label: language === 'es' ? 'Salas' : 'Living' },
        { id: 'Comedores', icon: Table, label: language === 'es' ? 'Comedores' : 'Dining' },
        { id: 'Cocinas', icon: ColumnsIcon, label: language === 'es' ? 'Cocinas' : 'Kitchen' },
        { id: 'Oficinas', icon: Lamp, label: language === 'es' ? 'Oficinas' : 'Office' }
    ];

    const filteredItems = GALLERY_DATA.filter((item) => {
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="h-full bg-industrial-bg overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fas fa-couch text-industrial-accent"></i>
                            {language === 'es' ? 'Galería Premium' : 'Premium Gallery'}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            {language === 'es' ? 'Catálogo exclusivo para clientes y showroom digital' : 'Exclusive catalog for clients and digital showroom'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-industrial-accent transition-colors" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={language === 'es' ? 'Buscar modelos...' : 'Search models...'}
                                className="bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-industrial-accent/50 transition-all w-64"
                            />
                        </div>
                        <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:border-industrial-accent transition-all">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* Categories Scrollable */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all whitespace-nowrap ${selectedCategory === cat.id
                                    ? 'bg-industrial-accent text-black border-industrial-accent shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                    : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/30'
                                }`}
                        >
                            <cat.icon size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item) => (
                        <motion.div
                            key={item.id}
                            layoutId={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative bg-black/40 border border-white/10 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-industrial-accent/50 transition-all"
                        >
                            {/* Image Container */}
                            <div className="aspect-[4/3] overflow-hidden relative">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                                {/* Float Tags */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="bg-black/80 backdrop-blur-md border border-white/10 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">
                                        {item.category}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-industrial-accent hover:text-black transition-all">
                                        <Heart size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-industrial-accent transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'In Stock' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-orange-500 shadow-[0_0_5px_#f59e0b]'}`} />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.status}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-industrial-accent">{item.price}</p>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-6">
                                    {item.description}
                                </p>

                                <div className="flex gap-2">
                                    <button className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                        <Maximize2 size={12} />
                                        {language === 'es' ? 'Ver Detalles' : 'Details'}
                                    </button>
                                    <button className="flex-1 px-4 py-3 rounded-xl bg-industrial-accent text-black text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2">
                                        <Sparkles size={12} />
                                        {language === 'es' ? 'Visualizar RA' : 'AR View'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Modal Detail Overlay */}
                <AnimatePresence>
                    {selectedItem && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedItem(null)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            />
                            <motion.div
                                layoutId={selectedItem.id}
                                className="relative w-full max-w-5xl bg-industrial-dark border border-industrial-accent/30 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-2"
                            >
                                <div className="h-full min-h-[400px]">
                                    <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt={selectedItem.title} />
                                </div>
                                <div className="p-12 space-y-8 flex flex-col justify-center">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-full bg-industrial-accent/20 text-industrial-accent text-[10px] font-black uppercase border border-industrial-accent/30">Premium Class</span>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Ref ID: {selectedItem.id}FPRO</span>
                                        </div>
                                        <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{selectedItem.title}</h2>
                                        <p className="text-zinc-400 text-sm leading-relaxed">{selectedItem.description} Built with Industrial-Pro standards for demanding architects and interior designers.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Pricing</p>
                                            <p className="text-2xl font-black text-industrial-accent">{selectedItem.price}</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Lead Time</p>
                                            <p className="text-2xl font-black text-white">2-3 Weeks</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button className="flex-1 h-16 rounded-2xl bg-industrial-accent text-black font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all">
                                            <ShoppingBag size={20} />
                                            {language === 'es' ? 'Cotizar Ahora' : 'Get Quote'}
                                        </button>
                                        <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all">
                                            <Share2 size={24} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FurnitureGalleryView;
