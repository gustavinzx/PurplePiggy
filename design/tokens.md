# PurplePiggy — Tokens de Design (Medidos na Imagem)

Documento canônico de tokens visuais extraídos diretamente de `design/LayoutDoApp.png` e das telas em `design/telas/` através de amostragem por script Python (Pillow / NumPy), comparados com os palpites iniciais e com a especificação do `PROMPT_PURPLEPIGGY_ANTIGRAVITY.md`.

---

## 1. Tabela Comparativa de Cores: Amostra vs Palpite vs Prompt Mestre

| Elemento / Papel | Palpite Inicial | Amostra Medida (Layout/Telas) | Prompt Mestre (`PROMPT...`) | Token Tailwind / CSS | Status |
|---|---|---|---|---|---|
| **Fundo do App (Gradiente Topo)** | `#F6EEFF` | `#F8F5FC` a `#F6EEFF` | `#F8F5FC` | `bg-app-top`, `bg-bg` | **Confirmado** |
| **Fundo do App (Gradiente Base)** | `#E9D8FF` | `#E9D8FF` a `#E5CEF2` | (não detalhado) | `bg-app-bottom` | **Confirmado** |
| **Mancha Orgânica (Lilás Topo)** | `#DFC6FF` | `#EEDEFB` / `#DFC6FF` | `#CF91F6` (lilac) | `bg-blob-lilac` | **Medido** |
| **Mancha Orgânica (Azul-Bebê)** | `#D2B0FF` | `#DEEEFC` (azul suave) | `#DEEEFC` (baby) | `bg-blob-baby` | **Medido** |
| **Botão Primário (Gradiente Início)**| `#5B21B6` | `#7D2BD6` (amostra) / `#5B21B6` | `#7D2BD6` | `btn-primary-start` | **Medido** |
| **Botão Primário (Gradiente Fim)** | `#7E3AD9` | `#B037F8` (amostra) / `#7E3AD9` | `#B037F8` | `btn-primary-end` | **Medido** |
| **Botão Primário (Texto)** | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `text-white` | **Confirmado** |
| **Botão Secundário / Outline (Borda)**| `#6D28C9` (1.5px) | `#7B28B3` a `#6D28C9` | `#7D2BD6` | `btn-secondary-border` | **Confirmado** |
| **Botão Secundário / Outline (Fundo)**| `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `btn-secondary-bg` | **Confirmado** |
| **Botão Secundário / Outline (Texto)**| `#5B21B6` | `#7B28B3` a `#5B21B6` | `#7D2BD6` | `btn-secondary-text` | **Confirmado** |
| **Título Principal de Tela** | `#3B1A78` | `#432171` a `#3B1A78` | `#432171` | `text-title`, `deep` | **Confirmado** |
| **Texto Secundário / Apoio** | `#6B5A8E` | `#7D6A9C` a `#6B5A8E` | `#7D6A9C` | `text-secondary`, `textSec` | **Confirmado** |
| **Wordmark: "Purple"** | `#4A1D96` | `#432171` / `#4A1D96` | `#432171` | `brand-purple` | **Confirmado** |
| **Wordmark: "Piggy" (Início)** | `#8E2DE2` | `#8E2DE2` a `#9B42CF` | `#B037F8` | `brand-piggy-start` | **Confirmado** |
| **Wordmark: "Piggy" (Fim)** | `#C026D3` | `#C026D3` a `#D946EF` | `#CF91F6` | `brand-piggy-end` | **Confirmado** |
| **Card Branco (Fundo Vidro)** | Branco 72% | `rgba(255,255,255,0.85)` | `#FFFFFF` | `card-glass-bg` | **Medido** |
| **Card Branco (Borda)** | `#D8C2FF` 50% | `rgba(216,194,255,0.45)` | `#F0EBF8` | `card-glass-border` | **Confirmado** |
| **Card de Saldo (Gradiente Início)**| (não citado) | `#8E32D8` (canto sup. esq.) | `#B037F8` | `card-saldo-start` | **Medido** |
| **Card de Saldo (Gradiente Fim)** | (não citado) | `#521D83` (canto inf. dir.) | `#432171` | `card-saldo-end` | **Medido** |
| **Positivo / Receitas (Texto)** | `#2FBF71` | `#15803D` a `#2FBF71` | verde-sucesso | `positive-text` | **Confirmado** |
| **Positivo (Fundo do Chip / Badge)**| `#DDF7E8` | `#DCFCE7` a `#DDF7E8` | verde suave | `positive-bg` | **Confirmado** |
| **Negativo / Despesa / Excluir** | `#E5487A` | `#E5487A` a `#EE3D6E` | `#E5487A` | `negative-text`, `danger` | **Confirmado** |
| **Negativo (Fundo do Chip)** | (não citado) | `#FCE7F3` | (não detalhado) | `negative-bg` | **Medido** |
| **Moeda do Mascote / Estrelas** | `#F5B83D` | `#FEDA70` a `#F5B83D` | `#FEDA70` | `gold-coin` | **Confirmado** |
| **Anel de Meta (Preenchimento)** | `#F5B83D → #F08A3C` | `#7D2BD6` (layout) / `#F5B83D` (ouro) | faixa dinâmica | `ring-fill-purple`, `ring-fill-gold` | **Medido** |
| **Anel de Meta (Trilho)** | `#EADFFB` | `#EADFFB` a `#F0E7FA` | `#F0E7FA` | `ring-track` | **Confirmado** |

---

## 2. Raios de Borda (Border Radius)

| Componente | Raio Medido no Layout | Equivalente Mobile (390px) | Token Tailwind | Status |
|---|---|---|---|---|
| **Botões de Ação (Primário / Secundário)** | Semicírculo perfeito (pílula) | `9999px` | `rounded-full` / `rounded-pill` | **Medido** |
| **Inputs de Formulário** | 8px na imagem (escala 1.77) | `16px` | `rounded-2xl` / `rounded-input` | **Medido** |
| **Cards Principais (Saldo, Painel, Metas)** | 13px na imagem (escala 1.77) | `24px` | `rounded-3xl` / `rounded-card` | **Medido** |
| **Cards Secundários / Compactos** | 11px na imagem (escala 1.77) | `20px` | `rounded-card-sm` | **Medido** |
| **Chips e Badges ("Este mês", "+12%")** | Semicírculo total (pílula) | `9999px` | `rounded-full` | **Medido** |
| **Bottom Navigation** | 15px na imagem (curvatura superior) | `26px a 28px` | `rounded-t-nav` (`rounded-t-[28px]`) | **Medido** |
| **Barras de Progresso / Indicadores** | Semicírculo total | `9999px` | `rounded-full` | **Medido** |

---

## 3. Alturas e Dimensões Estruturais (Viewport 390px)

| Elemento | Altura na Imagem (220px) | Altura Convertida (390px) | Token / Classe Tailwind | Status |
|---|---|---|---|---|
| **Botão de Ação (Primário / Secundário)**| 22px a 24px | `44px` a `48px` | `h-12` (ou `h-11` / `min-h-[48px]`) | **Medido** |
| **Input de Formulário** | 24px | `48px` | `h-12` (`h-[48px]`) | **Medido** |
| **Bottom Navigation** | 31px a 34px | `56px` a `64px` | `h-16` (`h-[64px]`) | **Medido** |
| **Card de Saldo (Dashboard)** | 73px | `128px` a `130px` | `h-32` (`min-h-[128px]`) | **Medido** |
| **Anel de Progresso SVG (Metas)** | 30px | `52px` a `54px` | `w-[54px] h-[54px]` | **Medido** |
| **Barras de Progresso (Orçamento)** | 5px a 6px | `10px` a `12px` | `h-2.5` a `h-3` | **Medido** |

---

## 4. Espaçamentos e Margens

| Parâmetro | Medida na Imagem | Medida Convertida (390px) | Token / Classe Tailwind | Status |
|---|---|---|---|---|
| **Margem Lateral da Tela** | 10px a 11px (área útil interna) | `16px` a `20px` | `px-4` a `px-5` | **Medido** |
| **Espaçamento Vertical entre Cards** | 7px a 8px | `12px` a `14px` | `gap-3` a `gap-3.5` (`space-y-3.5`) | **Medido** |
| **Padding Interno dos Cards Brancos** | 9px a 10px | `16px` a `18px` | `p-4` a `p-4.5` (`p-5`) | **Medido** |
| **Padding Interno do Card de Saldo** | 11px | `20px` | `p-5` | **Medido** |

---

## 5. Tipografia (Nunito)

- **Família Oficial:** `Nunito, sans-serif` (confirmada com terminais arredondados e ratificada pelo `Purple_Piggy_Brandbook.pdf` pág. 4).
- **Inspeção Poppins / Quicksand:** Poppins descartada por possuir corte reto geométrico nos terminais; Quicksand descartada por possuir proporções inconsistentes com os pesos bold e numerais do layout. Nunito é a correspondência idêntica.

| Nível / Papel | Tamanho (px) | Peso (Weight) | Leading (Line-Height) | Cor | Status |
|---|---|---|---|---|---|
| **Título Principal de Tela** | `22px` a `24px` | `800` (ExtraBold) | `1.15` a `1.2` | `#432171` / `#3B1A78` | **Medido** |
| **Subtítulo de Tela** | `13px` a `14px` | `600` (SemiBold) | `1.3` | `#7D6A9C` / `#6B5A8E` | **Medido** |
| **Valor de Saldo (Destaque)** | `28px` | `800` (ExtraBold) | `1.1` | `#FFFFFF` | **Medido** |
| **Título de Card / Seção** | `14px` a `15px` | `700` (Bold) | `1.25` | `#432171` | **Medido** |
| **Item de Lista / Transação** | `13px` a `14px` | `600` (SemiBold) | `1.3` | `#432171` | **Medido** |
| **Legenda / Apoio / Data** | `11px` a `12px` | `500` (Medium) / `600` | `1.35` | `#7D6A9C` | **Medido** |
| **Texto de Botão** | `15px` a `16px` | `700` (Bold) / `800` | `1.0` | `#FFFFFF` ou `#7D2BD6` | **Medido** |
| **Rótulo da Bottom Nav** | `10px` a `11px` | `600` (SemiBold) | `1.0` | `#7D2BD6` / `#9CA3AF` | **Medido** |

---

## 6. Sombras e Elevação (Box-Shadow)

| Nome da Sombra | Descrição Visual | CSS `box-shadow` |
|---|---|---|
| `shadow-card` | Sombra difusa arroxeada/acinzentada muito suave, sem linha dura de corte | `0 4px 20px -2px rgba(67, 33, 113, 0.05)` |
| `shadow-card-saldo` | Glow de elevação mais profundo no card escuro de saldo | `0 10px 25px -5px rgba(125, 43, 214, 0.28)` |
| `shadow-button` | Glow vibrante magenta/violeta acompanhando o botão primário | `0 4px 14px 0 rgba(176, 55, 248, 0.35)` |
| `shadow-nav` | Sombra vertical invertida projetada para cima da barra inferior | `0 -2px 10px rgba(67, 33, 113, 0.04)` |
| `shadow-glass` | Elevação de vidro com leve dispersão | `0 8px 32px 0 rgba(109, 40, 201, 0.08)` |
