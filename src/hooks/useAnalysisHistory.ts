
import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, FileData } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useAnalysisHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const { user } = useAuth();

    // Fetch history from Supabase
    const fetchHistory = useCallback(async () => {
        if (!user) {
            setHistory([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('analysis_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            // Map DB rows to Frontend HistoryItem format
            const formattedHistory: HistoryItem[] = (data || []).map(row => ({
                id: row.id,
                date: row.created_at,
                title: row.title || 'Untitled Scan',
                analysis: JSON.stringify(row.analysis_data), // Frontend expects stringified JSON
                images: row.images || [],
                previewImage: row.images?.[0]?.previewUrl || row.images?.[0]?.base64 || null
            }));

            setHistory(formattedHistory);
        } catch (err) {
            console.error("Failed to fetch analysis history:", err);
            // Fallback to local state if offline? For now, just log.
        }
    }, [user]);

    // Initial Fetch & Realtime Subscription (Optional)
    useEffect(() => {
        fetchHistory();

        // Optional: Subscribe to changes if we want real-time updates across devices
        // const channel = supabase.channel('history_changes')
        //     .on('postgres_changes', { event: '*', schema: 'public', table: 'analysis_history' }, () => {
        //         fetchHistory();
        //     })
        //     .subscribe();

        // return () => { supabase.removeChannel(channel); };
    }, [fetchHistory]);


    const saveToHistory = async (analysis: string, images: FileData[]) => {
        if (!user) return; // Only save for logged-in users

        // Extract title
        const opNameMatch = analysis.match(/\*\*Nombre de la Operación\*\*:\s*(.*)/i) ||
            analysis.match(/\*\*Operation Name\*\*:\s*(.*)/i);
        const title = opNameMatch ? opNameMatch[1].trim() : "New Scan";

        // OPTIMIZATION for Database Storage:
        // We do NOT want to store huge Base64 strings in the DB heavily.
        // For V1, we will strip base64 from 'images' JSON except for a small thumbnail if needed,
        // or rely on Storage URLs if we uploaded them.
        // For now, to keep it simple effectively like LocalStorage but in DB:
        // We will keep the first image's base64 for preview, but be careful with size.

        let optimizedImages = [];
        if (images.length > 0) {
            // Keep only the first image and try to keep it light
            // In a production app, we should upload to Storage bucket "history_images" and save URL.
            // For this rapid prototype, we'll slice the array to 1 user.
            const thumb = images[0];
            optimizedImages.push({
                name: thumb.name,
                mimeType: thumb.mimeType,
                // If it's a URL (from video extraction), keep it. If base64, maybe truncated? 
                // We'll keep base64 for now to ensure the UI works, but limit count.
                base64: thumb.base64,
                previewUrl: thumb.previewUrl
            });
        }

        let parsedAnalysis = {};
        try {
            parsedAnalysis = JSON.parse(analysis);
        } catch (e) {
            console.warn("Could not parse analysis JSON for DB storage, saving as raw string wrapper or null");
            parsedAnalysis = { raw: analysis };
        }

        try {
            const { data, error } = await supabase
                .from('analysis_history')
                .insert({
                    // Handle non-UUID user IDs (like 'god-1' from demo/admin bypass)
                    // If user.id is not a valid UUID, we can't save to this table which expects UUID.
                    // For now, we skip saving or use a dummy UUID if available.
                    // BETTER FIX: Check if it's a UUID.
                    user_id: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(user.id) ? user.id : '00000000-0000-0000-0000-000000000000',
                    company_id: user.company || null,
                    title,
                    analysis_data: parsedAnalysis,
                    images: optimizedImages
                })
                .select()
                .single();

            if (error) throw error;

            // Optimistic Update
            if (data) {
                const newItem: HistoryItem = {
                    id: data.id,
                    date: data.created_at,
                    title: data.title,
                    analysis: JSON.stringify(data.analysis_data),
                    images: data.images,
                    previewImage: data.images?.[0]?.previewUrl || data.images?.[0]?.base64
                };
                setHistory(prev => [newItem, ...prev]);
            }

        } catch (err) {
            console.error("Failed to save history to Supabase:", err);
            // Fallback to local state/alert?
        }
    };

    const clearHistory = async () => {
        // Not implemented for DB to avoid accidental massive deletion. 
        // Maybe users can only delete individual items.
        // Or implement a "Soft Delete" flag.
        console.warn("Clear All History not fully implemented for Database (Safety).");
        setHistory([]);
    };

    const deleteItem = async (id: string) => {
        try {
            const { error } = await supabase
                .from('analysis_history')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setHistory(prev => prev.filter(h => h.id !== id));
        } catch (err) {
            console.error("Failed to delete item:", err);
        }
    };

    return { history, saveToHistory, clearHistory, deleteItem };
};
