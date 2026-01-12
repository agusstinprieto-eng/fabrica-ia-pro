import React, { useState } from 'react';

interface GalleryItem {
    id: string;
    title: string;
    category: 'Layout' | 'Workstation' | 'Method' | 'Before/After' | 'Ergonomics';
    description: string;
    imageUrl: string;
    tags: string[];
    location?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: '1',
        title: 'U-Shaped Production Line',
        category: 'Layout',
        description: 'Optimized flow reducing operator walking time by 40%',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
        tags: ['Lean', 'Flow', 'Bangladesh'],
        location: 'Dhaka, Bangladesh',
    },
    {
        id: '2',
        title: 'Ergonomic Sewing Station',
        category: 'Workstation',
        description: 'Height-adjustable chair and proper lighting implementation',
        imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
        tags: ['Ergonomics', 'Safety', 'Vietnam'],
        location: 'Ho Chi Minh, Vietnam',
    },
    {
        id: '3',
        title: 'Bundle System vs. Single Piece Flow',
        category: 'Method',
        description: 'Comparative analysis showing 25% efficiency gain',
        imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800',
        tags: ['Method', 'Efficiency', 'Mexico'],
        location: 'Tijuana, Mexico',
    },
    {
        id: '4',
        title: 'Plant Layout Transformation',
        category: 'Before/After',
        description: 'From traditional to modular production layout',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee67ead760cf?w=800',
        tags: ['Kaizen', 'Improvement', 'Honduras'],
        location: 'San Pedro Sula, Honduras',
    },
    {
        id: '5',
        title: 'Proper Material Positioning',
        category: 'Ergonomics',
        description: 'Reducing reach distance and repetitive strain',
        imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800',
        tags: ['Ergonomics', 'Reach', 'Cambodia'],
        location: 'Phnom Penh, Cambodia',
    },
    {
        id: '6',
        title: 'Cellular Manufacturing Setup',
        category: 'Layout',
        description: 'Self-contained cells for complete garment production',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800',
        tags: ['Cellular', 'Lean', 'Ethiopia'],
        location: 'Addis Ababa, Ethiopia',
    },
    {
        id: '7',
        title: 'Inline Quality Control',
        category: 'Method',
        description: 'Defect detection at each operation step',
        imageUrl: 'https://images.unsplash.com/photo-1581092583537-20d51876f650?w=800',
        tags: ['Quality', 'Control', 'China'],
        location: 'Guangzhou, China',
    },
    {
        id: '8',
        title: 'Lighting Optimization',
        category: 'Ergonomics',
        description: '1000 lux task lighting reducing eye strain',
        imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800',
        tags: ['Lighting', 'Health', 'Colombia'],
        location: 'Medellín, Colombia',
    },
];

const CATEGORIES = ['All', 'Layout', 'Workstation', 'Method', 'Before/After', 'Ergonomics'] as const;

const PhotoGalleryView: React.FC = () => {
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = GALLERY_ITEMS.filter((item) => {
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Layout': return 'bg-cyber-blue/20 text-cyber-blue';
            case 'Workstation': return 'bg-emerald-500/20 text-emerald-400';
            case 'Method': return 'bg-purple-500/20 text-purple-400';
            case 'Before/After': return 'bg-yellow-500/20 text-yellow-400';
            case 'Ergonomics': return 'bg-pink-500/20 text-pink-400';
            default: return 'bg-zinc-500/20 text-zinc-400';
        }
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        <i className="fas fa-images text-cyber-blue mr-3"></i>
                        Photo Gallery
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Visual showcase of industrial manufacturing layouts and methods
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="bg-cyber-dark border border-cyber-blue/30 rounded-2xl p-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title, tags, or location..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white text-sm focus:border-cyber-blue outline-none"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${categoryFilter === cat
                                        ? 'bg-cyber-blue text-black'
                                        : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4">
                    {CATEGORIES.slice(1).map((cat) => (
                        <div key={cat} className="bg-cyber-dark border border-white/10 p-4 rounded-xl text-center">
                            <p className="text-2xl font-black text-white">
                                {GALLERY_ITEMS.filter((item) => item.category === cat).length}
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase">{cat}</p>
                        </div>
                    ))}
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedImage(item)}
                            className="group cursor-pointer bg-cyber-dark border border-white/10 rounded-2xl overflow-hidden hover:border-cyber-blue/50 transition-all hover:scale-105"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-zinc-900 overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <span
                                    className={`absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded ${getCategoryColor(
                                        item.category
                                    )}`}
                                >
                                    {item.category}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-lg font-black text-white mb-2 group-hover:text-cyber-blue transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.description}</p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {item.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="text-[9px] px-2 py-0.5 bg-white/5 text-zinc-600 rounded font-mono"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Location */}
                                {item.location && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                                        <i className="fas fa-map-marker-alt"></i>
                                        <span>{item.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-16">
                        <i className="fas fa-image text-5xl text-zinc-700 mb-4"></i>
                        <p className="text-zinc-500">No images found matching your filters</p>
                    </div>
                )}

                {/* Lightbox Modal */}
                {selectedImage && (
                    <div
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-5xl w-full bg-cyber-dark border border-cyber-blue rounded-2xl overflow-hidden"
                        >
                            <img
                                src={selectedImage.imageUrl}
                                alt={selectedImage.title}
                                className="w-full max-h-[60vh] object-contain bg-black"
                            />
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2">{selectedImage.title}</h3>
                                        <p className="text-sm text-zinc-400">{selectedImage.description}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedImage.tags.map((tag, index) => (
                                            <span key={index} className="text-xs px-3 py-1 bg-cyber-blue/20 text-cyber-blue rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    {selectedImage.location && (
                                        <span className="text-sm text-zinc-500">
                                            <i className="fas fa-map-marker-alt mr-2"></i>
                                            {selectedImage.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoGalleryView;
