-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  text text not null,
  quadrant text,
  priority text,
  action text,
  delegate_to text,
  reason text,
  done boolean default false
);

create table sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  task_count integer,
  tasks_json text,
  insight text
);

-- Allow open access (your app is password-protected at the app level)
alter table tasks enable row level security;
alter table sessions enable row level security;

create policy "allow all" on tasks for all using (true) with check (true);
create policy "allow all" on sessions for all using (true) with check (true);
