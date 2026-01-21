-- Machine Management Table for Manufactura IA Pro
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  installation_date DATE,
  total_operating_hours INTEGER DEFAULT 0,
  current_efficiency INTEGER DEFAULT 100,
  health_score INTEGER DEFAULT 100,
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  failure_probability INTEGER DEFAULT 0 CHECK (failure_probability >= 0 AND failure_probability <= 100),
  next_maintenance_due DATE,
  components_at_risk JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_machines_user_id ON machines(user_id);
CREATE INDEX IF NOT EXISTS idx_machines_risk_level ON machines(risk_level);
CREATE INDEX IF NOT EXISTS idx_machines_created_at ON machines(created_at DESC);

-- Enable Row Level Security
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own machines" ON machines;
DROP POLICY IF EXISTS "Users can insert own machines" ON machines;
DROP POLICY IF EXISTS "Users can update own machines" ON machines;
DROP POLICY IF EXISTS "Users can delete own machines" ON machines;

-- Create RLS Policies
CREATE POLICY "Users can view own machines"
  ON machines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own machines"
  ON machines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own machines"
  ON machines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own machines"
  ON machines FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS machines_updated_at_trigger ON machines;
CREATE TRIGGER machines_updated_at_trigger
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_machines_updated_at();

-- Grant permissions
GRANT ALL ON machines TO authenticated;
GRANT ALL ON machines TO service_role;

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'machines'
ORDER BY ordinal_position;
