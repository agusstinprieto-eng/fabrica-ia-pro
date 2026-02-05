import React, { useState } from 'react';
import { X, Plus, Loader } from 'lucide-react';

interface AddMachineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (machineData: MachineFormData) => Promise<void>;
}

export interface MachineFormData {
    name: string;
    type: string;
    location: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    installationDate: string;
    totalOperatingHours: number;
}

const machineTypes = [
    'CNC Mill',
    'CNC Lathe',
    'Press',
    'Injection Molding',
    'Assembly Line',
    'Conveyor',
    'Robot Arm',
    'Packaging Machine',
    'Quality Control Station',
    'Other'
];

const AddMachineModal: React.FC<AddMachineModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<MachineFormData>({
        name: '',
        type: '',
        location: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        installationDate: '',
        totalOperatingHours: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof MachineFormData, string>>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof MachineFormData, string>> = {};

        if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
        if (!formData.type) newErrors.type = 'Tipo requerido';
        if (!formData.location.trim()) newErrors.location = 'Ubicación requerida';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSaving(true);
        try {
            await onSave(formData);
            // Reset form
            setFormData({
                name: '',
                type: '',
                location: '',
                manufacturer: '',
                model: '',
                serialNumber: '',
                installationDate: '',
                totalOperatingHours: 0
            });
            onClose();
        } catch (error) {
            console.error('Error saving machine:', error);
            alert('Error al guardar la máquina. Por favor intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof MachineFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <Plus className="w-8 h-8 text-blue-400" />
                            Agregar Nueva Máquina
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Complete los datos de la máquina</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-auto flex-1">
                    {/* Machine Name */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Nombre de la Máquina *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
                            placeholder="Ej: CNC Mill #1"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Tipo de Máquina *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className={`w-full bg-slate-800 border ${errors.type ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                        >
                            <option value="">Seleccionar tipo...</option>
                            {machineTypes.map(type => (
                                <option key={type} value={type} className="bg-slate-800 text-white">{type}</option>
                            ))}
                        </select>
                        {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type}</p>}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Ubicación *
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            className={`w-full bg-slate-800 border ${errors.location ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
                            placeholder="Ej: Planta 1 - Área A"
                        />
                        {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
                    </div>

                    {/* Manufacturer & Model */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Fabricante
                            </label>
                            <input
                                type="text"
                                value={formData.manufacturer}
                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Ej: Haas"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Modelo
                            </label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Ej: VF-2"
                            />
                        </div>
                    </div>

                    {/* Serial Number */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Número de Serie
                        </label>
                        <input
                            type="text"
                            value={formData.serialNumber}
                            onChange={(e) => handleChange('serialNumber', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Ej: SN123456"
                        />
                    </div>

                    {/* Installation Date & Operating Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Fecha de Instalación
                            </label>
                            <input
                                type="date"
                                value={formData.installationDate}
                                onChange={(e) => handleChange('installationDate', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Horas de Operación
                            </label>
                            <input
                                type="number"
                                value={formData.totalOperatingHours}
                                onChange={(e) => handleChange('totalOperatingHours', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Agregar Máquina
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMachineModal;
