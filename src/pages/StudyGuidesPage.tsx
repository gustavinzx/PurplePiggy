// src/pages/StudyGuidesPage.tsx
// Central de Guias de Estudo, Cola Rápida e Glossário Financeiro (Prompt N12)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, BookOpen, Zap, HelpCircle, ChevronRight, Sparkles } from 'lucide-react'
import { Mascot } from '../components/Mascot'

interface GlossaryTerm {
  term: string
  definition: string
  category: 'básico' | 'crédito' | 'poupança' | 'segurança'
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Orçamento',
    definition: 'O planejamento de como você deseja direcionar sua renda entre gastos essenciais, conforto e metas futuras.',
    category: 'básico',
  },
  {
    term: 'Receita',
    definition: 'Todo dinheiro que entra na sua conta, seja salário, pensão, vendas ou rendimentos.',
    category: 'básico',
  },
  {
    term: 'Despesa Essencial',
    definition: 'Gastos vitais para manter a vida funcionando com dignidade: moradia, comida, saúde e transporte.',
    category: 'básico',
  },
  {
    term: 'Fatura',
    definition: 'O documento que reúne todas as compras feitas no cartão de crédito em um ciclo mensal.',
    category: 'crédito',
  },
  {
    term: 'Crédito Rotativo',
    definition: 'A modalidade de crédito acionada quando não se paga o valor integral da fatura, com as taxas de juros mais caras do mercado.',
    category: 'crédito',
  },
  {
    term: 'Parcelamento',
    definition: 'Divisão de um valor total em parcelas mensais. Quando há juros, o valor final pago aumenta.',
    category: 'crédito',
  },
  {
    term: 'Juros Simples',
    definition: 'Juros calculados sempre sobre o valor inicial emprestado ou investido.',
    category: 'básico',
  },
  {
    term: 'Juros Compostos',
    definition: 'Juros sobre juros: a taxa incide sobre o saldo acumulado, acelerando dívidas ou multiplicando economias.',
    category: 'básico',
  },
  {
    term: 'Reserva de Emergência',
    definition: 'Um colchão financeiro seguro e disponível a qualquer momento para imprevistos de saúde ou familiares.',
    category: 'poupança',
  },
  {
    term: 'Meta Financeira',
    definition: 'Um objetivo com nome, valor e prazo definidos, poupado com constância mês a mês.',
    category: 'poupança',
  },
  {
    term: 'Limite de Crédito',
    definition: 'O valor máximo que o banco autoriza você gastar no cartão. Não é extensão do seu salário.',
    category: 'crédito',
  },
  {
    term: 'Boleto Bancário',
    definition: 'Título de cobrança com código de barras usado para pagar serviços, contas ou compras à vista.',
    category: 'básico',
  },
  {
    term: 'Pix',
    definition: 'Meio de pagamento instantâneo brasileiro gratuito, disponível 24 horas por dia.',
    category: 'básico',
  },
  {
    term: 'Golpe Financeiro',
    definition: 'Armadilha em que criminosos induzem transferências ou roubam dados usando urgência e falsas promessas.',
    category: 'segurança',
  },
  {
    term: 'Open Finance',
    definition: 'Sistema regulado pelo Banco Central onde você escolhe compartilhar seus dados bancários com segurança e transparência.',
    category: 'segurança',
  },
  {
    term: 'LGPD',
    definition: 'Lei Geral de Proteção de Dados, garantindo que suas informações pessoais e bancárias pertençam exclusivamente a você.',
    category: 'segurança',
  },
  {
    term: 'Cheque Especial',
    definition: 'Limite de crédito pré-aprovado na conta corrente com juros diários altíssimos. Deve ser evitado.',
    category: 'crédito',
  },
  {
    term: 'Inflação',
    definition: 'O aumento geral dos preços das coisas ao longo do tempo, reduzindo o poder de compra do dinheiro.',
    category: 'básico',
  },
  {
    term: 'Poder de Compra',
    definition: 'A quantidade de bens ou serviços que uma mesma quantia de dinheiro consegue adquirir.',
    category: 'básico',
  },
  {
    term: 'Renda Fixa',
    definition: 'Aplicações em que as regras de remuneração são conhecidas desde o início, ideais para segurança e reserva.',
    category: 'poupança',
  },
  {
    term: 'CDB',
    definition: 'Certificado de Depósito Bancário: você empresta dinheiro ao banco em troca de rendimentos seguros garantidos pelo FGC.',
    category: 'poupança',
  },
  {
    term: 'CDI',
    definition: 'Taxa de referência do mercado financeiro que serve como régua de rendimento para a renda fixa segura.',
    category: 'poupança',
  },
  {
    term: 'Tesouro Direto',
    definition: 'Programa público onde qualquer pessoa pode emprestar dinheiro ao governo federal a partir de R$ 30 com risco soberano mínimo.',
    category: 'poupança',
  },
  {
    term: 'Taxa Selic',
    definition: 'A taxa básica de juros da economia brasileira, definida a cada 45 dias pelo Copom/Banco Central.',
    category: 'básico',
  },
  {
    term: 'Liquidez Diária',
    definition: 'A facilidade de resgatar o dinheiro investido no mesmo dia ou no próximo dia útil sem perda de rendimento.',
    category: 'poupança',
  },
  {
    term: 'IOF',
    definition: 'Imposto sobre Operações Financeiras, cobrado pelo governo em empréstimos, seguros e aplicações de curtíssimo prazo.',
    category: 'básico',
  },
  {
    term: 'Score de Crédito',
    definition: 'Pontuação de 0 a 1.000 dos birôs de crédito que indica a probabilidade de pagamento em dia.',
    category: 'crédito',
  },
  {
    term: 'Renegociação',
    definition: 'Acordo feito para reajustar prazos, parcelas e reduzir juros de dívidas em aberto.',
    category: 'crédito',
  },
  {
    term: 'Gastos Invisíveis',
    definition: 'Pequenos desembolsos do cotidiano e do cuidado com a família que não são anotados mas somam centenas de reais.',
    category: 'básico',
  },
  {
    term: 'Educação Financeira',
    definition: 'O aprendizado contínuo para tomar decisões com mais autonomia, segurança e paz de espírito.',
    category: 'básico',
  },
]

const QUICK_CARDS = [
  {
    title: 'A Regra dos Gastos Conscientes',
    tip: 'Antes de compras não essenciais acima de R$ 100, espere 48 horas. A maioria dos impulsos se dissipa nesse período.',
  },
  {
    title: 'O Perigo do Rotativo do Cartão',
    tip: 'Pagar apenas o mínimo da fatura joga o saldo na taxa mais cara do país. Parcelar a fatura em taxa pré-fixada é sempre mais saudável.',
  },
  {
    title: 'O Primeiro Degrau da Reserva',
    tip: 'Não se cobre juntar 6 meses logo de início. Comece com 1 semana de gastos essenciais e comemore cada conquista.',
  },
  {
    title: 'Três Perguntas Antes de Comprar',
    tip: '1. Eu realmente preciso disso agora? 2. Esse valor cabe no meu mês? 3. O que estou deixando de fazer no meu futuro?',
  },
]

export const StudyGuidesPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'guias' | 'cola' | 'glossario'>('guias')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')

  // Filtro de termos do glossário
  const filteredGlossary = GLOSSARY_TERMS.filter((g) => {
    const matchesSearch =
      g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'todos' || g.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="min-h-screen bg-[#FAF5FF] flex flex-col max-w-md mx-auto pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-purple-100 px-5 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/aprender')}
          aria-label="Voltar"
          className="text-purple-700 hover:text-purple-950 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-nunito font-black text-xl text-[#3B0764]">
            Guias de Estudo
          </h1>
          <p className="font-nunito text-xs text-gray-500">
            Resumos e glossário para consultar quando quiser.
          </p>
        </div>
      </header>

      {/* Abas */}
      <div className="flex border-b border-purple-100 bg-white px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('guias')}
          className={`flex-1 py-2.5 font-nunito font-extrabold text-sm text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'guias'
              ? 'border-[#7D2BD6] text-[#7D2BD6]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Guias
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cola')}
          className={`flex-1 py-2.5 font-nunito font-extrabold text-sm text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'cola'
              ? 'border-[#7D2BD6] text-[#7D2BD6]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Zap className="w-4 h-4" />
          Cola Rápida
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('glossario')}
          className={`flex-1 py-2.5 font-nunito font-extrabold text-sm text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'glossario'
              ? 'border-[#7D2BD6] text-[#7D2BD6]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Glossário ({GLOSSARY_TERMS.length})
        </button>
      </div>

      <main className="p-4 space-y-4 flex-1">
        {/* ABA: GUIAS DAS TRILHAS */}
        {activeTab === 'guias' && (
          <div className="space-y-3">
            {[
              {
                trackSlug: 'organizacao-financeira',
                title: 'Organização Financeira',
                desc: 'Como listar gastos sem culpa e montar o primeiro orçamento realista.',
                time: '5 min',
              },
              {
                trackSlug: 'juros-sem-misterio',
                title: 'Juros Sem Mistério',
                desc: 'Juros simples, compostos e como funcionam a seu favor.',
                time: '6 min',
              },
              {
                trackSlug: 'cartao-de-credito',
                title: 'Cartão de Crédito',
                desc: 'Melhor dia de compra, limite consciente e fuga do rotativo.',
                time: '5 min',
              },
              {
                trackSlug: 'reserva-de-emergencia',
                title: 'Reserva de Emergência',
                desc: 'Construindo seu primeiro colchão financeiro degrau a degrau.',
                time: '6 min',
              },
              {
                trackSlug: 'planejamento-financeiro',
                title: 'Planejamento Financeiro',
                desc: 'Metas com nome e data e a revisão mensal de 10 minutos.',
                time: '5 min',
              },
              {
                trackSlug: 'consumo-consciente',
                title: 'Consumo Consciente',
                desc: 'Desejo vs. necessidade e o filtro das 48 horas contra o impulso.',
                time: '5 min',
              },
              {
                trackSlug: 'golpes-financeiros',
                title: 'Golpes Financeiros',
                desc: 'Como identificar armadilhas no Pix, boletos e clonagem.',
                time: '6 min',
              },
              {
                trackSlug: 'economia-domestica',
                title: 'Economia Doméstica',
                desc: 'Visibilidade para os gastos com a família e cardápio semanal.',
                time: '6 min',
              },
            ].map((g, idx) => (
              <div
                key={g.trackSlug}
                onClick={() => navigate(`/aprender/trilha/${g.trackSlug}/nivel/1/guia`)}
                className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7D2BD6]">
                    TRILHA {String(idx + 1).padStart(2, '0')} · {g.time}
                  </span>
                  <h3 className="font-nunito font-extrabold text-base text-[#3B0764] mt-0.5">
                    {g.title}
                  </h3>
                  <p className="font-nunito text-xs text-gray-500 mt-0.5">{g.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* ABA: COLA RÁPIDA */}
        {activeTab === 'cola' && (
          <div className="space-y-3">
            {QUICK_CARDS.map((card, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-2"
              >
                <div className="flex items-center gap-2 text-[#7D2BD6]">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-nunito font-black text-sm uppercase tracking-wide">
                    {card.title}
                  </h3>
                </div>
                <p className="font-nunito text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {card.tip}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ABA: GLOSSÁRIO SEM ECONOMÊS */}
        {activeTab === 'glossario' && (
          <div className="space-y-3">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar termo ou significado..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-purple-100 text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-800 placeholder-gray-400 shadow-sm"
              />
            </div>

            {/* Lista de Termos */}
            <div className="space-y-2.5 pt-1">
              {filteredGlossary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-purple-100/90 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-nunito font-black text-sm text-[#3B0764]">
                      {item.term}
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-[#7D2BD6]">
                      {item.category}
                    </span>
                  </div>
                  <p className="font-nunito text-xs text-gray-600 leading-relaxed">
                    {item.definition}
                  </p>
                </div>
              ))}

              {filteredGlossary.length === 0 && (
                <div className="text-center py-8 text-gray-400 font-nunito text-sm">
                  Nenhum termo encontrado para &quot;{searchTerm}&quot;.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
export default StudyGuidesPage
