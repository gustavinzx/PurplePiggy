import difflib
import re

with open('PROMPT_PURPLEPIGGY_ANTIGRAVITY.md', 'r', encoding='utf-8') as f:
    old_content = f.read()

# Let's prepare new content by modifying the necessary sections:

# 1. Remove 💜 from title
new_content = old_content.replace("# 💜 PURPLEPIGGY — PROMPT MESTRE DE DESENVOLVIMENTO", "# PURPLEPIGGY — PROMPT MESTRE DE DESENVOLVIMENTO")

# 2. Section 2 mascot rule adjustment
old_mascot_rule = """- Quando o layout mostrar o porquinho em outra pose (segurando moeda, com capelo de formatura, com lâmpada), **use o asset oficial** na posição indicada e, se desejar o efeito, componha adereços **ao redor** dele com SVG/CSS (capelo, lâmpada, brilhos). Nunca altere o porquinho em si."""
new_mascot_rule = """- As poses do mascote são imagens prontas em `public/assets/mascot/` (consultar `mascotes/manifest.json`). Proibido recriar ou compor o mascote em SVG/CSS."""
new_content = new_content.replace(old_mascot_rule, new_mascot_rule)

# Remove "ou trocar por emoji" in line 69
new_content = new_content.replace("distorcer, recolorir ou trocar por emoji.", "distorcer, recolorir ou trocar por outras ilustrações.")

# 3. Section 3: Replace entire section 3 with a single line pointing to design/tokens.md and design/telas/
# Find section 3 start and section 4 start:
sec3_pattern = r"(## 3\. IDENTIDADE VISUAL E DESIGN SYSTEM\n\n)[\s\S]*?(\n## 4\. STACK E ARQUITETURA)"
sec3_replacement = r"\1Consulte os tokens oficiais em `design/tokens.md` e as referências visuais de cada tela em `design/telas/`.\n\2"
new_content = re.sub(sec3_pattern, sec3_replacement, new_content)

# 4. Section 4 adjustments (remove shadcn/ui and Lucide React):
new_content = new_content.replace("- **Tailwind CSS + shadcn/ui** (customizados com os tokens acima)", "- **Tailwind CSS** (customizado com os tokens de design/tokens.md)")
new_content = new_content.replace("- **Recharts** (gráficos), **Lucide React** (ícones), **Sonner** (toasts), **date-fns** (pt-BR)", "- **Recharts** (gráficos), **Sonner** (toasts), **date-fns** (pt-BR)")
new_content = new_content.replace("├─ components/ (ui/, Logo, Mascot, ProgressRing, BottomNav, EmptyState, Skeletons, ConfirmDialog)", "├─ components/ (Logo, Mascot, ProgressRing, BottomNav, EmptyState, Skeletons, ConfirmDialog)")

# 5. Section 5 check: replace checkmarks in seed text
new_content = new_content.replace("Moradia✔, Alimentação✔, Transporte✔, Saúde✔, Educação, Lazer, Compras, Cuidados com a família✔, Outros.", "Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Compras, Cuidados com a família, Outros (com flag is_essential nas categorias essenciais).")

# 6. Section 7: Replace with lean specification containing only: rota, comportamento, dados usados e regras de negócio
sec7_pattern = r"(## 7\. TELAS \(15\) — FIEL AO LAYOUT, COM COMPORTAMENTO REAL\n\n)[\s\S]*?(\n## 8\. REGRAS DE NEGÓCIO)"

new_sec7 = """## 7. TELAS (15) — ESPECIFICAÇÃO FUNCIONAL E REGRAS DE NEGÓCIO

Todas as rotas, comportamentos, dados persistidos e regras de cada tela estão descritos abaixo. A aparência e os elementos visuais devem seguir estritamente as imagens correspondentes em `design/telas/` e os tokens em `design/tokens.md`.

### 01 Splash (`/`)
- **Rota:** `/`
- **Comportamento:** Verifica se há sessão ativa e status do perfil. Se houver sessão com diagnóstico pendente, redireciona para `/diagnostico`; se o diagnóstico já foi concluído, redireciona para `/inicio`. Sem sessão ativa, apresenta botões de início e login.
- **Dados usados:** Sessão em `auth.users` e flag `profiles.diagnostic_done`.
- **Regras de negócio:** Rota pública de entrada.

### 02 Boas-vindas (`/boas-vindas`)
- **Rota:** `/boas-vindas`
- **Comportamento:** Apresentação introdutória dos pilares do produto (controle de gastos, metas no seu ritmo, educação financeira). Ações para criar conta (`/cadastrar`), acessar conta existente (`/entrar`) ou explorar o modo demonstração.
- **Dados usados:** Nenhum dado persistido; aciona `signInDemo()` ao solicitar demonstração.
- **Regras de negócio:** Inicia sessão anônima isolada com os dados fictícios da usuária demonstrativa Ana Oliveira.

### 03 Cadastro (`/cadastrar`)
- **Rota:** `/cadastrar`
- **Comportamento:** Formulário de registro com Nome completo, E-mail, Senha e Confirmação de senha. Validação dos campos com feedback inline de erro e feedback visual de carregamento.
- **Dados usados:** Criação de conta em `auth.users`; trigger do banco cria o registro correspondente em `profiles`.
- **Regras de negócio:** Senha com no mínimo 8 caracteres; senha e confirmação devem ser idênticas. Após criação bem-sucedida, redireciona automaticamente para `/diagnostico`.

### 04 Login (`/entrar`)
- **Rota:** `/entrar`
- **Comportamento:** Formulário de autenticação com E-mail e Senha, controle para alternar visibilidade da senha, link para recuperação de senha (`/redefinir-senha`) e botão secundário para cadastro.
- **Dados usados:** Autenticação via Supabase Auth (`auth.users`) e consulta a `profiles`.
- **Regras de negócio:** Tratamento acolhedor de credenciais inválidas; redireciona para `/diagnostico` se o diagnóstico não estiver feito, ou para `/inicio` caso concluído.

### 05 Diagnóstico (`/diagnostico`)
- **Rota:** `/diagnostico`
- **Comportamento:** Wizard de 3 etapas com perguntas sobre sentimento financeiro, renda mensal, gastos essenciais, reserva financeira e objetivo principal. Apresenta resumo financeiro ao concluir e direciona para o painel principal.
- **Dados usados:** Persistência em `financial_diagnosis`, atualização de `profiles.diagnostic_done = true` e `profiles.initial_balance`.
- **Regras de negócio:** Cálculo de comprometimento da renda segundo regra 8.7; geração automática do orçamento inicial em `budgets` (regra 8.4) e criação da meta "Reserva de emergência" em `financial_goals` com primeiro passo correspondente a 1 semana de essenciais (essenciais / 4). Permite pular mantendo `diagnostic_done = false`.

### 06 Dashboard (`/inicio`)
- **Rota:** `/inicio`
- **Comportamento:** Painel principal com visão consolidada da usuária autenticada. Permite ocultar/mostrar saldo (persistido no perfil), navegar para detalhes de gastos, acessar gerenciamento de metas, abrir trilhas educativas e acionar atalhos de transação (+ Gasto, + Receita) e simulador.
- **Dados usados:** `profiles.initial_balance` e `profiles.hide_balance`, agregação de `transactions` do mês corrente e anterior, metas ativas em `financial_goals`, meta de categoria `emergency`, e limites do mês em `budgets`.
- **Regras de negócio:** Regra 8.1 (saldo disponível), regra 8.2 (resumo mensal e variação percentual vs. mês anterior), regra 8.3 (alerta ao cruzar 80% e 100% do orçamento). Invalidação reativa de queries após inclusão, edição ou exclusão de transações e metas.

### 07 Gastos (`/gastos`)
- **Rota:** `/gastos`
- **Comportamento:** Consulta e listagem de transações. Filtros por período (mês atual, mês anterior, últimos 3 meses, personalizado), por categoria e por tipo (todas/receitas/despesas). Campo de busca textual por descrição e ordenação por data ou valor. Ação para abrir modal de inclusão de gasto ou receita.
- **Dados usados:** Consulta e filtragem em `transactions`, junção com `categories`.
- **Regras de negócio:** Totalização de despesas no período filtrado; inclusão manual com campos obrigatórios validados (valor positivo, descrição, categoria, data e forma de pagamento); disparo de alerta caso a despesa atinja os limiares de orçamento.

### 08 Detalhes da transação (`/gastos/:id`)
- **Rota:** `/gastos/:id`
- **Comportamento:** Visualização detalhada e edição dos campos do lançamento: descrição, categoria, data, valor, forma de pagamento e observações. Ação para salvar alterações e ação de exclusão protegida por confirmação.
- **Dados usados:** Leitura, atualização e exclusão em `transactions` onde `id = :id` e `user_id = auth.uid()`.
- **Regras de negócio:** Ao salvar ou excluir, recalcula o saldo disponível e limites do orçamento e redireciona de volta para `/gastos`.

### 09 Orçamento (`/orcamento`)
- **Rota:** `/orcamento`
- **Comportamento:** Acompanhamento do teto mensal global e por categoria. Exibição do valor total, gasto acumulado, valor disponível restante e porcentagem consumida. Modal de ajuste manual de limites e ação de sugestão automática de limites.
- **Dados usados:** Tabela `budgets` para o mês de referência e soma de despesas em `transactions` agrupadas por categoria.
- **Regras de negócio:** Regra 8.3 (alertas por categoria e geral em 80% e 100%); regra 8.4 (cálculo de sugestão com base na média dos últimos até 3 meses completos com margem de 10%, arredondada para cima em múltiplos de R$ 10).

### 10 Metas (`/metas`)
- **Rota:** `/metas`
- **Comportamento:** Listagem de metas financeiras em andamento e concluídas. Modais para criar nova meta, realizar aporte de dinheiro (depósito), efetuar retirada de dinheiro, editar prazos/valores e excluir meta.
- **Dados usados:** Tabela `financial_goals` e histórico em `goal_contributions`.
- **Regras de negócio:** Regra 8.5; trigger no banco atualiza `saved_amount` a cada aporte/retirada; validação impede retirada superior ao saldo acumulado; registro de `completed_at` ao atingir 100% da meta.

### 11 Aprender (`/aprender`)
- **Rota:** `/aprender`
- **Comportamento:** Trilha de formação financeira com 8 módulos estruturados. Exibição do progresso de conclusão de cada módulo e card de ofensiva diária de aprendizado.
- **Dados usados:** Consulta a `educational_contents` e consolidação de conclusões em `educational_progress`.
- **Regras de negócio:** Cálculo percentual de conclusão por trilha baseado na proporção de lições finalizadas pela usuária.

### 12 Lição (`/aprender/:trilha/:licao`)
- **Rota:** `/aprender/:trilha/:licao`
- **Comportamento:** Leitura do conteúdo teórico, exemplo prático e recomendação. Seção de desafio rápido (quiz de fixação) com validação de resposta, explicação didática e opção de tentar novamente em caso de erro. Ação para concluir a lição e botão para avançar para a próxima.
- **Dados usados:** Leitura de `educational_contents`, gravação em `educational_progress`.
- **Regras de negócio:** A conclusão da lição é habilitada mediante acerto do quiz; grava a data de conclusão em `educational_progress` evitando duplicatas.

### 13 Simulador de compras (`/simulador`)
- **Rota:** `/simulador`
- **Comportamento:** Simulação prévia do impacto financeiro de uma compra. Ajuste do valor desejado, forma de pagamento (à vista ou parcelado) e número de parcelas com taxa de juros opcional. Apresenta o peso percentual frente ao saldo disponível e orçamento do mês, além da equivalência do valor se aplicado nas metas ativas. Botões para aplicar o valor simulado em uma meta ou registrá-lo como despesa.
- **Dados usados:** Leitura de `profiles.initial_balance`, despesas de `transactions`, limites de `budgets` e metas em `financial_goals`.
- **Regras de negócio:** Regra 8.6; cálculo de parcelas com fórmula de juros compostos; tratamento para evitar divisão por zero em saldos nulos ou negativos; ação de aplicar em meta gera registro em `goal_contributions`.

### 14 Perfil (`/perfil`)
- **Rota:** `/perfil`
- **Comportamento:** Gerenciamento dos dados cadastrais (nome, telefone, saldo inicial), preferências de notificação (alertas de orçamento, metas, estudos), links para privacidade e segurança, informações institucionais, área de Open Finance e ação para desconectar da conta. No modo demonstrativo, botão para restaurar os dados de teste originais.
- **Dados usados:** Leitura e edição em `profiles`, bucket de armazenamento `avatars`, autenticação em `auth.users`.
- **Regras de negócio:** Atualização protegida por RLS; restauração de dados demo aciona `reset_demo_data()` e opera exclusivamente em contas com `is_demo = true`.

### 15 Open Finance (`/open-finance`)
- **Rota:** `/open-finance`
- **Comportamento:** Apresentação da instituição bancária conectada, exibição dos escopos de dados autorizados (saldo, extrato, cartões) e opções de gerenciamento de consentimento ou revogação imediata.
- **Dados usados:** Tabelas `bank_connections` e `open_finance_consents`.
- **Regras de negócio:** Validade do consentimento com prazo máximo de 12 meses conforme regulamentação do Banco Central; revogação altera status para `revoked` e encerra a sincronização; operação em modo demonstrativo conforme seção 10.
"""

new_content = re.sub(sec7_pattern, new_sec7 + r"\2", new_content)

# 7. Section 12 adjustments (remove emoji mention and checkmark):
new_content = new_content.replace("emojis de reprovação.", "expressões de reprovação.")
new_content = new_content.replace('mesmo nome da ação na confirmação ("Lançamento salvo ✓").', 'mesmo nome da ação na confirmação ("Lançamento salvo com sucesso").')

# 8. Section 15 adjustment (remove shadcn):
new_content = new_content.replace("Tailwind/shadcn com tokens", "Tailwind com tokens")

# Save proposed new content to scratch file
with open('scripts/PROMPT_PURPLEPIGGY_PROPOSED.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

# Generate unified diff
diff = list(difflib.unified_diff(
    old_content.splitlines(keepends=True),
    new_content.splitlines(keepends=True),
    fromfile='a/PROMPT_PURPLEPIGGY_ANTIGRAVITY.md',
    tofile='b/PROMPT_PURPLEPIGGY_ANTIGRAVITY.md',
    n=3
))

diff_text = ''.join(diff)
with open('scripts/prompt_diff.patch', 'w', encoding='utf-8') as f:
    f.write(diff_text)

print(f"Diff lines generated: {len(diff)}")
