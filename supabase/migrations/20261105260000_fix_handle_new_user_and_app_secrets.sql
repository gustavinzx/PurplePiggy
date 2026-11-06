-- Migration: 20261105260000_fix_handle_new_user_and_app_secrets.sql
-- Correção crítica do trigger handle_new_user, ranking order-by e tabela de secrets segura

-- 1. Correção do trigger handle_new_user (usar apenas colunas reais de public.profiles)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    initial_balance,
    is_demo
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'Usuária'), '@', 1)
    ),
    new.email,
    0,
    coalesce((new.raw_user_meta_data->>'is_demo')::boolean, false)
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = coalesce(profiles.email, excluded.email);
  return new;
end;
$$;

-- 2. Correção de ordenação no ranking get_weekly_leaderboard
create or replace function public.get_weekly_leaderboard(p_limit int default 30)
returns table (
  rank bigint,
  nickname text,
  weekly_xp int,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_week date := (date_trunc('week', current_date)::date);
begin
  return query
  with opted_users as (
    select
      p.id as uid,
      coalesce(
        nullif(trim(p.leaderboard_nickname), ''),
        case when p.id = v_user_id then 'Você' else 'Estudante Anônima' end
      ) as display_nick,
      coalesce(
        case when lus.week_start = v_current_week then lus.weekly_xp else 0 end,
        0
      )::int as xp,
      (p.id = v_user_id) as is_me
    from public.profiles p
    left join public.learn_user_stats lus on lus.user_id = p.id
    where (p.leaderboard_opt_in = true) or (v_user_id is not null and p.id = v_user_id)
  ),
  ranked as (
    select
      row_number() over (order by ou.xp desc, ou.uid asc) as rnk,
      ou.display_nick,
      ou.xp,
      ou.is_me
    from opted_users ou
  )
  select
    ranked.rnk as rank,
    ranked.display_nick as nickname,
    ranked.xp as weekly_xp,
    ranked.is_me as is_current_user
  from ranked
  order by 1 asc
  limit greatest(1, coalesce(p_limit, 30));
end;
$$;

grant execute on function public.get_weekly_leaderboard(int) to authenticated, anon;

-- 3. Schema private e tabela de secrets acessível estritamente por service_role
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant all on schema private to service_role;

create table if not exists private.app_secrets (
  name text primary key,
  value text not null,
  created_at timestamptz default now()
);

revoke all on private.app_secrets from public, anon, authenticated;
grant all on private.app_secrets to service_role;

create or replace function public.get_app_secret(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_val text;
begin
  select value into v_val from private.app_secrets where name = p_name;
  return v_val;
end;
$$;

revoke all on function public.get_app_secret(text) from public, anon, authenticated;
grant execute on function public.get_app_secret(text) to service_role;
