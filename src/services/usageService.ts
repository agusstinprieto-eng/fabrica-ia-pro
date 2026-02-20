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

            // Silently handle missing table (PGRST205) - table will be created later
            if (error && error.code !== 'PGRST205') {
                console.warn('Usage log warning:', error.message);
            }
        } catch (error) {
            // Non-critical: don't block the app if logging fails
        }
    },

    async getDailyUsage(username: string) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('usage_logs')
                .select('*')
                .eq('username', username)
                .gte('created_at', today.toISOString());

            if (error) throw error;

            return {
                text_queries: data
                    .filter(log => log.interaction_type === InteractionType.TEXT_QUERY)
                    .reduce((acc, curr) => acc + (curr.quantity || 0), 0),
                voice_minutes: data
                    .filter(log => log.interaction_type === InteractionType.VOICE_MINUTE)
                    .reduce((acc, curr) => acc + (curr.quantity || 0), 0),
                video_analyses: data
                    .filter(log => log.interaction_type === InteractionType.VIDEO_ANALYSIS)
                    .reduce((acc, curr) => acc + (curr.quantity || 0), 0)
            };
        } catch (error) {
            console.error('Error fetching daily usage:', error);
            return null;
        }
    },

    async getAllUsage() {
        try {
            const { data, error } = await supabase
                .from('usage_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching all usage:', error);
            return [];
        }
    },

    async getUserLimits(userId: string) {
        try {
            const { data, error } = await supabase
                .from('user_limits')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user limits:', error);
            // Default limits for safety if table not ready
            return {
                video_minutes_limit: 150,
                video_minutes_used: 0,
                plan_tier: 'standard'
            };
        }
    },

    async deductVideoMinutes(userId: string, minutes: number = 1) {
        try {
            // we use rpc or direct update. RPC is safer for concurrency
            const { error } = await supabase.rpc('deduct_video_quota', {
                p_user_id: userId,
                p_amount: minutes
            });

            if (error) {
                // Fallback to direct update if RPC doesn't exist yet
                const { data: current } = await this.getUserLimits(userId);
                await supabase
                    .from('user_limits')
                    .update({ video_minutes_used: (current?.video_minutes_used || 0) + minutes })
                    .eq('user_id', userId);
            }
        } catch (error) {
            console.error('Error deducting minutes:', error);
        }
    }
};
