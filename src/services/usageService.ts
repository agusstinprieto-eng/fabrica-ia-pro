import { supabase } from '../lib/supabaseClient';

export enum InteractionType {
    TEXT_QUERY = 'text_query',
    VOICE_MINUTE = 'voice_minute',
    VIDEO_ANALYSIS = 'video_analysis'
}

export const usageService = {
    async logUsage(username: string, type: InteractionType, quantity: number = 1, metadata: any = {}) {
        try {
            const { error } = await supabase
                .from('usage_logs')
                .insert([{
                    username,
                    interaction_type: type,
                    quantity,
                    metadata
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error logging usage:', error);
        }
    }
};
