// src/pages/DesignSystemLearnPage.tsx
// Vitrine dos Componentes Chunky do Módulo Aprender Gamificado (/design-system/learn)

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react'
import {
  ChunkyButton,
  OptionCard,
  QuizTopBar,
  FeedbackPanel,
} from '../features/learn/components'
import { useQuizEngine } from '../features/learn/engine/useQuizEngine'
import { getQuestionsByLesson } from '../features/learn/questions'
import { Atmosphere } from '../components/Atmosphere'

export const DesignSystemLearnPage: React.FC = () => {
  // Estados para demonstração interativa isolada dos cards
  const [demoSelectedCard, setDemoSelectedCard] = useState<number | null>(1)
  const [topBarProgress, setTopBarProgress] = useState<number>(60)
  const [topBarHearts, setTopBarHearts] = useState<number>(3)

  // Quiz real interativo embutido para teste de jogo
  const sampleQuestions = getQuestionsByLesson('para-onde-vai-meu-dinheiro')
  const quiz = useQuizEngine({
    questions: sampleQuestions,
    autoSubmitOnCompletion: false,
  })

  return (
    <div className="min-h-screen bg-[#F6EEFF] text-[#432171] relative overflow-x-hidden pb-20 font-sans">
      <Atmosphere variant="app" />

      {/* Header com Navegação */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#EADFFB] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/design-system"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Design System
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold bg-[#F0E7FA] text-[#7D2BD6] px-3 py-1 rounded-full border border-[#D8C2FF]">
            <Sparkles className="w-3.5 h-3.5" />
            Prompt N8B: Desafio Piggy
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12 relative z-10">
        {/* Título da Página */}
        <section className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#432171]">
            Componentes Chunky (Desafio Piggy)
          </h1>
          <p className="text-base text-[#6B5A8E] max-w-xl mx-auto">
            Biblioteca de componentes de física tátil 3D inspirados na mecânica Duolingo e construídos estritamente com os tokens e mascote oficial do PurplePiggy.
          </p>
        </section>

        {/* 1. SEÇÃO CHUNKY BUTTONS */}
        <section className="bg-white/90 rounded-3xl p-6 sm:p-8 border border-[#EADFFB] shadow-sm space-y-6">
          <div className="border-b border-[#F0E7FA] pb-3">
            <h2 className="text-xl font-extrabold text-[#432171]">1. ChunkyButton (Física Tátil 3D)</h2>
            <p className="text-xs text-[#7D6A9C]">
              Possui bisel inferior de 4px (<code className="bg-[#F6EEFF] px-1 rounded">border-b-[4px]</code>) e afundamento ativo de 2px no toque.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D6A9C]">Variantes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-[#7D6A9C] font-semibold">Primary</span>
                <ChunkyButton variant="primary" size="full">
                  VERIFICAR
                </ChunkyButton>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#7D6A9C] font-semibold">Success</span>
                <ChunkyButton variant="success" size="full">
                  CONTINUAR
                </ChunkyButton>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#7D6A9C] font-semibold">Danger</span>
                <ChunkyButton variant="danger" size="full">
                  ENTENDI
                </ChunkyButton>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#7D6A9C] font-semibold">Secondary</span>
                <ChunkyButton variant="secondary" size="full">
                  PULAR
                </ChunkyButton>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#7D6A9C] font-semibold">Neutral</span>
                <ChunkyButton variant="neutral" size="full">
                  AJUDA
                </ChunkyButton>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#7D6A9C] font-semibold">Disabled</span>
                <ChunkyButton variant="primary" size="full" disabled>
                  DESABILITADO
                </ChunkyButton>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D6A9C]">Tamanhos</h3>
            <div className="flex flex-wrap items-center gap-4">
              <ChunkyButton variant="primary" size="sm">
                Small (sm)
              </ChunkyButton>
              <ChunkyButton variant="primary" size="md">
                Medium (md)
              </ChunkyButton>
              <ChunkyButton variant="primary" size="lg">
                Large (lg)
              </ChunkyButton>
            </div>
          </div>
        </section>

        {/* 2. SEÇÃO OPTION CARD */}
        <section className="bg-white/90 rounded-3xl p-6 sm:p-8 border border-[#EADFFB] shadow-sm space-y-6">
          <div className="border-b border-[#F0E7FA] pb-3">
            <h2 className="text-xl font-extrabold text-[#432171]">2. OptionCard (Seleção de Alternativas)</h2>
            <p className="text-xs text-[#7D6A9C]">
              Card para exercícios de múltipla escolha e cenários práticos com badge indicador.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D6A9C]">Demonstração Interativa de Estados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OptionCard
                label="A"
                text="Estado Repouso (Idle): Branco com borda lilás suave"
                state="idle"
              />
              <OptionCard
                label="B"
                text="Estado Selecionado: Roxo vibrante com fundo suave"
                state="selected"
              />
              <OptionCard
                label="C"
                text="Estado Correto: Verde com bisel escuro e check"
                state="correct"
              />
              <OptionCard
                label="D"
                text="Estado Incorreto: Rosa-magenta com bisel escuro e X"
                state="incorrect"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#F0E7FA]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D6A9C]">Teste de Clique em Grupo</h3>
            <div className="space-y-2.5 max-w-lg">
              {['Anotar tudo durante 7 dias sem culpa', 'Cortar todos os gastos imediatamente', 'Esperar o próximo mês para começar'].map(
                (text, idx) => (
                  <OptionCard
                    key={idx}
                    label={String.fromCharCode(65 + idx)}
                    text={text}
                    selected={demoSelectedCard === idx}
                    onClick={() => setDemoSelectedCard(idx)}
                  />
                )
              )}
            </div>
          </div>
        </section>

        {/* 3. SEÇÃO QUIZ TOP BAR */}
        <section className="bg-white/90 rounded-3xl p-6 sm:p-8 border border-[#EADFFB] shadow-sm space-y-6">
          <div className="border-b border-[#F0E7FA] pb-3">
            <h2 className="text-xl font-extrabold text-[#432171]">3. QuizTopBar (Barra Superior da Lição)</h2>
            <p className="text-xs text-[#7D6A9C]">
              Barra de navegação da lição com botão fechar, barra de progresso elástica e contador de corações.
            </p>
          </div>

          <div className="bg-[#FAF5FF] p-4 rounded-2xl border border-[#EADFFB] space-y-4">
            <QuizTopBar
              progress={topBarProgress}
              hearts={topBarHearts}
              maxHearts={3}
              onClose={() => alert('Fechar lição')}
            />

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EADFFB] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#7D6A9C]">Progresso: {topBarProgress}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={topBarProgress}
                  onChange={(e) => setTopBarProgress(Number(e.target.value))}
                  className="w-32 accent-[#7D2BD6]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-[#7D6A9C]">Corações:</span>
                {[3, 2, 1, 0].map((h) => (
                  <button
                    key={h}
                    onClick={() => setTopBarHearts(h)}
                    className={`px-2 py-1 rounded-md font-bold text-xs ${
                      topBarHearts === h
                        ? 'bg-[#7D2BD6] text-white'
                        : 'bg-white text-[#7D6A9C] border border-[#D8C2FF]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. SEÇÃO FEEDBACK PANEL */}
        <section className="bg-white/90 rounded-3xl p-6 sm:p-8 border border-[#EADFFB] shadow-sm space-y-6">
          <div className="border-b border-[#F0E7FA] pb-3">
            <h2 className="text-xl font-extrabold text-[#432171]">4. FeedbackPanel (Drawer de Validação no Rodapé)</h2>
            <p className="text-xs text-[#7D6A9C]">
              Drawer que desliza no rodapé da lição após verificar a resposta, apresentando a pose oficial do mascote.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sucesso */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
                Painel de Sucesso (pose="success")
              </span>
              <div className="rounded-2xl overflow-hidden border border-[#86EFAC] shadow-sm">
                <FeedbackPanel
                  status="correct"
                  title="Excelente! Mandou muito bem!"
                  explanation="Anotar os gastos sem culpa traz clareza para enxergar seus hábitos com carinho."
                  tip="O objetivo inicial é apenas enxergar a realidade sem julgamento."
                  onAction={() => alert('Avançar lição')}
                />
              </div>
            </div>

            {/* Erro */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#BE185D]">
                Painel de Erro Construtivo (pose="retry")
              </span>
              <div className="rounded-2xl overflow-hidden border border-[#F472B6] shadow-sm">
                <FeedbackPanel
                  status="incorrect"
                  title="Quase lá! Veja a explicação:"
                  explanation="Cortar tudo repentinamente gera frustração e desistência. O segredo é a constância suave."
                  tip="Lembre-se: flexibilidade é a chave para a constância."
                  onAction={() => alert('Tentar novamente')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. SIMULADOR INTERATIVO COMPLETO */}
        <section className="bg-gradient-to-b from-white to-[#FDFBFE] rounded-3xl p-6 sm:p-8 border-2 border-[#7D2BD6]/30 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-[#EADFFB] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#7D2BD6] uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                Simulador do Motor de Quiz
              </div>
              <h2 className="text-2xl font-extrabold text-[#432171]">
                Lição Interativa ao Vivo
              </h2>
            </div>
            <button
              onClick={quiz.restartQuiz}
              title="Reiniciar Simulação"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#7D6A9C] hover:text-[#7D2BD6] bg-[#F6EEFF] px-3 py-1.5 rounded-xl border border-[#D8C2FF]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>

          {/* Top Bar do Quiz ao Vivo */}
          <QuizTopBar
            progress={quiz.progressPercent}
            hearts={quiz.hearts}
            maxHearts={quiz.maxHearts}
            onClose={quiz.restartQuiz}
          />

          {/* Corpo da Lição */}
          <div className="max-w-md mx-auto py-4 space-y-6">
            {quiz.status === 'completed' ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#15803D]">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#432171]">
                  Lição Concluída com Sucesso!
                </h3>
                <p className="text-sm text-[#6B5A8E]">
                  Você ganhou <strong className="text-[#2FBF71]">+{quiz.earnedCoins} Moedas Piggy</strong> e{' '}
                  <strong className="text-[#7D2BD6]">+{quiz.earnedXp} XP</strong>!
                </p>
                <ChunkyButton variant="primary" size="full" onClick={quiz.restartQuiz}>
                  JOGAR NOVAMENTE
                </ChunkyButton>
              </div>
            ) : quiz.status === 'game_over' ? (
              <div className="text-center py-8 space-y-4">
                <h3 className="text-2xl font-extrabold text-[#BE185D]">
                  Corações Esgotados!
                </h3>
                <p className="text-sm text-[#6B5A8E]">
                  Não se preocupe, errar faz parte do aprendizado financeiro.
                </p>
                <ChunkyButton variant="danger" size="full" onClick={quiz.restartQuiz}>
                  TENTAR NOVAMENTE
                </ChunkyButton>
              </div>
            ) : quiz.currentQuestion ? (
              <div className="space-y-6">
                {/* Enunciado */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#7D6A9C] uppercase tracking-wider">
                    Questão {quiz.currentIndex + 1} de {quiz.totalQuestions}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#432171] leading-snug">
                    {quiz.currentQuestion.prompt}
                  </h3>
                  {quiz.currentQuestion.contextText ? (
                    <div className="p-3.5 rounded-2xl bg-[#F6EEFF] border border-[#EADFFB] text-sm text-[#432171]">
                      {quiz.currentQuestion.contextText}
                    </div>
                  ) : null}
                </div>

                {/* Opções */}
                <div className="space-y-3">
                  {('options' in quiz.currentQuestion &&
                    Array.isArray(quiz.currentQuestion.options)
                      ? quiz.currentQuestion.options
                      : []
                  ).map((optionText, idx) => {
                    const isSelected = quiz.currentAnswer === idx
                    let cardState: 'idle' | 'selected' | 'correct' | 'incorrect' = isSelected
                      ? 'selected'
                      : 'idle'

                    if (quiz.status === 'correct' && isSelected) {
                      cardState = 'correct'
                    } else if (quiz.status === 'incorrect' && isSelected) {
                      cardState = 'incorrect'
                    }

                    return (
                      <OptionCard
                        key={idx}
                        label={String.fromCharCode(65 + idx)}
                        text={optionText}
                        state={cardState}
                        disabled={quiz.status === 'correct' || quiz.status === 'incorrect'}
                        onClick={() => quiz.selectAnswer(idx)}
                      />
                    )
                  })}
                </div>

                {/* Botão de Verificação (visível quando ainda respondendo) */}
                {quiz.status === 'answering' ? (
                  <div className="pt-4">
                    <ChunkyButton
                      variant="primary"
                      size="full"
                      disabled={!quiz.canVerify}
                      onClick={quiz.verifyAnswer}
                    >
                      VERIFICAR RESPOSTA
                    </ChunkyButton>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Feedback Drawer Ativo na Lição ao Vivo */}
          {quiz.status === 'correct' || quiz.status === 'incorrect' ? (
            <div className="rounded-2xl overflow-hidden shadow-lg border border-[#EADFFB] mt-4">
              <FeedbackPanel
                status={quiz.status}
                title={quiz.validation?.feedbackTitle}
                explanation={quiz.validation?.explanation}
                onAction={quiz.status === 'correct' ? quiz.nextQuestion : quiz.retryQuestion}
                actionText={quiz.status === 'correct' ? 'CONTINUAR' : 'TENTAR NOVAMENTE'}
              />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
