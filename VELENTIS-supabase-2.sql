-- VELENTIS online setup, part 2: chats, guilds and invites.
-- Run this AFTER the first file. Supabase: SQL Editor, New query, paste ALL of this, press Run.
-- It is safe to run more than once.

create or replace function is_friend(a uuid, b uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from friends where status = 'accepted' and ((user_id = a and friend_id = b) or (user_id = b and friend_id = a)));
$$;

create table if not exists direct_messages (
  id bigint generated always as identity primary key,
  sender uuid not null references auth.users on delete cascade,
  recipient uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  read boolean not null default false,
  check (sender <> recipient)
);
create index if not exists dm_pair on direct_messages (sender, recipient, created_at desc);
create index if not exists dm_to on direct_messages (recipient, read);

create table if not exists guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 24),
  motto text not null default '' check (char_length(motto) <= 80),
  code text not null default substr(md5(random()::text || clock_timestamp()::text), 1, 6),
  owner uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create unique index if not exists guild_name_u on guilds (lower(name));
create unique index if not exists guild_code_u on guilds (code);

create table if not exists guild_members (
  guild_id uuid not null references guilds on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);
create table if not exists guild_messages (
  id bigint generated always as identity primary key,
  guild_id uuid not null references guilds on delete cascade,
  sender uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists gm_guild on guild_messages (guild_id, created_at desc);
create table if not exists guild_invites (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references guilds on delete cascade,
  from_user uuid not null references auth.users on delete cascade,
  to_user uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  unique (guild_id, to_user)
);

alter table direct_messages enable row level security;
alter table guilds enable row level security;
alter table guild_members enable row level security;
alter table guild_messages enable row level security;
alter table guild_invites enable row level security;

create or replace function is_member(g uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from guild_members where guild_id = g and user_id = auth.uid());
$$;

drop policy if exists "dm read" on direct_messages;
drop policy if exists "dm send" on direct_messages;
drop policy if exists "dm mark read" on direct_messages;
drop policy if exists "dm delete own" on direct_messages;
create policy "dm read" on direct_messages for select to authenticated using (auth.uid() = sender or auth.uid() = recipient);
create policy "dm send" on direct_messages for insert to authenticated with check (auth.uid() = sender and is_friend(sender, recipient));
create policy "dm mark read" on direct_messages for update to authenticated using (auth.uid() = recipient) with check (auth.uid() = recipient);
create policy "dm delete own" on direct_messages for delete to authenticated using (auth.uid() = sender);

drop policy if exists "guild read" on guilds;
drop policy if exists "guild owner edit" on guilds;
drop policy if exists "guild owner delete" on guilds;
create policy "guild read" on guilds for select to authenticated using (
  is_member(id) or exists (select 1 from guild_invites i where i.guild_id = guilds.id and i.to_user = auth.uid()));
create policy "guild owner edit" on guilds for update to authenticated using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "guild owner delete" on guilds for delete to authenticated using (auth.uid() = owner);

drop policy if exists "members read" on guild_members;
drop policy if exists "members leave" on guild_members;
create policy "members read" on guild_members for select to authenticated using (is_member(guild_id));
create policy "members leave" on guild_members for delete to authenticated using (
  auth.uid() = user_id or exists (select 1 from guilds g where g.id = guild_id and g.owner = auth.uid()));

drop policy if exists "gmsg read" on guild_messages;
drop policy if exists "gmsg send" on guild_messages;
create policy "gmsg read" on guild_messages for select to authenticated using (is_member(guild_id));
create policy "gmsg send" on guild_messages for insert to authenticated with check (auth.uid() = sender and is_member(guild_id));

drop policy if exists "inv read" on guild_invites;
drop policy if exists "inv send" on guild_invites;
drop policy if exists "inv remove" on guild_invites;
create policy "inv read" on guild_invites for select to authenticated using (auth.uid() = from_user or auth.uid() = to_user);
create policy "inv send" on guild_invites for insert to authenticated with check (auth.uid() = from_user and is_member(guild_id) and is_friend(from_user, to_user));
create policy "inv remove" on guild_invites for delete to authenticated using (auth.uid() = from_user or auth.uid() = to_user);

-- these do the steps that need special rights, safely
create or replace function create_guild(gname text, gmotto text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if (select count(*) from guild_members where user_id = auth.uid()) >= 5 then raise exception 'You can be in up to 5 guilds.'; end if;
  insert into guilds (name, motto, owner) values (trim(gname), coalesce(trim(gmotto), ''), auth.uid()) returning id into gid;
  insert into guild_members (guild_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end $$;
grant execute on function create_guild(text, text) to authenticated;

create or replace function join_guild_code(c text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into gid from guilds where code = lower(trim(c));
  if gid is null then raise exception 'No guild with that code.'; end if;
  if (select count(*) from guild_members where user_id = auth.uid()) >= 5 then raise exception 'You can be in up to 5 guilds.'; end if;
  insert into guild_members (guild_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end $$;
grant execute on function join_guild_code(text) to authenticated;

create or replace function accept_guild_invite(inv uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  select guild_id into gid from guild_invites where id = inv and to_user = auth.uid();
  if gid is null then raise exception 'That invite is gone.'; end if;
  if (select count(*) from guild_members where user_id = auth.uid()) >= 5 then raise exception 'You can be in up to 5 guilds.'; end if;
  insert into guild_members (guild_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  delete from guild_invites where id = inv;
  return gid;
end $$;
grant execute on function accept_guild_invite(uuid) to authenticated;
