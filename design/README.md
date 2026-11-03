# Estrutura de Design do PurplePiggy

Este documento descreve a organização e o fluxo de assets e referências visuais do projeto PurplePiggy.

---

## 1. `design/telas/` (Fonte da Verdade Visual)
Contém os recortes exatos das telas do aplicativo extraídos do layout mestre (`design/LayoutDoApp.png`).
- Cada tela desenvolvida ou ajustada deve seguir **exclusivamente** os elementos visíveis na imagem correspondente.
- Se um elemento não está na imagem de referência da tela, **ele não existe no app**.

---

## 2. `design/tokens.md` (Valores Canônicos de Design)
Especificação oficial de:
- **Cores (hex)**: fundo do app, fundo dos cards, gradiente do saldo, botões primários/secundários/destrutivos, textos, bordas e tags.
- **Bordas e Raios**: botões e chips (pílula `9999px`), inputs (`16px`), cards (`24px`), bottom nav (`24px` superior).
- **Alturas**: botões (`48px`), inputs (`48px`), bottom nav (`64px`).
- **Tipografia**: Família `Nunito`, pesos (`font-bold`, `font-extrabold`) e tamanhos correspondentes.
- **Sombras e Espaçamentos**: margens laterais de `20px` (`px-5`) e espaçamento entre cards (`gap-3` a `gap-4`).

---

## 3. `mascotes/` (Originais e Geração)
- **`mascotes/_originals/`**: Contém os arquivos originais fonte da marca (`pig-oficial.png` e `pig-oficial-512.png`).
- **`mascotes/manifest.json`**: Catálogo das 12 poses aprovadas do mascote com indicação de arquivo, descrição e uso canônico no app.
- **Processamento**: Scripts para recorte de chroma key, despill e geração de transparência dos mascotes gerados a partir dos prompts oficiais.

---

## 4. `public/assets/` (Assets Finais de Produção)
Diretório servido diretamente pela aplicação web:
- **`public/assets/brand/`**: Cópias oficiais dos logos e marcas primárias.
- **`public/assets/mascot/`**: As 12 poses aprovadas em PNG transparente de alta resolução (`pig-head.png`, `pig-welcome.png`, `pig-peek.png`, etc.).
- **`public/assets/icons/`**: Ícones 3D e texturas auxiliares.
- **`public/assets/coins/`**: Moedas 3D de alta fidelidade.
- **`public/assets/decorations/`**: Confetes, estrelas e corações decorativos 3D.
