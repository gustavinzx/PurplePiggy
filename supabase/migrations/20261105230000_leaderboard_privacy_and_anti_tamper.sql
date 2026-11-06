-- Migration: 20261105230000_leaderboard_privacy_and_anti_tamper.sql
-- Prompt 3: Privacidade LGPD no Ranking, Opt-in, Apelido, Anti-Fraude de XP e Proteção de Campos de Perfil

-- 1. Campos de Opt-in e Apelido Seguro na Tabela de Perfis
alter table public.profiles
  add column if not exists leaderboard_opt_in boolean not null default false,
  add column if not exists leaderboard_nickname text;

-- Restrição de formato do apelido (3 a 20 caracteres, sem conter '@' para impedir e-mails)
alter table public.profiles
  drop constraint if exists chk_profiles_leaderboard_nickname;

alter table public.profiles
  add constraint chk_profiles_leaderboard_nickname
  check (
    leaderboard_nickname is null or (
      length(trim(leaderboard_nickname)) between 3 and 20
      and leaderboard_nickname not like '%@%'
    )
  );

-- 2. Anti-Fraude: Revogar INSERT e UPDATE direto em learn_user_stats
-- Usuárias só podem alterar XP, vidas, moedas e ofensivas através das RPCs SECURITY DEFINER auditadas
drop policy if exists "learn_user_stats_update_own" on public.learn_user_stats;
drop policy if exists "learn_user_stats_insert_own" on public.learn_user_stats;
drop policy if exists "learn_user_stats_delete_own" on public.learn_user_stats;

-- Revogar permissões DML diretas para authenticated e anon
revoke insert, update, delete on public.learn_user_stats from authenticated, anon;

-- Garantir política estrita de leitura própria
drop policy if exists "learn_user_stats_select_own" on public.learn_user_stats;
create policy "learn_user_stats_select_own" on public.learn_user_stats
  for select to authenticated using (auth.uid() = user_id);

-- 3. Função RPC Segura para Inicializar / Obter Estatísticas (SECURITY DEFINER)
create or replace function public.get_or_create_learn_stats()
returns public.learn_user_stats
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats public.learn_user_stats;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_stats from public.learn_user_stats where user_id = v_user_id;
  if not found then
    insert into public.learn_user_stats (
      user_id,
      hearts,
      streak_shields,
      piggy_coins,
      xp_points,
      weekly_xp,
      streak_count,
      longest_streak,
      week_start
    )
    values (
      v_user_id,
      3,
      0,
      0,
      0,
      0,
      0,
      0,
      (date_trunc('week', current_date)::date)
    )
    returning * into v_stats;
  end if;

  return v_stats;
end;
$$;

-- 3.1 Funções RPC Seguras para Dedução e Recarga de Vidas (sem permissão direta de update na tabela)
create or replace function public.deduct_learn_heart()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_hearts int;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  update public.learn_user_stats
  set hearts = greatest(0, hearts - 1),
      updated_at = now()
  where user_id = v_user_id
  returning hearts into v_new_hearts;

  return coalesce(v_new_hearts, 0);
end;
$$;

create or replace function public.recharge_learn_hearts()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats public.learn_user_stats;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Não autenticado');
  end if;

  select * into v_stats from public.learn_user_stats where user_id = v_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Estatísticas não encontradas');
  end if;

  if v_stats.hearts >= 3 then
    return jsonb_build_object('success', false, 'message', 'Suas vidas já estão cheias!');
  end if;

  if v_stats.piggy_coins < 30 then
    return jsonb_build_object('success', false, 'message', 'Moedas insuficientes');
  end if;

  update public.learn_user_stats
  set hearts = 3,
      piggy_coins = piggy_coins - 30,
      updated_at = now()
  where user_id = v_user_id
  returning * into v_stats;

  return jsonb_build_object(
    'success', true,
    'hearts', v_stats.hearts,
    'piggy_coins', v_stats.piggy_coins
  );
end;
$$;

-- 4. Função RPC Segura do Ranking com Privacidade por Padrão (LGPD)
-- Não expõe full_name, e-mail, avatar_url nem user_id de terceiros
drop function if exists public.get_weekly_leaderboard(int);

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
    -- Só inclui quem fez opt-in voluntário OU a própria usuária autenticada para ver sua colocação
    where p.leaderboard_opt_in = true or p.id = v_user_id
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
    r.rnk as rank,
    r.display_nick as nickname,
    r.xp as weekly_xp,
    r.is_me as is_current_user
  from ranked r
  order by r.rank asc
  limit greatest(1, coalesce(p_limit, 30));
end;
$$;

-- 5. Trigger de Proteção dos Campos de Sistema do Perfil
-- Impede que chamadas pelo cliente modifiquem `is_demo` ou `id`
create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.is_demo is distinct from old.is_demo then
      raise exception 'Operação não permitida: status is_demo não pode ser alterado pelo cliente.';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Operação não permitida: id do usuário é imutável.';
    end if;
    if new.created_at is distinct from old.created_at then
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_system_fields on public.profiles;
create trigger trg_protect_profile_system_fields
  before update on public.profiles
  for each row execute function public.protect_profile_system_fields();
