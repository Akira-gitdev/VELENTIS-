-- VELENTIS online setup. Paste ALL of this into Supabase: SQL Editor, New query, then press Run.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  level int not null default 1,
  total_xp int not null default 0,
  week_xp int not null default 0,
  best_streak int not null default 0,
  week_km numeric not null default 0,
  tiles int not null default 0,
  attrs jsonb not null default '{}',
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists snapshots (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  device text,
  updated_at timestamptz not null default now()
);
create table if not exists friends (
  user_id uuid not null references auth.users on delete cascade,
  friend_id uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table profiles enable row level security;
alter table snapshots enable row level security;
alter table friends enable row level security;

-- profiles: everyone logged in can read visible profiles; you can only write your own
create policy "read visible profiles" on profiles for select to authenticated using (visible or auth.uid() = id);
create policy "insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- snapshots: private backups, only you can see or change yours
create policy "own snapshot" on snapshots for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friends: you see requests that involve you; you send requests; the other person accepts; either can remove
create policy "see my friend rows" on friends for select to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "send request" on friends for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
create policy "accept request" on friends for update to authenticated using (auth.uid() = friend_id) with check (auth.uid() = friend_id and status = 'accepted');
create policy "remove friend" on friends for delete to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);

-- lets the sign-up screen check if a username is free (returns only true or false)
create or replace function username_free(name text) returns boolean
language sql security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(name));
$$;
grant execute on function username_free(text) to anon, authenticated;

-- makes the profile row automatically when someone signs up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username) values (new.id, lower(new.raw_user_meta_data->>'username'));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
