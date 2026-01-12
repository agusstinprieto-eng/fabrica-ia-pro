
import { useState, useEffect } from 'react';
import { HistoryItem, FileData } from '../types';

const STORAGE_KEY = 'ia_agus_reports_history';

export const useAnalysisHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = (analysis: string, images: FileData[]) => {
        // Extract title
        const opNameMatch = analysis.match(/\*\*Nombre de la Operación\*\*:\s*(.*)/i) ||
            analysis.match(/\*\*Operation Name\*\*:\s*(.*)/i);
        const title = opNameMatch ? opNameMatch[1].trim() : "New Scan";

        const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            analysis,
            // Store primarily the first image as preview to save space, or all if crucial
            // For now, let's keep all but be mindful of quota. 
            // Optimization: Strip base64 if too large or just store previewUrl if blob (blob URLs don't persist!)
            // We MUST store base64 for persistence across reloads.
            images: images.map(img => ({ ...img, selected: true })),
            previewImage: images[0]?.base64 || images[0]?.previewUrl,
            title
        };

        const updated = [newItem, ...history];
        setHistory(updated);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            alert("Storage full! Oldest reports might be lost or save failed.");
        }
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const deleteItem = (id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return { history, saveToHistory, clearHistory, deleteItem };
};
