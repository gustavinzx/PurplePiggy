-- Migration: 20261105220000_gamification_engine_v2.sql
-- Motor Gamificado PurplePiggy V2: Economia de Moedas, Streak Freeze, Prática Personalizada e Leaderboard Semanal

-- 1. Tabela de Estatísticas Gamificadas do Usuário
create table if not exists public.learn_user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_count int not null default 0 check (streak_count >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  piggy_coins int not null default 0 check (piggy_coins >= 0),
  xp_points int not null default 0 check (xp_points >= 0),
  weekly_xp int not null default 0 check (weekly_xp >= 0),
  week_start date not null default (date_trunc('week', current_date)::date),
  hearts int not null default 3 check (hearts between 0 and 5),
  streak_shields int not null default 0 check (streak_shields between 0 and 2),
  active_track_slug text not null default 'organizacao-financeira',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabela de Erros para Prática Personalizada (Passo 3)
create table if not exists public.user_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  concept_tag text not null default 'geral',
  mistake_count int not null default 1 check (mistake_count >= 0),
  last_mistake_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);
create index if not exists idx_user_mistakes_user_count on public.user_mistakes(user_id, mistake_count desc);

-- 3. Tabela de Reivindicação de Baús de Tesouro (Idempotência)
create table if not exists public.learn_chest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_slug text not null,
  chest_index int not null,
  claimed_at timestamptz not null default now(),
  unique (user_id, track_slug, chest_index)
);
create index if not exists idx_learn_chest_claims_user on public.learn_chest_claims(user_id);

-- 4. Tabela de Conclusões do Desafio Diário (60 segundos)
create table if not exists public.learn_daily_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  completed_at timestamptz not null default now(),
  unique (user_id, challenge_date)
);
create index if not exists idx_learn_daily_completions_user on public.learn_daily_completions(user_id);

-- ============================================================================
-- Habilitação de RLS e Políticas de Segurança
-- ============================================================================

alter table public.learn_user_stats enable row level security;
alter table public.user_mistakes enable row level security;
alter table public.learn_chest_claims enable row level security;
alter table public.learn_daily_completions enable row level security;

-- learn_user_stats
drop policy if exists "learn_user_stats_select_own" on public.learn_user_stats;
create policy "learn_user_stats_select_own" on public.learn_user_stats
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_user_stats_update_own" on public.learn_user_stats;
create policy "learn_user_stats_update_own" on public.learn_user_stats
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_user_stats_insert_own" on public.learn_user_stats;
create policy "learn_user_stats_insert_own" on public.learn_user_stats
  for insert to authenticated with check (auth.uid() = user_id);

-- user_mistakes
drop policy if exists "user_mistakes_select_own" on public.user_mistakes;
create policy "user_mistakes_select_own" on public.user_mistakes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_mistakes_all_own" on public.user_mistakes;
create policy "user_mistakes_all_own" on public.user_mistakes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- learn_chest_claims
drop policy if exists "learn_chest_claims_select_own" on public.learn_chest_claims;
create policy "learn_chest_claims_select_own" on public.learn_chest_claims
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_chest_claims_insert_own" on public.learn_chest_claims;
create policy "learn_chest_claims_insert_own" on public.learn_chest_claims
  for insert to authenticated with check (auth.uid() = user_id);

-- learn_daily_completions
drop policy if exists "learn_daily_completions_select_own" on public.learn_daily_completions;
create policy "learn_daily_completions_select_own" on public.learn_daily_completions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_daily_completions_insert_own" on public.learn_daily_completions;
create policy "learn_daily_completions_insert_own" on public.learn_daily_completions
  for insert to authenticated with check (auth.uid() = user_id);

-- ============================================================================
-- Funções e RPCs do Motor Gamificado
-- ============================================================================

-- RPC 1: Obter estatísticas do usuário com auto-reconciliação de Ofensiva (Streak Freeze) e XP Semanal
create or replace function public.get_learn_user_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
  v_today date := current_date;
  v_current_week date := (date_trunc('week', current_date)::date);
  v_freeze_used boolean := false;
  v_new_streak int;
  v_new_shields int;
  v_last_act date;
  v_weekly_xp int;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_stats from public.learn_user_stats where user_id = v_user_id for update;

  if not found then
    insert into public.learn_user_stats (
      user_id, streak_count, longest_streak, last_activity_date,
      piggy_coins, xp_points, weekly_xp, week_start,
      hearts, streak_shields, active_track_slug
    ) values (
      v_user_id, 0, 0, null,
      0, 0, 0, v_current_week,
      3, 0, 'organizacao-financeira'
    )
    returning * into v_stats;
  end if;

  v_new_streak := v_stats.streak_count;
  v_new_shields := v_stats.streak_shields;
  v_last_act := v_stats.last_activity_date;
  v_weekly_xp := v_stats.weekly_xp;

  -- 1. Reset semanal automático de XP se virou a semana
  if v_stats.week_start < v_current_week then
    v_weekly_xp := 0;
  end if;

  -- 2. Verificação de Streak Freeze na consulta (login/abertura)
  -- Se o usuário tinha uma sequência ativa (> 0) e ficou sem atividade ontem e hoje:
  if v_new_streak > 0 and v_last_act is not null and v_last_act < (v_today - 1) then
    -- Se tem escudo de congelamento, consome 1 e protege a ofensiva
    if v_new_shields > 0 then
      v_new_shields := v_new_shields - 1;
      v_last_act := (v_today - 1); -- Simula que ontem esteve ativo pelo congelamento
      v_freeze_used := true;
    else
      -- Sem escudo protetor, a sequência zera
      v_new_streak := 0;
    end if;
  end if;

  -- Atualiza se algo mudou
  if v_new_streak <> v_stats.streak_count or
     v_new_shields <> v_stats.streak_shields or
     v_last_act is distinct from v_stats.last_activity_date or
     v_weekly_xp <> v_stats.weekly_xp or
     v_stats.week_start <> v_current_week then
    update public.learn_user_stats
    set streak_count = v_new_streak,
        streak_shields = v_new_shields,
        last_activity_date = v_last_act,
        weekly_xp = v_weekly_xp,
        week_start = v_current_week,
        updated_at = now()
    where user_id = v_user_id
    returning * into v_stats;
  end if;

  return jsonb_build_object(
    'user_id', v_stats.user_id,
    'streak_count', v_stats.streak_count,
    'longest_streak', v_stats.longest_streak,
    'last_activity_date', v_stats.last_activity_date,
    'piggy_coins', v_stats.piggy_coins,
    'xp_points', v_stats.xp_points,
    'weekly_xp', v_stats.weekly_xp,
    'hearts', v_stats.hearts,
    'streak_shields', v_stats.streak_shields,
    'active_track_slug', v_stats.active_track_slug,
    'freeze_used_today', v_freeze_used
  );
end;
$$;

-- RPC 2: Concluir lição com cálculo de ofensiva, moedas e XP
create or replace function public.complete_learn_lesson(p_lesson_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_content_id uuid;
  v_stats record;
  v_today date := current_date;
  v_current_week date := (date_trunc('week', current_date)::date);
  v_newly_completed boolean := false;
  v_coins_to_add int := 10;
  v_xp_to_add int := 20;
  v_new_streak int := 1;
  v_new_shields int := 0;
  v_new_longest int := 1;
  v_weekly_xp int := 0;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  -- 1. Obter ID do conteúdo
  select id into v_content_id from public.educational_contents where lesson_slug = p_lesson_slug;
  if not found then
    raise exception 'Lição não encontrada: %', p_lesson_slug;
  end if;

  -- 2. Registrar progresso educacional
  insert into public.educational_progress (user_id, content_id, completed_at)
  values (v_user_id, v_content_id, now())
  on conflict (user_id, content_id) do nothing;

  if found then
    v_newly_completed := true;
    v_coins_to_add := 10;
    v_xp_to_add := 20;
  else
    v_newly_completed := false;
    v_coins_to_add := 2; -- Recompensa de revisão
    v_xp_to_add := 5;
  end if;

  -- 3. Obter ou criar stats
  select * into v_stats from public.learn_user_stats where user_id = v_user_id for update;

  if not found then
    insert into public.learn_user_stats (
      user_id, streak_count, longest_streak, last_activity_date,
      piggy_coins, xp_points, weekly_xp, week_start,
      hearts, streak_shields, active_track_slug
    ) values (
      v_user_id, 1, 1, v_today,
      v_coins_to_add, v_xp_to_add, v_xp_to_add, v_current_week,
      3, 0, 'organizacao-financeira'
    )
    returning * into v_stats;
  else
    v_new_shields := v_stats.streak_shields;
    v_weekly_xp := case when v_stats.week_start = v_current_week then v_stats.weekly_xp + v_xp_to_add else v_xp_to_add end;

    if v_stats.last_activity_date = v_today then
      -- Já treinou hoje
      v_new_streak := greatest(1, v_stats.streak_count);
    elsif v_stats.last_activity_date = (v_today - 1) then
      -- Sequência continuada dia a dia
      v_new_streak := v_stats.streak_count + 1;
    elsif v_stats.last_activity_date < (v_today - 1) then
      -- Perdeu um ou mais dias: verificar se tem escudo de proteção
      if v_new_shields > 0 then
        v_new_shields := v_new_shields - 1;
        v_new_streak := v_stats.streak_count + 1;
      else
        v_new_streak := 1;
      end if;
    else
      v_new_streak := 1;
    end if;

    v_new_longest := greatest(v_stats.longest_streak, v_new_streak);

    update public.learn_user_stats
    set streak_count = v_new_streak,
        longest_streak = v_new_longest,
        last_activity_date = v_today,
        piggy_coins = v_stats.piggy_coins + v_coins_to_add,
        xp_points = v_stats.xp_points + v_xp_to_add,
        weekly_xp = v_weekly_xp,
        week_start = v_current_week,
        streak_shields = v_new_shields,
        updated_at = now()
    where user_id = v_user_id
    returning * into v_stats;
  end if;

  return jsonb_build_object(
    'success', true,
    'newly_completed', v_newly_completed,
    'coins_earned', v_coins_to_add,
    'xp_earned', v_xp_to_add,
    'current_streak', v_stats.streak_count,
    'longest_streak', v_stats.longest_streak,
    'total_coins', v_stats.piggy_coins,
    'total_xp', v_stats.xp_points,
    'weekly_xp', v_stats.weekly_xp,
    'hearts', v_stats.hearts,
    'streak_shields', v_stats.streak_shields
  );
end;
$$;

-- RPC 3: Comprar Escudo de Congelamento de Ofensiva (Custa 50 Moedas Piggy, máx 2)
create or replace function public.buy_streak_shield()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
  v_shield_cost int := 50;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_stats from public.learn_user_stats where user_id = v_user_id for update;
  if not found or v_stats.piggy_coins < v_shield_cost then
    return jsonb_build_object('success', false, 'message', 'Moedas Piggy insuficientes (custo: 50)');
  end if;

  if v_stats.streak_shields >= 2 then
    return jsonb_build_object('success', false, 'message', 'Limite máximo de congelamentos atingido (máx. 2)');
  end if;

  update public.learn_user_stats
  set piggy_coins = piggy_coins - v_shield_cost,
      streak_shields = streak_shields + 1,
      updated_at = now()
  where user_id = v_user_id
  returning * into v_stats;

  return jsonb_build_object(
    'success', true,
    'total_coins', v_stats.piggy_coins,
    'streak_shields', v_stats.streak_shields
  );
end;
$$;

-- RPC 4: Resgatar Baú de Tesouro (+50 Moedas Piggy)
create or replace function public.claim_learn_chest(p_track_slug text, p_chest_index int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
  v_reward_coins int := 50;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.learn_chest_claims (user_id, track_slug, chest_index, claimed_at)
  values (v_user_id, p_track_slug, p_chest_index, now())
  on conflict (user_id, track_slug, chest_index) do nothing;

  if not found then
    select piggy_coins into v_stats from public.learn_user_stats where user_id = v_user_id;
    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'coins_earned', 0,
      'total_coins', coalesce(v_stats.piggy_coins, 0)
    );
  end if;

  update public.learn_user_stats
  set piggy_coins = piggy_coins + v_reward_coins,
      updated_at = now()
  where user_id = v_user_id
  returning * into v_stats;

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'coins_earned', v_reward_coins,
    'total_coins', v_stats.piggy_coins
  );
end;
$$;

-- RPC 5: Concluir Desafio Rápido Diário (60s)
create or replace function public.complete_daily_learn_challenge(p_challenge_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
  v_today date := coalesce(p_challenge_date, current_date);
  v_coins_to_add int := 15;
  v_xp_to_add int := 25;
  v_current_week date := (date_trunc('week', current_date)::date);
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.learn_daily_completions (user_id, challenge_date, completed_at)
  values (v_user_id, v_today, now())
  on conflict (user_id, challenge_date) do nothing;

  if not found then
    select * into v_stats from public.learn_user_stats where user_id = v_user_id;
    return jsonb_build_object(
      'success', true,
      'already_completed', true,
      'coins_earned', 0,
      'xp_earned', 0,
      'current_streak', coalesce(v_stats.streak_count, 0),
      'total_coins', coalesce(v_stats.piggy_coins, 0)
    );
  end if;

  update public.learn_user_stats
  set piggy_coins = piggy_coins + v_coins_to_add,
      xp_points = xp_points + v_xp_to_add,
      weekly_xp = case when week_start = v_current_week then weekly_xp + v_xp_to_add else v_xp_to_add end,
      week_start = v_current_week,
      updated_at = now()
  where user_id = v_user_id
  returning * into v_stats;

  return jsonb_build_object(
    'success', true,
    'already_completed', false,
    'coins_earned', v_coins_to_add,
    'xp_earned', v_xp_to_add,
    'current_streak', v_stats.streak_count,
    'longest_streak', v_stats.longest_streak,
    'total_coins', v_stats.piggy_coins,
    'total_xp', v_stats.xp_points
  );
end;
$$;

-- RPC 6 (Passo 3): Registrar Erro de Questão no Motor de Prática
create or replace function public.record_user_mistake(p_exercise_id text, p_concept_tag text default 'geral')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count int;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Não autenticado');
  end if;

  insert into public.user_mistakes (user_id, exercise_id, concept_tag, mistake_count, last_mistake_at)
  values (v_user_id, p_exercise_id, coalesce(p_concept_tag, 'geral'), 1, now())
  on conflict (user_id, exercise_id) do update
  set mistake_count = public.user_mistakes.mistake_count + 1,
      concept_tag = coalesce(excluded.concept_tag, public.user_mistakes.concept_tag),
      last_mistake_at = now()
  returning mistake_count into v_count;

  return jsonb_build_object('success', true, 'exercise_id', p_exercise_id, 'mistake_count', v_count);
end;
$$;

-- RPC 7 (Passo 3): Obter os Exercícios com Maior Índice de Erros para Ilhas de Revisão
create or replace function public.get_user_review_exercises(p_limit int default 5)
returns table (
  exercise_id text,
  concept_tag text,
  mistake_count int,
  last_mistake_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  return query
  select um.exercise_id, um.concept_tag, um.mistake_count, um.last_mistake_at
  from public.user_mistakes um
  where um.user_id = v_user_id
  order by um.mistake_count desc, um.last_mistake_at desc
  limit greatest(1, coalesce(p_limit, 5));
end;
$$;

-- RPC 8 (Passo 4): Classificação Semanal (Leaderboard em Chaves de 30 Usuários)
create or replace function public.get_weekly_leaderboard(p_limit int default 30)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
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
  select
    row_number() over (order by (case when lus.week_start = v_current_week then lus.weekly_xp else 0 end) desc, p.created_at asc) as rank,
    p.id as user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Estudante Piggy') as display_name,
    p.avatar_url,
    coalesce(case when lus.week_start = v_current_week then lus.weekly_xp else 0 end, 0)::int as weekly_xp,
    (p.id = v_user_id) as is_current_user
  from public.profiles p
  left join public.learn_user_stats lus on lus.user_id = p.id
  order by weekly_xp desc, p.created_at asc
  limit greatest(1, coalesce(p_limit, 30));
end;
$$;
