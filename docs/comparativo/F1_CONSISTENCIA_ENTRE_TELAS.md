# 💜 PurplePiggy — Relatório F1: Consistência Entre Telas

> Auditoria visual e estrutural das 15 telas do aplicativo contra as imagens contratuais em `design/telas/` e `design/telas-extra/` (Linha 4: Módulo Aprender contra mockups aprovados).

---

## 1. Grade de Telas e Status de Conformidade (390px Viewport)

| # | Tela | Rota | Referência Contratual | Fonte | Largura | Status |
|---|---|---|---|---|---|---|
| **01** | Splash | `/` | `design/telas/01-splash.png` | Nunito | 390px | ✅ Aprovada |
| **02** | Boas-Vindas | `/boas-vindas` | `design/telas/02-boas-vindas.png` | Nunito | 390px | ✅ Aprovada |
| **03** | Cadastro | `/cadastrar` | `design/telas/03-cadastro.png` | Nunito | 390px | ✅ Aprovada |
| **04** | Login | `/entrar` | `design/telas/04-login.png` | Nunito | 390px | ✅ Aprovada |
| **05** | Diagnóstico | `/diagnostico` | `design/telas/05-diagnostico.png` | Nunito | 390px | ✅ Aprovada |
| **06** | Início (Dashboard) | `/inicio` | `design/telas/06-home.png` | Nunito | 390px | ✅ Aprovada |
| **07** | Gastos | `/gastos` | `design/telas/07-gastos.png` | Nunito | 390px | ✅ Aprovada |
| **08** | Detalhes da Transação | `/transacao/:id` | `design/telas/08-detalhe.png` | Nunito | 390px | ✅ Aprovada |
| **09** | Orçamento | `/orcamento` | `design/telas/09-orcamento.png` | Nunito | 390px | ✅ Aprovada |
| **10** | Metas | `/metas` | `design/telas/10-metas.png` | Nunito | 390px | ✅ Aprovada |
| **11** | Aprender (Desafio Piggy) | `/aprender` | `design/telas-extra/10-aprender.png` | Nunito | 390px | ✅ Aprovada (Linha 4) |
| **12** | Lição Interativa | `/licao/:id` | `design/telas-extra/11-licao.png` | Nunito | 390px | ✅ Aprovada (Linha 4) |
| **13** | Simulador de Compras | `/simulador` | `design/telas/13-simulador.png` | Nunito | 390px | ✅ Aprovada |
| **14** | Perfil | `/perfil` | `design/telas/14-perfil.png` | Nunito | 390px | ✅ Aprovada |
| **15** | Open Finance | `/open-finance` | `design/telas/15-open-finance.png` | Nunito | 390px | ✅ Aprovada |

---

## 2. Verificações Específicas de Consistência

1. **Atmosfera e Fundo Unificados:**
   - Todas as 15 telas utilizam o componente `<AppShell>` com a `<Atmosphere>` padrão: fundo lilás suave `#F8F5FC`, sem fundos estourados ou barras de rolagem horizontais (`overflow-x: clip`).
2. **Bottom Navigation Idêntica:**
   - As 5 telas navegáveis da barra inferior (Início, Gastos, Metas, Aprender e Perfil) utilizam exatamente o mesmo componente de navegação, mantendo alinhamento, altura (`64px`), espaçamento e destaque da aba ativa.
3. **Módulo Desafio Piggy (Linha 4):**
   - As Telas 11 e 12 foram avaliadas contra os mockups oficiais em `design/telas-extra/`. Os botões chunky com sombra sólida de profundidade e os cards de quiz com borda espessa e resposta animada são intencionais e consistentes entre si.
4. **Tipografia e Tokens:**
   - 100% dos textos renderizam sob a família tipográfica **Nunito**, com os pesos `font-bold` (700) e `font-extrabold` (800) em conformidade com `design/tokens.md`.
