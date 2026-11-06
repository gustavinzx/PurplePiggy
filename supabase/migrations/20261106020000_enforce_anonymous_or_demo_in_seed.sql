-- Migration: 20261106020000_enforce_anonymous_or_demo_in_seed.sql
-- Restringir execução de seed_demo_data() estritamente a sessões anônimas ou perfis já marcados como demonstração (is_demo = true)

create or replace function public.seed_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_anonymous boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  v_is_demo boolean := false;
  v_profile public.profiles;
  v_current_month date := (date_trunc('month', current_date)::date);
  v_current_week date := (date_trunc('week', current_date)::date);

  -- IDs de categorias
  v_cat_moradia uuid;
  v_cat_alimentacao uuid;
  v_cat_transporte uuid;
  v_cat_saude uuid;
  v_cat_lazer uuid;
  v_cat_salario uuid;

  -- IDs de metas
  v_goal_reserva uuid;
  v_goal_viagem uuid;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  -- Verificar se o usuário chamador já é uma conta de demonstração
  select coalesce(is_demo, false) into v_is_demo
  from public.profiles
  where id = v_user_id;

  -- 1. Regra Estrita de Segurança:
  -- Só permite executar seed se a sessão for anônima OU se o perfil já for uma conta demo.
  -- Usuárias reais autenticadas são bloqueadas para evitar sobreescrita acidental de finanças pessoais.
  if not (v_is_anonymous or v_is_demo) then
    raise exception 'Operação não permitida: seed_demo_data é restrito a sessões anônimas ou contas de demonstração.';
  end if;

  -- Marca o perfil como modo de demonstração e define dados de Ana Oliveira
  update public.profiles
  set is_demo = true,
      full_name = 'Ana Oliveira',
      initial_balance = 1250.00,
      diagnostic_done = true,
      hide_balance = false,
      leaderboard_opt_in = false,
      leaderboard_nickname = 'AnaPiggy',
      updated_at = now()
  where id = v_user_id
  returning * into v_profile;

  -- Se o perfil ainda não existir na tabela profiles, cria
  if not found then
    insert into public.profiles (
      id, full_name, email, is_demo, initial_balance, diagnostic_done,
      hide_balance, leaderboard_opt_in, leaderboard_nickname
    )
    values (
      v_user_id, 'Ana Oliveira', null, true, 1250.00, true,
      false, false, 'AnaPiggy'
    )
    returning * into v_profile;
  end if;

  -- 2. Garantir Categorias do Usuário Demo
  insert into public.categories (user_id, slug, name, icon, color, is_essential, sort_order)
  values (v_user_id, 'moradia', 'Moradia', 'Home', '#8B5CF6', true, 1)
  on conflict (user_id, slug) do update set name = excluded.name
  returning id into v_cat_moradia;

  insert into public.categories (user_id, slug, name, icon, color, is_essential, sort_order)
  values (v_user_id, 'alimentacao', 'Alimentação', 'ShoppingCart', '#EC4899', true, 2)
  on conflict (user_id, slug) do update set name = excluded.name
  returning id into v_cat_alimentacao;

  insert into public.categories (user_id, slug, name, icon, color, is_essential, sort_order)
  values (v_user_id, 'transporte', 'Transporte', 'Car', '#3B82F6', true, 3)
  on conflict (user_id, slug) do update set name = excluded.name
  returning id into v_cat_transporte;

  insert into public.categories (user_id, slug, name, icon, color, is_essential, sort_order)
  values (v_user_id, 'saude', 'Saúde & Cuidados', 'HeartPulse', '#10B981', true, 4)
  on conflict (user_id, slug) do update set name = excluded.name
  returning id into v_cat_saude;

  insert into public.categories (user_id, slug, name, icon, color, is_essential, sort_order)
  values (v_user_id, 'lazer', 'Lazer & Família', 'Coffee', '#F59E0B', false, 5)
  on conflict (user_id, slug) do update set name = excluded.name
  returning id into v_cat_lazer;

  insert into public.categories (user_id, slug, name, icon, color, is_essential, sort_order)
  values (v_user_id, 'salario', 'Salário & Renda', 'Wallet', '#10B981', false, 6)
  on conflict (user_id, slug) do update set name = excluded.name
  returning id into v_cat_salario;

  -- 3. Transações de 5 a 6 meses com datas relativas à data atual
  for m in 0..5 loop
    declare
      v_m_date date := (v_current_month - (m || ' month')::interval)::date;
    begin
      -- Salário mensal (R$ 4.200,00)
      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_salario, 'income', 'Salário Empresa ABC', 4200.00, v_m_date + 4, 'transfer', 'demo');

      -- Moradia (Aluguel e contas)
      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_moradia, 'expense', 'Aluguel & Condomínio', 1200.00, v_m_date + 9, 'boleto', 'demo');

      -- Alimentação (Supermercado e feira)
      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_alimentacao, 'expense', 'Supermercado Mensal', 820.00, v_m_date + 11, 'debit_card', 'demo');

      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_alimentacao, 'expense', 'Feira da Semana & Padaria', 330.00, v_m_date + 18, 'pix', 'demo');

      -- Transporte
      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_transporte, 'expense', 'Combustível e Transporte', 350.00, v_m_date + 14, 'credit_card', 'demo');

      -- Saúde
      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_saude, 'expense', 'Farmácia e Plano Familiar', 220.00, v_m_date + 20, 'pix', 'demo');

      -- Lazer
      insert into public.transactions (user_id, category_id, type, description, amount, occurred_on, payment_method, source)
      values (v_user_id, v_cat_lazer, 'expense', 'Passeio com os filhos & Cinema', 480.00, v_m_date + 22, 'credit_card', 'demo');
    end;
  end loop;

  -- 4. Orçamentos do Mês Atual
  insert into public.budgets (user_id, category_id, month, limit_amount)
  values (v_user_id, v_cat_alimentacao, v_current_month, 1200.00)
  on conflict (user_id, month, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set limit_amount = excluded.limit_amount;

  insert into public.budgets (user_id, category_id, month, limit_amount)
  values (v_user_id, v_cat_lazer, v_current_month, 500.00)
  on conflict (user_id, month, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set limit_amount = excluded.limit_amount;

  insert into public.budgets (user_id, category_id, month, limit_amount)
  values (v_user_id, v_cat_moradia, v_current_month, 1400.00)
  on conflict (user_id, month, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set limit_amount = excluded.limit_amount;

  insert into public.budgets (user_id, category_id, month, limit_amount)
  values (v_user_id, v_cat_transporte, v_current_month, 500.00)
  on conflict (user_id, month, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set limit_amount = excluded.limit_amount;

  -- 5. Metas Financeiras
  insert into public.financial_goals (user_id, name, category, target_amount, saved_amount, deadline, icon)
  values (v_user_id, 'Reserva de emergência', 'emergency', 10000.00, 0, current_date + 180, 'Shield')
  returning id into v_goal_reserva;

  insert into public.financial_goals (user_id, name, category, target_amount, saved_amount, deadline, icon)
  values (v_user_id, 'Viagem com os filhos', 'travel', 4000.00, 0, current_date + 240, 'Plane')
  returning id into v_goal_viagem;

  -- Aportes
  insert into public.goal_contributions (user_id, goal_id, kind, amount, occurred_on)
  values (v_user_id, v_goal_reserva, 'deposit', 2200.00, current_date - 60);

  insert into public.goal_contributions (user_id, goal_id, kind, amount, occurred_on)
  values (v_user_id, v_goal_reserva, 'deposit', 2000.00, current_date - 30);

  insert into public.goal_contributions (user_id, goal_id, kind, amount, occurred_on)
  values (v_user_id, v_goal_reserva, 'deposit', 2000.00, current_date - 5);

  insert into public.goal_contributions (user_id, goal_id, kind, amount, occurred_on)
  values (v_user_id, v_goal_viagem, 'deposit', 600.00, current_date - 45);

  insert into public.goal_contributions (user_id, goal_id, kind, amount, occurred_on)
  values (v_user_id, v_goal_viagem, 'deposit', 600.00, current_date - 15);

  -- 6. Diagnóstico Financeiro
  insert into public.financial_diagnosis (
    user_id, feeling, monthly_income, essential_expenses, has_emergency_fund, main_goal, spending_habit
  )
  values (
    v_user_id, 'partial_control', 4200.00, 2720.00, 'small', 'Construir reserva e proteger a família', 'plans'
  )
  on conflict (user_id) do update
  set monthly_income = 4200.00, essential_expenses = 2720.00, has_emergency_fund = 'small';

  -- 7. Conexão Open Finance Bancária de Demonstração
  insert into public.bank_connections (
    user_id, institution_name, account_label, provider, status, is_demo
  )
  values (
    v_user_id, 'Banco Exemplo', 'Conta Corrente · Ag 0001', 'demo', 'active', true
  );

  -- 8. Estatísticas do Módulo Aprender
  insert into public.learn_user_stats (
    user_id, streak_count, longest_streak, last_activity_date,
    piggy_coins, xp_points, weekly_xp, week_start, hearts, streak_shields, active_track_slug
  )
  values (
    v_user_id, 5, 7, current_date, 90, 320, 140, v_current_week, 3, 1, 'organizacao-financeira'
  )
  on conflict (user_id) do update
  set streak_count = 5, xp_points = 320, weekly_xp = 140, hearts = 3, streak_shields = 1;

  -- Lições concluídas
  insert into public.educational_progress (user_id, content_id, completed_at)
  select v_user_id, id, now()
  from public.educational_contents
  where track_slug = 'organizacao-financeira'
  limit 2
  on conflict (user_id, content_id) do nothing;

  return jsonb_build_object(
    'success', true,
    'message', 'Cenário demonstrativo de Ana Oliveira carregado com sucesso.'
  );
end;
$$;

grant execute on function public.seed_demo_data() to authenticated;
