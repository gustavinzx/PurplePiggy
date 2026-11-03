// src/features/learn/components/GuideReader.tsx
// Componente canônico e reutilizável de Leitura de Guia (Prompt N11B e N12)
import React from 'react'
import { ArrowLeft, BookOpen, Lightbulb, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'
import { ChunkyButton } from './ChunkyButton'

export interface GuideContent {
  title: string
  subtitle?: string
  trackTitle?: string
  readingTimeMinutes?: number
  mascotTip?: string
  explanation: string
  example?: string
  tip?: string
}

interface GuideReaderProps {
  guide: GuideContent
  onBack: () => void
  onComplete?: () => void
  onNextLesson?: () => void
  completedButtonText?: string
  nextButtonText?: string
  className?: string
}

export const GuideReader: React.FC<GuideReaderProps> = ({
  guide,
  onBack,
  onComplete,
  onNextLesson,
  completedButtonText = 'Concluir lição ✓',
  nextButtonText = 'Iniciar Desafio →',
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-[#FAF5FF] flex flex-col justify-between ${className}`}>
      {/* Top Bar de navegação */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 py-3 flex items-center justify-between max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="flex items-center gap-1.5 text-purple-700 font-nunito font-extrabold text-sm hover:text-purple-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
          EDUCAÇÃO FINANCEIRA · {guide.readingTimeMinutes || 5} MIN
        </span>
      </header>

      {/* Conteúdo Principal do Guia */}
      <main className="max-w-md mx-auto w-full px-5 py-6 flex-1 space-y-6">
        {/* Cabeçalho do Guia */}
        <div className="space-y-2">
          {guide.trackTitle && (
            <span className="text-xs font-black uppercase tracking-wider text-[#7D2BD6]">
              {guide.trackTitle}
            </span>
          )}
          <h1 className="font-nunito font-black text-2xl sm:text-3xl text-[#3B0764] leading-tight">
            {guide.title}
          </h1>
          {guide.subtitle && (
            <p className="font-nunito font-semibold text-sm sm:text-base text-gray-600 leading-relaxed">
              {guide.subtitle}
            </p>
          )}
        </div>

        {/* Mascote Idea com balão de fala acolhedor */}
        <div className="flex items-start gap-3 bg-white p-4 rounded-3xl border border-purple-100 shadow-sm">
          <div className="w-16 h-16 flex-shrink-0 drop-shadow">
            <Mascot pose="idea" className="w-full h-full object-contain" priority />
          </div>
          <div className="flex-1 text-xs font-nunito text-purple-950 leading-relaxed pt-1">
            <div className="font-extrabold text-purple-800 text-[11px] uppercase tracking-wider mb-0.5">
              Dica da Piggy
            </div>
            {guide.mascotTip ||
              'Aprender no seu próprio ritmo é o segredo para transformar sua relação com o dinheiro!'}
          </div>
        </div>

        {/* Bloco 1: Explicação Didática */}
        <section className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-purple-700">
            <BookOpen className="w-5 h-5" />
            <h2 className="font-nunito font-black text-base uppercase tracking-wide">
              Explicação
            </h2>
          </div>
          <div className="font-nunito text-[16px] leading-[1.65] text-gray-700 whitespace-pre-line">
            {guide.explanation}
          </div>
        </section>

        {/* Bloco 2: Exemplo Prático */}
        {guide.example && (
          <section className="bg-[#F6EEFF] p-5 rounded-3xl border border-purple-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#7D2BD6]">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-nunito font-black text-base uppercase tracking-wide">
                Exemplo Prático
              </h2>
            </div>
            <div className="font-nunito text-[15.5px] leading-[1.6] text-purple-950 whitespace-pre-line">
              {guide.example}
            </div>
          </section>
        )}

        {/* Bloco 3: Dica de Ouro */}
        {guide.tip && (
          <section className="bg-[#FEF3C7] p-5 rounded-3xl border border-amber-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-800">
              <Lightbulb className="w-5 h-5" />
              <h2 className="font-nunito font-black text-base uppercase tracking-wide">
                Dica de Ouro
              </h2>
            </div>
            <p className="font-nunito text-[15px] leading-[1.6] text-amber-950 font-bold">
              {guide.tip}
            </p>
          </section>
        )}
      </main>

      {/* Rodapé Fixo com Botões Chunky */}
      <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100 p-4 max-w-md mx-auto w-full space-y-2.5 shadow-lg">
        {onComplete && (
          <ChunkyButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onComplete}
          >
            {completedButtonText}
          </ChunkyButton>
        )}

        {onNextLesson && (
          <ChunkyButton
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onNextLesson}
          >
            {nextButtonText}
          </ChunkyButton>
        )}
      </footer>
    </div>
  )
}
