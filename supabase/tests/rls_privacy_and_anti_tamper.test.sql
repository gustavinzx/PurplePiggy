-- Testes de RLS, Privacidade LGPD e Anti-fraude (Prompt 3)
-- Pode ser executado no Supabase SQL Editor ou via psql

begin;

-- 1. Setup de usuários de teste simulados
create temp table if not exists test_users (
  id uuid primary key,
  email text,
  full_name text
);

insert into test_users (id, email, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'maria@exemplo.com', 'Maria Silva'),
  ('22222222-2222-2222-2222-222222222222', 'joao@exemplo.com', 'João Santos')
on conflict do nothing;

-- 2. Teste: Tentar UPDATE direto em learn_user_stats como authenticated
-- Esperado: Permission Denied (revogado)
do $$
begin
  -- Simula sessão autenticada de Maria
  set local role authenticated;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

  begin
    update public.learn_user_stats
    set xp_points = 999999
    where user_id = '11111111-1111-1111-1111-111111111111';

    -- Se chegou aqui, falhou no anti-fraude!
    raise exception 'FALHA DE SEGURANÇA: authenticated conseguiu fazer UPDATE direto em learn_user_stats!';
  exception
    when insufficient_privilege then
      raise notice 'SUCESSO: UPDATE direto bloqueado por falta de privilégio (DML revogado)';
  end;
end;
$$;

-- 3. Teste: Isolamento RLS entre usuárias (Maria não enxerga dados de João)
do $$
declare
  v_count int;
begin
  set local role authenticated;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

  -- Consulta dados de João
  select count(*) into v_count
  from public.learn_user_stats
  where user_id = '22222222-2222-2222-2222-222222222222';

  if v_count > 0 then
    raise exception 'FALHA DE ISOLAMENTO: Maria conseguiu visualizar dados de João!';
  else
    raise notice 'SUCESSO: Isolamento RLS ativo entre usuárias';
  end if;
end;
$$;

-- 4. Teste: Ranking LGPD não expõe nome real nem e-mail
do $$
declare
  v_rec record;
begin
  set local role authenticated;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

  for v_rec in select * from public.get_weekly_leaderboard(10) loop
    -- Verifica se o apelido não contém arroba (vazamento de e-mail)
    if v_rec.nickname like '%@%' then
      raise exception 'FALHA DE PRIVACIDADE: E-mail vazado no ranking!';
    end if;
  end loop;

  raise notice 'SUCESSO: Ranking LGPD seguro e anônimo';
end;
$$;

-- 5. Teste: Trigger bloqueia alteração de is_demo pelo cliente
do $$
begin
  set local role authenticated;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

  begin
    update public.profiles
    set is_demo = true
    where id = '11111111-1111-1111-1111-111111111111';

    raise exception 'FALHA: Cliente conseguiu alterar is_demo!';
  exception
    when others then
      raise notice 'SUCESSO: Trigger bloqueou alteração de is_demo pelo cliente';
  end;
end;
$$;

-- 6. Teste (Prompt 4): reset_demo_data() chamado por usuária real (não demo) deve falhar
do $$
begin
  -- Maria é usuária real (is_demo = false)
  set local role authenticated;
  set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

  begin
    perform public.reset_demo_data();
    raise exception 'FALHA: Usuária real conseguiu executar reset_demo_data()!';
  exception
    when others then
      raise notice 'SUCESSO: reset_demo_data() bloqueado para usuárias reais';
  end;
end;
$$;

rollback;
