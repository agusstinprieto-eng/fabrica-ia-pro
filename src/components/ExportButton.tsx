import React, { useState } from 'react';

interface ExportButtonProps {
    onExportPDF: () => void;
    onExportExcel?: () => void;
    onExportPowerPoint?: () => void;
    disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
    onExportPDF,
    onExportExcel,
    onExportPowerPoint,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const hasMultipleOptions = onExportExcel || onExportPowerPoint;

    // If only PDF export is available, show single button
    if (!hasMultipleOptions) {
        return (
            <button
                onClick={onExportPDF}
                disabled={disabled}
                className="px-6 py-3 bg-cyber-blue text-black font-bold rounded-lg hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <i className="fas fa-file-pdf"></i>
                Export PDF
            </button>
        );
    }

    return (
        <div className="relative inline-block">
            {/* Main Export Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="px-6 py-3 bg-cyber-blue text-black font-bold rounded-lg hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
                <i className="fas fa-download"></i>
                <span>Export</span>
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-cyber-dark border border-cyber-blue/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* PDF Option */}
                        <button
                            onClick={() => {
                                onExportPDF();
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5"
                        >
                            <i className="fas fa-file-pdf text-red-400 text-lg w-6"></i>
                            <div>
                                <p className="text-sm font-bold text-white">Export to PDF</p>
                                <p className="text-[10px] text-zinc-500">Professional report</p>
                            </div>
                        </button>

                        {/* Excel Option */}
                        {onExportExcel && (
                            <button
                                onClick={() => {
                                    onExportExcel();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5"
                            >
                                <i className="fas fa-file-excel text-emerald-400 text-lg w-6"></i>
                                <div>
                                    <p className="text-sm font-bold text-white">Export to Excel</p>
                                    <p className="text-[10px] text-zinc-500">Data table + charts</p>
                                </div>
                            </button>
                        )}

                        {/* PowerPoint Option */}
                        {onExportPowerPoint && (
                            <button
                                onClick={() => {
                                    onExportPowerPoint();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                            >
                                <i className="fas fa-file-powerpoint text-orange-400 text-lg w-6"></i>
                                <div>
                                    <p className="text-sm font-bold text-white">Export to PowerPoint</p>
                                    <p className="text-[10px] text-zinc-500">Presentation slides</p>
                                </div>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;
