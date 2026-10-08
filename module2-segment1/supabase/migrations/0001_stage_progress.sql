-- Stage completion only. Recordings, 'My signs' and answers stay on the device (script, Segment 1).
create table if not exists public.stage_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  module text not null,
  stage_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, module, stage_id)
);

alter table public.stage_progress enable row level security;

create policy "own rows: select" on public.stage_progress
  for select using (auth.uid() = user_id);
create policy "own rows: insert" on public.stage_progress
  for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.stage_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
