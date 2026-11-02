-- Extensions
create extension if not exists "pgcrypto";

-- Function to handle updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text,
  avatar_url text,
  phone text,
  birth_date date,
  initial_balance numeric(12,2) not null default 0,
  hide_balance boolean not null default false,
  notify_budget boolean not null default true,
  notify_goals boolean not null default true,
  notify_learning boolean not null default false,
  card_alert_limit numeric(12,2),
  diagnostic_done boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  icon text not null,
  color text not null,
  is_essential boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

-- 3) transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id),
  type text not null check (type in ('income','expense')),
  description text not null check (char_length(description) between 1 and 140),
  amount numeric(12,2) not null check (amount > 0),
  occurred_on date not null,
  payment_method text not null check (payment_method in ('pix','credit_card','debit_card','cash','boleto','transfer','other')),
  notes text,
  source text not null default 'manual' check (source in ('manual','open_finance','demo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_transactions_user_date on transactions (user_id, occurred_on desc);
create index if not exists idx_transactions_user_category on transactions (user_id, category_id);

-- 4) budgets
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  limit_amount numeric(12,2) not null check (limit_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists budgets_unique on budgets
  (user_id, month, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 5) financial_goals
create table if not exists financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('emergency','travel','purchase','debt','course','personal')),
  target_amount numeric(12,2) not null check (target_amount > 0),
  saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0),
  deadline date,
  icon text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) goal_contributions
create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references financial_goals(id) on delete cascade,
  kind text not null check (kind in ('deposit','withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create or replace function apply_goal_contribution() returns trigger language plpgsql as $$
declare
  cur numeric;
  new_saved numeric;
  target numeric;
begin
  select saved_amount, target_amount into cur, target from financial_goals where id = new.goal_id for update;
  if new.kind = 'withdrawal' and new.amount > cur then
    raise exception 'Valor maior que o acumulado na meta';
  end if;

  new_saved := cur + case when new.kind = 'deposit' then new.amount else -new.amount end;

  update financial_goals set
    saved_amount = new_saved,
    completed_at = case when new_saved >= target then coalesce(completed_at, now()) else null end
  where id = new.goal_id;

  return new;
end;
$$;

drop trigger if exists trg_goal_contrib on goal_contributions;
create trigger trg_goal_contrib after insert on goal_contributions
  for each row execute function apply_goal_contribution();

-- 7) financial_diagnosis
create table if not exists financial_diagnosis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  feeling text not null check (feeling in ('start_organizing','partial_control','improve_planning','in_debt')),
  monthly_income numeric(12,2) not null check (monthly_income >= 0),
  essential_expenses numeric(12,2) not null check (essential_expenses >= 0),
  has_emergency_fund text not null check (has_emergency_fund in ('no','small','three_months_plus')),
  main_goal text not null,
  spending_habit text not null check (spending_habit in ('plans','impulse_sometimes','uses_credit_a_lot','no_tracking')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8) educational_contents
create table if not exists educational_contents (
  id uuid primary key default gen_random_uuid(),
  track_slug text not null,
  track_title text not null,
  track_description text not null,
  track_order int not null,
  lesson_slug text not null unique,
  lesson_title text not null,
  summary text not null,
  body_md text not null,
  example_md text,
  tip text,
  minutes int not null check (minutes > 0),
  lesson_order int not null,
  icon text
);

-- 9) educational_progress
create table if not exists educational_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references educational_contents(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, content_id)
);

-- 10) bank_connections
create table if not exists bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_name text not null,
  account_label text,
  provider text not null default 'demo',
  provider_ref text,
  status text not null check (status in ('pending','active','revoked','expired','error')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11) open_finance_consents
create table if not exists open_finance_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references bank_connections(id) on delete cascade,
  scopes text[] not null,
  status text not null check (status in ('authorized','revoked','expired')),
  authorized_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Triggers for updated_at
drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_transactions_updated_at on transactions;
create trigger trg_transactions_updated_at before update on transactions
  for each row execute function set_updated_at();

drop trigger if exists trg_budgets_updated_at on budgets;
create trigger trg_budgets_updated_at before update on budgets
  for each row execute function set_updated_at();

drop trigger if exists trg_financial_goals_updated_at on financial_goals;
create trigger trg_financial_goals_updated_at before update on financial_goals
  for each row execute function set_updated_at();

drop trigger if exists trg_financial_diagnosis_updated_at on financial_diagnosis;
create trigger trg_financial_diagnosis_updated_at before update on financial_diagnosis
  for each row execute function set_updated_at();

drop trigger if exists trg_bank_connections_updated_at on bank_connections;
create trigger trg_bank_connections_updated_at before update on bank_connections
  for each row execute function set_updated_at();

-- Automatic profile creation on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, is_demo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Usuária PurplePiggy'),
    new.email,
    coalesce((new.raw_user_meta_data->>'is_demo')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table financial_goals enable row level security;
alter table goal_contributions enable row level security;
alter table financial_diagnosis enable row level security;
alter table educational_contents enable row level security;
alter table educational_progress enable row level security;
alter table bank_connections enable row level security;
alter table open_finance_consents enable row level security;

-- Profiles RLS
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Categories RLS
create policy "categories_select_accessible" on categories for select
  using (user_id is null or user_id = auth.uid());
create policy "categories_insert_own" on categories for insert
  with check (user_id = auth.uid());
create policy "categories_update_own" on categories for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_delete_own" on categories for delete
  using (user_id = auth.uid());

-- Transactions RLS
create policy "transactions_all_own" on transactions for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and
    exists (select 1 from categories where id = category_id and (user_id is null or user_id = auth.uid()))
  );

-- Budgets RLS
create policy "budgets_all_own" on budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Financial goals RLS
create policy "financial_goals_all_own" on financial_goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Goal contributions RLS
create policy "goal_contributions_all_own" on goal_contributions for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and
    exists (select 1 from financial_goals where id = goal_id and user_id = auth.uid())
  );

-- Financial diagnosis RLS
create policy "financial_diagnosis_all_own" on financial_diagnosis for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Educational contents RLS (read only for all authenticated and anon)
create policy "educational_contents_read" on educational_contents for select
  using (true);

-- Educational progress RLS
create policy "educational_progress_all_own" on educational_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Bank connections RLS
create policy "bank_connections_all_own" on bank_connections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Open Finance consents RLS
create policy "open_finance_consents_all_own" on open_finance_consents for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
