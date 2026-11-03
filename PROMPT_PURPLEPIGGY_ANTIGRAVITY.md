# 💜 PURPLEPIGGY — PROMPT MESTRE DE DESENVOLVIMENTO

> Cole este documento inteiro no Antigravity e anexe os arquivos listados na seção 2.
> Idioma do produto: **português do Brasil**. Idioma do código: inglês (nomes de variáveis, tabelas e funções).

---

## 0. COMO VOCÊ (AGENTE) DEVE TRABALHAR

Você é uma equipe sênior (produto, design, front-end, back-end e QA) construindo o **PurplePiggy**: um aplicativo web de controle e educação financeira para mulheres adultas, **real, funcional e integrado**, para ser apresentado em sala de aula e depois evoluir.

**Regras de execução**

1. **Comece gerando um plano** (Implementation Plan) dividido nas fases da seção 15. Só avance de fase quando a anterior estiver rodando e testada.
2. **Nada de protótipo.** Cada botão executa uma ação real ou mostra claramente que a função não está disponível no ambiente. Nenhum dado fixo no código aparecendo como se fosse da usuária.
3. **O layout oficial anexo (`LayoutDoApp.png`) é a especificação visual.** Reproduza as 15 telas com fidelidade: estrutura, hierarquia, textos, cores, cards, anéis de progresso, ícones e navegação. Não use o layout como "inspiração"; use como contrato. Onde este documento e o layout divergirem em *aparência*, vale o layout. Onde divergirem em *comportamento*, vale este documento.
4. **Banco real.** Não use localStorage, mock JSON ou estado em memória como substituto do banco. localStorage só para preferências de interface (ex.: ocultar saldo, tema).
5. **Se faltarem credenciais do Supabase**, pare e peça: `SUPABASE_URL` e `SUPABASE_ANON_KEY`. Enquanto isso, ofereça subir o Supabase local (`supabase start`) como alternativa. Nunca finja o backend.
6. **Teste de verdade.** Use o navegador do agente para percorrer os fluxos da seção 14, capture screenshots e corrija o que quebrar antes de declarar pronto.
7. **Priorize.** Tudo marcado **[P0]** é obrigatório. **[P1]** entra se o P0 estiver completo e estável. **[P2]** é bônus. Não gaste tempo em P2 antes de fechar P0 e P1.
8. **Escopo fechado.** Não implemente o que está na seção 13 (fora de escopo), mesmo que pareça uma boa ideia.

---

## 1. CONTEXTO DO PRODUTO (use como base de todas as decisões)

**Problema.** Muitas mulheres chegam ao endividamento sem uma visão clara de para onde o dinheiro está indo e sem apoio para criar um plano realista de gastos e economia.

**Proposta.** App que organiza gastos, gera **orçamento e metas a partir dos dados reais de cada usuária**, ensina educação financeira ao longo do uso e prepara integração com Open Finance. O foco é **prevenir e controlar** o endividamento, **não renegociar dívidas**.

**Público.** Mulheres adultas que querem organizar a vida financeira, sair do endividamento ou evitar entrar nele. Muitas são responsáveis pelas contas da casa.

**Dados que orientam o produto (2026; usar em textos educativos e de apresentação, sempre atribuindo a fonte)**
- Mulheres são 50,5% dos inadimplentes (Serasa) e 51,39% pela base CNDL/SPC Brasil.
- 42% dos inadimplentes de 2026 já estavam negativados 10 anos antes (reincidência): renegociar não basta, é preciso informação e organização.
- Entre mulheres endividadas, 86% devem no cartão, 59% no supermercado e 42% em remédios ou tratamentos (Think Olga & Eva): a dívida vem de **gastos essenciais**, não de supérfluos.
- Só 19% das mulheres têm reserva financeira, contra 32% dos homens (Serasa).
- Quatro em cada dez mulheres são responsáveis pelas contas da casa; 32% são as únicas provedoras.
- Mulheres recebem 21% menos que homens e quitam mais dívidas quando têm ferramenta: falta o que evite a próxima dívida.

**Consequências de design (obrigatórias)**
1. **Zero culpa.** Nunca tratar gasto como erro. Nada de "corte a blusinha". Os gastos essenciais pesam, e o app reconhece isso.
2. **Categoria própria "Cuidados com a família"** (lanche da escola, remédio dos pais, material dos filhos): gastos invisíveis precisam aparecer.
3. **Reserva de emergência em destaque** e em passos pequenos (primeiro passo = uma semana de gastos essenciais).
4. **Educação embutida**: cada função explica o porquê dos números.
5. **Sem anúncios, sem oferta de crédito, sem venda de dados.** Privacidade como promessa de marca (LGPD).
6. **Plano gratuito completo**: 48% dos inadimplentes ganham até 1 salário mínimo.

**Diferencial frente aos concorrentes** (Mobills, Organizze, Minhas Economias, Pierre, Nath/Me Poupe, PouPay+, Serasa, Acordo Certo): orçamento e metas automáticos a partir dos gastos reais, foco em quem sustenta a casa, linguagem sem julgamento, simulador de compras e educação enquanto usa. Pegue deles: entrada automática via Open Finance, limites por categoria, interface limpa, alertas claros. Evite: anúncios e crédito no meio do controle, parar em organizar sem explicar, empurrar investimento para quem tem dívida no cartão, tratar a usuária só como devedora.

**MVV (usar na tela "Sobre o PurplePiggy")**
- **Missão:** ajudar mulheres a entender e controlar o próprio dinheiro, com planejamento personalizado e educação financeira acessível, para que saiam do endividamento ou nunca entrem nele.
- **Visão:** ser a principal referência em educação e controle financeiro para mulheres no Brasil, com mais autonomia e segurança para cada usuária.
- **Valores:** Autonomia (o app orienta, não impõe), Educação, Acolhimento, Transparência, Privacidade e segurança, Inclusão.

---

## 2. ASSETS OFICIAIS (ANEXOS)

| Arquivo | Uso |
|---|---|
| `LayoutDoApp.png` | Especificação visual das 15 telas. Contrato de design. |
| `Purple_Piggy_Brandbook.pdf` | Logo, paleta, tipografia, componentes e aplicações da marca. |
| `Benchmarking__Brainstorm__MVP_e_MVV.pdf` | Fundamentação, escopo do MVP, MVV. |
| `pig-oficial.png` (e `pig-oficial-512.png`) | **Mascote oficial**, fundo transparente. Copiar para `public/assets/`. |
| Porquinho simplificado/sorridente (opcional) | A página "Aplicações da Marca" do brandbook mostra uma versão simplificada para ícone do app e boas-vindas. Se o arquivo for anexado, usar nesses pontos; se não, usar só o oficial. |

**Regras da mascote e da logo**
- Use **exatamente** o arquivo oficial. **Proibido** redesenhar, recriar com IA, distorcer, recolorir ou trocar por emoji.
- Mantenha proporção, contorno preto, orelhas em degradê, bochechas, focinho rosa e moeda amarela.
- Quando o layout mostrar o porquinho em outra pose (segurando moeda, com capelo de formatura, com lâmpada), **use o asset oficial** na posição indicada e, se desejar o efeito, componha adereços **ao redor** dele com SVG/CSS (capelo, lâmpada, brilhos). Nunca altere o porquinho em si.
- Logotipo: "Purple" em roxo escuro `#432171` e "Piggy" em roxo vibrante `#B037F8`, Nunito Extra-Bold; em fundo escuro, "Purple" em branco. Componente `<Logo variant="light|dark|icon" />`.
- Favicon e ícone PWA: cabeça do porquinho sobre fundo lilás arredondado. **[P2]** PWA instalável com manifest.

---

## 3. IDENTIDADE VISUAL E DESIGN SYSTEM

**Paleta (tokens CSS/Tailwind)**

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#B037F8` | Ações principais, destaques, "Piggy" |
| `lilac` | `#CF91F6` | Gradientes, estados suaves, gráficos |
| `deep` | `#432171` | Títulos, texto forte, cabeçalhos escuros |
| `pink` | `#FF79A8` | Botão secundário e detalhes (uso moderado) |
| `baby` | `#DEEEFC` | Cards informativos, fundos de destaque |
| `gold` | `#FEDA70` | Conquistas, moedas, alertas de atenção |
| `bg` | `#F8F5FC` | Fundo do app |
| `white` | `#FFFFFF` | Cards |

Complementares sugeridos (derivar, não inventar paleta nova): verde-sucesso suave para receitas, rosa-vermelho `#E5487A` para exclusão/estouro, cinza-lilás `#7D6A9C` para texto secundário.

**Tipografia:** Nunito (via `@fontsource/nunito`). Títulos e destaques: ExtraBold/Bold. Subtítulos: SemiBold. Texto corrido: Regular (itálico apenas para apoio e slogans). Escala: 12/14/16/20/24/32/40.

**Componentes** (reproduzir como no layout e no brandbook)
- Botão **principal**: pílula com degradê roxo (`#7D2BD6 → #B037F8`), texto branco, altura 48px, sombra suave, estado pressionado com leve escala.
- Botão **secundário**: pílula rosa `#FF79A8` (brandbook) ou contorno roxo (layout, telas de login/boas-vindas). Botão **destrutivo**: contorno rosa-vermelho.
- **Cards**: raio 20–24px, fundo branco ou `baby`, sombra roxa translúcida muito suave. Card de saldo: degradê roxo (`#B037F8 → #432171`) com texto branco e ícone de olho.
- **Barras de progresso** (11–12px, raio total) e **anéis de progresso** circulares (SVG) nas metas, com cor muda por faixa: normal (roxo), atenção ≥80% (dourado), limite ≥100% (rosa).
- Barra empilhada de categorias no "Painel de gastos" (roxo, rosa, amarelo, azul-bebê, lilás).
- **Bottom navigation** de 5 itens: Início, Gastos, Metas, Aprender, Perfil (como no layout), com item ativo em roxo e ícone preenchido.
- Inputs com ícone à esquerda, borda lilás, foco roxo; campo de senha com olho para mostrar/ocultar.
- Fundo com **blobs lilás/azul-bebê**, estrelinhas e brilhos discretos nas telas de entrada (splash, boas-vindas, cadastro, login), como no layout.
- Ícones: **Lucide React**, traço consistente, em "tiles" de fundo lilás claro. Ícones de categoria: Moradia (casa), Alimentação (carrinho), Transporte (ônibus), Saúde (coração/pílula), Educação (capelo), Lazer (balão/estrela), Compras (sacola), Cuidados com a família (pessoas), Outros (sparkles).
- Microinterações: transição de tela suave (150–250ms), contagem animada em valores principais, anel/barra que preenchem ao entrar, confete leve ao concluir meta ou lição. Respeitar `prefers-reduced-motion`.
- Responsivo **mobile-first**. No desktop, manter o app em uma coluna central de até 480px com moldura sutil **ou** adaptar para layout com sidebar (navegação lateral no lugar da bottom nav) em ≥1024px. **Não deixar telas vazias**: preencher com cards, gráficos e dicas úteis.
- Acessibilidade: contraste AA, foco visível, `aria-label` em ícones, formulários com labels, áreas de toque ≥44px.

**Cabeçalho de marca (referência do layout):** chips "Controle de gastos", "Metas personalizadas", "Educação financeira", "Mais tranquilidade" podem ser usados em uma seção "Por que o PurplePiggy" na tela de boas-vindas (carrossel) e em "Sobre".

---

## 4. STACK E ARQUITETURA

- **React 18 + TypeScript + Vite**
- **Tailwind CSS + shadcn/ui** (customizados com os tokens acima)
- **React Router** (rotas protegidas)
- **TanStack Query** (cache e invalidação: o dashboard atualiza sozinho ao criar/editar/excluir)
- **React Hook Form + Zod** (validação)
- **Supabase**: PostgreSQL, Auth, Row Level Security, Edge Functions, RPC
- **Recharts** (gráficos), **Lucide React** (ícones), **Sonner** (toasts), **date-fns** (pt-BR)
- **Vitest** (unidade das regras financeiras) e **Playwright** ou o navegador do agente (fluxos)
- Deploy: **Vercel** (front) + **Supabase** (backend)

**Estrutura**
```
purplepiggy/
├─ public/assets/ (pig-oficial.png, logos, og-image)
├─ src/
│  ├─ app/ (router, providers, layout, guards)
│  ├─ components/ (ui/, Logo, Mascot, ProgressRing, BottomNav, EmptyState, Skeletons, ConfirmDialog)
│  ├─ features/
│  │  ├─ auth/  ├─ diagnostic/  ├─ dashboard/  ├─ transactions/
│  │  ├─ budget/  ├─ goals/  ├─ learn/  ├─ simulator/
│  │  ├─ profile/  ├─ openfinance/  └─ demo/
│  ├─ lib/ (supabase.ts, format.ts, finance/ [funções puras testáveis])
│  ├─ hooks/  ├─ types/ (gerados do Supabase)  └─ styles/
├─ supabase/ (migrations/, seed.sql, functions/)
├─ tests/
├─ .env.example
└─ README.md
```
Toda regra de cálculo (saldo, variação, orçamento, previsões, simulador) fica em `src/lib/finance/` como **funções puras com testes**.

---

## 5. BANCO DE DADOS (PostgreSQL / SUPABASE)

Crie as migrations abaixo. Valores monetários em `numeric(12,2)`. Todas as tabelas de usuária têm `user_id uuid references auth.users(id) on delete cascade`, `created_at` e `updated_at`, índice por `user_id`, e **RLS ativado**.

```sql
-- extensões e util
create extension if not exists "pgcrypto";
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- 1) profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text,
  avatar_url text,
  phone text, birth_date date,
  initial_balance numeric(12,2) not null default 0,
  hide_balance boolean not null default false,
  notify_budget boolean not null default true,
  notify_goals boolean not null default true,
  notify_learning boolean not null default false,
  card_alert_limit numeric(12,2),            -- [P2] alerta de limite do cartão
  diagnostic_done boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) categories (padrão do sistema: user_id null; personalizadas: user_id preenchido)
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text not null, name text not null,
  icon text not null, color text not null,
  is_essential boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

-- 3) transactions
create table transactions (
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
create index on transactions (user_id, occurred_on desc);
create index on transactions (user_id, category_id);

-- 4) budgets (category_id null = orçamento mensal total)
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  limit_amount numeric(12,2) not null check (limit_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index budgets_unique on budgets
  (user_id, month, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 5) financial_goals
create table financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null
    check (category in ('emergency','travel','purchase','debt','course','personal')),
  target_amount numeric(12,2) not null check (target_amount > 0),
  saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0),
  deadline date, icon text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) goal_contributions (depósito/retirada; trigger mantém saved_amount)
create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references financial_goals(id) on delete cascade,
  kind text not null check (kind in ('deposit','withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create or replace function apply_goal_contribution() returns trigger language plpgsql as $$
declare cur numeric; begin
  select saved_amount into cur from financial_goals where id = new.goal_id for update;
  if new.kind = 'withdrawal' and new.amount > cur then
    raise exception 'Valor maior que o acumulado na meta'; end if;
  update financial_goals set
    saved_amount = saved_amount + case when new.kind='deposit' then new.amount else -new.amount end,
    completed_at = case when saved_amount + case when new.kind='deposit' then new.amount else -new.amount end >= target_amount
                        then coalesce(completed_at, now()) else null end
  where id = new.goal_id;
  return new; end $$;
create trigger trg_goal_contrib after insert on goal_contributions
  for each row execute function apply_goal_contribution();

-- 7) financial_diagnosis
create table financial_diagnosis (
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

-- 8) educational_contents (global, leitura para autenticadas)
create table educational_contents (
  id uuid primary key default gen_random_uuid(),
  track_slug text not null, track_title text not null, track_description text not null, track_order int not null,
  lesson_slug text not null unique, lesson_title text not null, summary text not null,
  body_md text not null, example_md text, tip text,
  minutes int not null check (minutes > 0), lesson_order int not null, icon text
);

-- 9) educational_progress
create table educational_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references educational_contents(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, content_id)
);

-- 10) bank_connections  /  11) open_finance_consents
create table bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_name text not null, account_label text,
  provider text not null default 'demo', provider_ref text,
  status text not null check (status in ('pending','active','revoked','expired','error')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table open_finance_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references bank_connections(id) on delete cascade,
  scopes text[] not null,                      -- ex.: {'accounts','transactions','cards'}
  status text not null check (status in ('authorized','revoked','expired')),
  authorized_at timestamptz not null default now(),
  expires_at timestamptz not null,             -- prazo máximo de 12 meses
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- triggers updated_at em todas as tabelas com updated_at
-- (criar trigger before update -> set_updated_at() para profiles, transactions, budgets,
--  financial_goals, financial_diagnosis, bank_connections)
```

**Row Level Security (obrigatório em todas as tabelas)**
- `profiles`: `select/update` onde `id = auth.uid()`; `insert` automático via trigger em `auth.users`.
- `transactions`, `budgets`, `financial_goals`, `goal_contributions`, `financial_diagnosis`, `educational_progress`, `bank_connections`, `open_finance_consents`: `select/insert/update/delete` **somente** onde `user_id = auth.uid()` (com `with check` igual).
- `categories`: `select` onde `user_id is null or user_id = auth.uid()`; `insert/update/delete` somente onde `user_id = auth.uid()`.
- `educational_contents`: `select` para `authenticated`; sem escrita pelo cliente.
- Policy de `insert` deve impedir inserir com `user_id` de outra pessoa. Validar também que `transactions.category_id` e `goal_contributions.goal_id` pertencem à usuária (via `with check` com `exists`).
- **Prove** o isolamento: escreva um teste que loga como duas usuárias e confirma que uma não lê nem altera dados da outra.

**Funções/RPC (SECURITY DEFINER, `search_path` fixo)**
- `handle_new_user()`: trigger em `auth.users` que cria `profiles` (nome vindo de `raw_user_meta_data`).
- `seed_demo_data()` e `reset_demo_data()`: só funcionam se `profiles.is_demo = true` para `auth.uid()`. `reset` apaga transações, orçamentos, metas, contribuições, progresso e conexões **apenas daquela usuária demo** e recria o conjunto fictício (seção 11). Jamais tocam dados de usuárias reais.
- `dashboard_summary(month date)` **[P1]**: retorna receitas, despesas, saldo, variação, gastos por categoria e série dos últimos 6 meses numa chamada (ou implemente no cliente com queries agregadas; escolha a opção mais simples e rápida).

**Seed**: categorias padrão (user_id null) com `is_essential`: Moradia✔, Alimentação✔, Transporte✔, Saúde✔, Educação, Lazer, Compras, Cuidados com a família✔, Outros. Mais as lições da seção 9.

---

## 6. AUTENTICAÇÃO E SEGURANÇA

- Supabase Auth com e-mail e senha. Cadastro, login, logout, **recuperação de senha** por e-mail (rota `/redefinir-senha`), sessão persistente e renovação automática.
- Rotas protegidas: sem sessão, redireciona para `/entrar`; com sessão e sem diagnóstico, redireciona para `/diagnostico`.
- Senha: mínimo 8 caracteres, com indicador de força. Mensagens de erro claras e acolhedoras ("E-mail ou senha incorretos. Confira e tente de novo.").
- **Nunca** expor `service_role` no front. Chaves apenas via `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Entregar `.env.example`.
- Sanitizar entradas, limitar tamanhos, tratar todos os erros de rede com toast e opção "Tentar de novo".
- Avatar: bucket privado `avatars` com policy por `auth.uid()`; limite de 2 MB, JPG/PNG/WebP. **[P1]**
- Exibir em Privacidade e segurança: política resumida em linguagem simples (LGPD), opções "Exportar meus dados" **[P2]** e "Excluir minha conta e dados" **[P1]** (com confirmação dupla).
- Orientação ao agente: para a apresentação, deixar a **confirmação de e-mail desativada** no Supabase (documentar no README como ativar em produção).

---

## 7. TELAS (15) — FIEL AO LAYOUT, COM COMPORTAMENTO REAL

Rotas sugeridas entre parênteses. Textos entre aspas vêm do layout oficial: **mantenha-os**.

### 01 Splash `/`
Logo PurplePiggy, mascote com leve flutuação, slogan "Seu dinheiro, seu ritmo.", botões "Começar" e "Entrar". Animação de entrada suave. Se houver sessão válida, redireciona sozinho (início ou diagnóstico) após ~1,5s; senão mostra os botões.

### 02 Boas-vindas `/boas-vindas`
"Bem-vinda!" / "Aqui você aprende, organiza e conquista seus objetivos financeiros com leveza." Carrossel de 3 pontos (organizar gastos, metas, aprender) com indicador de pontos. Botão "Começar agora" (vai ao cadastro) e link "Já tenho uma conta · Entrar". **Botão extra discreto: "Ver modo demonstração"** (seção 11).

### 03 Cadastro `/cadastrar`
"Crie sua conta" / "Um novo começo para sua vida financeira." Campos com ícone: Nome completo, E-mail, Senha, Confirmar senha. Aviso "Seus dados são tratados com cuidado." (cadeado). Botão "Criar minha conta". Rodapé "Já tem conta? Entrar". Validação com Zod, erros inline, cadastro **real** no Supabase Auth, criação do perfil, redirecionamento ao diagnóstico.

### 04 Login `/entrar`
"Que bom ter você de volta!" / "Entre para acompanhar sua evolução." Mascote no canto superior direito. E-mail, Senha (olho para mostrar), "Esqueci minha senha ?" (fluxo real de recuperação), botão "Entrar", botão contorno "Criar uma conta". Mensagens de erro acolhedoras e estado de carregamento no botão.

### 05 Diagnóstico `/diagnostico`
Wizard de **3 passos** com barra de progresso e contador ("1 de 3"). Título "Vamos conhecer você" / "Responda no seu ritmo. Não existe resposta certa ou errada."
- **Passo 1:** "Como você se sente com suas finanças?" (rádios: Quero começar a me organizar / Tenho controle parcial / Quero melhorar meu planejamento / Estou com dívidas) e "Qual sua renda mensal aproximada?" (valor numérico com máscara R$, ou faixa; preferir valor, pois alimenta o orçamento).
- **Passo 2:** gastos essenciais mensais aproximados (moradia, mercado, transporte, saúde, família) e "Você tem reserva financeira?" (Não / Sim, pequena / Sim, de 3 meses ou mais).
- **Passo 3:** principal objetivo (Reserva de emergência, Quitar dívida, Viagem, Curso, Notebook/compra, Outro) e hábitos de consumo (Planejo minhas compras / Compro por impulso às vezes / Uso muito o cartão / Não acompanho meus gastos).
- Botão final "Concluir diagnóstico". Permite voltar entre passos sem perder respostas e **pular** com "Fazer depois" (usa valores nulos e mantém `diagnostic_done=false` com lembrete no dashboard).
- **Resumo inicial** ao concluir (modal/tela com mascote): renda, essenciais (valor e % da renda), sobra estimada, reserva sugerida (1 semana de essenciais), 1 mensagem acolhedora conforme o perfil, e botão "Ir para o meu painel". Ao concluir, o sistema **cria** automaticamente: orçamento mensal inicial (seção 8.4) e a meta "Reserva de emergência" com primeiro passo.

### 06 Dashboard `/inicio` (a tela mais importante)
Seguir o layout, com todos os valores vindos do banco da usuária autenticada:
- Saudação "Olá, {primeiro nome}! 👋" / "Sua vida financeira no caminho certo." + mascote no canto.
- **Card "Saldo disponível"** (degradê roxo) com valor, olho para ocultar/mostrar (persistir em `profiles.hide_balance`), chip de variação (ex.: "▲ +12%") e "Atualizado hoje".
- Duas mini-cards: **Receitas** e **Despesas** do mês.
- **Comparação com o mês anterior** (setas e %, sem tom de cobrança).
- **Painel de gastos** ("Este mês >" leva a `/gastos`): total do mês + barra empilhada por categoria com legenda e percentuais; abaixo, **gráfico de rosca ou barras** por categoria.
- **Evolução financeira**: gráfico de linha/área dos últimos 6 meses (receitas x despesas) com tooltip.
- **Orçamento mensal**: barra com % usado e valor disponível (vai a `/orcamento`).
- **Reserva de emergência**: "60% · R$ 6.000,00 de R$ 10.000,00" (vem da meta de categoria `emergency`; se não existir, CTA para criá-la).
- **Progresso das metas** (até 3 anéis pequenos).
- **Alertas de orçamento** (≥80% e ≥100%) em cards dourados/rosa, com texto acolhedor.
- **Transações recentes** (4 últimas) com "Ver todas".
- **Atalhos**: "+ Despesa", "+ Receita" (abrem o modal de lançamento), "Simular compra".
- Mensagem motivacional rotativa curta ("Pequenos passos também são conquistas.").
- Skeletons no carregamento; estado vazio elegante para conta nova ("Vamos organizar isso juntas? Registre seu primeiro gasto.") com mascote.
- **Atualização automática**: ao criar/editar/excluir transação, meta ou orçamento, invalidar as queries e o dashboard reflete na hora.

### 07 Gastos `/gastos`
"Seus gastos" / "Acompanhe para onde seu dinheiro está indo."
- Filtros: período (Este mês, Mês anterior, Últimos 3 meses, Personalizado) e categoria ("Todas" + categorias); filtro de tipo (todas/receitas/despesas); **busca** por descrição; **ordenação** por data ou valor.
- "Total de despesas" do filtro e **gráfico de barras mensais** (como no layout) com meses recentes.
- Lista "Transações recentes" agrupada por dia, com ícone da categoria, descrição, categoria e valor (despesa em rosa-vermelho com "-", receita em verde com "+"), paginação ou scroll infinito, "Ver todas".
- Botão flutuante/fixo "**+ Adicionar gasto**" abre modal de lançamento manual (também para receita): descrição, valor, tipo (receita/despesa), categoria, data (padrão hoje), forma de pagamento (Pix, Cartão de crédito, Cartão de débito, Dinheiro, Boleto, Transferência), observações opcionais.
- Estado vazio e skeleton. Resultado de busca vazio com sugestão.

### 08 Detalhes da transação `/gastos/:id`
Botão "< Voltar". Card de destaque com ícone, descrição, valor e etiqueta "Despesa" (ou "Receita"). Campos **editáveis**: Descrição, Categoria (select), Data (date picker, ex.: 02/11/2026), Valor, Forma de pagamento, Observações. Botão "Salvar alterações" (persiste, toast "Lançamento atualizado ✓") e botão contorno vermelho "Excluir lançamento" com **diálogo de confirmação**. Ao salvar/excluir, voltar à lista com dados atualizados.

### 09 Orçamento `/orcamento`
"Seu orçamento" / "Planeje seus limites com tranquilidade."
- Card "Orçamento mensal": valor total, "disponíveis" (restante) e percentual usado (ex.: 67%), com barra.
- Lista por categoria: ícone, "R$ gasto / R$ limite", % e barra com cor por faixa (normal, ≥80% atenção, ≥100% limite).
- Botão "+ Ajustar orçamento": modal para editar o total e os limites por categoria, com validação (soma dos limites pode exceder o total? **avisar** com mensagem gentil, sem bloquear).
- Botão **"✨ Sugerir limites"**: aplica a regra 8.4 e mostra pré-visualização antes de salvar (usuária confirma).
- Navegação entre meses (anterior/próximo) **[P1]**.
- **Alertas** ao cruzar 80% e 100%: banner na tela, card no dashboard e toast no momento do lançamento que causou o cruzamento. Texto: "Você chegou a 80% do limite de Alimentação este mês. Vamos reorganizar isso juntas?"

### 10 Metas `/metas`
"Suas metas" / "Pequenos passos, grandes conquistas."
- Cards com estrela/ícone, nome, "R$ acumulado de R$ meta", **anel de progresso** com % (como no layout: 60%, 35%, 20%) e, ao abrir, detalhes: valor restante, prazo, aporte mensal necessário, **previsão de conclusão** (8.5).
- Botão "+ Criar nova meta": nome, valor desejado, prazo, categoria (Reserva de emergência, Viagem, Compra, Quitar dívida, Curso, Pessoal).
- Por meta: **Editar**, **Excluir** (com confirmação), **Adicionar dinheiro**, **Retirar dinheiro** (valida saldo da meta), histórico de aportes (`goal_contributions`).
- Ao concluir 100%: celebração (confete leve, moeda dourada) e mensagem de conquista.
- Sugestão da meta de reserva com primeiro passo pequeno (1 semana de essenciais).

### 11 Aprender `/aprender` (Mockups `10-aprender.png` e `10b-trocar-trilha.png`)
Módulo **Desafio Piggy** (educação financeira gamificada no estilo Duolingo com identidade, tokens e tom PurplePiggy).
- **Top Bar Fixa:** Seletor de Trilha ativa com chevron que abre a gaveta de troca (`10b-trocar-trilha.png` com as 8 trilhas e suas barras de progresso), contador de Ofensiva (streak de dias seguidos com fogo), saldo de moedas Piggy douradas e vidas/corações.
- **Header da Unidade:** Card de unidade em vidro lilás com título, descrição de foco e botão para abrir o Caderno da Trilha (resumo em 1 min e glossário sem economês).
- **Trilha Sinuosa (Mapa de Níveis):** Caminho em zigue-zague com nós circulares táteis 3D (bisel inferior `border-b-[6px]`):
  - *Nó Concluído:* Círculo roxo com check branco e 3 estrelas de maestria douradas.
  - *Nó Ativo:* Pulso de brilho suave (`animate-pulseGlow`), balão flutuante "COMEÇAR!" e mascote `pig-welcome` apoiado ao lado.
  - *Nó Bloqueado:* Fundo lilás suave com cadeado discreto.
  - *Baú do Tesouro:* Porquinho-cofre que entrega 50 moedas Piggy ao desbloquear.
- **Desafio Rápido Diário:** Mini-atividade diária de 60 segundos para manter o streak ativo mesmo em dias corridos.

### 12 Lição `/aprender/:trilha/:licao` (Mockup `11-licao.png`)
Experiência de aprendizado gamificada em microdoses de 2 a 3 minutos com física tátil e feedback imediato:
- **Top Bar da Lição:** Botão fechar `X` à esquerda (com diálogo de saída acolhedor sem punição), barra de progresso contínua pílula (avança com elasticidade a cada resposta certa) e corações roxos.
- **Área de Exercício:**
  - Mascote `pig-idea` apresentando o enunciado com balão de fala acolhedor.
  - **Cards de Opção Chunky:** Botões de resposta com bisel 3D inferior de 4px (`border-b-[4px]`) que afundam fisicamente ao toque (`active:translate-y-[2px]`). Suporte a múltipla escolha rápida, cenários do cotidiano (Sim/Não), ordenação de prioridades e pareamento de conceitos.
- **Painel de Feedback Fixo (Drawer de Rodapé):**
  - *Acerto:* Gaveta verde suave (`#DCFCE7`), ícone check, mascote `pig-success`, celebração sonora/confete e botão chunky verde "CONTINUAR".
  - *Erro Construtivo:* Gaveta rosa suave (`#FCE7F3`), explicação didática sem termos difíceis, mascote `pig-retry` acolhedor e botão chunky roxo "ENTENDI" (a questão retorna ao final da lição para fixação).
- **Encerramento da Lição:** Tela de celebração com mascote `pig-trophy`, ganho de XP e moedas Piggy, avanço da Ofensiva e retorno suave ao mapa.

### 13 Simulador de compras `/simulador`
"Antes de comprar, veja como essa escolha pode impactar seu planejamento." (regras em 8.6)
- Card roxo "Quanto custa sua compra?" com valor grande e **slider** de R$ 50 a R$ 2.000 (+ campo numérico para valores fora da faixa), nome do produto, forma de pagamento (À vista, Cartão à vista, Parcelado) e número de parcelas (2–24) com juros opcionais.
- "O que esse valor pode representar?": cards com Reserva de emergência, Educação, Sonho pessoal (e as **metas reais** da usuária) mostrando quanto o valor avançaria cada uma.
- "Impacto no orçamento": "{x}% do saldo disponível" com barra; também % do orçamento mensal e da categoria.
- Comparação de valores (ideia do grupo): "Esse valor equivale a {x}% do seu gasto com mercado este mês" e outros equivalentes calculados com os **dados dela**.
- Simulação de economia: "Se guardasse esse valor por 12 meses, poderia chegar a ~R$ {y}", claramente rotulada **"Simulação simples e ilustrativa. Não é recomendação de investimento."**
- Botões úteis: "Aplicar numa meta" (cria aporte real após confirmação) e "Registrar como gasto".
- Tom: a decisão é da usuária; nunca "você não deveria comprar".

### 14 Perfil `/perfil`
"Seu perfil" / "Personalize sua experiência PurplePiggy." Foto (upload com recorte), nome, e-mail, botão "Editar". Seção **Minha conta** (itens com seta): Dados pessoais (nome, telefone, nascimento, saldo inicial), Preferências (tema claro/escuro **[P2]**, moeda pt-BR), Notificações (alertas de orçamento 80%/100%, metas, lembretes de estudo; salvas no perfil), Privacidade e segurança (alterar senha, política, excluir conta), Sobre o PurplePiggy (MVV, versão). Seção **Conexões financeiras**: "Open Finance · Contas e consentimentos". Botão contorno vermelho "Sair da conta". Se `is_demo`, mostrar botão "Restaurar dados demonstrativos".

### 15 Open Finance `/open-finance`
"Suas contas em um só lugar, com transparência e controle." Ver seção 10 (arquitetura e regras de honestidade). Estrutura do layout: card da instituição com status ("Ativa"), **Dados compartilhados** ("Você controla o que compartilhar e por quanto tempo.") com itens (Saldo e extrato; Dados de cartão) e "Compartilhamento autorizado", **Consentimento** ("A autorização pode ser revogada a qualquer momento."), botões "Gerenciar consentimento" e "Revogar acesso", e rodapé "🔒 Dados demonstrativos." quando em modo demo.

---

## 8. REGRAS DE NEGÓCIO (implementar em `src/lib/finance/` + testes unitários)

**8.1 Saldo disponível** = `profiles.initial_balance` + Σ receitas − Σ despesas (todo o histórico da usuária).

**8.2 Resumo do mês**: receitas e despesas do mês corrente; resultado = receitas − despesas. **Variação** (chip do saldo) = (resultado do mês − resultado do mês anterior) / |resultado do mês anterior|; se não houver mês anterior, ocultar o chip. Comparação de despesas: % de variação das despesas vs. mês anterior com texto neutro ("Você gastou 8% menos que no mês passado").

**8.3 Alertas de orçamento**: `ratio = gasto_categoria / limite`. `≥ 0.8` → atenção (dourado); `≥ 1.0` → limite atingido (rosa). Também para o orçamento total. Disparar toast ao cruzar o limiar na criação/edição de uma despesa.

**8.4 Orçamento inicial e sugestão**
- Pós-diagnóstico: orçamento total = renda mensal; limites iniciais estimados distribuindo os gastos essenciais declarados em Moradia 40%, Alimentação 30%, Transporte 15%, Saúde 10%, Cuidados com a família 5%, marcados como "estimativa inicial, ajuste quando quiser".
- **Sugestão com dados reais**: se houver ao menos 1 mês completo anterior com despesas, para cada categoria usar a **média dos últimos até 3 meses completos** × 1,10, arredondada para cima ao múltiplo de R$ 10. O total sugerido é a soma, limitado à renda declarada (avisar se exceder). Sem dados suficientes: mensagem "Registre mais alguns gastos e eu sugiro limites com base na sua realidade."

**8.5 Metas**: `percentual = saved/target`; `restante = target − saved`; `aporte_mensal_necessário = restante / meses_até_prazo` (mín. 1 mês); **previsão** = `restante / média_mensal_de_aportes_dos_últimos_3_meses` (só se houver aportes), exibindo data estimada; se não houver histórico, mostrar apenas o aporte necessário. Meta de reserva: primeiro passo = `essenciais_mensais / 4` ("uma semana de gastos essenciais"), depois 1 mês, 3 meses, 6 meses como degraus sugeridos.

**8.6 Simulador**
- `pct_saldo = valor / saldo` (se saldo ≤ 0, exibir "saldo indisponível" sem dividir por zero).
- `pct_orcamento = parcela_mensal / orçamento_total_do_mês` (usar renda declarada se não houver orçamento).
- Parcelado: `parcela = valor / n` sem juros; se informar taxa mensal `i`, `parcela = valor × i / (1 − (1+i)^−n)` e mostrar **total pago** e **juros pagos**.
- Aplicado a meta: novo percentual da meta = `(saved + valor) / target`.
- Economia ilustrativa: `FV = valor × (1 + 0,008)^12` com taxa editável (padrão 0,8% a.m.), sempre rotulada como simulação.
- Equivalências a partir dos dados da própria usuária (ex.: % do gasto mensal em Alimentação, em Transporte; número de dias de gasto médio diário).

**8.7 Diagnóstico → resumo**: `comprometimento = essenciais / renda`. Mensagens: ≤60% "Seus gastos essenciais cabem bem na renda. Dá para começar a guardar aos poucos."; 61–85% "Seus essenciais ocupam boa parte da renda, e isso é comum. Vamos organizar isso juntas, um passo de cada vez."; >85% "Seus essenciais ocupam quase toda a renda. Vamos olhar com carinho onde dá para respirar e proteger o que importa." Perfil "Estou com dívidas": incluir card informativo neutro sobre canais de renegociação gratuitos oficiais, **sem** o app negociar nada **[P1]**.

**8.8 Alerta de cartão [P2]**: se `card_alert_limit` definido, somar despesas com `credit_card` no mês e alertar em 80% e 100%, com link para a lição "Cartão de crédito".

---

## 9. CONTEÚDO EDUCATIVO (seed em `educational_contents`)

Linguagem simples, acolhedora, sem julgamento. Cada lição: resumo, texto (3 a 5 parágrafos curtos em Markdown), **exemplo prático** numérico, **dica**, tempo. Redigir completos; abaixo, trilhas, lições e pontos obrigatórios.

1. **Organização financeira** (Comece a entender seus hábitos) — (a) *Para onde vai meu dinheiro?*: anotar tudo por uma semana, sem julgar; separar essenciais, desejos e metas. (b) *Montando seu primeiro orçamento*: partir da renda, listar essenciais, definir tetos realistas; exemplo com renda de R$ 2.500.
2. **Juros sem mistério** (Entenda como os juros funcionam) — (a) *Juros: o que são?*: valores adicionais cobrados ou recebidos quando uma quantia é emprestada ou investida (texto do layout). (b) *Simples x compostos*: exemplo R$ 1.000 a 2% a.m. (simples: R$ 20 por mês; compostos: R$ 20,00, depois R$ 20,40…). Mostrar por que dívida cresce rápido.
3. **Cartão de crédito** — (a) *Como o cartão realmente funciona*: fatura, fechamento, vencimento, limite x conforto. (b) *O perigo do pagamento mínimo e do rotativo*: o que sobra vira dívida com juros altos; como sair com calma. Dica: acompanhar o limite com que você se sente confortável.
4. **Reserva de emergência** — (a) *Por que ter uma reserva*: só 19% das mulheres têm (Serasa); imprevistos sem dívida. (b) *Começando pequeno*: primeiro passo de uma semana de essenciais; degraus de 1, 3 e 6 meses; aportes de R$ 20 contam.
5. **Planejamento financeiro** — (a) *Metas com nome e prazo*: dividir o valor pelo número de meses. (b) *Revisão mensal de 10 minutos*: o que funcionou, o que ajustar, sem culpa.
6. **Consumo consciente** — (a) *Desejo, necessidade e impulso*: regra das 48 horas. (b) *Perguntas antes de comprar*: preciso? cabe? o que deixo de fazer? (conecta ao simulador).
7. **Golpes financeiros** — (a) *Sinais de alerta*: pressa, promessa fácil, links por mensagem, pedido de código. (b) *Boleto falso e golpes de Pix*: conferir beneficiário, nunca compartilhar senhas/códigos, ligar só nos canais oficiais do banco.
8. **Economia doméstica** — (a) *Cuidando da casa sem se sobrecarregar*: gastos invisíveis da família (escola, remédios) e como dar visibilidade a eles. (b) *Pequenos ajustes que somam*: cardápio semanal, comparar preços, revisar assinaturas, envolver a família nas decisões.

Todo conteúdo citando números deve atribuir a fonte (ex.: "Serasa, 2026") e evitar promessas de resultado.

---

## 10. OPEN FINANCE — ARQUITETURA E HONESTIDADE

**Princípio:** **não simular uma conexão bancária real como se fosse verdadeira. Não inventar saldos bancários reais.**

- Criar a camada `OpenFinanceProvider` (interface) com: `listInstitutions()`, `createConsent(scopes, expiresAt)`, `getConsentStatus(id)`, `revokeConsent(id)`, `fetchAccounts(id)`, `fetchTransactions(id, range)`.
- Implementações: **`DemoProvider`** (padrão, `VITE_OPEN_FINANCE_PROVIDER=demo`) e **stub documentado** para um provedor autorizado (ex.: Pluggy ou Belvo). Chamadas reais devem passar por **Supabase Edge Function**, nunca com segredos no front.
- Sem credenciais de provedor: modo **demonstrativo** com faixa visível "Dados demonstrativos" em todas as telas da área. Instituições listadas são fictícias ("Banco Exemplo"), nunca nomes de bancos reais conectados.
- No modo demo, "Conectar instituição" cria `bank_connections` + `open_finance_consents` com `is_demo=true`, escopos escolhidos, validade de até 12 meses e **não** importa saldo real; no máximo gera algumas transações marcadas `source='demo'` para demonstração.
- Mostrar sempre: status (Pendente, Ativa, Revogada, Expirada), escopos compartilhados em linguagem simples, data de autorização e **prazo**, e botões "Gerenciar consentimento" e "Revogar acesso" (revoga de verdade no banco, atualiza status e remove o acesso demonstrativo).
- Texto de transparência (LGPD): quais dados, para quê, por quanto tempo, como cancelar.
- Documentar no README os passos para plugar um provedor real e o que muda (Edge Function, webhooks, mapeamento para `transactions` com `source='open_finance'`).

---

## 11. MODO DEMONSTRAÇÃO (apresentação acadêmica)

- Botão "Ver modo demonstração" (boas-vindas e login) usa **login anônimo do Supabase** (habilitar "Anonymous sign-ins") e chama `seed_demo_data()`: cada visitante demo recebe **sua própria** conta isolada, marcada `is_demo=true`, sem tocar em dados de usuárias reais. Alternativa documentada: conta demo fixa.
- Usuária fictícia **"Ana Oliveira"** (`ana@email.com` apenas visual) com banner permanente "Dados fictícios de demonstração".
- Conjunto fictício coerente e rico: ~6 meses de transações (salário R$ 3.200, aluguel, mercado, transporte, farmácia, escola/filhos em Cuidados com a família, lazer, compras), orçamento total R$ 3.000 com limites por categoria (alguns em 80%+ para mostrar alertas), metas (Reserva de emergência R$ 6.000/R$ 10.000; Viagem dos sonhos R$ 1.750/R$ 5.000; Novo notebook R$ 800/R$ 4.000), progresso parcial nas trilhas, conexão Banco Exemplo demonstrativa. Datas **relativas à data atual**, para os gráficos sempre parecerem vivos.
- Todas as funções permanecem **interativas** (criar, editar, excluir, aportar).
- Botão "Restaurar dados demonstrativos" (perfil) chama `reset_demo_data()`.
- Opção de **converter a demo em conta real** (criar e-mail/senha) **[P2]**.

---

## 12. TOM DE VOZ E MICROCOPY

Acolhedor, simples, autônomo, sem julgamento. Frases-base: "Você está construindo uma relação mais saudável com seu dinheiro." / "Pequenos passos também são conquistas." / "Seu planejamento está evoluindo." / "Vamos organizar isso juntas?" / "Seus dados são tratados com cuidado."

**Proibido:** culpar ("você gastou demais", "erro", "irresponsável"), linguagem de ameaça, urgência artificial, "corte supérfluos", emojis de reprovação.
**Padrão de erro:** diz o que aconteceu e como resolver, sem pedir desculpas em excesso ("Não conseguimos salvar agora. Confira sua conexão e tente de novo.").
**Padrão de vazio:** convite à ação com mascote.
**Botões:** verbo + objeto ("Salvar alterações", "Criar minha conta"); mesmo nome da ação na confirmação ("Lançamento salvo ✓").

---

## 13. FORA DE ESCOPO (NÃO IMPLEMENTAR)

Pagamentos, Pix/transferências, empréstimos e crédito, renegociação de dívidas (apenas informar canais oficiais, **[P1]** no diagnóstico), assistente de IA/chat, plano pago, comunidade/desafios coletivos, modo offline, mapa de dívidas e simulador de juros do cartão (versão 2). Não adicionar anúncios, ofertas de crédito nem rastreadores de terceiros.

---

## 14. QUALIDADE, TESTES E ACEITE

**Globais:** navegação funcional entre todas as telas; loading states e skeletons; toasts de sucesso/erro; modais; confirmação de exclusão; formulários validados; estados vazios; tratamento de erro; logout; sessão persistente; responsivo (celular, tablet, desktop); nenhum botão decorativo; sem erros no console.

**Testes unitários (Vitest)**: saldo, variação, alertas 80/100, sugestão de orçamento, previsão de meta, simulador (incluindo saldo ≤ 0 e juros), resumo do diagnóstico.

**Teste de segurança**: duas usuárias, comprovar isolamento por RLS em todas as tabelas; tentar inserir `user_id` alheio e confirmar bloqueio; `reset_demo_data()` falha para usuária não demo.

**Fluxos obrigatórios a percorrer no navegador (com screenshots)**
1. Splash → Boas-vindas → Cadastro (usuária nova) → Diagnóstico → resumo → Dashboard vazio e elegante.
2. Adicionar receita e várias despesas → dashboard atualiza (saldo, gráficos, painel, alertas).
3. Editar e excluir transação (com confirmação) → tudo recalcula.
4. Filtrar, buscar e ordenar em Gastos.
5. Definir orçamento, cruzar 80% e 100% e ver alertas; usar "Sugerir limites".
6. Criar meta, aportar, retirar, editar, excluir, concluir (celebração).
7. Fazer uma trilha: abrir lição, concluir, próxima, progresso persistido após recarregar.
8. Simulador: mover slider, trocar pagamento, ver impactos e "Aplicar numa meta".
9. Perfil: editar dados, avatar, notificações, trocar senha, logout, login novamente (sessão e dados persistem).
10. Open Finance demo: conectar, ver consentimento, revogar.
11. Recuperação de senha.
12. Modo demonstração completo + "Restaurar dados demonstrativos", e confirmar que **contas reais ficam intactas**.
13. Responsividade em 375px, 768px e 1280px.

**Definição de pronto:** todos os P0 funcionando de ponta a ponta, layout fiel ao `LayoutDoApp.png`, mascote oficial intacto, RLS provada, demo funcionando, README completo.

---

## 15. FASES DE EXECUÇÃO

1. **Fundação**: projeto Vite+TS, Tailwind/shadcn com tokens, fonte Nunito, assets, `Logo`, `Mascot`, layout/rotas, bottom nav, componentes base.
2. **Banco e auth**: migrations, RLS, triggers, seed de categorias e lições, cadastro/login/recuperação, guards, perfil automático. **Teste de RLS.**
3. **Núcleo financeiro [P0]**: transações (CRUD, filtros), diagnóstico, dashboard, orçamento, metas — com regras em `lib/finance` e testes.
4. **Educação e simulador [P0]**.
5. **Perfil, Open Finance (demo) e modo demonstração [P0/P1]**.
6. **Polimento**: animações, skeletons, estados vazios, acessibilidade, responsividade, microcopy, revisão tela a tela contra o layout.
7. **QA e entrega**: roteiro da seção 14, correções, README, deploy.

---

## 16. ENTREGÁVEIS

- Código organizado e tipado, sem segredos versionados.
- `supabase/migrations/*.sql` + `seed.sql` + funções RPC/Edge.
- `.env.example` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPEN_FINANCE_PROVIDER=demo`.
- **README.md** com: visão geral; pré-requisitos; criar projeto Supabase; rodar migrations (`supabase db push`); habilitar login anônimo e desativar confirmação de e-mail para a demo; variáveis de ambiente; `npm install` / `npm run dev` / `npm run test`; como criar e usar a conta demo; **publicação na Vercel** (variáveis, build `vite build`, rewrites SPA); como plugar um provedor de Open Finance real; limitações conhecidas.
- Aplicação publicada (URL) e relatório final com screenshots dos fluxos testados e lista de itens P2 não entregues.

**Objetivo final:** um app que pareça um produto fintech profissional, com identidade própria, em que minha namorada consiga, durante a apresentação, cadastrar uma usuária, registrar gastos, criar metas, ver os gráficos se atualizarem, usar o simulador, estudar uma lição e mostrar a navegação completa, tudo de verdade e sem travar.

**O nome é PurplePiggy. A mascote e a logo oficiais são obrigatórias e não podem ser recriadas ou modificadas.**
