-- supabase/migrations/20261104000000_pluggy_open_finance.sql
-- Suporte robusto para Open Finance com provedor Pluggy no PurplePiggy

-- 1. Adicionar colunas de suporte para provedores reais (Pluggy) em bank_connections
alter table if exists bank_connections
  add column if not exists raw_status text,
  add column if not exists institution_logo text;

-- 2. Garantir restrição de unicidade para permitir upsert seguro por usuário e provider_ref
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bank_connections_user_provider_ref_key'
  ) then
    alter table bank_connections
      add constraint bank_connections_user_provider_ref_key unique (user_id, provider_ref);
  end if;
end $$;

-- 3. Confirmar que RLS está habilitado e políticas cobrem CRUD completo do usuário
alter table if exists bank_connections enable row level security;
alter table if exists open_finance_consents enable row level security;

-- Atualizar/Garantir políticas de RLS
drop policy if exists "bank_connections_all_own" on bank_connections;
create policy "bank_connections_all_own" on bank_connections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "open_finance_consents_all_own" on open_finance_consents;
create policy "open_finance_consents_all_own" on open_finance_consents for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
