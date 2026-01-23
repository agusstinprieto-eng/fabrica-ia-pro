import React, { useState, useEffect, useRef } from 'react';
import { operationsService, ManufacturingOperation } from '../../services/operationsService';

interface OperationSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (op: ManufacturingOperation) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}

export const OperationSearchInput: React.FC<OperationSearchInputProps> = ({
    value,
    onChange,
    onSelect,
    placeholder,
    autoFocus,
    className
}) => {
    const [results, setResults] = useState<ManufacturingOperation[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (text: string) => {
        onChange(text);
        if (text.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setLoading(true);
        // Debounce could be added here, but for now simple direct call
        try {
            const ops = await operationsService.searchOperations(text);
            setResults(ops);
            setShowResults(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (op: ManufacturingOperation) => {
        onChange(op.operation);
        onSelect(op);
        setShowResults(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                    if (value.length >= 2 && results.length > 0) setShowResults(true);
                }}
                placeholder={placeholder}
                className={className}
            />

            {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <i className="fas fa-circle-notch fa-spin text-cyber-blue text-xs"></i>
                </div>
            )}

            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#0a0a0a] border border-cyber-blue/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((op, idx) => (
                        <button
                            key={op.id || idx}
                            onClick={() => handleSelect(op)}
                            className="w-full text-left px-3 py-2 hover:bg-cyber-blue/10 border-b border-white/5 last:border-0 transition-colors flex flex-col gap-1"
                        >
                            <span className="text-white text-xs font-bold">{op.operation}</span>
                            <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                <span>{op.process_code || 'N/A'}</span>
                                <div className="flex gap-2">
                                    {op.machine_type && <span className="text-cyber-purple">{op.machine_type}</span>}
                                    {op.smv && <span className="text-cyber-green">{op.smv} min</span>}
                                    {op.tmu && <span className="text-cyber-blue">{op.tmu} TMU</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
