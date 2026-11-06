-- Teste SQL: seed_demo_data() deve rejeitar execução chamada por usuária real (não-anônima e is_demo=false)
-- Referência: Item 2 das correções de segurança do PurplePiggy

begin;

do $$
declare
  v_test_user_id uuid;
  v_err_msg text;
  v_caught boolean := false;
begin
  -- Seleciona uma usuária real existente para o teste
  select id into v_test_user_id
  from auth.users
  where coalesce(is_anonymous, false) = false
  limit 1;

  if v_test_user_id is null then
    raise notice 'Nenhuma usuária real encontrada para o teste; criando ID simulado';
    v_test_user_id := gen_random_uuid();
  end if;

  -- Garante que o perfil está com is_demo = false
  update public.profiles
  set is_demo = false
  where id = v_test_user_id;

  -- Simula sessão autenticada de usuária real com claims JWT normais (não anônima)
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_test_user_id::text, 'is_anonymous', false)::text, true);
  perform set_config('request.jwt.claim.sub', v_test_user_id::text, true);
  perform set_config('request.jwt.claim.is_anonymous', 'false', true);

  begin
    perform public.seed_demo_data();
  exception
    when others then
      v_caught := true;
      get stacked diagnostics v_err_msg = message_text;
  end;

  if not v_caught then
    raise exception 'FALHA DE SEGURANÇA: Usuária real conseguiu executar seed_demo_data()!';
  end if;

  if v_err_msg not like '%Operação não permitida: seed_demo_data é restrito a sessões anônimas ou contas de demonstração.%' then
    raise exception 'FALHA: Mensagem de erro inesperada: %', v_err_msg;
  end if;

  raise notice 'SUCESSO: seed_demo_data() bloqueado corretamente para usuária real: %', v_err_msg;
end;
$$;

rollback;
