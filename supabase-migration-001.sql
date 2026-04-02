-- Run this in Supabase SQL Editor (it adds the today_tasks table)

create table today_tasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  date date not null,
  created_at timestamp with time zone default now()
);

alter table today_tasks enable row level security;
create policy "allow all" on today_tasks for all using (true) with check (true);

-- Feedback corrections table
create table corrections (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  task_id uuid references tasks(id) on delete cascade,
  task_text text,
  original_quadrant text,
  original_priority text,
  original_action text,
  original_delegate_to text,
  corrected_quadrant text,
  corrected_priority text,
  corrected_action text,
  corrected_delegate_to text,
  correction_note text
);

alter table corrections enable row level security;
create policy "allow all" on corrections for all using (true) with check (true);

-- Decision log table (session memory)
create table decision_log (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  decision_type text, -- 'today_confirm', 'reprioritise', 'done', 'delegate_override'
  task_id uuid references tasks(id) on delete cascade,
  task_text text,
  quadrant text,
  from_value text,
  to_value text,
  context text
);

alter table decision_log enable row level security;
create policy "allow all" on decision_log for all using (true) with check (true);
