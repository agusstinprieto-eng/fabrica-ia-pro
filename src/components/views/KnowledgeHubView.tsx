import React, { useState } from 'react';

interface Resource {
    id: string;
    title: string;
    type: 'course' | 'video' | 'pdf';
    category: 'GSD' | 'Lean' | 'Ergonomics' | 'Time Study' | 'Costing';
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    duration?: string;
    description: string;
    url: string;
    thumbnail: string;
}

const RESOURCES: Resource[] = [
    // GSD Category
    { id: '1', title: 'GSD Fundamentals', type: 'course', category: 'GSD', level: 'Beginner', duration: '4 hours', description: 'Complete introduction to General Sewing Data methodology', url: '#', thumbnail: '📚' },
    { id: '2', title: 'Advanced GSD Coding', type: 'video', category: 'GSD', level: 'Advanced', duration: '45 min', description: 'Master complex operation breakdowns', url: '#', thumbnail: '🎬' },
    { id: '3', title: 'GSD Standards Manual 2024', type: 'pdf', category: 'GSD', level: 'Intermediate', description: 'Official reference guide for all GSD codes', url: '#', thumbnail: '📄' },

    // Lean Manufacturing
    { id: '4', title: 'Lean in Garment Manufacturing', type: 'course', category: 'Lean', level: 'Beginner', duration: '6 hours', description: 'Apply Lean principles to reduce waste and improve flow', url: '#', thumbnail: '📚' },
    { id: '5', title: '5S in Sewing Floors', type: 'video', category: 'Lean', level: 'Beginner', duration: '30 min', description: 'Practical 5S implementation examples', url: '#', thumbnail: '🎬' },
    { id: '6', title: 'Value Stream Mapping', type: 'pdf', category: 'Lean', level: 'Advanced', description: 'VSM templates and case studies', url: '#', thumbnail: '📄' },

    // Ergonomics
    { id: '7', title: 'Industrial Ergonomics Basics', type: 'course', category: 'Ergonomics', level: 'Beginner', duration: '3 hours', description: 'Design safe and efficient workstations', url: '#', thumbnail: '📚' },
    { id: '8', title: 'Preventing RSI in Operators', type: 'video', category: 'Ergonomics', level: 'Intermediate', duration: '25 min', description: 'Reduce repetitive strain injuries', url: '#', thumbnail: '🎬' },
    { id: '9', title: 'Ergonomic Assessment Toolkit', type: 'pdf', category: 'Ergonomics', level: 'Advanced', description: 'REBA, RULA, and checklist tools', url: '#', thumbnail: '📄' },

    // Time Study
    { id: '10', title: 'MTM Time Study Certification', type: 'course', category: 'Time Study', level: 'Advanced', duration: '8 hours', description: 'Official MTM-1 and MTM-2 training', url: '#', thumbnail: '📚' },
    { id: '11', title: 'Stopwatch Time Study Demo', type: 'video', category: 'Time Study', level: 'Beginner', duration: '20 min', description: 'Proper technique for manual time studies', url: '#', thumbnail: '🎬' },
    { id: '12', title: 'Performance Rating Guide', type: 'pdf', category: 'Time Study', level: 'Intermediate', description: 'Calibrate pace rating accuracy', url: '#', thumbnail: '📄' },

    // Costing
    { id: '13', title: 'Minute Costing Mastery', type: 'course', category: 'Costing', level: 'Intermediate', duration: '5 hours', description: 'Calculate accurate labor costs per garment', url: '#', thumbnail: '📚' },
    { id: '14', title: 'Cost Breakdown Analysis', type: 'video', category: 'Costing', level: 'Beginner', duration: '35 min', description: 'Break down total product cost', url: '#', thumbnail: '🎬' },
    { id: '15', title: 'Pricing Strategy Templates', type: 'pdf', category: 'Costing', level: 'Advanced', description: 'Excel templates for cost analysis', url: '#', thumbnail: '📄' },
];

const CATEGORIES = ['All', 'GSD', 'Lean', 'Ergonomics', 'Time Study', 'Costing'] as const;
const TYPES = ['All', 'course', 'video', 'pdf'] as const;

const KnowledgeHubView: React.FC = () => {
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredResources = RESOURCES.filter((resource) => {
        const matchesCategory = categoryFilter === 'All' || resource.category === categoryFilter;
        const matchesType = typeFilter === 'All' || resource.type === typeFilter;
        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesType && matchesSearch;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'course': return 'fa-graduation-cap';
            case 'video': return 'fa-play-circle';
            case 'pdf': return 'fa-file-pdf';
            default: return 'fa-book';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'course': return 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue';
            case 'video': return 'bg-red-500/20 text-red-400 border-red-500';
            case 'pdf': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500';
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500';
        }
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        <i className="fas fa-book-open text-cyber-blue mr-3"></i>
                        Knowledge Hub
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Educational resources for industrial engineers and production managers
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
                            placeholder="Search courses, videos, PDFs..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white text-sm focus:border-cyber-blue outline-none"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-cyber-blue outline-none"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Type</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-cyber-blue outline-none"
                            >
                                {TYPES.map((type) => (
                                    <option key={type} value={type}>{type === 'All' ? 'All Types' : type.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-cyber-dark border border-cyber-blue/30 p-4 rounded-xl text-center">
                        <p className="text-3xl font-black text-cyber-blue">{RESOURCES.filter(r => r.type === 'course').length}</p>
                        <p className="text-xs text-zinc-500 uppercase">Courses</p>
                    </div>
                    <div className="bg-cyber-dark border border-red-500/30 p-4 rounded-xl text-center">
                        <p className="text-3xl font-black text-red-400">{RESOURCES.filter(r => r.type === 'video').length}</p>
                        <p className="text-xs text-zinc-500 uppercase">Videos</p>
                    </div>
                    <div className="bg-cyber-dark border border-emerald-500/30 p-4 rounded-xl text-center">
                        <p className="text-3xl font-black text-emerald-400">{RESOURCES.filter(r => r.type === 'pdf').length}</p>
                        <p className="text-xs text-zinc-500 uppercase">Documents</p>
                    </div>
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <div
                            key={resource.id}
                            className="bg-cyber-dark border border-white/10 rounded-2xl p-6 hover:border-cyber-blue/50 transition-all group hover:scale-105"
                        >
                            {/* Icon & Type Badge */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    {resource.thumbnail}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${getTypeColor(resource.type)}`}>
                                    {resource.type}
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-black text-white mb-2 group-hover:text-cyber-blue transition-colors">
                                {resource.title}
                            </h3>
                            <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{resource.description}</p>

                            {/* Meta */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple rounded font-bold">
                                    {resource.category}
                                </span>
                                {resource.duration && (
                                    <span className="text-zinc-600">
                                        <i className="fas fa-clock mr-1"></i>
                                        {resource.duration}
                                    </span>
                                )}
                            </div>

                            {/* Action */}
                            <button className="mt-4 w-full py-2 bg-cyber-blue/10 border border-cyber-blue text-cyber-blue rounded-lg font-bold hover:bg-cyber-blue hover:text-black transition-all flex items-center justify-center gap-2">
                                <i className={`fas ${getTypeIcon(resource.type)}`}></i>
                                {resource.type === 'course' ? 'Start Learning' : resource.type === 'video' ? 'Watch Now' : 'Download PDF'}
                            </button>
                        </div>
                    ))}
                </div>

                {filteredResources.length === 0 && (
                    <div className="text-center py-16">
                        <i className="fas fa-search text-5xl text-zinc-700 mb-4"></i>
                        <p className="text-zinc-500">No resources found matching your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeHubView;
