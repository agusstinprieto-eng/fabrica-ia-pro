-- Migration: Enforce Limits & Governance
-- Description: Limits production lines to 10 per organization and ensures RLS.

-- 1. Function to check limit before insert
CREATE OR REPLACE FUNCTION check_production_line_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    limit_count INTEGER := 10; -- Hard Limit
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM public.production_lines
    WHERE organization_id = NEW.organization_id;

    IF current_count >= limit_count THEN
        RAISE EXCEPTION 'Limit Reached: Maximum of % production lines allowed per organization. Contact Sales for Enterprise Plan.', limit_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on production_lines table
DROP TRIGGER IF EXISTS enforce_line_limit ON public.production_lines;
CREATE TRIGGER enforce_line_limit
BEFORE INSERT ON public.production_lines
FOR EACH ROW
EXECUTE FUNCTION check_production_line_limit();

-- 3. Row Level Security (RLS) Assurance
-- Ensure RLS is enabled on critical tables
ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see lines from their organization
DROP POLICY IF EXISTS "Access own org lines" ON public.production_lines;
CREATE POLICY "Access own org lines" ON public.production_lines
    USING (organization_id = auth.uid()::uuid); -- Assumes simple 1-1 mapping for demo, or match via org_members table

-- Policy: Users can only insert lines for their organization
DROP POLICY IF EXISTS "Insert own org lines" ON public.production_lines;
CREATE POLICY "Insert own org lines" ON public.production_lines
    WITH CHECK (organization_id = auth.uid()::uuid);

-- 4. Comment / Documentation
COMMENT ON TABLE public.production_lines IS 'Stores manufacturing lines. Limited to 10 per org by trigger enforce_line_limit.';
