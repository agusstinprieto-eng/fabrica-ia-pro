-- Secure Manufacturing Operations for Horacio (Safe Re-run Version)
-- This migration handles the dependency between RLS policies and column types.

-- 1. DROP POLICIES FIRST
-- Postgres prevents altering column types if they are used in RLS policies.
DROP POLICY IF EXISTS "Users can view own machines" ON machines;
DROP POLICY IF EXISTS "Users can insert own machines" ON machines;
DROP POLICY IF EXISTS "Users can update own machines" ON machines;
DROP POLICY IF EXISTS "Users can delete own machines" ON machines;
DROP POLICY IF EXISTS "Users can access own operations" ON manufacturing_operations;
DROP POLICY IF EXISTS "Allow all access" ON manufacturing_operations;
DROP POLICY IF EXISTS "Enable all access for manufacturing_operations" ON manufacturing_operations;

-- 2. Prepare machines table type conversion
DO $$ 
BEGIN 
    -- Drop the foreign key constraint to allow mixed UUID/Demo string IDs
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='machines' AND constraint_name='machines_user_id_fkey') THEN
        ALTER TABLE machines DROP CONSTRAINT machines_user_id_fkey;
    END IF;
END $$;

-- Now we can safely convert user_id to TEXT
ALTER TABLE machines ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Backfill existing machines with Horacio's ID if NULL
UPDATE machines SET user_id = 'horacio-demo' WHERE user_id IS NULL;

-- 3. Handle manufacturing_operations column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manufacturing_operations' AND column_name='user_id') THEN
        ALTER TABLE manufacturing_operations ADD COLUMN user_id TEXT;
    ELSE
        ALTER TABLE manufacturing_operations ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;
END $$;

-- Backfill existing operations with Horacio's ID if NULL
UPDATE manufacturing_operations SET user_id = 'horacio-demo' WHERE user_id IS NULL;

-- 4. Re-enable and Configure RLS for manufacturing_operations
ALTER TABLE manufacturing_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own operations" 
ON manufacturing_operations 
FOR ALL 
USING (
    (auth.uid()::text = user_id) OR 
    (user_id = 'horacio-demo')
)
WITH CHECK (
    (auth.uid()::text = user_id) OR 
    (user_id = 'horacio-demo')
);

-- 5. Re-configure RLS for machines
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own machines"
  ON machines FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'horacio-demo');

CREATE POLICY "Users can insert own machines"
  ON machines FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'horacio-demo');

CREATE POLICY "Users can update own machines"
  ON machines FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = 'horacio-demo');

CREATE POLICY "Users can delete own machines"
  ON machines FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = 'horacio-demo');

-- 6. Ensure machine types catalog remains public
ALTER TABLE manufacturing_machine_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read" ON manufacturing_machine_types;
CREATE POLICY "Public Read" ON manufacturing_machine_types FOR SELECT USING (true);

-- End of Safe Migration
