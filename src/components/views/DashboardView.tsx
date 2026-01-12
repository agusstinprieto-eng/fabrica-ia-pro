import React from 'react';

const DashboardView: React.FC = () => {
    return (
        <div className="h-full p-8 overflow-y-auto">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Executive <span className="text-cyber-blue">Dashboard</span></h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-cyber-dark border border-cyber-blue/30 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/10 blur-3xl rounded-full"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Efficiency (OEE)</h3>
                    <div className="text-4xl font-black text-white mb-2">87.4%</div>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <i className="fas fa-arrow-up"></i> +2.1% <span className="text-zinc-600">vs last week</span>
                    </div>
                </div>

                <div className="bg-cyber-dark border border-cyber-purple/30 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-purple/10 blur-3xl rounded-full"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Total Output (Pcs)</h3>
                    <div className="text-4xl font-black text-white mb-2">12,450</div>
                    <div className="flex items-center gap-2 text-cyber-purple text-xs font-bold">
                        <i className="fas fa-tshirt"></i> Target: 12,000
                    </div>
                </div>

                <div className="bg-cyber-dark border border-red-500/30 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-3xl rounded-full"></div>
                    <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-2">Defect Rate</h3>
                    <div className="text-4xl font-black text-white mb-2">1.8%</div>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <i className="fas fa-check"></i> Below Limit (2.0%)
                    </div>
                </div>
            </div>

            <div className="w-full h-64 bg-cyber-black/50 border border-cyber-gray/30 rounded-2xl flex items-center justify-center text-zinc-600 font-mono text-sm">
                [ Chart Visualization Placeholder: Production per Hour ]
            </div>
        </div>
    );
};

export default DashboardView;
