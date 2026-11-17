-- VELENTIS setup, part 3: gold wallet, gifts, trades, duels, and the free outfit for every account.
-- Run VELENTIS-supabase.sql and VELENTIS-supabase-2.sql first. Then paste ALL of this into Supabase:
-- SQL Editor, New query, Run. It is safe to run more than once.

-- ---------- tables ----------
create table if not exists wallets (
  user_id uuid primary key references auth.users on delete cascade,
  gold int not null default 0 check (gold >= 0),
  earn_day date not null default current_date,
  earn_today int not null default 0
);
create table if not exists gold_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  delta int not null,
  why text not null,
  created_at timestamptz not null default now()
);
create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  sender uuid references auth.users on delete set null,
  recipient uuid not null references auth.users on delete cascade,
  code text,
  kind text not null check (kind in ('fit','gold')),
  fit text,
  gold int not null default 0,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending','claimed')),
  created_at timestamptz not null default now()
);
create unique index if not exists gifts_code_once on gifts (recipient, code) where code is not null;
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users on delete cascade,
  b uuid not null references auth.users on delete cascade,
  a_gold int not null default 0 check (a_gold >= 0),
  b_gold int not null default 0 check (b_gold >= 0),
  a_fits text[] not null default '{}',
  b_fits text[] not null default '{}',
  a_ok boolean not null default false,
  b_ok boolean not null default false,
  status text not null default 'open' check (status in ('open','done','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (a <> b)
);
create table if not exists duels (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users on delete cascade,
  b uuid not null references auth.users on delete cascade,
  a_power int not null,
  b_power int,
  status text not null default 'pending' check (status in ('pending','done','cancelled')),
  winner uuid,
  lost int not null default 0,
  won int not null default 0,
  pct int not null default 0,
  created_at timestamptz not null default now(),
  check (a <> b)
);

alter table wallets enable row level security;
alter table gold_log enable row level security;
alter table gifts enable row level security;
alter table trades enable row level security;
alter table duels enable row level security;
drop policy if exists "own wallet" on wallets;
create policy "own wallet" on wallets for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own log" on gold_log;
create policy "own log" on gold_log for select to authenticated using (auth.uid() = user_id);
drop policy if exists "my gifts" on gifts;
create policy "my gifts" on gifts for select to authenticated using (auth.uid() = recipient or auth.uid() = sender);
drop policy if exists "my trades" on trades;
create policy "my trades" on trades for select to authenticated using (auth.uid() = a or auth.uid() = b);
drop policy if exists "my duels" on duels;
create policy "my duels" on duels for select to authenticated using (auth.uid() = a or auth.uid() = b);
-- nobody can write these tables directly. Only the functions below can, so gold cannot be faked.

-- ---------- helpers ----------
create or replace function ensure_wallet(uid uuid) returns void
language sql security definer set search_path = public as $$
  insert into wallets (user_id) values (uid) on conflict do nothing;
$$;

create or replace function wallet_get() returns int
language plpgsql security definer set search_path = public as $$
declare g int;
begin
  perform ensure_wallet(auth.uid());
  select gold into g from wallets where user_id = auth.uid();
  return g;
end $$;
grant execute on function wallet_get() to authenticated;

-- gold from a boss or from selling loot. There is a limit per call and per day.
create or replace function gold_earn(src text, amt int) returns int
language plpgsql security definer set search_path = public as $$
declare cap int; w wallets; give int;
begin
  if auth.uid() is null then raise exception 'Log in first'; end if;
  if src not in ('boss','sell') then raise exception 'Unknown gold source'; end if;
  cap := case src when 'boss' then 120 else 250 end;
  amt := least(greatest(coalesce(amt, 0), 0), cap);
  perform ensure_wallet(auth.uid());
  select * into w from wallets where user_id = auth.uid() for update;
  if w.earn_day <> current_date then w.earn_day := current_date; w.earn_today := 0; end if;
  give := greatest(least(amt, 500 - w.earn_today), 0);
  update wallets set gold = gold + give, earn_day = w.earn_day, earn_today = w.earn_today + give where user_id = auth.uid();
  if give > 0 then insert into gold_log (user_id, delta, why) values (auth.uid(), give, src); end if;
  select gold into give from wallets where user_id = auth.uid();
  return give;
end $$;
grant execute on function gold_earn(text, int) to authenticated;

-- buy a dungeon outfit with gold
create or replace function buy_fit(item text) returns int
language plpgsql security definer set search_path = public as $$
declare price int; g int;
begin
  price := case item when 'gate' then 300 when 'raid' then 600 else null end;
  if price is null then raise exception 'That outfit is not for sale'; end if;
  perform ensure_wallet(auth.uid());
  select gold into g from wallets where user_id = auth.uid() for update;
  if g < price then raise exception 'Not enough gold'; end if;
  update wallets set gold = gold - price where user_id = auth.uid();
  insert into gold_log (user_id, delta, why) values (auth.uid(), -price, 'buy ' || item);
  return g - price;
end $$;
grant execute on function buy_fit(text) to authenticated;

-- ---------- the free outfit for everyone ----------
create or replace function welcome_check() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into gifts (sender, recipient, code, kind, fit, note) values (null, auth.uid(), 'welcome', 'fit', 'knit', 'A gift for joining Velentis')
  on conflict do nothing;
end $$;
grant execute on function welcome_check() to authenticated;

create or replace function welcome_on_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into gifts (sender, recipient, code, kind, fit, note) values (null, new.id, 'welcome', 'fit', 'knit', 'A gift for joining Velentis')
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists welcome_gift on profiles;
create trigger welcome_gift after insert on profiles for each row execute function welcome_on_profile();
-- every account that already exists
insert into gifts (sender, recipient, code, kind, fit, note)
select null, id, 'welcome', 'fit', 'knit', 'A gift for joining Velentis' from profiles
on conflict do nothing;

-- ---------- gifts between friends ----------
create or replace function send_gift(to_user uuid, k text, f text, g int, n text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); gid uuid; w int;
begin
  if me is null then raise exception 'Log in first'; end if;
  if not is_friend(me, to_user) then raise exception 'You can only send gifts to friends'; end if;
  if exists (select 1 from gifts where sender = me and recipient = to_user and created_at::date = current_date) then
    raise exception 'You already sent this friend a gift today';
  end if;
  if k = 'gold' then
    if g < 1 or g > 100 then raise exception 'Gold gifts are 1 to 100'; end if;
    perform ensure_wallet(me);
    select gold into w from wallets where user_id = me for update;
    if w < g then raise exception 'Not enough gold'; end if;
    update wallets set gold = gold - g where user_id = me;
    insert into gold_log (user_id, delta, why) values (me, -g, 'gift');
    insert into gifts (sender, recipient, kind, gold, note) values (me, to_user, 'gold', g, left(coalesce(n, ''), 120)) returning id into gid;
  elsif k = 'fit' then
    if f not in ('gate','raid') then raise exception 'That outfit cannot be given away'; end if;
    insert into gifts (sender, recipient, kind, fit, note) values (me, to_user, 'fit', f, left(coalesce(n, ''), 120)) returning id into gid;
  else raise exception 'Unknown gift'; end if;
  return gid;
end $$;
grant execute on function send_gift(uuid, text, text, int, text) to authenticated;

create or replace function claim_gift(gid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r gifts;
begin
  select * into r from gifts where id = gid and recipient = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'That gift is gone'; end if;
  update gifts set status = 'claimed' where id = gid;
  if r.kind = 'gold' then
    perform ensure_wallet(auth.uid());
    update wallets set gold = gold + r.gold where user_id = auth.uid();
    insert into gold_log (user_id, delta, why) values (auth.uid(), r.gold, 'gift received');
  end if;
  return jsonb_build_object('kind', r.kind, 'fit', r.fit, 'gold', r.gold);
end $$;
grant execute on function claim_gift(uuid) to authenticated;

-- ---------- trades ----------
create or replace function trade_open(to_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); tid uuid;
begin
  if me is null then raise exception 'Log in first'; end if;
  if not is_friend(me, to_user) then raise exception 'You can only trade with friends'; end if;
  select id into tid from trades where status = 'open' and created_at > now() - interval '1 day'
    and ((a = me and b = to_user) or (a = to_user and b = me)) limit 1;
  if tid is not null then return tid; end if;
  insert into trades (a, b) values (me, to_user) returning id into tid;
  return tid;
end $$;
grant execute on function trade_open(uuid) to authenticated;

create or replace function trade_set(tid uuid, g int, fits text[]) returns void
language plpgsql security definer set search_path = public as $$
declare t trades; w int;
begin
  select * into t from trades where id = tid and status = 'open' and (a = auth.uid() or b = auth.uid()) for update;
  if not found then raise exception 'This trade is closed'; end if;
  if t.created_at < now() - interval '1 day' then raise exception 'This trade expired'; end if;
  g := greatest(coalesce(g, 0), 0);
  fits := coalesce(fits, '{}');
  if exists (select 1 from unnest(fits) x where x not in ('gate','raid')) then raise exception 'That outfit cannot be traded'; end if;
  perform ensure_wallet(auth.uid());
  select gold into w from wallets where user_id = auth.uid();
  if g > w then raise exception 'You do not have that much gold'; end if;
  if t.a = auth.uid() then update trades set a_gold = g, a_fits = fits, a_ok = false, b_ok = false, updated_at = now() where id = tid;
  else update trades set b_gold = g, b_fits = fits, a_ok = false, b_ok = false, updated_at = now() where id = tid; end if;
end $$;
grant execute on function trade_set(uuid, int, text[]) to authenticated;

create or replace function trade_confirm(tid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare t trades; wa int; wb int;
begin
  select * into t from trades where id = tid and status = 'open' and (a = auth.uid() or b = auth.uid()) for update;
  if not found then raise exception 'This trade is closed'; end if;
  if t.created_at < now() - interval '1 day' then raise exception 'This trade expired'; end if;
  if t.a = auth.uid() then t.a_ok := true; else t.b_ok := true; end if;
  if t.a_ok and t.b_ok then
    perform ensure_wallet(t.a); perform ensure_wallet(t.b);
    select gold into wa from wallets where user_id = t.a for update;
    select gold into wb from wallets where user_id = t.b for update;
    if wa < t.a_gold or wb < t.b_gold then
      update trades set a_ok = false, b_ok = false, updated_at = now() where id = tid;
      raise exception 'One of you no longer has enough gold. The trade was reset';
    end if;
    update wallets set gold = gold - t.a_gold + t.b_gold where user_id = t.a;
    update wallets set gold = gold - t.b_gold + t.a_gold where user_id = t.b;
    if t.a_gold <> t.b_gold then
      insert into gold_log (user_id, delta, why) values (t.a, t.b_gold - t.a_gold, 'trade'), (t.b, t.a_gold - t.b_gold, 'trade');
    end if;
    update trades set a_ok = true, b_ok = true, status = 'done', updated_at = now() where id = tid;
    return 'done';
  end if;
  update trades set a_ok = t.a_ok, b_ok = t.b_ok, updated_at = now() where id = tid;
  return 'open';
end $$;
grant execute on function trade_confirm(uuid) to authenticated;

create or replace function trade_cancel(tid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update trades set status = 'cancelled', updated_at = now() where id = tid and status = 'open' and (a = auth.uid() or b = auth.uid());
end $$;
grant execute on function trade_cancel(uuid) to authenticated;

-- ---------- duels ----------
create or replace function duel_challenge(opp uuid, pw int) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); did uuid;
begin
  if me is null then raise exception 'Log in first'; end if;
  if not is_friend(me, opp) then raise exception 'You can only duel friends'; end if;
  if pw < 1 or pw > 3000 then raise exception 'Bad power'; end if;
  if exists (select 1 from duels where status = 'pending' and ((a = me and b = opp) or (a = opp and b = me))) then
    raise exception 'A duel with this friend is already waiting';
  end if;
  insert into duels (a, b, a_power) values (me, opp, pw) returning id into did;
  return did;
end $$;
grant execute on function duel_challenge(uuid, int) to authenticated;

create or replace function duel_accept(did uuid, pw int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d duels; sa numeric; sb numeric; win uuid; los uuid; lg int; loss int; pc int; gain int; margin numeric; cnt int;
begin
  select * into d from duels where id = did and b = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'That duel is gone'; end if;
  if pw < 1 or pw > 3000 then raise exception 'Bad power'; end if;
  select count(*) into cnt from duels where status = 'done' and created_at::date = current_date and (a = auth.uid() or b = auth.uid());
  if cnt >= 5 then raise exception 'You already fought 5 duels today'; end if;
  if exists (select 1 from duels where status = 'done' and created_at > now() - interval '1 hour'
             and ((a = d.a and b = d.b) or (a = d.b and b = d.a))) then
    raise exception 'You two fought a moment ago. Wait an hour';
  end if;
  sa := power(d.a_power, 1.3) * (0.75 + random() * 0.5);
  sb := power(pw, 1.3) * (0.75 + random() * 0.5);
  if sa >= sb then win := d.a; los := d.b; else win := d.b; los := d.a; end if;
  margin := abs(sa - sb) / (sa + sb);
  pc := 10 + round(20 * least(margin / 0.3, 1));
  perform ensure_wallet(win); perform ensure_wallet(los);
  select gold into lg from wallets where user_id = los for update;
  loss := case when lg >= 20 then floor(lg * pc / 100.0)::int else 0 end;
  gain := least(loss * 2, 150);
  if loss > 0 then
    update wallets set gold = gold - loss where user_id = los;
    insert into gold_log (user_id, delta, why) values (los, -loss, 'lost a duel');
  end if;
  if gain > 0 then
    update wallets set gold = gold + gain where user_id = win;
    insert into gold_log (user_id, delta, why) values (win, gain, 'won a duel');
  end if;
  update duels set status = 'done', b_power = pw, winner = win, lost = loss, won = gain, pct = pc where id = did;
  return jsonb_build_object('winner', win, 'lost', loss, 'won', gain, 'pct', pc);
end $$;
grant execute on function duel_accept(uuid, int) to authenticated;

create or replace function duel_cancel(did uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update duels set status = 'cancelled' where id = did and status = 'pending' and (a = auth.uid() or b = auth.uid());
end $$;
grant execute on function duel_cancel(uuid) to authenticated;
