import { supabase } from '../lib/supabaseClient';

export enum InteractionType {
    TEXT_QUERY = 'text_query',
    VOICE_MINUTE = 'voice_minute',
    VIDEO_ANALYSIS = 'video_analysis',
    LOGIN = 'login'
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
                .maybeSingle(); // Returns null if no row exists (vs .single() which throws 406)

            if (error) throw error;

            // Return defaults if user has no limits row yet
            if (!data) {
                return {
                    video_minutes_limit: 150,
                    video_minutes_used: 0,
                    plan_tier: 'standard'
                };
            }

            return data;
        } catch (error) {
            console.warn('getUserLimits fallback to defaults:', error);
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
    },

    async getGlobalStats() {
        try {
            const { data, error } = await supabase
                .from('usage_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by user
            const statsByUser: Record<string, any> = {};
            data.forEach(log => {
                const user = log.username || 'unknown';
                if (!statsByUser[user]) {
                    statsByUser[user] = {
                        username: user,
                        text_queries: 0,
                        voice_minutes: 0,
                        video_analyses: 0,
                        logins: 0,
                        last_interaction: log.created_at
                    };
                }

                if (log.interaction_type === InteractionType.TEXT_QUERY) statsByUser[user].text_queries += log.quantity || 0;
                if (log.interaction_type === InteractionType.VOICE_MINUTE) statsByUser[user].voice_minutes += log.quantity || 0;
                if (log.interaction_type === InteractionType.VIDEO_ANALYSIS) statsByUser[user].video_analyses += log.quantity || 0;
                if (log.interaction_type === InteractionType.LOGIN) statsByUser[user].logins += log.quantity || 0;
            });

            return Object.values(statsByUser);
        } catch (error) {
            console.error('Error fetching global stats:', error);
            return [];
        }
    },

    async getPeriodicUsage(timeframe: 'day' | 'week' | 'month' | 'year') {
        try {
            const now = new Date();
            let gteDate = new Date();

            if (timeframe === 'day') gteDate.setHours(0, 0, 0, 0);
            if (timeframe === 'week') gteDate.setDate(now.getDate() - 7);
            if (timeframe === 'month') gteDate.setMonth(now.getMonth() - 1);
            if (timeframe === 'year') gteDate.setFullYear(now.getFullYear() - 1);

            const { data, error } = await supabase
                .from('usage_logs')
                .select('*')
                .gte('created_at', gteDate.toISOString());

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching periodic usage:', error);
            return [];
        }
    }
};
