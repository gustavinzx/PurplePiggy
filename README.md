# 🐷 PurplePiggy — Gestão e Educação Financeira Feminina

> **Aplicativo web mobile-first de gestão e educação financeira para mulheres adultas.**  
> Criado com foco na autonomia, empatia, zero julgamento e clareza visual, fiel ao Brandbook e às 15 telas originais do protótipo acadêmico.

[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-yellow.svg)](https://vitest.dev/)

---

## 🎯 Missão, Visão e Valores (MVV)

- **Missão:** Capacitar mulheres a conquistarem independência e tranquilidade financeira através de uma ferramenta simples, acolhedora e educativa.
- **Visão:** Ser a principal referência brasileira em finanças descomplicadas para mulheres, desmistificando o orçamento e incentivando a construção de patrimônio sem culpa.
- **Valores:**
  - **Empatia e Zero Julgamento:** Nenhum gasto é tratado como "erro" ou acompanhado de mensagens de culpa.
  - **Transparência Absoluta:** O consentimento e a privacidade de dados (Open Finance e LGPD) estão sempre em primeiro lugar.
  - **Educação Contínua:** Aprender finanças deve ser prático, progressivo e integrado ao dia a dia.
  - **Acolhimento da Realidade Feminina:** Categorização sensível à rotina real (ex: categoria dedicada *"Cuidados com a família"*).

---

## 📱 As 15 Telas Entregues

| # | Rota | Descrição e Funcionalidades |
|---|------|-----------------------------|
| **1** | `/` | **Splash:** Apresentação da marca, mascote oficial em destaque e transição suave. |
| **2** | `/boas-vindas` | **Boas-vindas:** Onboarding com proposta de valor, botão para cadastro e atalho para demonstração. |
| **3** | `/cadastrar` | **Cadastro:** Registro seguro com e-mail e senha, validação em tempo real e criação de perfil. |
| **4** | `/entrar` | **Login:** Acesso com e-mail/senha, recuperação de senha e botão de 1 clique para Modo Demonstração. |
| **5** | `/diagnostico` | **Diagnóstico Financeiro:** Questionário interativo de 5 perguntas com recomendação de perfil personalizada. |
| **6** | `/inicio` | **Dashboard / Início:** Saldo disponível em destaque, anel de progresso orçamentário, atalhos rápidos e últimas transações. |
| **7** | `/gastos` | **Gastos / Transações:** Listagem cronológica, busca, filtro por categoria (incluindo "Cuidados com a família"), nova transação via modal e resumo do mês. |
| **8** | `/gastos/:id` | **Detalhe do Gasto:** Exibição detalhada, edição e exclusão de transação com feedback em tempo real. |
| **9** | `/orcamento` | **Planejamento Orçamentário:** Distribuição inteligente de limites por categoria, barras de progresso coloridas e alertas preventivos. |
| **10** | `/metas` | **Metas Financeiras:** Criação de sonhos/objetivos, cálculo automático de prazo, aporte de depósitos com animação e barra de avanço. |
| **11** | `/aprender` | **Trilhas de Aprendizado:** 8 trilhas educativas com mascote vestindo capelo de formatura e progresso por lição. |
| **12** | `/aprender/:track/:lesson` | **Lição Interativa:** Conteúdo didático formatado, mascote com lâmpada de ideias, quiz de fixação e botão de conclusão. |
| **13** | `/simulador` | **Simulador "Comprar Agora ou Esperar?":** Avalia impacto de compras à vista ou parceladas no orçamento mensal e calcula custo de oportunidade. |
| **14** | `/perfil` | **Perfil e Configurações:** Edição de dados pessoais, foto/avatar, visualização de diagnóstico, botão de redefinir dados demo e logout. |
| **15** | `/open-finance` | **Open Finance:** Gestão transparente de instituições conectadas, escopos de compartilhamento ativos e revogação imediata com 1 clique. |

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Roteamento & Estado:** React Router DOM v6, TanStack Query (React Query) v5.
- **Backend & Database:** Supabase (PostgreSQL 15), Row Level Security (RLS) habilitado em 100% das tabelas.
- **Testes:** Vitest para testes unitários de regras de negócio financeiras.
- **Design System:** Mobile-first (viewport 360–480px centralizado em desktops com fundo acolhedor `#F8F6FC`), gradientes da paleta oficial PurplePiggy (`#7F00FF` a `#E100FF`).

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Pré-requisitos
- Node.js 18+ instalado.
- Conta e projeto ativo no [Supabase](https://supabase.com).

### 2. Clonar e Instalar Dependências
```bash
git clone https://github.com/seu-usuario/purple-piggy.git
cd purple-piggy
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Preencha com as credenciais do seu projeto Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_OPEN_FINANCE_PROVIDER=demo
```

### 4. Executar os Testes Unitários
```bash
npm run test
```
*Garante a validação das fórmulas de saldo, diagnóstico, projeção de metas e cálculo do simulador de compras.*

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5175/` (ou a porta exibida no terminal).

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

O banco de dados foi estruturado com isolamento estrito via **Row Level Security (RLS)**:

- `profiles`: Cadastro do usuário, nome, avatar, renda mensal e perfil do diagnóstico.
- `categories`: Categorias padrão do sistema (Alimentação, Moradia, Transporte, Lazer, Cuidados com a família, Saúde, etc.) e personalizadas.
- `transactions`: Lançamentos de receitas e despesas vinculados à categoria.
- `budgets`: Tetos orçamentários mensais definidos por categoria.
- `financial_goals` & `goal_contributions`: Metas de poupança/sonhos e histórico de depósitos com trigger de atualização automática de saldo acumulado.
- `financial_diagnosis`: Respostas do questionário inicial e pontuação calculada.
- `educational_contents` & `educational_progress`: 16 lições didáticas divididas em 8 trilhas e rastreamento de conclusão por usuária.
- `bank_connections` & `open_finance_consents`: Registro transparente de conexões simuladas e consentimentos ativos.

### Funções RPC Incluídas:
- `seed_demo_data(user_id)`: Cria dados ricos para o usuário de demonstração.
- `reset_demo_data(user_id)`: Restaura os dados da demonstração para o estado inicial a qualquer momento pelo app.

---

## 👩‍💼 Modo Demonstração (Ana Oliveira)

Para fins de avaliação de bancas acadêmicas ou testes imediatos sem necessidade de preencher formulários:

1. Na tela de boas-vindas ou na tela de login, clique em **"Ver modo demonstração (Ana Oliveira)"**.
2. O app autentica automaticamente a usuária de teste com dados pré-carregados:
   - **E-mail:** `ana@email.com`
   - **Perfil:** Ana Oliveira, renda de R$ 4.200/mês.
   - **Histórico:** Transações dos últimos 5 meses categorizadas.
   - **Metas:** Reserva de Emergência (62% atingida) e Viagem com os Filhos.
   - **Open Finance:** Conexão de demonstração ativa com "Banco Exemplo".
3. A qualquer momento, na tela de **Perfil**, é possível clicar em **"Restaurar Dados Demo"** para reiniciar o cenário.

---

## 🌐 Deploy na Vercel

O projeto está pronto para deploy contínuo na Vercel:

1. Conecte o repositório Git na plataforma Vercel.
2. Defina as Variáveis de Ambiente no painel da Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPEN_FINANCE_PROVIDER=demo`
3. O arquivo `vercel.json` já configurado na raiz garante o roteamento SPA (evitando erros 404 em rotas diretas):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
4. Clique em **Deploy**.

---

## 🔒 Open Finance e Privacidade

Conforme especificado na concepção do produto:
- O módulo de Open Finance atual opera em modo `demo` transparente com indicador visual permanente: *"Dados demonstrativos"*.
- **Pronto para Integração Real:** A arquitetura desacoplada em `src/lib/openFinance.ts` permite a substituição do provider mock por conectores certificados pelo Banco Central (como **Pluggy** ou **Belvo**) apenas alterando as chaves de API e webhooks, mantendo a interface e a governança de consentimento da usuária inalteradas.

---

## 💜 Mascote Oficial & Design

O mascote oficial da **PurplePiggy** simboliza acolhimento, proteção e prosperidade:
- Preservado integralmente nos formatos de alta resolução (`pig-oficial.png` e `pig-oficial-512.png`).
- Acessórios de contexto (como o capelo de formatura e a lâmpada de reflexão) são renderizados dinamicamente via overlays vetoriais sem adulterar a imagem base.

---

## 📄 Licença e Créditos

Projeto acadêmico desenvolvido com dedicação para empoderamento financeiro feminino.  
Design e identidade visual baseados no Brandbook oficial da PurplePiggy.
# PurplePiggy
