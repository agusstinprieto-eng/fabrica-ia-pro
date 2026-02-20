-- 🏭 MANUFACTURA IA PRO: SISTEMA AVANZADO DE CUOTAS (CORREGIDO)
-- Ejecutar en el Dashboard de Supabase

CREATE TABLE IF NOT EXISTS public.user_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_tier TEXT DEFAULT 'standard' CHECK (plan_tier IN ('standard', 'enterprise', 'godmode')),
    video_minutes_limit INTEGER DEFAULT 0,
    video_minutes_used INTEGER DEFAULT 0,
    text_queries_limit INTEGER DEFAULT 0,
    text_queries_used INTEGER DEFAULT 0,
    cycle_start_date DATE DEFAULT CURRENT_DATE,
    cycle_end_date DATE, -- Calculado manualmente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.calculate_pro_rata_limit(p_full_monthly_limit INTEGER) RETURNS INTEGER AS $$
DECLARE v_days_in_month INTEGER; v_days_remaining INTEGER; v_pro_rated_limit INTEGER;
BEGIN
    v_days_in_month := DATE_PART('days', (date_trunc('month', NOW()) + interval '1 month' - interval '1 day'));
    v_days_remaining := v_days_in_month - DATE_PART('day', NOW()) + 1;
    v_pro_rated_limit := FLOOR((p_full_monthly_limit::NUMERIC / v_days_in_month) * v_days_remaining);
    RETURN v_pro_rated_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.activate_manufactura_plan(p_user_id UUID, p_plan_tier TEXT) RETURNS JSON AS $$
DECLARE v_video_limit INTEGER; v_text_limit INTEGER; v_video_pro_rated INTEGER; v_text_pro_rated INTEGER;
BEGIN
    IF p_plan_tier = 'standard' THEN v_video_limit := 150; v_text_limit := 1000;
    ELSIF p_plan_tier = 'enterprise' THEN v_video_limit := 1000; v_text_limit := 3000;
    ELSE RETURN json_build_object('error', 'Invalid plan tier'); END IF;
    
    v_video_pro_rated := public.calculate_pro_rata_limit(v_video_limit);
    v_text_pro_rated := public.calculate_pro_rata_limit(v_text_limit);
    
    INSERT INTO public.user_limits (user_id, plan_tier, video_minutes_limit, text_queries_limit, cycle_start_date, cycle_end_date)
    VALUES (p_user_id, p_plan_tier, v_video_pro_rated, v_text_pro_rated, CURRENT_DATE, ((date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date))
    ON CONFLICT (user_id) DO UPDATE SET 
        plan_tier = EXCLUDED.plan_tier, 
        video_minutes_limit = v_video_pro_rated, 
        text_queries_limit = v_text_pro_rated, 
        cycle_start_date = CURRENT_DATE, 
        cycle_end_date = ((date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date),
        video_minutes_used = 0, 
        text_queries_used = 0;
        
    RETURN json_build_object('status', 'active', 'pro_rata_video', v_video_pro_rated, 'full_monthly_video', v_video_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.deduct_video_quota(p_user_id UUID, p_amount INTEGER) RETURNS VOID AS $$
BEGIN
    UPDATE public.user_limits SET video_minutes_used = video_minutes_used + p_amount WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
