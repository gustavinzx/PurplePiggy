# PurplePiggy: regras para o agente

## Fonte da verdade
- Visual: imagens em design/telas/ (recortes de design/LayoutDoApp.png). Se algo não está na imagem, NÃO existe no app.
- Comportamento, banco, autenticação e regras de negócio: PROMPT_PURPLEPIGGY_ANTIGRAVITY.md.
- Se os dois divergirem em aparência, vale a imagem.
- Cores, fontes, raios, sombras e espaçamentos: design/tokens.md. Não invente valores.
- Mascote e ilustrações: PNGs aprovados em public/assets/mascot/ (lista em mascotes/manifest.json). Ícones em public/assets/icons/, moedas em public/assets/coins/.

## Proibido
- Emojis na interface (única exceção: a mãozinha de aceno do "Olá, {nome}!" da tela Início).
- Fonte Inter, Roboto ou fonte padrão do sistema (a fonte é Nunito).
- Componentes de biblioteca (shadcn, Material etc.) com estilo padrão.
- Ícones grandes ou de destaque fora dos assets. Ícones pequenos de interface (seta, olho, cadeado, calendário, check): só podem vir de biblioteca se traço, cor e tamanho baterem com o layout; caso contrário, criar SVG igual ao da imagem.
- Recriar o mascote ou ilustrações em SVG/CSS. Use os PNGs aprovados.
- Gradientes, sombras ou cores que não estejam no layout.
- Textos genéricos (Lorem ipsum, Welcome, Get started).
- Adicionar telas, cards, gráficos, atalhos, seções ou botões que não estão na imagem.
- "Melhorar", "modernizar" ou "equilibrar" o design por conta própria.

## Ritual de tela (obrigatório em toda tarefa de UI)
1. Abra a imagem de referência e liste TODOS os elementos visíveis (textos exatos, ícones, cards, ordem, cores).
2. Liste o que existe hoje no app e NÃO está na imagem. Remova.
3. Implemente com os tokens e componentes do design system.
4. Rode o app, tire screenshot em 390px de largura, compare lado a lado com a referência e liste TODAS as diferenças em tabela (elemento, referência, app, correção): cor, fonte, tamanho, raio, espaçamento, ícone, alinhamento, elementos a mais ou a menos. Corrija e repita até zerar.
5. Confirme: sem emoji, sem ícone fora do padrão, sem componente com estilo padrão, mascote só dos assets, textos idênticos aos do layout (pt-BR).
6. Trabalhe na branch fix/ui-<tela>. Não toque em outras telas. Não commite em main. Mostre o screenshot final e a lista do que mudou.

## Na dúvida, pergunte. Não assuma.

## EXCEÇÃO AUTORIZADA: módulo Desafio Piggy
O módulo de aprendizado gamificado (mapa de níveis, exercícios, Ofensiva Piggy, guias de estudo) não existe em design/telas/ e foi autorizado por mim. A regra "se não está na imagem, não existe" NÃO vale para ele e nenhuma auditoria pode removê-lo. A fonte visual dele é design/telas-extra/ (mockups aprovados por mim: 10-aprender.png, 10b-trocar-trilha.png e 11-licao.png). As telas 11 (Aprender) e 12 (Lição) do layout original deixam de ser contrato visual e foram substituídas por esses mockups. Estrutura, layout e mecânica vêm de design/referencias/duolingo-ui.jpg e dos mockups extras; o visual, identidade, cores, mascote, textos e tom são SEMPRE os do PurplePiggy (tokens, Nunito, mascote e assets próprios). Proibido copiar cores, mascote, ícones ou textos do Duolingo.

## REDESIGN V2 (autorizado)
Telas cobertas: /inicio, /gastos, /metas, /aprender (mapa), /perfil e a tela de Parabéns (resumo de
nível). A fonte visual delas passa a ser design/v2/ (referencia-v2.png e os recortes NN-*.png) e
substitui design/telas/ e design/telas-extra/ SÓ para essas telas. As demais continuam como em
design/telas/.
REGRAS DE SEGURANÇA
- Só camada de apresentação (componentes, CSS, assets). NÃO alterar supabase/, migrations, RPCs,
  src/lib/, assinaturas de hooks de dados, rotas nem nomes de campos. Dado novo = seletor puro novo,
  com teste, sem mudar os existentes.
- Uma tela por vez, em branch redesign/v2-<tela> a partir de redesign/v2, com a tag pre-v2-<tela>
  antes de começar. Antes de pedir aprovação: tsc, vitest, build e e2e passando. Se algo quebrar,
  reverta a tela; não conserte outras coisas no caminho.
- Textos e valores do app vêm do banco; o mockup define estrutura e estilo.
- Sem emojis (única exceção: a mãozinha de aceno do "Olá, {nome}!"). O sparkle do mockup é o asset
  public/assets/icons/sparkle.
- Sem recriar mascote ou ilustração em SVG ou CSS: só PNG ou WebP aprovados (manifest).
- Mobile first: medir em 390x844 e 360x780 com o DevTools em modo dispositivo. No desktop, a coluna
  tem no máximo 430px, centralizada, com a mesma largura em carregamento, vazio, erro e dados.
- Evidência obrigatória: screenshot lado a lado com a referência e tabela de diferenças (elemento,
  referência, app, correção). Não escreva "pronto" sem isso.
- Mockup que exige funcionalidade nova: faça o mínimo viável e me avise. Se exigir mudança de
  banco, PARE e pergunte.
- Exceção ao N14: no v2 as estrelas de maestria voltam (3 estrelas na ilha concluída). Vidas e
  moedas continuam proibidas.

