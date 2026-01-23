create table if not exists manufacturing_operations (
  id uuid default gen_random_uuid() primary key,
  process_code text,
  operation text,
  machine_code text, -- M/C
  tmu numeric,
  smv numeric,
  tgt_hr numeric, -- TGT / HR
  machine_type text,
  machine_full_form text,
  brand text,
  created_at timestamptz default now()
);

-- Add RLS policies (Open for now as it's an internal tool, or restrict if needed)
alter table manufacturing_operations enable row level security;

create policy "Allow all access" on manufacturing_operations
  for all using (true) with check (true);
