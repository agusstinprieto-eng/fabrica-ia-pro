-- Enable RLS on manufacturing tables
alter table manufacturing_operations enable row level security;
alter table manufacturing_machine_types enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable all access for manufacturing_operations" on manufacturing_operations;
drop policy if exists "Enable all access for manufacturing_machine_types" on manufacturing_machine_types;

-- Create permissive policies for development
create policy "Enable all access for manufacturing_operations"
on manufacturing_operations for all
using (true)
with check (true);

create policy "Enable all access for manufacturing_machine_types"
on manufacturing_machine_types for all
using (true)
with check (true);
