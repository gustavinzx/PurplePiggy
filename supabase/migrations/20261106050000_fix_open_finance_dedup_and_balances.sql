-- supabase/migrations/20261106050000_fix_open_finance_dedup_and_balances.sql
-- 1. Remover transações duplicadas existentes preservando a mais antiga
delete from public.transactions a
using public.transactions b
where a.id > b.id
  and a.user_id = b.user_id
  and a.description = b.description
  and a.amount = b.amount
  and a.occurred_on = b.occurred_on
  and a.source = 'open_finance'
  and b.source = 'open_finance';

-- 2. Garantir índice único padrão (sem WHERE) para compatibilidade nativa com upsert do PostgREST
drop index if exists idx_transactions_user_external_id;

create unique index if not exists idx_transactions_user_external_id
  on public.transactions (user_id, external_id);

-- 3. Limpar conexões revogadas antigas que possam causar conflito
update public.bank_connections
set status = 'revoked'
where status != 'active';

-- 4. Alinhar initial_balance para usuários com contas Open Finance conectadas
do $$
declare
  r record;
  v_bank_balance numeric;
  v_month_net numeric;
  v_cur_month text;
begin
  v_cur_month := to_char(now(), 'YYYY-MM');

  for r in select distinct user_id from public.bank_connections where status = 'active' and balance is not null loop
    select coalesce(sum(balance), 0) into v_bank_balance
    from public.bank_connections
    where user_id = r.user_id and status = 'active';

    select coalesce(sum(case when type = 'income' then amount else -amount end), 0) into v_month_net
    from public.transactions
    where user_id = r.user_id and occurred_on >= (v_cur_month || '-01')::date;

    update public.profiles
    set initial_balance = round(v_bank_balance - v_month_net, 2)
    where id = r.user_id;
  end loop;
end $$;
