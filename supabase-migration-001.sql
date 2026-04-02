-- Run this in Supabase SQL Editor (it adds the today_tasks table)

create table today_tasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  date date not null,
  created_at timestamp with time zone default now()
);

alter table today_tasks enable row level security;
create policy "allow all" on today_tasks for all using (true) with check (true);
