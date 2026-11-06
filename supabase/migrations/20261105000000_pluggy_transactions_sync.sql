-- supabase/migrations/20261105000000_pluggy_transactions_sync.sql
-- Adiciona suporte para sincronização idempotente de transações e contas bancárias via Pluggy Open Finance

-- 1. Adicionar colunas external_id e account_id à tabela transactions
alter table if exists transactions
  add column if not exists external_id text,
  add column if not exists account_id text;

-- 2. Garantir índice único para prevenir duplicidade de transações importadas do Open Finance
create unique index if not exists idx_transactions_user_external_id
  on transactions (user_id, external_id)
  where external_id is not null;

-- 3. Adicionar coluna balance em bank_connections se não existir
alter table if exists bank_connections
  add column if not exists balance numeric(12,2),
  add column if not exists last_synced_at timestamptz;
