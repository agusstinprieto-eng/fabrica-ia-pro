import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../contexts/SimulationContext';
import { useAuth } from '../../contexts/AuthContext';
import DocumentManager from '../common/DocumentManager';

const LineRow: React.FC<{
    line: { id: string, name: string, absenteeismRate: number, qualityRejectionRate: number };
    onUpdate: (id: string, params: any) => void;
    onRemove: (id: string) => void;
}> = ({ line, onUpdate, onRemove }) => {
    const [name, setName] = useState(line.name);
    const [absenteeism, setAbsenteeism] = useState<number | string>(line.absenteeismRate);
    const [quality, setQuality] = useState<number | string>(line.qualityRejectionRate);

    // Sync if external props change substantially
    useEffect(() => {
        if (line.name !== name) setName(line.name);
        if (Number(line.absenteeismRate) !== Number(absenteeism)) setAbsenteeism(line.absenteeismRate);
        if (Number(line.qualityRejectionRate) !== Number(quality)) setQuality(line.qualityRejectionRate);
    }, [line]);

    const handleNumberChange = (value: string, setter: (val: number | string) => void) => {
        if (value === '') {
            setter('');
        } else {
            // Strip leading zeros if integer part has multiple digits
            // e.g., "05" -> "5", but "0." -> "0." and "0" -> "0"
            if (/^0\d+/.test(value)) {
                setter(value.replace(/^0+/, ''));
                return;
            }
            setter(value);
        }
    };

    const handleBlur = (
        id: string,
        field: 'absenteeismRate' | 'qualityRejectionRate',
        value: number | string,
        setter: (val: number | string) => void
    ) => {
        const numVal = value === '' ? 0 : parseFloat(value.toString()) || 0;
        setter(numVal); // normalize display on blur
        onUpdate(id, { [field]: numVal });
    };

    return (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 relative group">
            <button
                onClick={() => onRemove(line.id)}
                className="absolute top-2 right-2 text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors opacity-60 hover:opacity-100"
                title="Remove Line"
            >
                <i className="fas fa-times"></i>
            </button>

            <div className="mb-3 border-b border-white/10 pb-2 mr-6">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => onUpdate(line.id, { name })}
                    className="bg-transparent text-white font-bold w-full outline-none focus:text-cyan-400 transition-colors"
                    placeholder="Line Name"
                />
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                        Absenteeism Rate (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={absenteeism}
                        onChange={(e) => handleNumberChange(e.target.value, setAbsenteeism)}
                        onBlur={() => handleBlur(line.id, 'absenteeismRate', absenteeism, setAbsenteeism)}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                        Quality Rejection Rate (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={quality}
                        onChange={(e) => handleNumberChange(e.target.value, setQuality)}
                        onBlur={() => handleBlur(line.id, 'qualityRejectionRate', quality, setQuality)}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
};



interface Settings {
    pdfPageSize: 'letter' | 'a4';
    pdfMargins: number;
    defaultLanguage: 'en' | 'es';
    companyName: string;
    defaultHourlyWage: number;
    defaultOverhead: number;
}

interface SettingsViewProps {
    onRestartTour?: () => void;
    language: 'en' | 'es';
}

const DEFAULT_SETTINGS: Settings = {
    pdfPageSize: 'letter',
    pdfMargins: 10,
    defaultLanguage: 'en',
    companyName: 'IA.AGUS Engineering Labs',
    defaultHourlyWage: 2.5,
    defaultOverhead: 45,
};

const SettingsView: React.FC<SettingsViewProps> = ({ onRestartTour, language }) => {
    const { user, updateProfile, updatePassword } = useAuth();
    const { lines, updateLineParams, addLine, removeLine, costInputs, updateCostInput } = useSimulation();
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [newLineName, setNewLineName] = useState('');
    const [uploadLog, setUploadLog] = useState<string>('');

    // Profile State
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileCompany, setProfileCompany] = useState(user?.company || '');

    // Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');

    useEffect(() => {
        if (user) {
            setProfileName(user.name);
            setProfileCompany(user.company);
        }
    }, [user]);

    useEffect(() => {
        const stored = localStorage.getItem('costura-ia-settings');
        if (stored) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
    }, []);

    const handlePasswordUpdate = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordMsg("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMsg("Password must be at least 6 characters");
            return;
        }

        const success = await updatePassword(newPassword);
        if (success) {
            setPasswordMsg("Success: Password updated securely.");
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMsg(''), 3000);
        } else {
            setPasswordMsg("Error: Failed to update password.");
        }
    };

    const compressImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Use PNG to preserve transparency for professional logos
                resolve(canvas.toDataURL('image/png'));
            };
        });
    };

    const handleSave = async () => {
        try {
            // Save Local Settings
            localStorage.setItem('costura-ia-settings', JSON.stringify(settings));

            // Save Profile Settings
            if (user) {
                await updateProfile({
                    name: profileName,
                    company: profileCompany
                });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error("Storage Error", e);
            alert(language === 'es'
                ? "Error: Hubo un problema al guardar."
                : "Error: There was an issue saving settings.");
        }
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('costura-ia-settings');
    };

    const handleAddLine = () => {
        if (!newLineName.trim()) return;
        addLine(newLineName);
        setNewLineName('');
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            Configuración
                            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">v2.5.2-INDUSTRIAL</span>
                        </h2>
                        <p className="text-zinc-500 font-mono text-xs mt-1 uppercase tracking-widest">Ajustes Globales del Sistema Operativo Industrial</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <i className="fas fa-shield-alt"></i>
                        Secure Cloud Sync Active
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-cyber-dark border border-blue-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-user-circle"></i>
                        Profile Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Company
                            </label>
                            <input
                                type="text"
                                value={profileCompany}
                                onChange={(e) => setProfileCompany(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-500 mb-2">
                                Email (Read Only)
                            </label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-[#0a0a0a]/50 border border-white/5 rounded-lg px-4 py-3 text-zinc-500 text-sm cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-500 mb-2">
                                Role (Read Only)
                            </label>
                            <div className="w-full bg-[#0a0a0a]/50 border border-white/5 rounded-lg px-4 py-3 text-zinc-500 text-sm flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                <span className="uppercase">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-cyber-dark border border-red-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-red-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-lock"></i>
                        Security Settings
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-white mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-red-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-red-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordUpdate}
                                disabled={!newPassword || newPassword !== confirmPassword}
                                className="px-6 py-2 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-wider"
                            >
                                Update Security Credentials
                            </button>
                        </div>
                        {passwordMsg && (
                            <p className={`text-xs ${passwordMsg.includes('Success') ? 'text-green-400' : 'text-red-400'} text-right`}>
                                {passwordMsg}
                            </p>
                        )}
                    </div>
                </div>

                {/* Data Upload Section */}
                <div className="bg-cyber-dark border border-purple-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-purple-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-file-upload"></i>
                        Import Master Data (Operations & Machines)
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            id="file-upload"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadLog('Processing file...');

                                try {
                                    // Dynamic import of services to avoid cycle issues if any
                                    const { readOperationsFromExcel, readMachinesFromExcel } = await import('../../services/excelService');
                                    const { operationsService } = await import('../../services/operationsService');

                                    if (confirm(`¿Cargar Archivo Maestro: ${file.name}?\nSe buscarán pestañas de 'Operaciones' y 'Máquinas'.`)) {
                                        let log = `File: ${file.name}\n`;

                                        // Try Operations
                                        try {
                                            const opsData = await readOperationsFromExcel(file);
                                            log += `Found ${opsData.length} operations rows.\n`;
                                            if (opsData.length > 0) {
                                                const opsResult = await operationsService.uploadOperations(opsData, user?.id || 'public');
                                                log += `✅ Saved ${opsResult?.length || 0} operations.\n`;
                                            }
                                        } catch (err: any) {
                                            // Quiet fail if sheet not found, but log it
                                            console.warn("Operations import skipped/failed", err);
                                            log += `⚠️ Operaciones: No encontrado/Error (${err.message}).\n`;
                                        }

                                        // Try Machines
                                        try {
                                            const machinesData = await readMachinesFromExcel(file);
                                            log += `Found ${machinesData.length} machine rows.\n`;
                                            if (machinesData.length > 0) {
                                                const machResult = await operationsService.uploadMachineTypes(machinesData);
                                                log += `✅ Saved ${machResult?.length || 0} machines.\n`;
                                            }
                                        } catch (err: any) {
                                            console.warn("Machines import skipped/failed", err);
                                            log += `⚠️ Máquinas: No encontrado/Error (${err.message}).\n`;
                                        }

                                        setUploadLog(log + '\n✨ PROCESO COMPLETADO. Verifica los resultados arriba.');
                                    }
                                } catch (err: any) {
                                    console.error(err);
                                    setUploadLog((prev) => prev + `\n❌ Critical Error: ${err.message}`);
                                }
                                // Reset input
                                e.target.value = '';
                            }}
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer bg-[#0a0a0a] border border-purple-500/50 hover:bg-purple-500/10 text-white px-6 py-4 rounded-xl border-dashed border-2 flex items-center gap-3 transition-all w-full sm:w-auto"
                        >
                            <i className="fas fa-file-excel text-2xl text-green-500"></i>
                            <div>
                                <div className="font-bold text-sm">Click to Upload Excel</div>
                                <div className="text-xs text-zinc-500">Supported: .xlsx, .xls</div>
                            </div>
                        </label>

                        <div className="text-xs text-zinc-400 italic">
                            Expected Columns: PROCESS CODE, OPERATION, M/C, T.M.U., S.M.V., TGT / HR, Machine Type, Machine Full Form, Brand
                        </div>
                    </div>

                    {uploadLog && (
                        <div className="mt-4 bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-xs text-green-400 whitespace-pre-wrap">
                            {uploadLog}
                        </div>
                    )}
                </div>

                {/* PDF Settings */}
                <div className="bg-cyber-dark border border-emerald-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-file-pdf"></i>
                        PDF Export Settings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Page Size
                            </label>
                            <select
                                value={settings.pdfPageSize}
                                onChange={(e) =>
                                    setSettings({ ...settings, pdfPageSize: e.target.value as 'letter' | 'a4' })
                                }
                                className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="letter" className="bg-gray-900 text-white">Letter (8.5" × 11")</option>
                                <option value="a4" className="bg-gray-900 text-white">A4 (210mm × 297mm)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Margins (mm)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="25"
                                value={settings.pdfMargins}
                                onChange={(e) =>
                                    setSettings({ ...settings, pdfMargins: parseInt(e.target.value) })
                                }
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Costing Defaults (Live Simulation Params) */}
                <div className="bg-cyber-dark border border-yellow-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-yellow-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-coins"></i>
                        Cost Parameters (Real-time)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Hourly Wage (USD/hr)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="1"
                                value={costInputs.hourlyWage}
                                onChange={(e) => updateCostInput('hourlyWage', parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Labor Cost & Absenteeism</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Scrap Cost (USD/Unit)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={costInputs.scrapCost}
                                onChange={(e) => updateCostInput('scrapCost', parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Full loss per scrapped unit</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Overhead (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={costInputs.overhead}
                                onChange={(e) => updateCostInput('overhead', parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">General operational overhead</p>
                        </div>
                    </div>
                </div>

                {/* Company Information */}
                <div className="bg-cyber-dark border border-orange-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-orange-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-building"></i>
                        Company Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                placeholder="Your Company Name"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 outline-none"
                            />
                            <p className="text-xs text-zinc-600 mt-2">
                                Appears on PDF reports and analysis headers
                            </p>
                        </div>
                    </div>
                </div>

                {/* Language Preference */}
                <div className="bg-cyber-dark border border-pink-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-pink-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-globe"></i>
                        Language Preference
                    </h3>
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Default Language
                        </label>
                        <select
                            value={settings.defaultLanguage}
                            onChange={(e) =>
                                setSettings({ ...settings, defaultLanguage: e.target.value as 'en' | 'es' })
                            }
                            className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-pink-500 outline-none"
                        >
                            <option value="en" className="bg-gray-900 text-white">English (EN)</option>
                            <option value="es" className="bg-gray-900 text-white">Español (ES)</option>
                        </select>
                    </div>
                </div>


                {/* Documentation Center - Knowledge Base */}
                <div className="bg-cyber-dark border border-cyan-500/30 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <i className="fas fa-brain text-[120px] text-cyan-400"></i>
                    </div>

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <i className="fas fa-book-reader text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Centro de Documentación Maestra</h3>
                            <p className="text-[10px] text-cyan-500/50 font-mono uppercase tracking-widest mt-1">Manuales de Planta, SOPs y Fichas Técnicas</p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <DocumentManager />
                    </div>

                    <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl relative z-10">
                    </div>
                </div>

                {/* Line Configuration */}
                <div className="bg-cyber-dark border border-cyan-500/30 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className="text-lg font-black text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                            <i className="fas fa-industry"></i>
                            Production Line Parameters
                        </h3>
                        {/* Add Line Form */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input
                                type="text"
                                value={newLineName}
                                onChange={(e) => setNewLineName(e.target.value)}
                                placeholder="New Line Name"
                                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none sm:w-40"
                            />
                            <button
                                onClick={handleAddLine}
                                disabled={!newLineName.trim()}
                                className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <i className="fas fa-plus mr-1"></i> Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {lines.map(line => (
                                <LineRow
                                    key={line.id}
                                    line={line}
                                    onUpdate={updateLineParams}
                                    onRemove={removeLine}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-zinc-600 mt-2">
                            Manage your production lines. Click on a line name to rename it. These values directly impact simulation logic.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        className="flex-1 py-4 bg-cyber-blue text-black font-black rounded-xl uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                    >
                        <i className={`fas ${saved ? 'fa-check' : 'fa-save'}`}></i>
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-8 py-4 bg-cyber-dark border border-red-500/30 text-red-400 font-black rounded-xl uppercase tracking-widest hover:bg-red-500/10 transition-all"
                    >
                        <i className="fas fa-undo mr-2"></i>
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;

