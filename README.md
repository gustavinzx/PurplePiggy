# 🐷 PurplePiggy — Gestão e Educação Financeira Feminina

> **Aplicativo nativo Android (Capacitor) e Web mobile-first de gestão financeira e aprendizagem gamificada para mulheres.**  
> Desenvolvido com arquitetura zero-julgamento, transparência de dados, conformidade LGPD e design system acolhedor.

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119eff.svg)](https://capacitorjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-78%20passed-22c55e.svg)](https://vitest.dev/)

---

## 📋 Sumário
1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Pré-requisitos](#-pré-requisitos)
3. [Configuração do Backend (Supabase)](#-configuração-do-backend-supabase)
4. [Configuração Local (.env)](#-configuração-local-env)
5. [Rodando em Desenvolvimento](#-rodando-em-desenvolvimento)
6. [Testes e Verificação de Qualidade](#-testes-e-verificação-de-qualidade)
7. [Build Web e Sincronização Nativa (Capacitor)](#-build-web-e-sincronização-nativa-capacitor)
8. [Geração do APK e Pacote Android (AAB)](#-geração-do-apk-e-pacote-android-aab)
9. [Roteiro de Testes Ponta a Ponta (360×800)](#-roteiro-de-testes-ponta-a-ponta-360800)
10. [Deploy na Vercel (Opcional)](#-deploy-na-vercel-opcional)
11. [Segurança, LGPD e Limitações Conhecidas](#-segurança-lgpd-e-limitações-conhecidas)

---

## 🎯 Sobre o Projeto

O **PurplePiggy** combina gestão orçamentária sensível à rotina real com um módulo de educação financeira em formato de trilhas interativas (Desafio Piggy), com mecânica de aprendizado gentil (sem frustração ou paywalls punitivos) e conformidade integral com a LGPD:
- **Gestão Financeira:** Controle de receitas, despesas categorizadas, planejamento com alertas preventivos (80% e 100%) e metas com depósitos acumulados.
- **Aprendizado Gamificado (Desafio Piggy):** Trilhas educativas com lições em etapas, fila de repetição espaçada, desafios rápidos diários e mascotes ilustrados oficiais.
- **Privacidade & LGPD:** O ranking semanal opera sob **opt-in voluntário** com apelido anônimo; nomes reais, fotos e saldos nunca são expostos a terceiros.
- **Modo Demonstração Isolado:** Cada visitante pode explorar o cenário completo de "Ana Oliveira" com um clique através de autenticação anônima isolada, sem misturar dados entre usuários.

---

## 💻 Pré-requisitos

Para rodar ou compilar o projeto em seu ambiente:
- **Node.js:** versão 18.x ou superior (recomendado Node 20 LTS ou 22).
- **npm:** versão 9+ ou 10+.
- **Git** instalado.
- **Para compilar o App Android nativo (APK/AAB):**
  - Android Studio (versão Hedgehog ou mais recente) com Android SDK Platform 34+ e Build Tools.
  - JDK 21 configurado (`JAVA_HOME`).

---

## ☁️ Configuração do Backend (Supabase)

### 1. Criar Projeto
Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto (ex: `purplepiggy-prod`).

### 2. Aplicar as Migrations do Banco
Com a CLI do Supabase instalada:
```bash
supabase link --project-ref seu-project-ref
supabase db push
```
*Ou execute os arquivos SQL da pasta `supabase/migrations/` em ordem cronológica no SQL Editor do painel do Supabase.*

### 3. Habilitar Login Anônimo (Essencial para o Modo Demonstração)
> **Atenção:** O modo de demonstração do PurplePiggy utiliza autenticação anônima isolada por visitante (`signInAnonymously()`). Se este recurso estiver desabilitado no painel do Supabase, o app exibirá a mensagem *"Modo demonstração indisponível no momento"*.
>
> **Como habilitar no painel do Supabase:**
> 1. Acesse **Authentication** → **Configuration** → **Sign In / Providers** (ou **Providers**).
> 2. Localize a opção **Anonymous sign-ins** e marque-a como **Enabled** (Ativada).
> 3. Clique em **Save** para salvar as alterações.

### 4. Configurar Confirmação de E-mail
1. Acesse **Authentication** → **Email**.
2. Desative temporariamente a opção *"Confirm email"* para cadastros instantâneos durante desenvolvimento/testes, ou configure suas credenciais SMTP personalizadas para envios reais.

### 5. Configurar Redirect URLs e Deep Links
No painel do Supabase, acesse **Authentication** → **URL Configuration** → **Redirect URLs** e adicione:
- `http://localhost:5173/**`
- `http://localhost:5175/**`
- `https://purplepiggy.app/**`
- `purplepiggy://**`
- `com.purplepiggy.app://**`

### 6. Secrets das Edge Functions e Deploy
Para publicar as funções do Supabase (`supabase/functions/`):
```bash
# Definir secrets de ambiente (caso utilize Open Finance Pluggy real)
supabase secrets set PLUGGY_CLIENT_ID=seu_client_id
supabase secrets set PLUGGY_CLIENT_SECRET=seu_client_secret

# Fazer deploy das Edge Functions
supabase functions deploy create-connect-token
supabase functions deploy sync-pluggy-transactions
supabase functions deploy recover-password
```

---

## 🚀 Publicar nova versão (APK + atualização in-app)

O bucket `releases` é público só para leitura (download do APK). Upload e registro em `app_releases` exigem a **service_role**, para que ninguém com a chave anon consiga trocar o APK.

1. Copie a chave em **Supabase → Project Settings → API Keys → service_role**.
2. Adicione ao `.env` local (o arquivo já está no `.gitignore`; nunca commite):
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. Rode:
   ```bash
   node scripts/release_app.cjs --version 2.4.0 --notes "O que mudou"
   ```

---

## 🔑 Configuração Local (.env)

Copie o arquivo de exemplo na raiz do projeto:
```bash
cp .env.example .env
```
Preencha `.env` com os dados do seu projeto Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-public-key
VITE_OPEN_FINANCE_PROVIDER=demo
```

---

## 🚀 Rodando em Desenvolvimento

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento Vite:
```bash
npm run dev
```
O app abrirá por padrão em `http://localhost:5173/` (com modo responsivo ideal testado em 360×800 e 390×844).

---

## 🧪 Testes e Verificação de Qualidade

Execute a suíte completa de testes automatizados:
```bash
npm test
```
- **78 testes unitários** cobrindo:
  - Fórmulas de orçamento e despesas essenciais
  - Alertas preventivos de limites (80% e 100%)
  - Motor de quiz, spaced repetition e cálculo de XP
  - Dedução e recarga de foco sem bloqueios
  - Proteção e formatação de privacidade do ranking (LGPD)

Para validar a tipagem estrita do TypeScript:
```bash
npx tsc --noEmit
```

Para validar a integridade das 17 poses oficiais do mascote:
```bash
node scripts/verify_mascots.cjs
```

---

## 📱 Build Web e Sincronização Nativa (Capacitor)

Compile o pacote web otimizado:
```bash
npm run build
```
*(Executa a verificação dos mascotes, checagem do compilador TypeScript e a minificação Vite na pasta `dist/`)*.

Sincronize com o projeto nativo Android:
```bash
npx cap sync android
```

---

## 📦 Geração do APK e Pacote Android (AAB)

### 1. Gerar APK de Testes (Debug)
Na pasta raiz do projeto:
```bash
cd android
./gradlew assembleDebug
```
O arquivo gerado estará em `android/app/build/outputs/apk/debug/app-debug.apk`.

### 2. Gerar Pacote de Produção Assinado (AAB para Google Play)
1. Crie uma keystore segura fora do repositório:
```bash
keytool -genkey -v -keystore ../purplepiggy-release.keystore -alias purplepiggy -keyalg RSA -keysize 2048 -validity 10000
```
2. Crie um arquivo `keystore.properties` na raiz do projeto (já protegido no `.gitignore`):
```properties
storeFile=../purplepiggy-release.keystore
storePassword=sua-senha-keystore
keyAlias=purplepiggy
keyPassword=sua-senha-alias
```
3. Compile o bundle de produção:
```bash
cd android
./gradlew bundleRelease
```
O pacote assinado estará em `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 📋 Roteiro de Testes Ponta a Ponta (360×800)

1. **Cadastro Novo:** Acesse `/cadastrar`, crie uma conta real → complete o questionário do Diagnóstico Financeiro → acesse o Dashboard vazio.
2. **Lançamentos:** Registre uma receita (ex: R$ 4.000) e uma despesa essencial (ex: R$ 800) → veja o saldo e a listagem atualizarem instantaneamente.
3. **Orçamento e Alertas:** Em `/orcamento`, defina um teto de R$ 500 para Alimentação e lance uma despesa de R$ 450 (90%) → verifique a notificação de alerta preventivo.
4. **Metas:** Crie a meta "Reserva de Emergência" (R$ 5.000) → faça um aporte de R$ 1.000 → observe o avanço na barra e o saldo recalculado.
5. **Módulo Aprender:** Inicie uma lição em `/aprender` → erre uma questão propositalmente → confirme que a questão volta ao fim da fila sem travamento por game over.
6. **Privacidade no Perfil:** Em `/perfil` → *Privacidade e Segurança* → ative o ranking e defina um apelido público (ex: "PoupadorTop") → confirme que seus dados reais não são compartilhados.
7. **Modo Demonstração:** Saia da conta e clique em *"Modo Demonstração"* → explore os dados pré-carregados de Ana Oliveira → clique em *"Restaurar"* no perfil para reiniciar o cenário.

---

## 🌐 Deploy na Vercel (Opcional)

1. Importe o repositório na Vercel.
2. Configure as seguintes variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPEN_FINANCE_PROVIDER=demo`
3. O roteamento SPA já está protegido pelo arquivo `vercel.json`:
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

---

## 🔒 Segurança, LGPD e Limitações Conhecidas

- **Row Level Security (RLS):** 100% das tabelas do banco de dados possuem políticas estritas vinculadas ao `auth.uid()`. Nenhuma usuária consegue ler, atualizar ou excluir dados de outra.
- **Proteção Anti-Fraude:** A tabela de gamificação (`learn_user_stats`) não aceita comandos DML diretos do cliente (`revoke insert, update, delete`); o progresso é validado através de RPCs `security definer`.
- **Privacidade do Ranking:** Somente usuárias com `leaderboard_opt_in = true` são listadas para terceiros, exibindo exclusivamente apelido e XP semanal.
- **Open Finance:** Opera com conectores demonstrativos por padrão. A ativação do provedor Pluggy em produção requer credenciais oficiais do Banco Central configuradas como secrets no Supabase.
