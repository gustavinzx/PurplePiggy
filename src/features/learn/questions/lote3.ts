// src/features/learn/questions/lote3.ts
// Lote 3: Trilha 5 (Planejamento financeiro) e Trilha 6 (Consumo consciente)
import type { LearnQuestion } from './types'

export const LOTE_3_QUESTIONS: LearnQuestion[] = [
  // =========================================================================
  // TRILHA 5 - LIÇÃO 1: metas-com-nome-e-prazo
  // =========================================================================
  {
    id: 'l3-t5-l1-mc',
    lessonSlug: 'metas-com-nome-e-prazo',
    trackSlug: 'planejamento-financeiro',
    lote: 3,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'O que transforma um sonho vago em uma meta financeira real e alcançável?',
    options: [
      'Dar um nome claro, um valor total definido e um prazo realista.',
      'Torcer para ganhar na loteria ou receber um aumento inesperado.',
      'Apenas prometer a si mesmo que vai tentar guardar dinheiro.',
    ],
    correctIndex: 0,
    explanation: 'Definir quanto custa e quando você quer alcançar permite dividir o objetivo em parcelas suaves por mês.',
    tip: 'No PurplePiggy você cria metas com prazos e o porquinho calcula o ritmo mensal para você.',
  },
  {
    id: 'l3-t5-l1-fb',
    lessonSlug: 'metas-com-nome-e-prazo',
    trackSlug: 'planejamento-financeiro',
    lote: 3,
    typology: 'fill_in_the_blank',
    orderIndex: 2,
    prompt: 'Complete a fórmula de uma boa meta:',
    sentence: 'Dividir uma meta grande em parcelas mensais menores torna a conquista muito mais ___ de realizar.',
    options: ['fácil', 'pesada', 'arriscada', 'distante'],
    correctAnswer: 'fácil',
    explanation: 'Guardar R$ 50 por 10 meses é infinitamente mais tranquilo do que juntar R$ 500 de uma só vez.',
  },
  {
    id: 'l3-t5-l1-sc',
    lessonSlug: 'metas-com-nome-e-prazo',
    trackSlug: 'planejamento-financeiro',
    lote: 3,
    typology: 'scenario_choice',
    orderIndex: 3,
    prompt: 'Como Juliana deve estruturar essa vontade?',
    scenarioText: 'Juliana quer trocar de notebook até o final do ano para trabalhar melhor. Ela calcula que o modelo custa R$ 2.400 e faltam 12 meses.',
    options: ['Guardar R$ 200 por mês em uma meta separada', 'Comprar parcelado em 24x com juros altos na loja'],
    correctIndex: 0,
    explanation: 'Poupar com antecedência economiza dinheiro com juros e ainda permite negociar desconto à vista.',
  },

  // =========================================================================
  // TRILHA 5 - LIÇÃO 2: revisao-mensal-10-min
  // =========================================================================
  {
    id: 'l3-t5-l2-op',
    lessonSlug: 'revisao-mensal-10-min',
    trackSlug: 'planejamento-financeiro',
    lote: 3,
    typology: 'order_priorities',
    orderIndex: 1,
    prompt: 'Qual a ordem ideal para fazer sua revisão financeira mensal em 10 minutos?',
    items: [
      'Conferir as categorias onde você mais gastou no mês',
      'Celebrar as metas que você conseguiu avançar',
      'Ajustar os limites do próximo mês com base no que aprendeu',
    ],
    correctOrder: [
      'Conferir as categorias onde você mais gastou no mês',
      'Celebrar as metas que você conseguiu avançar',
      'Ajustar os limites do próximo mês com base no que aprendeu',
    ],
    explanation: 'Uma revisão sem julgamentos fortalece a conexão com suas prioridades e renova suas energias.',
  },

  // =========================================================================
  // TRILHA 6 - LIÇÃO 1: desejo-vs-necessidade
  // =========================================================================
  {
    id: 'l3-t6-l1-cm',
    lessonSlug: 'desejo-vs-necessidade',
    trackSlug: 'consumo-consciente',
    lote: 3,
    typology: 'concept_matching',
    orderIndex: 1,
    prompt: 'Classifique cada item entre necessidade e desejo:',
    pairs: [
      { id: 'p1', left: 'Supermercado e itens básicos de higiene', right: 'Necessidade essencial' },
      { id: 'p2', left: 'Aluguel, água, energia e internet de casa', right: 'Necessidade essencial' },
      { id: 'p3', left: 'Tênis de marca lançamento para passear', right: 'Desejo de estilo de vida' },
    ],
    explanation: 'Desejos são legítimos e trazem alegria, mas devem ser atendidos sem comprometer suas necessidades.',
  },
  {
    id: 'l3-t6-l1-sc',
    lessonSlug: 'desejo-vs-necessidade',
    trackSlug: 'consumo-consciente',
    lote: 3,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Qual conselho ajuda Rodrigo a evitar o arrependimento?',
    scenarioText: 'Rodrigo estava navegando nas redes sociais às 23h após um dia exaustivo de trabalho e sentiu um impulso forte de comprar um fone de ouvido de R$ 380.',
    options: ['Aplicar a regra das 24 horas e reavaliar amanhã de cabeça fresca', 'Comprar imediatamente para aliviar o estresse'],
    correctIndex: 0,
    explanation: 'Comprar por cansaço ou ansiedade é um gatilho comum. Dormir sobre a decisão quase sempre dissipa o impulso.',
  },

  // =========================================================================
  // TRILHA 6 - LIÇÃO 2: perguntas-antes-de-comprar
  // =========================================================================
  {
    id: 'l3-t6-l2-mc',
    lessonSlug: 'perguntas-antes-de-comprar',
    trackSlug: 'consumo-consciente',
    lote: 3,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Qual destas perguntas é fundamental fazer a si mesmo antes de passar o cartão?',
    options: [
      'Eu realmente preciso disso agora, cabe no meu orçamento e posso pagar à vista?',
      'Será que meus amigos vão achar essa compra bonita?',
      'Quantas parcelas o vendedor consegue dividir para ficar baratinho por mês?',
    ],
    correctIndex: 0,
    explanation: 'Perguntar se cabe no orçamento e se é o momento certo protege suas metas de médio e longo prazo.',
  },
]
