import React, { useState, useEffect } from 'react';
import { mockMachines, mockAlerts } from '../../data/mockMaintenanceData';
import { Machine, RiskLevel, MaintenancePrediction } from '../../types/maintenance';
import { Activity, AlertTriangle, CheckCircle, XCircle, Calendar, TrendingUp, Brain, X, Loader, Plus } from 'lucide-react';
import { analyzeMaintenanceNeeds, generateMaintenanceReport } from '../../services/maintenanceService';
import { machineService } from '../../services/machineService';
import AddMachineModal, { MachineFormData } from '../AddMachineModal';

const PredictiveMaintenanceView: React.FC = () => {
    const [selectedFilter, setSelectedFilter] = useState<RiskLevel | 'all'>('all');
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [aiPrediction, setAiPrediction] = useState<MaintenancePrediction | null>(null);
    const [aiReport, setAiReport] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isLoadingMachines, setIsLoadingMachines] = useState(true);

    // Load machines from Supabase on mount
    useEffect(() => {
        loadMachines();
    }, []);

    const loadMachines = async () => {
        try {
            setIsLoadingMachines(true);
            const data = await machineService.getMachines();

            // If no machines in database, use mock data for demo
            if (data.length === 0) {
                setMachines(mockMachines);
            } else {
                setMachines(data);
            }
        } catch (error) {
            console.error('Error loading machines:', error);
            // Fallback to mock data on error
            setMachines(mockMachines);
        } finally {
            setIsLoadingMachines(false);
        }
    };

    // Handle add machine
    const handleAddMachine = async (formData: MachineFormData) => {
        // Check machine limit
        if (machines.length >= 50) {
            alert('⚠️ Límite alcanzado: Máximo 50 máquinas permitidas.\n\nPara agregar más máquinas, contacta a soporte para actualizar tu plan.');
            return;
        }

        try {
            // Save to Supabase
            const newMachine = await machineService.addMachine({
                name: formData.name,
                type: formData.type,
                location: formData.location,
                manufacturer: formData.manufacturer,
                model: formData.model,
                serialNumber: formData.serialNumber,
                installationDate: formData.installationDate,
                totalOperatingHours: formData.totalOperatingHours
            });

            // Add to local state
            setMachines(prev => [...prev, newMachine]);

            console.log('✅ Machine saved to Supabase:', newMachine);
        } catch (error) {
            console.error('❌ Error saving machine:', error);
            alert('Error al guardar la máquina. Por favor intenta de nuevo.');
            throw error; // Re-throw to prevent modal from closing
        }
    };

    // Filter machines based on risk level
    const filteredMachines = selectedFilter === 'all'
        ? machines
        : machines.filter(m => m.riskLevel === selectedFilter);

    // Count machines by risk level
    const riskCounts = {
        critical: machines.filter(m => m.riskLevel === 'critical').length,
        high: machines.filter(m => m.riskLevel === 'high').length,
        medium: machines.filter(m => m.riskLevel === 'medium').length,
        low: machines.filter(m => m.riskLevel === 'low').length,
    };

    // Get health score color
    const getHealthColor = (score: number): string => {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 50) return '#f59e0b'; // Yellow
        if (score >= 30) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    // Get risk level badge
    const getRiskBadge = (level: RiskLevel) => {
        const config = {
            low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Óptimo' },
            medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Atención' },
            high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', label: 'Riesgo' },
            critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Crítico' },
        };
        return config[level];
    };

    // Calculate days until maintenance
    const getDaysUntilMaintenance = (dueDate: string): number => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Analyze machine with AI
    const handleAnalyzeMachine = async (machine: Machine) => {
        setSelectedMachine(machine);
        setIsAnalyzing(true);
        setAiPrediction(null);
        setAiReport('');

        try {
            const prediction = await analyzeMaintenanceNeeds(machine);
            setAiPrediction(prediction);

            const report = await generateMaintenanceReport(machine, prediction);
            setAiReport(report);
        } catch (error) {
            console.error('Error analyzing machine:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full overflow-auto p-6 bg-slate-950 relative">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-400" />
                            Mantenimiento Predictivo
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Monitoreo inteligente de maquinaria con IA</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 font-bold">{mockAlerts.length} Alertas Activas</span>
                        </div>
                        <div className={`flex items-center gap-2 ${machines.length >= 50 ? 'bg-red-500/20 border-red-500/30' : 'bg-blue-500/20 border-blue-500/30'} border rounded-lg px-4 py-2`}>
                            <Activity className={`w-5 h-5 ${machines.length >= 50 ? 'text-red-400' : 'text-blue-400'}`} />
                            <span className={`font-bold ${machines.length >= 50 ? 'text-red-400' : 'text-blue-400'}`}>
                                {machines.length}/50 Máquinas
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider">Total Máquinas</p>
                                <p className="text-3xl font-black text-white mt-1">{mockMachines.length}</p>
                            </div>
                            <Activity className="w-10 h-10 text-blue-400 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-400 text-xs uppercase tracking-wider">Óptimas</p>
                                <p className="text-3xl font-black text-green-400 mt-1">{riskCounts.low}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-400 text-xs uppercase tracking-wider">Atención</p>
                                <p className="text-3xl font-black text-yellow-400 mt-1">{riskCounts.medium + riskCounts.high}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-yellow-400 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-400 text-xs uppercase tracking-wider">Críticas</p>
                                <p className="text-3xl font-black text-red-400 mt-1">{riskCounts.critical}</p>
                            </div>
                            <XCircle className="w-10 h-10 text-red-400 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedFilter('all')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${selectedFilter === 'all'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Todas ({mockMachines.length})
                    </button>
                    <button
                        onClick={() => setSelectedFilter('critical')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${selectedFilter === 'critical'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Críticas ({riskCounts.critical})
                    </button>
                    <button
                        onClick={() => setSelectedFilter('high')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${selectedFilter === 'high'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Riesgo ({riskCounts.high})
                    </button>
                    <button
                        onClick={() => setSelectedFilter('medium')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${selectedFilter === 'medium'
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Atención ({riskCounts.medium})
                    </button>
                    <button
                        onClick={() => setSelectedFilter('low')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${selectedFilter === 'low'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Óptimas ({riskCounts.low})
                    </button>
                </div>
            </div>

            {/* Machine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMachines.map((machine) => {
                    const badge = getRiskBadge(machine.riskLevel);
                    const daysUntilMaintenance = getDaysUntilMaintenance(machine.nextMaintenanceDue);
                    const healthColor = getHealthColor(machine.healthScore);

                    return (
                        <div
                            key={machine.id}
                            onClick={() => handleAnalyzeMachine(machine)}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-blue-500/10"
                        >
                            {/* Machine Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-black text-lg group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                        {machine.name}
                                        <Brain className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">{machine.type}</p>
                                </div>
                                <div className={`${badge.bg} ${badge.text} ${badge.border} border px-2 py-1 rounded text-xs font-bold uppercase`}>
                                    {badge.label}
                                </div>
                            </div>

                            {/* Health Score */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-400 text-xs uppercase tracking-wider">Health Score</span>
                                    <span className="text-white font-black text-xl" style={{ color: healthColor }}>
                                        {machine.healthScore}/100
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-500 rounded-full"
                                        style={{
                                            width: `${machine.healthScore}%`,
                                            backgroundColor: healthColor,
                                            boxShadow: `0 0 10px ${healthColor}40`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Eficiencia:</span>
                                    <span className="text-white font-bold">{machine.currentEfficiency}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Horas de Operación:</span>
                                    <span className="text-white font-bold">{machine.totalOperatingHours.toLocaleString()}h</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Riesgo de Falla:</span>
                                    <span className={`font-bold ${machine.failureProbability > 50 ? 'text-red-400' : machine.failureProbability > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {machine.failureProbability}%
                                    </span>
                                </div>
                            </div>

                            {/* Maintenance Due */}
                            <div className={`flex items-center gap-2 p-3 rounded-lg ${daysUntilMaintenance <= 7 ? 'bg-red-500/20 border border-red-500/30' :
                                daysUntilMaintenance <= 14 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                    'bg-slate-800/50 border border-slate-700'
                                }`}>
                                <Calendar className={`w-4 h-4 ${daysUntilMaintenance <= 7 ? 'text-red-400' :
                                    daysUntilMaintenance <= 14 ? 'text-yellow-400' :
                                        'text-slate-400'
                                    }`} />
                                <div className="flex-1">
                                    <p className={`text-xs font-bold ${daysUntilMaintenance <= 7 ? 'text-red-400' :
                                        daysUntilMaintenance <= 14 ? 'text-yellow-400' :
                                            'text-slate-400'
                                        }`}>
                                        Mantenimiento en {daysUntilMaintenance} días
                                    </p>
                                </div>
                            </div>

                            {/* Components at Risk */}
                            {machine.componentsAtRisk.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-800">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Componentes en Riesgo:</p>
                                    {machine.componentsAtRisk.slice(0, 2).map((comp, idx) => (
                                        <div key={idx} className="text-xs text-red-400 mb-1">
                                            • {comp.name} ({comp.riskPercentage}%)
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredMachines.length === 0 && (
                <div className="text-center py-20">
                    <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No hay máquinas en esta categoría</p>
                </div>
            )}

            {/* Machine Detail Panel with AI Analysis */}
            {selectedMachine && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMachine(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <Brain className="w-8 h-8 text-blue-400" />
                                    {selectedMachine.name}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Análisis Predictivo con IA</p>
                            </div>
                            <button
                                onClick={() => setSelectedMachine(null)}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 overflow-auto flex-1">
                            {/* Loading State */}
                            {isAnalyzing && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                                    <p className="text-white font-bold">Analizando con Gemini AI...</p>
                                    <p className="text-slate-400 text-sm mt-2">Generando predicciones y recomendaciones</p>
                                </div>
                            )}

                            {/* AI Prediction Results */}
                            {!isAnalyzing && aiPrediction && (
                                <>
                                    {/* Health Score & Risk */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Health Score (IA)</p>
                                            <p className="text-3xl font-black" style={{ color: getHealthColor(aiPrediction.healthScore) }}>
                                                {aiPrediction.healthScore}/100
                                            </p>
                                        </div>
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Nivel de Riesgo</p>
                                            <div className={`inline-block px-3 py-1 rounded-full ${getRiskBadge(aiPrediction.riskLevel).bg} ${getRiskBadge(aiPrediction.riskLevel).border} border`}>
                                                <p className={`text-sm font-bold uppercase ${getRiskBadge(aiPrediction.riskLevel).text}`}>
                                                    {getRiskBadge(aiPrediction.riskLevel).label}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Components at Risk */}
                                    {aiPrediction.componentsAtRisk.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                            <h3 className="text-red-400 font-bold uppercase text-sm mb-3 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Componentes en Riesgo
                                            </h3>
                                            <div className="space-y-2">
                                                {aiPrediction.componentsAtRisk.map((comp, idx) => (
                                                    <div key={idx} className="bg-slate-900/50 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-white font-bold">{comp.name}</p>
                                                            <p className="text-red-400 font-bold">{comp.riskPercentage}% riesgo</p>
                                                        </div>
                                                        <p className="text-slate-400 text-sm mb-1">Falla estimada: {comp.estimatedFailureDate}</p>
                                                        <p className="text-blue-400 text-sm">→ {comp.recommendedAction}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                        <h3 className="text-blue-400 font-bold uppercase text-sm mb-3">Recomendaciones de IA</h3>
                                        <ul className="space-y-2">
                                            {aiPrediction.recommendations.map((rec, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-white">
                                                    <span className="text-blue-400 font-bold">{idx + 1}.</span>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Spare Parts & Cost */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                            <h3 className="text-slate-400 font-bold uppercase text-xs mb-3">Piezas Requeridas</h3>
                                            <ul className="space-y-1">
                                                {aiPrediction.spareParts.map((part, idx) => (
                                                    <li key={idx} className="text-white text-sm">• {part}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                            <h3 className="text-slate-400 font-bold uppercase text-xs mb-3">Costo Estimado</h3>
                                            <p className="text-2xl font-black text-green-400">${aiPrediction.estimatedCost.toLocaleString()} USD</p>
                                            <p className="text-slate-400 text-xs mt-1">Urgencia: {aiPrediction.urgency}</p>
                                        </div>
                                    </div>

                                    {/* AI Generated Report */}
                                    {aiReport && (
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                            <h3 className="text-white font-bold uppercase text-sm mb-3 flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-blue-400" />
                                                Reporte Ejecutivo (Generado por IA)
                                            </h3>
                                            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                {aiReport}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Add Button */}
            <button
                onClick={() => setIsAddMachineModalOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
                title="Agregar Nueva Máquina"
            >
                <Plus className="w-8 h-8 text-white" />
            </button>

            {/* Add Machine Modal */}
            <AddMachineModal
                isOpen={isAddMachineModalOpen}
                onClose={() => setIsAddMachineModalOpen(false)}
                onSave={handleAddMachine}
            />
        </div>
    );
};

export default PredictiveMaintenanceView;
