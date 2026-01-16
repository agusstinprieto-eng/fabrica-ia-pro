import React, { useState, useEffect } from 'react';

interface Settings {
    frameCount: 6 | 12 | 18;
    pdfPageSize: 'letter' | 'a4';
    pdfMargins: number;
    defaultLanguage: 'en' | 'es';
    companyName: string;
    companyLogo: string;
    defaultHourlyWage: number;
    defaultOverhead: number;
}

interface SettingsViewProps {
    onRestartTour?: () => void;
    language: 'en' | 'es';
}

const DEFAULT_SETTINGS: Settings = {
    frameCount: 6,
    pdfPageSize: 'letter',
    pdfMargins: 10,
    defaultLanguage: 'en',
    companyName: 'IA.AGUS Engineering Labs',
    companyLogo: '',
    defaultHourlyWage: 2.5,
    defaultOverhead: 45,
};

const SettingsView: React.FC<SettingsViewProps> = ({ onRestartTour, language }) => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('costura-ia-settings');
        if (stored) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
    }, []);

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

    const handleSave = () => {
        try {
            localStorage.setItem('costura-ia-settings', JSON.stringify(settings));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error("Storage Error", e);
            alert(language === 'es'
                ? "Error: El logo es demasiado grande para el almacenamiento local. Intenta con una imagen más pequeña."
                : "Error: The logo is too large for local storage. Please try a smaller image.");
        }
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('costura-ia-settings');
    };

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        <i className="fas fa-cog text-cyber-blue mr-3"></i>
                        Settings
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        Configure your analysis preferences and company information
                    </p>
                </div>


                {/* Analysis Settings */}
                <div className="bg-cyber-dark border border-cyber-purple/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-cyber-purple uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-microscope"></i>
                        Analysis Settings
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Frame Extraction Count
                            </label>
                            <select
                                value={settings.frameCount}
                                onChange={(e) =>
                                    setSettings({ ...settings, frameCount: parseInt(e.target.value) as 6 | 12 | 18 })
                                }
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-cyber-purple outline-none"
                            >
                                <option value="6" className="bg-cyber-black text-white">6 frames (Fast)</option>
                                <option value="12" className="bg-cyber-black text-white">12 frames (Balanced)</option>
                                <option value="18" className="bg-cyber-black text-white">18 frames (Detailed)</option>
                            </select>
                            <p className="text-xs text-zinc-600 mt-2">
                                More frames = better analysis but longer processing time
                            </p>
                        </div>
                    </div>
                </div>

                {/* PDF Settings */}
                <div className="bg-cyber-dark border border-emerald-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-file-pdf"></i>
                        PDF Export Settings
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Page Size
                            </label>
                            <select
                                value={settings.pdfPageSize}
                                onChange={(e) =>
                                    setSettings({ ...settings, pdfPageSize: e.target.value as 'letter' | 'a4' })
                                }
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="letter" className="bg-cyber-black text-white">Letter (8.5" × 11")</option>
                                <option value="a4" className="bg-cyber-black text-white">A4 (210mm × 297mm)</option>
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
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Costing Defaults */}
                <div className="bg-cyber-dark border border-yellow-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-yellow-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i className="fas fa-coins"></i>
                        Costing Defaults
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Default Hourly Wage (USD)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="1"
                                max="50"
                                value={settings.defaultHourlyWage}
                                onChange={(e) =>
                                    setSettings({ ...settings, defaultHourlyWage: parseFloat(e.target.value) })
                                }
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                Default Overhead (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={settings.defaultOverhead}
                                onChange={(e) =>
                                    setSettings({ ...settings, defaultOverhead: parseInt(e.target.value) })
                                }
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none"
                            />
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
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 outline-none"
                            />
                            <p className="text-xs text-zinc-600 mt-2">
                                Appears on PDF reports and analysis headers
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                {settings.defaultLanguage === 'es' ? 'Logo de la Empresa' : 'Company Logo'}
                            </label>
                            <div className="flex items-center gap-4">
                                {settings.companyLogo && (
                                    <div className="w-16 h-16 rounded-xl bg-white/10 p-2 border border-white/10 flex items-center justify-center shrink-0">
                                        <img src={settings.companyLogo} className="max-w-full max-h-full object-contain" alt="Logo preview" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = async () => {
                                                    const compressed = await compressImage(reader.result as string);
                                                    setSettings({ ...settings, companyLogo: compressed });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        className="w-full bg-black/50 border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-xl px-4 py-3 text-zinc-500 hover:text-orange-500 text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        {settings.defaultLanguage === 'es' ? 'Subir Logo' : 'Upload Logo'}
                                    </button>
                                </div>
                                {settings.companyLogo && (
                                    <button
                                        onClick={() => setSettings({ ...settings, companyLogo: '' })}
                                        className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">
                                {settings.defaultLanguage === 'es' ? 'Se muestra en los reportes PDF. Formatos recomendados: PNG o JPG.' : 'Appears on PDF reports. Recommended: PNG or JPG.'}
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
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-pink-500 outline-none"
                        >
                            <option value="en" className="bg-cyber-black text-white">English (EN)</option>
                            <option value="es" className="bg-cyber-black text-white">Español (ES)</option>
                        </select>
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
