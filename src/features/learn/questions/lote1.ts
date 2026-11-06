// src/features/learn/questions/lote1.ts
// Lote 1: Trilha 1 (Organização financeira) e Trilha 2 (Juros sem mistério)
import type { LearnQuestion } from './types'

export const LOTE_1_QUESTIONS: LearnQuestion[] = [
  // =========================================================================
  // TRILHA 1 - LIÇÃO 1: para-onde-vai-meu-dinheiro
  // =========================================================================
  {
    id: 'l1-t1-l1-mc',
    lessonSlug: 'para-onde-vai-meu-dinheiro',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Qual é a melhor atitude para começar a organizar seus gastos na primeira semana?',
    options: [
      'Cortar imediatamente todos os pequenos prazeres da sua rotina.',
      'Anotar tudo o que gasta por 7 dias, com calma e sem se julgar.',
      'Esperar o próximo mês para ver o que sobra na conta.',
    ],
    correctIndex: 1,
    explanation: 'Anotar os gastos sem culpa traz clareza para enxergar seus hábitos com carinho.',
    tip: 'O objetivo inicial é apenas enxergar a realidade sem nenhuma autocobrança.',
  },
  {
    id: 'l1-t1-l1-sc',
    lessonSlug: 'para-onde-vai-meu-dinheiro',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'O que fazer neste momento?',
    scenarioText: 'Camila recebeu o salário hoje. Antes de pagar as contas fixas essenciais, viu uma promoção relâmpago de roupas com 40% de desconto.',
    options: ['Aproveitar a promoção agora mesmo', 'Garantir as contas essenciais primeiro'],
    correctIndex: 1,
    explanation: 'Proteger o teto e a comida traz a tranquilidade necessária para planejar as compras depois.',
    tip: 'Descontos só economizam se a compra já estivesse planejada no orçamento.',
  },
  {
    id: 'l1-t1-l1-op',
    lessonSlug: 'para-onde-vai-meu-dinheiro',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'order_priorities',
    orderIndex: 3,
    prompt: 'Ordene a sequência ideal para organizar suas finanças do mês:',
    items: [
      'Definir o valor para lazer e compras com tranquilidade',
      'Garantir moradia, alimentação e contas básicas',
      'Reservar um valor pequeno para o futuro e reserva',
    ],
    correctOrder: [
      'Garantir moradia, alimentação e contas básicas',
      'Reservar um valor pequeno para o futuro e reserva',
      'Definir o valor para lazer e compras com tranquilidade',
    ],
    explanation: 'Primeiro protegemos o essencial, depois guardamos uma semente e por fim aproveitamos com liberdade.',
  },
  {
    id: 'l1-t1-l1-cm',
    lessonSlug: 'para-onde-vai-meu-dinheiro',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'concept_matching',
    orderIndex: 4,
    prompt: 'Conecte cada tipo de gasto com seu exemplo prático:',
    pairs: [
      { id: 'p1', left: 'Gasto Essencial', right: 'Aluguel e contas de luz' },
      { id: 'p2', left: 'Prioridade Futura', right: 'Poupar R$ 50 para reserva' },
      { id: 'p3', left: 'Estilo de Vida', right: 'Café na padaria com amigos' },
    ],
    explanation: 'Diferenciar esses três grupos permite equilibrar seu dinheiro sem apertos desnecessários.',
  },
  {
    id: 'l1-t1-l1-fb',
    lessonSlug: 'para-onde-vai-meu-dinheiro',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'fill_in_the_blank',
    orderIndex: 5,
    prompt: 'Complete a frase com a palavra correta:',
    sentence: 'Organizar o dinheiro é sobre ter ___ para fazer escolhas conscientes no seu dia a dia.',
    options: ['restrição', 'medo', 'clareza', 'pressa'],
    correctAnswer: 'clareza',
    explanation: 'Com clareza e informações visíveis, seu dinheiro passa a trabalhar a favor do seu ritmo.',
  },

  // =========================================================================
  // TRILHA 1 - LIÇÃO 2: montando-primeiro-orcamento
  // =========================================================================
  {
    id: 'l1-t1-l2-mc',
    lessonSlug: 'montando-primeiro-orcamento',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Por onde devemos começar ao montar um orçamento realista?',
    options: [
      'Tentar gastar menos de R$ 500 no mês inteiro.',
      'Ignorar as contas fixas e focar só na fatura do cartão.',
      'Partir da sua renda líquida real e separar os gastos essenciais.',
    ],
    correctIndex: 2,
    explanation: 'Conhecer sua renda líquida e cobrir os essenciais é o alicerce de qualquer planejamento sustentável.',
    tip: 'Renda líquida é o valor que de fato cai na sua conta bancária.',
  },
  {
    id: 'l1-t1-l2-sc',
    lessonSlug: 'montando-primeiro-orcamento',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Qual decisão protege melhor o orçamento de Lucas?',
    scenarioText: 'Lucas calculou suas contas do mês e percebeu que sobram apenas R$ 80 livres. Um amigo convidou para uma viagem de fim de semana de R$ 250.',
    options: ['Parcelar a viagem em 10 vezes no cartão', 'Conversar abertamente e propor um passeio gratuito'],
    correctIndex: 1,
    explanation: 'Amigos verdadeiros entendem seus momentos financeiros e valorizam sua presença, não os gastos.',
  },
  {
    id: 'l1-t1-l2-fb',
    lessonSlug: 'montando-primeiro-orcamento',
    trackSlug: 'organizacao-financeira',
    lote: 1,
    typology: 'fill_in_the_blank',
    orderIndex: 3,
    prompt: 'Complete com o termo recomendado:',
    sentence: 'Um orçamento saudável precisa de ___ para acolher imprevistos sem que você se desespere.',
    options: ['punição', 'flexibilidade', 'rigidez', 'dívidas'],
    correctAnswer: 'flexibilidade',
    explanation: 'A flexibilidade é o que permite você manter a constância mesmo quando surgem gastos inesperados.',
  },

  // =========================================================================
  // TRILHA 2 - LIÇÃO 1: juros-o-que-sao
  // =========================================================================
  {
    id: 'l1-t2-l1-mc',
    lessonSlug: 'juros-o-que-sao',
    trackSlug: 'juros-sem-misterio',
    lote: 1,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Em poucas palavras, o que são juros?',
    options: [
      'Uma taxa cobrada apenas quando alguém é multado pelo banco.',
      'Valores adicionais cobrados ou recebidos pelo uso do dinheiro no tempo.',
      'Um imposto obrigatório que vai direto para a prefeitura.',
    ],
    correctIndex: 1,
    explanation: 'Juros são o custo do dinheiro no tempo: quem empresta recebe, quem toma emprestado paga.',
  },
  {
    id: 'l1-t2-l1-cm',
    lessonSlug: 'juros-o-que-sao',
    trackSlug: 'juros-sem-misterio',
    lote: 1,
    typology: 'concept_matching',
    orderIndex: 2,
    prompt: 'Ligue cada situação ao papel dos juros:',
    pairs: [
      { id: 'p1', left: 'Investir no Tesouro Selic', right: 'Juros trabalhando a seu favor' },
      { id: 'p2', left: 'Entrar no cheque especial', right: 'Juros crescendo contra você' },
      { id: 'p3', left: 'Pagamento total à vista', right: 'Zero cobrança de juros' },
    ],
    explanation: 'Saber quando os juros ajudam ou atrapalham é o superpoder da tranquilidade financeira.',
  },

  // =========================================================================
  // TRILHA 2 - LIÇÃO 2: simples-vs-compostos
  // =========================================================================
  {
    id: 'l1-t2-l2-mc',
    lessonSlug: 'simples-vs-compostos',
    trackSlug: 'juros-sem-misterio',
    lote: 1,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Por que dívidas atrasadas no cartão crescem tão rápido com juros compostos?',
    options: [
      'Porque o banco dobra o valor da dívida toda semana por lei.',
      'Porque os juros simples são os mais comuns no Brasil.',
      'Porque os juros do mês seguinte são calculados sobre os juros anteriores (juros sobre juros).',
    ],
    correctIndex: 2,
    explanation: 'Nos juros compostos, a base de cálculo cresce mês a mês, fazendo a bola de neve rolar com mais força.',
  },
  {
    id: 'l1-t2-l2-sc',
    lessonSlug: 'simples-vs-compostos',
    trackSlug: 'juros-sem-misterio',
    lote: 1,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Qual é o melhor caminho para Mariana?',
    scenarioText: 'Mariana tem uma fatura de R$ 1.200 e só tem R$ 400 hoje. O banco sugeriu pagar o mínimo de R$ 180.',
    options: ['Pagar apenas o mínimo do rotativo', 'Buscar parcelamento fixo da fatura ou renegociar'],
    correctIndex: 1,
    explanation: 'O crédito rotativo tem as maiores taxas do mercado. Parcelamentos fixos têm juros muito menores.',
  },
]
