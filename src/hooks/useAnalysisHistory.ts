
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

        // OPTIMIZATION: Save only the first image to prevent LocalStorage Quota Exceeded
        // We cannot save all 6 frames * 10 reports.
        const thumbnail = images.length > 0 ? images[0] : null;
        const optimizedImages = thumbnail ? [thumbnail] : [];

        const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            analysis,
            images: optimizedImages, // Only keep one reference
            previewImage: thumbnail?.base64 || thumbnail?.previewUrl,
            title
        };

        // Limit to last 10 items to prevent overflow
        const currentHistory = [...history];
        if (currentHistory.length >= 10) {
            currentHistory.pop(); // Remove oldest
        }

        const updated = [newItem, ...currentHistory];
        setHistory(updated);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            // Emergency cleanup if still full
            console.warn("Storage quota exceeded. Clearing oldest items...");
            try {
                // Keep only last 3
                const emergencyTrim = updated.slice(0, 3);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencyTrim));
                setHistory(emergencyTrim);
            } catch (err) {
                console.error("Critical storage failure", err);
                // Last resort: Save only text, no images
                const textOnly = updated.map(item => ({ ...item, images: [], previewImage: null }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly));
                setHistory(textOnly);
            }
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
