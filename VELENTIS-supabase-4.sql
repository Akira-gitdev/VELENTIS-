-- VELENTIS setup, part 4: private vault for things too big or too private for the normal backup
-- (wardrobe photos, cooking photos, and your AI key if you keep that backup switched on).
-- Run VELENTIS-supabase.sql, -2 and -3 first. Then paste ALL of this into Supabase:
-- SQL Editor, New query, Run. It is safe to run more than once.

create table if not exists vault (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('wardrobe', 'chefpics', 'keys')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table vault enable row level security;
drop policy if exists "own vault" on vault;
create policy "own vault" on vault for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
