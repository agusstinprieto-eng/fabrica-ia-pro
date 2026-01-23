create table if not exists manufacturing_machine_types (
  id uuid default gen_random_uuid() primary key,
  code text unique, -- Machine Type (e.g., SNLS)
  name text, -- Machine Full Form
  brand text,
  created_at timestamptz default now()
);

-- Add RLS policies
alter table manufacturing_machine_types enable row level security;

create policy "Allow all access" on manufacturing_machine_types
  for all using (true) with check (true);
