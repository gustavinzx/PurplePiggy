-- Migration: 20261103000000_learn_gamification_and_questions.sql
-- Prompt N5: Schema, RLS e RPCs do Módulo Aprender Gamificado (Desafio Piggy)
-- Regras: PostgreSQL Best Practices (search_path='', RLS ativado, índices em FKs, segurança estrita)

-- 1. Tabela de Estatísticas Gamificadas do Usuário
create table if not exists public.learn_user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_count int not null default 0 check (streak_count >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  piggy_coins int not null default 0 check (piggy_coins >= 0),
  xp_points int not null default 0 check (xp_points >= 0),
  hearts int not null default 3 check (hearts between 0 and 5),
  streak_shields int not null default 0 check (streak_shields >= 0),
  active_track_slug text not null default 'organizacao-financeira',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabela de Reivindicação de Baús de Tesouro (Idempotência ao abrir baú)
create table if not exists public.learn_chest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_slug text not null,
  chest_index int not null,
  claimed_at timestamptz not null default now(),
  unique (user_id, track_slug, chest_index)
);
create index if not exists idx_learn_chest_claims_user on public.learn_chest_claims(user_id);

-- 3. Tabela do Desafio Rápido Diário (Mini-atividade de 60 segundos)
create table if not exists public.learn_daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  title text not null,
  question_id text not null,
  reward_coins int not null default 15,
  reward_xp int not null default 25,
  created_at timestamptz not null default now()
);

-- 4. Tabela de Conclusões do Desafio Diário
create table if not exists public.learn_daily_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  completed_at timestamptz not null default now(),
  unique (user_id, challenge_date)
);
create index if not exists idx_learn_daily_completions_user on public.learn_daily_completions(user_id);

-- 5. Tabela Canônica de Questões Interativas (5 Tipologias nos 4 Lotes)
create table if not exists public.learn_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_slug text not null references public.educational_contents(lesson_slug) on delete cascade,
  track_slug text not null,
  lote_number int not null check (lote_number between 1 and 4),
  typology text not null check (typology in ('multiple_choice', 'scenario_choice', 'order_priorities', 'concept_matching', 'fill_in_the_blank')),
  prompt text not null,
  context_text text,
  options jsonb not null,
  correct_answer jsonb not null,
  explanation text not null,
  tip text,
  order_index int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists idx_learn_questions_lesson on public.learn_questions(lesson_slug);
create index if not exists idx_learn_questions_track on public.learn_questions(track_slug);
create index if not exists idx_learn_questions_lote on public.learn_questions(lote_number);

-- ============================================================================
-- Habilitação de RLS e Políticas de Segurança Estrita
-- ============================================================================

alter table public.learn_user_stats enable row level security;
alter table public.learn_chest_claims enable row level security;
alter table public.learn_daily_challenges enable row level security;
alter table public.learn_daily_completions enable row level security;
alter table public.learn_questions enable row level security;

-- learn_user_stats: usuário só acessa seus próprios dados
drop policy if exists "learn_user_stats_select_own" on public.learn_user_stats;
create policy "learn_user_stats_select_own" on public.learn_user_stats
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_user_stats_update_own" on public.learn_user_stats;
create policy "learn_user_stats_update_own" on public.learn_user_stats
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_user_stats_insert_own" on public.learn_user_stats;
create policy "learn_user_stats_insert_own" on public.learn_user_stats
  for insert to authenticated with check (auth.uid() = user_id);

-- learn_chest_claims: usuário só acessa seus próprios resgates
drop policy if exists "learn_chest_claims_select_own" on public.learn_chest_claims;
create policy "learn_chest_claims_select_own" on public.learn_chest_claims
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_chest_claims_insert_own" on public.learn_chest_claims;
create policy "learn_chest_claims_insert_own" on public.learn_chest_claims
  for insert to authenticated with check (auth.uid() = user_id);

-- learn_daily_challenges: leitura pública para autenticados e anônimos
drop policy if exists "learn_daily_challenges_read_all" on public.learn_daily_challenges;
create policy "learn_daily_challenges_read_all" on public.learn_daily_challenges
  for select to authenticated, anon using (true);

-- learn_daily_completions: usuário só manipula suas conclusões
drop policy if exists "learn_daily_completions_select_own" on public.learn_daily_completions;
create policy "learn_daily_completions_select_own" on public.learn_daily_completions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "learn_daily_completions_insert_own" on public.learn_daily_completions;
create policy "learn_daily_completions_insert_own" on public.learn_daily_completions
  for insert to authenticated with check (auth.uid() = user_id);

-- learn_questions: leitura pedagógica pública
drop policy if exists "learn_questions_read_all" on public.learn_questions;
create policy "learn_questions_read_all" on public.learn_questions
  for select to authenticated, anon using (true);

-- ============================================================================
-- Funções de Apoio e RPCs de Completude (PostgreSQL Best Practices)
-- ============================================================================

-- RPC: Obter ou inicializar estatísticas do usuário
create or replace function public.get_learn_user_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_stats from public.learn_user_stats where user_id = v_user_id;

  if not found then
    insert into public.learn_user_stats (user_id, streak_count, longest_streak, piggy_coins, xp_points, hearts, streak_shields, active_track_slug)
    values (v_user_id, 0, 0, 0, 0, 3, 0, 'organizacao-financeira')
    returning * into v_stats;
  end if;

  return jsonb_build_object(
    'user_id', v_stats.user_id,
    'streak_count', v_stats.streak_count,
    'longest_streak', v_stats.longest_streak,
    'last_activity_date', v_stats.last_activity_date,
    'piggy_coins', v_stats.piggy_coins,
    'xp_points', v_stats.xp_points,
    'hearts', v_stats.hearts,
    'streak_shields', v_stats.streak_shields,
    'active_track_slug', v_stats.active_track_slug
  );
end;
$$;

-- RPC: Concluir lição com cálculo de streak (Ofensiva Piggy), Moedas e XP
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
  v_newly_completed boolean := false;
  v_coins_to_add int := 10;
  v_xp_to_add int := 20;
  v_new_streak int := 1;
  v_new_longest int;
  v_new_shields int;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  -- 1. Validar existência da lição
  select id into v_content_id from public.educational_contents where lesson_slug = p_lesson_slug;
  if v_content_id is null then
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
    insert into public.learn_user_stats (user_id, streak_count, longest_streak, last_activity_date, piggy_coins, xp_points, hearts, streak_shields)
    values (v_user_id, 1, 1, v_today, v_coins_to_add, v_xp_to_add, 3, 0)
    returning * into v_stats;
  else
    -- Cálculo de Ofensiva Piggy (Streak)
    v_new_shields := v_stats.streak_shields;
    if v_stats.last_activity_date = v_today then
      -- Já treinou hoje, mantém contagem
      v_new_streak := v_stats.streak_count;
    elsif v_stats.last_activity_date = (v_today - 1) then
      -- Sequência continuada
      v_new_streak := v_stats.streak_count + 1;
    elsif v_stats.last_activity_date < (v_today - 1) then
      -- Perdeu um dia: verifica se tem escudo de proteção de ofensiva
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
    'hearts', v_stats.hearts
  );
end;
$$;

-- RPC: Resgatar Baú de Tesouro (+50 Moedas Piggy)
create or replace function public.claim_learn_chest(p_track_slug text, p_chest_index int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats record;
  v_already_claimed boolean := false;
  v_reward_coins int := 50;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  -- Tentativa de inserção idempotente
  insert into public.learn_chest_claims (user_id, track_slug, chest_index, claimed_at)
  values (v_user_id, p_track_slug, p_chest_index, now())
  on conflict (user_id, track_slug, chest_index) do nothing;

  if not found then
    v_already_claimed := true;
    select piggy_coins into v_stats from public.learn_user_stats where user_id = v_user_id;
    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'coins_earned', 0,
      'total_coins', coalesce(v_stats.piggy_coins, 0)
    );
  end if;

  -- Creditar 50 moedas
  update public.learn_user_stats
  set piggy_coins = piggy_coins + v_reward_coins,
      updated_at = now()
  where user_id = v_user_id
  returning * into v_stats;

  if not found then
    insert into public.learn_user_stats (user_id, piggy_coins, hearts)
    values (v_user_id, v_reward_coins, 3)
    returning * into v_stats;
  end if;

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'coins_earned', v_reward_coins,
    'total_coins', v_stats.piggy_coins
  );
end;
$$;

-- RPC: Concluir Desafio Rápido Diário (60s)
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
  v_new_streak int := 1;
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

  -- Atualizar streak e recompensas
  select * into v_stats from public.learn_user_stats where user_id = v_user_id for update;
  if not found then
    insert into public.learn_user_stats (user_id, streak_count, longest_streak, last_activity_date, piggy_coins, xp_points, hearts)
    values (v_user_id, 1, 1, v_today, v_coins_to_add, v_xp_to_add, 3)
    returning * into v_stats;
  else
    if v_stats.last_activity_date = v_today then
      v_new_streak := v_stats.streak_count;
    elsif v_stats.last_activity_date = (v_today - 1) then
      v_new_streak := v_stats.streak_count + 1;
    else
      v_new_streak := 1;
    end if;

    update public.learn_user_stats
    set streak_count = v_new_streak,
        longest_streak = greatest(longest_streak, v_new_streak),
        last_activity_date = v_today,
        piggy_coins = piggy_coins + v_coins_to_add,
        xp_points = xp_points + v_xp_to_add,
        updated_at = now()
    where user_id = v_user_id
    returning * into v_stats;
  end if;

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

-- RPC: Comprar Escudo de Congelamento de Ofensiva (Custa 50 Moedas Piggy)
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
    return jsonb_build_object('success', false, 'message', 'Moedas Piggy insuficientes');
  end if;

  if v_stats.streak_shields >= 2 then
    return jsonb_build_object('success', false, 'message', 'Limite máximo de escudos atingido (2)');
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


-- ============================================================================
-- Carga Inicial das Questões (Lotes 1 a 4)
-- ============================================================================

insert into public.learn_questions (
  lesson_slug, track_slug, lote_number, typology, prompt, context_text, options, correct_answer, explanation, tip, order_index
) values
  ('para-onde-vai-meu-dinheiro', 'organizacao-financeira', 1, 'multiple_choice', 'Qual é a melhor atitude para começar a organizar seus gastos na primeira semana?', null, '["Anotar tudo o que gasta por 7 dias, com calma e sem se julgar.", "Cortar imediatamente todos os pequenos prazeres da sua rotina.", "Esperar o próximo mês para ver o que sobra na conta."]'::jsonb, '0'::jsonb, 'Anotar os gastos sem culpa traz clareza para enxergar seus hábitos com carinho.', 'O objetivo inicial é apenas enxergar a realidade sem nenhuma autocobrança.', 1),
  ('para-onde-vai-meu-dinheiro', 'organizacao-financeira', 1, 'scenario_choice', 'O que fazer neste momento?', 'Camila recebeu o salário hoje. Antes de pagar as contas fixas essenciais, viu uma promoção relâmpago de roupas com 40% de desconto.', '["Garantir as contas essenciais primeiro", "Aproveitar a promoção agora mesmo"]'::jsonb, '0'::jsonb, 'Proteger o teto e a comida traz a tranquilidade necessária para planejar as compras depois.', 'Descontos só economizam se a compra já estivesse planejada no orçamento.', 2),
  ('para-onde-vai-meu-dinheiro', 'organizacao-financeira', 1, 'order_priorities', 'Ordene a sequência ideal para organizar suas finanças do mês:', null, '["Garantir moradia, alimentação e contas básicas", "Reservar um valor pequeno para o futuro e reserva", "Definir o valor para lazer e compras com tranquilidade"]'::jsonb, '["Garantir moradia, alimentação e contas básicas", "Reservar um valor pequeno para o futuro e reserva", "Definir o valor para lazer e compras com tranquilidade"]'::jsonb, 'Primeiro protegemos o essencial, depois guardamos uma semente e por fim aproveitamos com liberdade.', null, 3),
  ('para-onde-vai-meu-dinheiro', 'organizacao-financeira', 1, 'concept_matching', 'Conecte cada tipo de gasto com seu exemplo prático:', null, '[{"id": "p1", "left": "Gasto Essencial", "right": "Aluguel e contas de luz"}, {"id": "p2", "left": "Prioridade Futura", "right": "Poupar R$ 50 para reserva"}, {"id": "p3", "left": "Estilo de Vida", "right": "Café na padaria com amigos"}]'::jsonb, '{"Gasto Essencial": "Aluguel e contas de luz", "Prioridade Futura": "Poupar R$ 50 para reserva", "Estilo de Vida": "Café na padaria com amigos"}'::jsonb, 'Diferenciar esses três grupos permite equilibrar seu dinheiro sem apertos desnecessários.', null, 4),
  ('para-onde-vai-meu-dinheiro', 'organizacao-financeira', 1, 'fill_in_the_blank', 'Complete a frase com a palavra correta:', null, '{"sentence": "Organizar o dinheiro é sobre ter ___ para fazer escolhas conscientes no seu dia a dia.", "options": ["clareza", "restrição", "medo", "pressa"]}'::jsonb, '"clareza"'::jsonb, 'Com clareza e informações visíveis, seu dinheiro passa a trabalhar a favor do seu ritmo.', null, 5),
  ('montando-primeiro-orcamento', 'organizacao-financeira', 1, 'multiple_choice', 'Por onde devemos começar ao montar um orçamento realista?', null, '["Partir da sua renda líquida real e separar os gastos essenciais.", "Tentar gastar menos de R$ 500 no mês inteiro.", "Ignorar as contas fixas e focar só na fatura do cartão."]'::jsonb, '0'::jsonb, 'Conhecer sua renda líquida e cobrir os essenciais é o alicerce de qualquer planejamento sustentável.', 'Renda líquida é o valor que de fato cai na sua conta bancária.', 1),
  ('montando-primeiro-orcamento', 'organizacao-financeira', 1, 'scenario_choice', 'Qual decisão protege melhor o orçamento de Lucas?', 'Lucas calculou suas contas do mês e percebeu que sobram apenas R$ 80 livres. Um amigo convidou para uma viagem de fim de semana de R$ 250.', '["Conversar abertamente e propor um passeio gratuito", "Parcelar a viagem em 10 vezes no cartão"]'::jsonb, '0'::jsonb, 'Amigos verdadeiros entendem seus momentos financeiros e valorizam sua presença, não os gastos.', null, 2),
  ('montando-primeiro-orcamento', 'organizacao-financeira', 1, 'fill_in_the_blank', 'Complete com o termo recomendado:', null, '{"sentence": "Um orçamento saudável precisa de ___ para acolher imprevistos sem que você se desespere.", "options": ["flexibilidade", "punição", "rigidez", "dívidas"]}'::jsonb, '"flexibilidade"'::jsonb, 'A flexibilidade é o que permite você manter a constância mesmo quando surgem gastos inesperados.', null, 3),
  ('juros-o-que-sao', 'juros-sem-misterio', 1, 'multiple_choice', 'Em poucas palavras, o que são juros?', null, '["Valores adicionais cobrados ou recebidos pelo uso do dinheiro no tempo.", "Uma taxa cobrada apenas quando alguém é multado pelo banco.", "Um imposto obrigatório que vai direto para a prefeitura."]'::jsonb, '0'::jsonb, 'Juros são o custo do dinheiro no tempo: quem empresta recebe, quem toma emprestado paga.', null, 1),
  ('juros-o-que-sao', 'juros-sem-misterio', 1, 'concept_matching', 'Ligue cada situação ao papel dos juros:', null, '[{"id": "p1", "left": "Investir no Tesouro Selic", "right": "Juros trabalhando a seu favor"}, {"id": "p2", "left": "Entrar no cheque especial", "right": "Juros crescendo contra você"}, {"id": "p3", "left": "Pagamento total à vista", "right": "Zero cobrança de juros"}]'::jsonb, '{"Investir no Tesouro Selic": "Juros trabalhando a seu favor", "Entrar no cheque especial": "Juros crescendo contra você", "Pagamento total à vista": "Zero cobrança de juros"}'::jsonb, 'Saber quando os juros ajudam ou atrapalham é o superpoder da tranquilidade financeira.', null, 2),
  ('simples-vs-compostos', 'juros-sem-misterio', 1, 'multiple_choice', 'Por que dívidas atrasadas no cartão crescem tão rápido com juros compostos?', null, '["Porque os juros do mês seguinte são calculados sobre os juros anteriores (juros sobre juros).", "Porque o banco dobra o valor da dívida toda semana por lei.", "Porque os juros simples são os mais comuns no Brasil."]'::jsonb, '0'::jsonb, 'Nos juros compostos, a base de cálculo cresce mês a mês, fazendo a bola de neve rolar com mais força.', null, 1),
  ('simples-vs-compostos', 'juros-sem-misterio', 1, 'scenario_choice', 'Qual é o melhor caminho para Mariana?', 'Mariana tem uma fatura de R$ 1.200 e só tem R$ 400 hoje. O banco sugeriu pagar o mínimo de R$ 180.', '["Buscar parcelamento fixo da fatura ou renegociar", "Pagar apenas o mínimo do rotativo"]'::jsonb, '0'::jsonb, 'O crédito rotativo tem as maiores taxas do mercado. Parcelamentos fixos têm juros muito menores.', null, 2),
  ('como-o-cartao-funciona', 'cartao-de-credito', 2, 'multiple_choice', 'Qual é a melhor definição prática para o cartão de crédito?', null, '["Um meio de pagamento que utiliza um empréstimo de curto prazo até a data de vencimento.", "Uma extensão do seu salário que você pode gastar sem se preocupar.", "Uma conta corrente separada que guarda seu dinheiro economizado."]'::jsonb, '0'::jsonb, 'O cartão de crédito adianta um pagamento que precisará ser quitado integralmente na data combinada.', 'Gastar no cartão compromete a sua renda do mês seguinte.', 1),
  ('como-o-cartao-funciona', 'cartao-de-credito', 2, 'concept_matching', 'Associe as datas do cartão com seu significado real:', null, '[{"id": "p1", "left": "Data de Fechamento", "right": "Dia em que a fatura é fechada e as compras vão para o próximo mês"}, {"id": "p2", "left": "Data de Vencimento", "right": "Último dia para pagar a fatura sem cobrança de juros ou multas"}, {"id": "p3", "left": "Limite do Cartão", "right": "Teto máximo emprestado pelo banco para suas compras"}]'::jsonb, '{"Data de Fechamento": "Dia em que a fatura é fechada e as compras vão para o próximo mês", "Data de Vencimento": "Último dia para pagar a fatura sem cobrança de juros ou multas", "Limite do Cartão": "Teto máximo emprestado pelo banco para suas compras"}'::jsonb, 'Comprar logo após o fechamento da fatura dá até 40 dias para pagar, sem pagar nenhum juro.', null, 2),
  ('como-o-cartao-funciona', 'cartao-de-credito', 2, 'fill_in_the_blank', 'Complete a recomendação sobre uso do cartão:', null, '{"sentence": "A melhor forma de usar o cartão é pagar sempre o valor ___ da fatura até o vencimento.", "options": ["integral", "mínimo", "parcelado", "estimado"]}'::jsonb, '"integral"'::jsonb, 'Pagar 100% da fatura garante que você desfrute dos benefícios do cartão sem pagar um centavo de juros.', null, 3),
  ('perigo-do-rotativo', 'cartao-de-credito', 2, 'multiple_choice', 'Por que o crédito rotativo do cartão é considerado tão arriscado?', null, '["Porque possui uma das taxas de juros mais elevadas de toda a economia brasileira.", "Porque cancela o cartão de crédito imediatamente no dia seguinte.", "Porque é proibido pelo Banco Central para quem tem conta corrente."]'::jsonb, '0'::jsonb, 'As taxas anuais do rotativo podem ultrapassar 400% ao ano, multiplicando a dívida com rapidez extrema.', null, 1),
  ('perigo-do-rotativo', 'cartao-de-credito', 2, 'scenario_choice', 'O que Pedro deve escolher para proteger seu futuro financeiro?', 'A fatura de Pedro veio em R$ 900. Ele só conseguiu juntar R$ 300 este mês. O aplicativo oferece "Pagamento Mínimo de R$ 135" ou "Parcelar em 6x fixas".', '["Optar pelo parcelamento fixo com juros conhecidos", "Pagar apenas o mínimo de R$ 135"]'::jsonb, '0'::jsonb, 'O parcelamento fixo interrompe a bola de neve do rotativo e permite organizar os pagamentos futuros.', null, 2),
  ('por-que-ter-reserva', 'reserva-de-emergencia', 2, 'multiple_choice', 'Qual é o verdadeiro propósito de ter uma reserva de emergência?', null, '["Garantir paz mental e proteção diante de imprevistos sem precisar contrair dívidas caras.", "Juntar dinheiro apenas para comprar roupas novas na virada de ano.", "Apostar em investimentos de alto risco para tentar dobrar o patrimônio rapidamente."]'::jsonb, '0'::jsonb, 'A reserva de emergência é um colchão acolchoado: quando a vida tropeça, ela amortece o tombo.', null, 1),
  ('por-que-ter-reserva', 'reserva-de-emergencia', 2, 'concept_matching', 'Identifique o que é ou não é motivo para usar a reserva:', null, '[{"id": "p1", "left": "Remédio urgente ou dente quebrado", "right": "Uso legítimo da reserva de emergência"}, {"id": "p2", "left": "Geladeira que estragou no calor", "right": "Uso legítimo da reserva de emergência"}, {"id": "p3", "left": "Celular novo só porque lançou modelo recente", "right": "Não usar a reserva (planejar como meta)"}]'::jsonb, '{"Remédio urgente ou dente quebrado": "Uso legítimo da reserva de emergência", "Geladeira que estragou no calor": "Uso legítimo da reserva de emergência", "Celular novo só porque lançou modelo recente": "Não usar a reserva (planejar como meta)"}'::jsonb, 'Emergências são acontecimentos imprevisíveis e urgentes que afetam sua subsistência ou saúde.', null, 2),
  ('comecando-pequeno', 'reserva-de-emergencia', 2, 'order_priorities', 'Organize as metas de construção da sua reserva na ordem recomendada:', null, '["Guardar 1 semana de gastos essenciais (primeira vitória)", "Atingir 1 mês completo de despesas essenciais", "Construir de 3 a 6 meses de segurança total"]'::jsonb, '["Guardar 1 semana de gastos essenciais (primeira vitória)", "Atingir 1 mês completo de despesas essenciais", "Construir de 3 a 6 meses de segurança total"]'::jsonb, 'Começar pequeno com 1 semana traz confiança imediata e torna o hábito sustentável no dia a dia.', null, 1),
  ('comecando-pequeno', 'reserva-de-emergencia', 2, 'scenario_choice', 'Qual atitude fortalece o hábito de poupar de Ana?', 'Ana acha que guardar R$ 20 por mês é pouco demais e pensa em desistir porque a meta parece muito distante.', '["Começar com os R$ 20 agora mesmo com orgulho", "Esperar ganhar mais para só então começar"]'::jsonb, '0'::jsonb, 'O mais importante no começo é consolidar o hábito e a disciplina, não o valor inicial.', null, 2),
  ('metas-com-nome-e-prazo', 'planejamento-financeiro', 3, 'multiple_choice', 'O que transforma um sonho vago em uma meta financeira real e alcançável?', null, '["Dar um nome claro, um valor total definido e um prazo realista.", "Torcer para ganhar na loteria ou receber um aumento inesperado.", "Apenas prometer a si mesmo que vai tentar guardar dinheiro."]'::jsonb, '0'::jsonb, 'Definir quanto custa e quando você quer alcançar permite dividir o objetivo em parcelas suaves por mês.', 'No PurplePiggy você cria metas com prazos e o porquinho calcula o ritmo mensal para você.', 1),
  ('metas-com-nome-e-prazo', 'planejamento-financeiro', 3, 'fill_in_the_blank', 'Complete a fórmula de uma boa meta:', null, '{"sentence": "Dividir uma meta grande em parcelas mensais menores torna a conquista muito mais ___ de realizar.", "options": ["fácil", "pesada", "arriscada", "distante"]}'::jsonb, '"fácil"'::jsonb, 'Guardar R$ 50 por 10 meses é infinitamente mais tranquilo do que juntar R$ 500 de uma só vez.', null, 2),
  ('metas-com-nome-e-prazo', 'planejamento-financeiro', 3, 'scenario_choice', 'Como Juliana deve estruturar essa vontade?', 'Juliana quer trocar de notebook até o final do ano para trabalhar melhor. Ela calcula que o modelo custa R$ 2.400 e faltam 12 meses.', '["Guardar R$ 200 por mês em uma meta separada", "Comprar parcelado em 24x com juros altos na loja"]'::jsonb, '0'::jsonb, 'Poupar com antecedência economiza dinheiro com juros e ainda permite negociar desconto à vista.', null, 3),
  ('revisao-mensal-10-min', 'planejamento-financeiro', 3, 'order_priorities', 'Qual a ordem ideal para fazer sua revisão financeira mensal em 10 minutos?', null, '["Conferir as categorias onde você mais gastou no mês", "Celebrar as metas que você conseguiu avançar", "Ajustar os limites do próximo mês com base no que aprendeu"]'::jsonb, '["Conferir as categorias onde você mais gastou no mês", "Celebrar as metas que você conseguiu avançar", "Ajustar os limites do próximo mês com base no que aprendeu"]'::jsonb, 'Uma revisão sem julgamentos fortalece a conexão com suas prioridades e renova suas energias.', null, 1),
  ('desejo-vs-necessidade', 'consumo-consciente', 3, 'concept_matching', 'Classifique cada item entre necessidade e desejo:', null, '[{"id": "p1", "left": "Supermercado e itens básicos de higiene", "right": "Necessidade essencial"}, {"id": "p2", "left": "Aluguel, água, energia e internet de casa", "right": "Necessidade essencial"}, {"id": "p3", "left": "Tênis de marca lançamento para passear", "right": "Desejo de estilo de vida"}]'::jsonb, '{"Supermercado e itens básicos de higiene": "Necessidade essencial", "Aluguel, água, energia e internet de casa": "Necessidade essencial", "Tênis de marca lançamento para passear": "Desejo de estilo de vida"}'::jsonb, 'Desejos são legítimos e trazem alegria, mas devem ser atendidos sem comprometer suas necessidades.', null, 1),
  ('desejo-vs-necessidade', 'consumo-consciente', 3, 'scenario_choice', 'Qual conselho ajuda Rodrigo a evitar o arrependimento?', 'Rodrigo estava navegando nas redes sociais às 23h após um dia exaustivo de trabalho e sentiu um impulso forte de comprar um fone de ouvido de R$ 380.', '["Aplicar a regra das 24 horas e reavaliar amanhã de cabeça fresca", "Comprar imediatamente para aliviar o estresse"]'::jsonb, '0'::jsonb, 'Comprar por cansaço ou ansiedade é um gatilho comum. Dormir sobre a decisão quase sempre dissipa o impulso.', null, 2),
  ('perguntas-antes-de-comprar', 'consumo-consciente', 3, 'multiple_choice', 'Qual destas perguntas é fundamental fazer a si mesmo antes de passar o cartão?', null, '["Eu realmente preciso disso agora, cabe no meu orçamento e posso pagar à vista?", "Será que meus amigos vão achar essa compra bonita?", "Quantas parcelas o vendedor consegue dividir para ficar baratinho por mês?"]'::jsonb, '0'::jsonb, 'Perguntar se cabe no orçamento e se é o momento certo protege suas metas de médio e longo prazo.', null, 1),
  ('sinais-de-alerta', 'golpes-financeiros', 4, 'multiple_choice', 'Qual é o maior sinal de alerta para identificar um golpe ou pirâmide financeira?', null, '["Promessa de lucros altos e rápidos com garantia de \"risco zero\".", "Investimento oferecido por bancos regulamentados pelo Banco Central.", "Aplicação de renda fixa que rende próximo à taxa Selic oficial."]'::jsonb, '0'::jsonb, 'No mundo real, retornos elevados sempre envolvem riscos proporcionais. Lucro alto e garantido não existe.', 'Se parecer bom demais para ser verdade, desconfie e não transfira nenhum valor.', 1),
  ('sinais-de-alerta', 'golpes-financeiros', 4, 'scenario_choice', 'Qual atitude protege a segurança de Beatriz?', 'Beatriz recebeu uma ligação urgente dizendo ser da "central de segurança" do seu banco, pedindo para ela digitar sua senha ou fazer um Pix de teste para cancelar uma invasão.', '["Desligar imediatamente e ligar no número oficial do cartão", "Seguir as instruções da ligação para não perder a conta"]'::jsonb, '0'::jsonb, 'Nenhum banco legítimo pede senhas, códigos de SMS ou transferências para "cancelar" fraudes.', null, 2),
  ('golpes-de-pix-e-boleto', 'golpes-financeiros', 4, 'concept_matching', 'Ligue cada tipo de fraude ao cuidado preventivo correto:', null, '[{"id": "p1", "left": "Pagamento de Boleto", "right": "Conferir o nome e CNPJ do beneficiário na tela final"}, {"id": "p2", "left": "Transferência por Pix", "right": "Confirmar os dados do destinatário antes de autenticar"}, {"id": "p3", "left": "Mensagem de parente pedindo dinheiro", "right": "Ligar por chamada de voz antes de fazer qualquer envio"}]'::jsonb, '{"Pagamento de Boleto": "Conferir o nome e CNPJ do beneficiário na tela final", "Transferência por Pix": "Confirmar os dados do destinatário antes de autenticar", "Mensagem de parente pedindo dinheiro": "Ligar por chamada de voz antes de fazer qualquer envio"}'::jsonb, 'A checagem do nome do destinatário antes da senha evita 99% das fraudes de engenharia social.', null, 1),
  ('golpes-de-pix-e-boleto', 'golpes-financeiros', 4, 'fill_in_the_blank', 'Complete a recomendação sobre segurança digital:', null, '{"sentence": "Antes de confirmar qualquer Pix ou boleto, confira com calma o ___ final do recebedor.", "options": ["nome", "endereço", "modelo do celular", "horário"]}'::jsonb, '"nome"'::jsonb, 'Golpistas alteram o código de barras, mas o nome do recebedor na tela de confirmação denuncia a fraude.', null, 2),
  ('gastos-invisiveis-familia', 'economia-domestica', 4, 'multiple_choice', 'O que são os chamados "gastos invisíveis" no orçamento doméstico?', null, '["Pequenas despesas recorrentes e assinaturas não utilizadas que somadas levam centenas de reais por mês.", "Contas de água e energia elétrica devidamente registradas.", "Impostos anuais obrigatórios retidos na fonte."]'::jsonb, '0'::jsonb, 'Serviços de streaming esquecidos, taxas bancárias avulsas e pequenas compras diárias somam quantias expressivas.', null, 1),
  ('gastos-invisiveis-familia', 'economia-domestica', 4, 'scenario_choice', 'Qual é o melhor jeito de envolver a família nas finanças?', 'Clara quer organizar a casa financeiramente, mas tem medo de parecer controladora ou chata com os filhos e o parceiro.', '["Conversar abertamente sobre sonhos em comum e metas da família", "Esconder as contas e tentar resolver tudo sozinha no sofrimento"]'::jsonb, '0'::jsonb, 'Quando a família entende que economizar hoje financia a viagem de férias de amanhã, todos colaboram felizes.', null, 2),
  ('pequenos-ajustes-que-somam', 'economia-domestica', 4, 'order_priorities', 'Organize o roteiro de economia doméstica prática:', null, '["Auditar assinaturas digitais e cancelar serviços não utilizados", "Planejar as refeições da semana antes de ir ao supermercado com lista", "Direcionar o dinheiro economizado diretamente para a meta do porquinho"]'::jsonb, '["Auditar assinaturas digitais e cancelar serviços não utilizados", "Planejar as refeições da semana antes de ir ao supermercado com lista", "Direcionar o dinheiro economizado diretamente para a meta do porquinho"]'::jsonb, 'Cortar o desperdício sem abrir mão do que importa gera alívio imediato no orçamento da casa.', null, 1);
