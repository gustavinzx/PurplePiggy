// src/features/learn/questions/lote2.ts
// Lote 2: Trilha 3 (Cartão de crédito) e Trilha 4 (Reserva de emergência)
import type { LearnQuestion } from './types'

export const LOTE_2_QUESTIONS: LearnQuestion[] = [
  // =========================================================================
  // TRILHA 3 - LIÇÃO 1: como-o-cartao-funciona
  // =========================================================================
  {
    id: 'l2-t3-l1-mc',
    lessonSlug: 'como-o-cartao-funciona',
    trackSlug: 'cartao-de-credito',
    lote: 2,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Qual é a melhor definição prática para o cartão de crédito?',
    options: [
      'Uma extensão do seu salário que você pode gastar sem se preocupar.',
      'Um meio de pagamento que utiliza um empréstimo de curto prazo até a data de vencimento.',
      'Uma conta corrente separada que guarda seu dinheiro economizado.',
    ],
    correctIndex: 1,
    explanation: 'O cartão de crédito adianta um pagamento que precisará ser quitado integralmente na data combinada.',
    tip: 'Gastar no cartão compromete a sua renda do mês seguinte.',
  },
  {
    id: 'l2-t3-l1-cm',
    lessonSlug: 'como-o-cartao-funciona',
    trackSlug: 'cartao-de-credito',
    lote: 2,
    typology: 'concept_matching',
    orderIndex: 2,
    prompt: 'Associe as datas do cartão com seu significado real:',
    pairs: [
      { id: 'p1', left: 'Data de Fechamento', right: 'Dia em que a fatura fecha e compras vão para o próximo mês' },
      { id: 'p2', left: 'Data de Vencimento', right: 'Último dia para pagar a fatura sem cobrança de juros' },
      { id: 'p3', left: 'Limite do Cartão', right: 'Teto máximo emprestado pelo banco para suas compras' },
    ],
    explanation: 'Comprar logo após o fechamento da fatura dá até 40 dias para pagar, sem pagar nenhum juro.',
  },
  {
    id: 'l2-t3-l1-fb',
    lessonSlug: 'como-o-cartao-funciona',
    trackSlug: 'cartao-de-credito',
    lote: 2,
    typology: 'fill_in_the_blank',
    orderIndex: 3,
    prompt: 'Complete a recomendação sobre uso do cartão:',
    sentence: 'A melhor forma de usar o cartão é pagar sempre o valor ___ da fatura até o vencimento.',
    options: ['mínimo', 'parcelado', 'integral', 'estimado'],
    correctAnswer: 'integral',
    explanation: 'Pagar 100% da fatura garante que você desfrute dos benefícios do cartão sem pagar um centavo de juros.',
  },

  // =========================================================================
  // TRILHA 3 - LIÇÃO 2: perigo-do-rotativo
  // =========================================================================
  {
    id: 'l2-t3-l2-mc',
    lessonSlug: 'perigo-do-rotativo',
    trackSlug: 'cartao-de-credito',
    lote: 2,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Por que o crédito rotativo do cartão é considerado tão arriscado?',
    options: [
      'Porque cancela o cartão de crédito imediatamente no dia seguinte.',
      'Porque é proibido pelo Banco Central para quem tem conta corrente.',
      'Porque possui uma das taxas de juros mais elevadas de toda a economia brasileira.',
    ],
    correctIndex: 2,
    explanation: 'As taxas anuais do rotativo podem ultrapassar 400% ao ano, multiplicando a dívida com rapidez extrema.',
  },
  {
    id: 'l2-t3-l2-sc',
    lessonSlug: 'perigo-do-rotativo',
    trackSlug: 'cartao-de-credito',
    lote: 2,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'O que Pedro deve escolher para proteger seu futuro financeiro?',
    scenarioText: 'A fatura de Pedro veio em R$ 900. Ele só conseguiu juntar R$ 300 este mês. O aplicativo oferece "Pagamento Mínimo de R$ 135" ou "Parcelar em 6x fixas".',
    options: ['Pagar apenas o mínimo de R$ 135', 'Optar pelo parcelamento fixo com juros conhecidos'],
    correctIndex: 1,
    explanation: 'O parcelamento fixo interrompe a bola de neve do rotativo e permite organizar os pagamentos futuros.',
  },

  // =========================================================================
  // TRILHA 4 - LIÇÃO 1: por-que-ter-reserva
  // =========================================================================
  {
    id: 'l2-t4-l1-mc',
    lessonSlug: 'por-que-ter-reserva',
    trackSlug: 'reserva-de-emergencia',
    lote: 2,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Qual é o verdadeiro propósito de ter uma reserva de emergência?',
    options: [
      'Juntar dinheiro apenas para comprar roupas novas na virada de ano.',
      'Garantir paz mental e proteção diante de imprevistos sem precisar contrair dívidas caras.',
      'Apostar em investimentos de alto risco para tentar dobrar o patrimônio rapidamente.',
    ],
    correctIndex: 1,
    explanation: 'A reserva de emergência é um colchão acolchoado: quando a vida tropeça, ela amortece o tombo.',
  },
  {
    id: 'l2-t4-l1-cm',
    lessonSlug: 'por-que-ter-reserva',
    trackSlug: 'reserva-de-emergencia',
    lote: 2,
    typology: 'concept_matching',
    orderIndex: 2,
    prompt: 'Identifique o que é ou não é motivo para usar a reserva:',
    pairs: [
      { id: 'p1', left: 'Remédio urgente ou dente quebrado', right: 'Imprevisto de saúde (usar reserva)' },
      { id: 'p2', left: 'Geladeira que estragou no calor', right: 'Reparo doméstico urgente (usar reserva)' },
      { id: 'p3', left: 'Celular novo só porque lançou modelo recente', right: 'Desejo de consumo (planejar como meta)' },
    ],
    explanation: 'Emergências são acontecimentos imprevisíveis e urgentes que afetam sua subsistência ou saúde.',
  },

  // =========================================================================
  // TRILHA 4 - LIÇÃO 2: comecando-pequeno
  // =========================================================================
  {
    id: 'l2-t4-l2-op',
    lessonSlug: 'comecando-pequeno',
    trackSlug: 'reserva-de-emergencia',
    lote: 2,
    typology: 'order_priorities',
    orderIndex: 1,
    prompt: 'Organize as metas de construção da sua reserva na ordem recomendada:',
    items: [
      'Construir de 3 a 6 meses de segurança total',
      'Guardar 1 semana de gastos essenciais (primeira vitória)',
      'Atingir 1 mês completo de despesas essenciais',
    ],
    correctOrder: [
      'Guardar 1 semana de gastos essenciais (primeira vitória)',
      'Atingir 1 mês completo de despesas essenciais',
      'Construir de 3 a 6 meses de segurança total',
    ],
    explanation: 'Começar pequeno com 1 semana traz confiança imediata e torna o hábito sustentável no dia a dia.',
  },
  {
    id: 'l2-t4-l2-sc',
    lessonSlug: 'comecando-pequeno',
    trackSlug: 'reserva-de-emergencia',
    lote: 2,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Qual atitude fortalece o hábito de poupar de Ana?',
    scenarioText: 'Ana acha que guardar R$ 20 por mês é pouco demais e pensa em desistir porque a meta parece muito distante.',
    options: ['Esperar ganhar mais para só então começar', 'Começar com os R$ 20 agora mesmo com orgulho'],
    correctIndex: 1,
    explanation: 'O mais importante no começo é consolidar o hábito e a disciplina, não o valor inicial.',
  },
]
