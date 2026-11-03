// src/features/learn/questions/lote4.ts
// Lote 4: Trilha 7 (Golpes financeiros) e Trilha 8 (Economia doméstica)
import type { LearnQuestion } from './types'

export const LOTE_4_QUESTIONS: LearnQuestion[] = [
  // =========================================================================
  // TRILHA 7 - LIÇÃO 1: sinais-de-alerta
  // =========================================================================
  {
    id: 'l4-t7-l1-mc',
    lessonSlug: 'sinais-de-alerta',
    trackSlug: 'golpes-financeiros',
    lote: 4,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Qual é o maior sinal de alerta para identificar um golpe ou pirâmide financeira?',
    options: [
      'Promessa de lucros altos e rápidos com garantia de "risco zero".',
      'Investimento oferecido por bancos regulamentados pelo Banco Central.',
      'Aplicação de renda fixa que rende próximo à taxa Selic oficial.',
    ],
    correctIndex: 0,
    explanation: 'No mundo real, retornos elevados sempre envolvem riscos proporcionais. Lucro alto e garantido não existe.',
    tip: 'Se parecer bom demais para ser verdade, desconfie e não transfira nenhum valor.',
  },
  {
    id: 'l4-t7-l1-sc',
    lessonSlug: 'sinais-de-alerta',
    trackSlug: 'golpes-financeiros',
    lote: 4,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Qual atitude protege a segurança de Beatriz?',
    scenarioText: 'Beatriz recebeu uma ligação urgente dizendo ser da "central de segurança" do seu banco, pedindo para ela digitar sua senha ou fazer um Pix de teste para cancelar uma invasão.',
    options: ['Desligar imediatamente e ligar no número oficial do cartão', 'Seguir as instruções da ligação para não perder a conta'],
    correctIndex: 0,
    explanation: 'Nenhum banco legítimo pede senhas, códigos de SMS ou transferências para "cancelar" fraudes.',
  },

  // =========================================================================
  // TRILHA 7 - LIÇÃO 2: golpes-de-pix-e-boleto
  // =========================================================================
  {
    id: 'l4-t7-l2-cm',
    lessonSlug: 'golpes-de-pix-e-boleto',
    trackSlug: 'golpes-financeiros',
    lote: 4,
    typology: 'concept_matching',
    orderIndex: 1,
    prompt: 'Ligue cada tipo de fraude ao cuidado preventivo correto:',
    pairs: [
      { id: 'p1', left: 'Pagamento de Boleto', right: 'Conferir o nome e CNPJ do beneficiário na tela final' },
      { id: 'p2', left: 'Transferência por Pix', right: 'Confirmar os dados do destinatário antes de autenticar' },
      { id: 'p3', left: 'Mensagem de parente pedindo dinheiro', right: 'Ligar por chamada de voz antes de fazer qualquer envio' },
    ],
    explanation: 'A checagem do nome do destinatário antes da senha evita 99% das fraudes de engenharia social.',
  },
  {
    id: 'l4-t7-l2-fb',
    lessonSlug: 'golpes-de-pix-e-boleto',
    trackSlug: 'golpes-financeiros',
    lote: 4,
    typology: 'fill_in_the_blank',
    orderIndex: 2,
    prompt: 'Complete a recomendação sobre segurança digital:',
    sentence: 'Antes de confirmar qualquer Pix ou boleto, confira com calma o ___ final do recebedor.',
    options: ['nome', 'endereço', 'modelo do celular', 'horário'],
    correctAnswer: 'nome',
    explanation: 'Golpistas alteram o código de barras, mas o nome do recebedor na tela de confirmação denuncia a fraude.',
  },

  // =========================================================================
  // TRILHA 8 - LIÇÃO 1: gastos-invisiveis-familia
  // =========================================================================
  {
    id: 'l4-t8-l1-mc',
    lessonSlug: 'gastos-invisiveis-familia',
    trackSlug: 'economia-domestica',
    lote: 4,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'O que são os chamados "gastos invisíveis" no orçamento doméstico?',
    options: [
      'Pequenas despesas recorrentes e assinaturas não utilizadas que somadas levam centenas de reais por mês.',
      'Contas de água e energia elétrica devidamente registradas.',
      'Impostos anuais obrigatórios retidos na fonte.',
    ],
    correctIndex: 0,
    explanation: 'Serviços de streaming esquecidos, taxas bancárias avulsas e pequenas compras diárias somam quantias expressivas.',
  },
  {
    id: 'l4-t8-l1-sc',
    lessonSlug: 'gastos-invisiveis-familia',
    trackSlug: 'economia-domestica',
    lote: 4,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Qual é o melhor jeito de envolver a família nas finanças?',
    scenarioText: 'Clara quer organizar a casa financeiramente, mas tem medo de parecer controladora ou chata com os filhos e o parceiro.',
    options: ['Conversar abertamente sobre sonhos em comum e metas da família', 'Esconder as contas e tentar resolver tudo sozinha no sofrimento'],
    correctIndex: 0,
    explanation: 'Quando a família entende que economizar hoje financia a viagem de férias de amanhã, todos colaboram felizes.',
  },

  // =========================================================================
  // TRILHA 8 - LIÇÃO 2: pequenos-ajustes-que-somam
  // =========================================================================
  {
    id: 'l4-t8-l2-op',
    lessonSlug: 'pequenos-ajustes-que-somam',
    trackSlug: 'economia-domestica',
    lote: 4,
    typology: 'order_priorities',
    orderIndex: 1,
    prompt: 'Organize o roteiro de economia doméstica prática:',
    items: [
      'Auditar assinaturas digitais e cancelar serviços não utilizados',
      'Planejar as refeições da semana antes de ir ao supermercado com lista',
      'Direcionar o dinheiro economizado diretamente para a meta do porquinho',
    ],
    correctOrder: [
      'Auditar assinaturas digitais e cancelar serviços não utilizados',
      'Planejar as refeições da semana antes de ir ao supermercado com lista',
      'Direcionar o dinheiro economizado diretamente para a meta do porquinho',
    ],
    explanation: 'Cortar o desperdício sem abrir mão do que importa gera alívio imediato no orçamento da casa.',
  },
]
